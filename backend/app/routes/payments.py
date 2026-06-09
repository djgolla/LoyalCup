"""
Payments routes.

CARD ONLY launch flow:
  POST /api/v1/payments/quote
    - Asks Square to calculate subtotal/tax/total before card entry.

  POST /api/v1/payments/create
    - Creates a pending LoyalCup order.
    - Creates Square order.
    - Charges Square card nonce.
    - Confirms LoyalCup order.
    - Awards/redeems loyalty.

SECURITY:
  The mobile app may send unit_price/base_price for UI convenience, but the
  backend NEVER trusts client prices. All checkout pricing is resolved from
  Supabase menu_items + modifier_options using the service role before quote,
  charge, order_items insert, loyalty redemption, and loyalty awarding.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator

from app.services.square_order_service import process_payment, quote_order
from app.services.notification_service import send_order_placed_push
from app.services.loyalty_service import (
    get_balance,
    compute_redemption,
    award_points_for_order,
    redeem_points_for_order,
)
from app.utils.security import require_auth
from app.database import get_supabase

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])
logger = logging.getLogger(__name__)


class PaymentItem(BaseModel):
    menu_item_id: str
    quantity: int

    # Kept optional so the current app request shape does not break.
    # These values are ignored for security.
    unit_price: Optional[float] = None
    base_price: Optional[float] = None

    customizations: List[dict] = Field(default_factory=list)

    @validator("quantity")
    def _q(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        if v > 25:
            raise ValueError("Quantity is too high")
        return v

    @validator("unit_price")
    def _p(cls, v):
        if v is not None and v < 0:
            raise ValueError("Unit price cannot be negative")
        return v


class QuotePaymentRequest(BaseModel):
    shop_id: str
    items: List[PaymentItem]
    loyalty_points_to_redeem: int = 0
    customer_note: Optional[str] = None

    @validator("items")
    def _items(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        if len(v) > 50:
            raise ValueError("Too many line items")
        return v

    @validator("loyalty_points_to_redeem")
    def _pts(cls, v):
        if v < 0:
            raise ValueError("Cannot redeem negative points")
        return v

    @validator("customer_note")
    def _note(cls, v):
        if v and len(v) > 500:
            raise ValueError("Customer note cannot exceed 500 characters")
        return v


class CreatePaymentRequest(QuotePaymentRequest):
    payment_nonce: str


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _customization_id(customization: Dict[str, Any]) -> Optional[str]:
    return (
        customization.get("id")
        or customization.get("option_id")
        or customization.get("modifier_option_id")
    )


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def _safe_bool_not_false(value: Any) -> bool:
    return value is not False


def _normalize_modifier_option(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return only trusted DB fields needed by checkout/Square/order history.
    Do not pass through client-provided price_adjustment/name blindly.
    """
    price_adjustment = _safe_float(row.get("price_adjustment"), 0.0)

    return {
        "id": row.get("id"),
        "name": row.get("name") or "Customization",
        "price_adjustment": price_adjustment,
        "modifier_group_id": row.get("modifier_group_id"),
        "pos_id": row.get("pos_id"),
        "pos_source": row.get("pos_source"),
        "square_modifier_id": (
            row.get("square_modifier_id")
            or row.get("pos_modifier_id")
            or row.get("modifier_id")
            or row.get("pos_id")
        ),
    }


def _resolve_order_items(db, shop_id: str, items: List[PaymentItem]) -> List[dict]:
    """
    Security-critical price resolver.

    The app can only choose:
      - menu_item_id
      - quantity
      - modifier option IDs/customization IDs

    The backend decides:
      - whether item belongs to this shop
      - whether item is available/active/in stock
      - base price
      - valid modifier prices
      - final unit price
    """
    sc = db.get_service_client()

    menu_item_ids = list({str(item.menu_item_id) for item in items if item.menu_item_id})
    if not menu_item_ids:
        raise HTTPException(status_code=400, detail="No valid menu items provided")

    menu_resp = (
        sc.table("menu_items")
        .select(
            "id, shop_id, name, base_price, is_available, is_active, "
            "is_out_of_stock, pos_id, pos_source, modifier_group_ids"
        )
        .in_("id", menu_item_ids)
        .execute()
    )

    menu_lookup = {row["id"]: row for row in (menu_resp.data or [])}

    customization_ids = []
    for item in items:
        for customization in item.customizations or []:
            cid = _customization_id(customization)
            if cid:
                customization_ids.append(str(cid))

    customization_lookup: Dict[str, Dict[str, Any]] = {}
    if customization_ids:
        opt_resp = (
            sc.table("modifier_options")
            .select("*")
            .in_("id", list(set(customization_ids)))
            .execute()
        )
        customization_lookup = {row["id"]: row for row in (opt_resp.data or [])}

    resolved_items = []

    for item in items:
        menu_item_id = str(item.menu_item_id)
        menu_row = menu_lookup.get(menu_item_id)

        if not menu_row:
            raise HTTPException(status_code=400, detail="A menu item in your cart no longer exists")

        if menu_row.get("shop_id") != shop_id:
            raise HTTPException(status_code=400, detail="Cart contains an item from the wrong shop")

        if menu_row.get("is_available") is False or menu_row.get("is_active") is False:
            raise HTTPException(status_code=400, detail=f"{menu_row.get('name', 'Item')} is no longer available")

        if menu_row.get("is_out_of_stock") is True:
            raise HTTPException(status_code=400, detail=f"{menu_row.get('name', 'Item')} is out of stock")

        allowed_group_ids = set(menu_row.get("modifier_group_ids") or [])
        trusted_customizations = []

        for customization in item.customizations or []:
            cid = _customization_id(customization)
            if not cid:
                continue

            option_row = customization_lookup.get(str(cid))
            if not option_row:
                raise HTTPException(status_code=400, detail="Invalid customization selected")

            if option_row.get("shop_id") != shop_id:
                raise HTTPException(status_code=400, detail="Customization belongs to another shop")

            if option_row.get("is_active") is False:
                raise HTTPException(status_code=400, detail="Customization is no longer available")

            option_group_id = option_row.get("modifier_group_id")
            if allowed_group_ids and option_group_id and option_group_id not in allowed_group_ids:
                raise HTTPException(status_code=400, detail="Customization is not valid for this item")

            trusted_customizations.append(_normalize_modifier_option(option_row))

        base_price = _safe_float(menu_row.get("base_price"), 0.0)
        mods_total = sum(_safe_float(c.get("price_adjustment"), 0.0) for c in trusted_customizations)
        unit_price = round(base_price + mods_total, 2)

        if unit_price < 0:
            raise HTTPException(status_code=400, detail="Invalid item price")

        resolved_items.append({
            "menu_item_id": menu_item_id,
            "quantity": max(1, int(item.quantity or 1)),
            "unit_price": unit_price,
            "base_price": base_price,
            "customizations": trusted_customizations,
            "name": menu_row.get("name"),
        })

    return resolved_items


def _subtotal_cents(items_data: List[dict]) -> int:
    subtotal_dollars = sum(item["unit_price"] * item.get("quantity", 1) for item in items_data)
    return int(round(subtotal_dollars * 100))


def _subtotal_dollars(items_data: List[dict]) -> float:
    return round(_subtotal_cents(items_data) / 100, 2)


def _loyalty_discount_for_request(
    *,
    db,
    customer_id: str,
    shop_id: str,
    items_data: List[dict],
    points_to_redeem: int,
) -> int:
    if points_to_redeem <= 0:
        return 0

    balance = get_balance(db, customer_id, shop_id)

    preview = compute_redemption(
        config=balance["config"],
        subtotal_cents=_subtotal_cents(items_data),
        points_balance=balance["current_balance"],
        requested_points=points_to_redeem,
    )

    if not preview["valid"]:
        raise HTTPException(status_code=400, detail=preview["reason"] or "Invalid redemption")

    return int(preview["discount_cents"] or 0)


@router.post("/quote")
async def quote_payment(
    request: QuotePaymentRequest,
    user: dict = Depends(require_auth()),
):
    """
    Returns Square-calculated totals before showing the card screen.
    This does not create an order and does not charge a card.
    """
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()
    sc = db.get_service_client()

    shop_resp = (
        sc.table("shops")
        .select("id, status, name, mobile_ordering_enabled")
        .eq("id", request.shop_id)
        .limit(1)
        .execute()
    )

    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop = shop_resp.data[0]

    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently accepting orders")

    if shop.get("mobile_ordering_enabled") is False:
        raise HTTPException(status_code=400, detail="Mobile ordering is currently disabled for this shop")

    items_data = _resolve_order_items(db, request.shop_id, request.items)

    loyalty_discount_cents = _loyalty_discount_for_request(
        db=db,
        customer_id=customer_id,
        shop_id=request.shop_id,
        items_data=items_data,
        points_to_redeem=request.loyalty_points_to_redeem,
    )

    try:
        quote = await quote_order(
            db=db,
            shop_id=request.shop_id,
            items=items_data,
            loyalty_discount_cents=loyalty_discount_cents,
            customer_note=request.customer_note,
        )
    except Exception as e:
        logger.error(f"[Payment Quote] Square quote failed shop={request.shop_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Could not calculate order total: {str(e)}")

    return {
        "success": True,
        "shop_id": request.shop_id,
        "shop_name": shop.get("name"),
        **quote,
    }


@router.post("/create")
async def create_payment(
    request: CreatePaymentRequest,
    user: dict = Depends(require_auth()),
):
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()
    sc = db.get_service_client()

    if not request.payment_nonce or not request.payment_nonce.strip():
        raise HTTPException(status_code=400, detail="Payment nonce required")

    shop_resp = (
        sc.table("shops")
        .select("id, status, name, avg_prep_time_minutes, mobile_ordering_enabled")
        .eq("id", request.shop_id)
        .limit(1)
        .execute()
    )

    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop = shop_resp.data[0]

    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently accepting orders")

    if shop.get("mobile_ordering_enabled") is False:
        raise HTTPException(status_code=400, detail="Mobile ordering is currently disabled for this shop")

    prep_minutes = int(shop.get("avg_prep_time_minutes") or 10)
    shop_name = shop.get("name", "the shop")
    ready_at_iso = (_now_utc() + timedelta(minutes=prep_minutes)).isoformat()

    items_data = _resolve_order_items(db, request.shop_id, request.items)
    subtotal_dollars = _subtotal_dollars(items_data)

    loyalty_discount_cents = _loyalty_discount_for_request(
        db=db,
        customer_id=customer_id,
        shop_id=request.shop_id,
        items_data=items_data,
        points_to_redeem=request.loyalty_points_to_redeem,
    )

    try:
        pending_payload = {
            "customer_id": customer_id,
            "shop_id": request.shop_id,
            "status": "payment_pending",
            "subtotal": subtotal_dollars,
            "tax": 0,
            "total": 0,
            "ready_at": ready_at_iso,
            "metadata": {
                "pos_provider": "square",
                "payment_method": "card_in_app",
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "customer_note": request.customer_note,
                "prep_minutes": prep_minutes,
                "ready_at": ready_at_iso,
                "server_priced": True,
            },
        }

        pending_resp = (
            sc.table("orders")
            .insert(pending_payload)
            .execute()
        )

        if not pending_resp.data:
            raise RuntimeError("Pending order insert returned no data")

        order = pending_resp.data[0]
        order_id = order["id"]

    except Exception as e:
        logger.exception(f"[Payment] Failed to create pending order before charge: {e}")
        raise HTTPException(status_code=500, detail="Could not create order. Card was not charged.")

    try:
        payment_result = await process_payment(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id=order_id,
            items=items_data,
            payment_nonce=request.payment_nonce,
            loyalty_discount_cents=loyalty_discount_cents,
            customer_note=request.customer_note,
        )
    except Exception as e:
        try:
            sc.table("orders").update({
                "status": "payment_failed",
                "metadata": {**(order.get("metadata") or {}), "failure_reason": str(e)},
            }).eq("id", order_id).execute()
        except Exception as mark_err:
            logger.error(f"[Payment] Could not mark order payment_failed order={order_id}: {mark_err}")

        logger.error(f"[Payment] Square order/charge failed order={order_id}: {e}")
        raise HTTPException(status_code=402, detail=str(e))

    charged_cents = payment_result["charged_cents"]
    tax_cents = payment_result["tax_cents"]
    square_order_id = payment_result["square_order_id"]
    square_payment_id = payment_result.get("square_payment_id")
    currency = payment_result["currency"]

    charged_dollars = charged_cents / 100
    tax_dollars = tax_cents / 100

    order_metadata = {
        "square_order_id": square_order_id,
        "square_payment_id": square_payment_id,
        "pos_provider": "square",
        "currency": currency,
        "loyalty_points_redeemed": request.loyalty_points_to_redeem,
        "payment_method": "card_in_app" if square_payment_id else "loyalty_free",
        "customer_note": request.customer_note,
        "prep_minutes": prep_minutes,
        "ready_at": ready_at_iso,
        "server_priced": True,
    }

    if loyalty_discount_cents > 0:
        order_metadata["discount_amount"] = loyalty_discount_cents / 100

    try:
        confirmed_resp = (
            sc.table("orders")
            .update({
                "status": "confirmed",
                "subtotal": subtotal_dollars,
                "tax": tax_dollars,
                "total": charged_dollars,
                "ready_at": ready_at_iso,
                "metadata": order_metadata,
            })
            .eq("id", order_id)
            .execute()
        )

        if confirmed_resp.data:
            order = confirmed_resp.data[0]

    except Exception as e:
        logger.error(
            f"[Payment] CHARGE SUCCEEDED but order confirm update failed! "
            f"order={order_id} square_payment={square_payment_id} error={e}"
        )

    try:
        sc.table("order_items").insert([
            {
                "order_id": order_id,
                "menu_item_id": item["menu_item_id"],
                "quantity": item.get("quantity", 1),
                "unit_price": item["unit_price"],
                "total_price": item["unit_price"] * item.get("quantity", 1),
                "customizations": item.get("customizations", []),
            }
            for item in items_data
        ]).execute()
    except Exception as e:
        logger.error(f"[Payment] order_items insert failed order={order_id}: {e}")

    if request.loyalty_points_to_redeem > 0:
        try:
            await redeem_points_for_order(
                db=db,
                order_id=order_id,
                customer_id=customer_id,
                shop_id=request.shop_id,
                points_to_redeem=request.loyalty_points_to_redeem,
            )
        except Exception as e:
            logger.error(f"[Payment] Point deduction failed order={order_id}: {e}")

    points_awarded = 0
    points_pending = 0
    points_available_at = None

    try:
        award_result = await award_points_for_order(
            db=db,
            order_id=order_id,
            customer_id=customer_id,
            shop_id=request.shop_id,
            order_total=charged_dollars,
        )

        points_awarded = award_result.get("points", 0)
        points_pending = award_result.get("points_pending", points_awarded)
        points_available_at = award_result.get("points_available_at")

        if points_awarded > 0:
            order_metadata = {
                **order_metadata,
                "loyalty_points_earned": points_awarded,
                "loyalty_points_pending": points_pending,
                "loyalty_points_available_at": points_available_at,
            }

            sc.table("orders").update({
                "loyalty_points_earned": points_awarded,
                "metadata": order_metadata,
            }).eq("id", order_id).execute()

    except Exception as e:
        logger.warning(f"[Payment] Points award failed order={order_id}: {e}")

    try:
        profile = (
            sc.table("profiles")
            .select("push_token")
            .eq("id", customer_id)
            .single()
            .execute()
            .data or {}
        )

        await send_order_placed_push(
            push_token=profile.get("push_token"),
            shop_name=shop_name,
            prep_minutes=prep_minutes,
            order_id=order_id,
        )

    except Exception as e:
        logger.warning(f"[Payment] ETA push failed order={order_id}: {e}")

    logger.info(
        f"[Payment] SUCCESS order={order_id} square_payment={square_payment_id} "
        f"charged=${charged_dollars:.2f} tax=${tax_dollars:.2f} ready_at={ready_at_iso} "
        f"pts_earned={points_awarded} pts_pending={points_pending}"
    )

    return {
        "success": True,
        "order_id": order_id,
        "square_order_id": square_order_id,
        "charged": charged_dollars,
        "tax": tax_dollars,
        "currency": currency,
        "status": "confirmed",
        "ready_at": ready_at_iso,
        "points_earned": points_awarded,
        "points_pending": points_pending,
        "points_available_at": points_available_at,
        "prep_minutes": prep_minutes,
        "message": f"Order placed! {shop_name} will have it ready in about {prep_minutes} minutes.",
    }
"""
POST /api/v1/payments/create

Safe atomic flow:
  1. Validate cart + shop
  2. Validate loyalty redemption upfront
  3. Create order in DB with status=payment_pending before any charge
  4. Create Square order + charge card
  5. Confirm order
  6. Save order items
  7. Deduct redeemed points / award pending points
  8. Send ETA push
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator

from app.services.square_order_service import process_payment
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
    unit_price: float
    base_price: Optional[float] = None
    customizations: List[dict] = []

    @validator("quantity")
    def _q(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v

    @validator("unit_price")
    def _p(cls, v):
        if v < 0:
            raise ValueError("Unit price cannot be negative")
        return v


class CreatePaymentRequest(BaseModel):
    shop_id: str
    items: List[PaymentItem]
    payment_nonce: str
    loyalty_points_to_redeem: int = 0
    customer_note: Optional[str] = None

    @validator("items")
    def _items(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
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
        .select("id, status, name, avg_prep_time_minutes")
        .eq("id", request.shop_id)
        .limit(1)
        .execute()
    )

    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop = shop_resp.data[0]

    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently accepting orders")

    prep_minutes = int(shop.get("avg_prep_time_minutes") or 10)
    shop_name = shop.get("name", "the shop")

    items_data = [item.dict(exclude={"base_price"}) for item in request.items]
    subtotal_dollars = sum(item["unit_price"] * item.get("quantity", 1) for item in items_data)
    subtotal_cents = int(round(subtotal_dollars * 100))

    loyalty_discount_cents = 0

    if request.loyalty_points_to_redeem > 0:
        balance = get_balance(db, customer_id, request.shop_id)
        preview = compute_redemption(
            config=balance["config"],
            subtotal_cents=subtotal_cents,
            points_balance=balance["current_balance"],
            requested_points=request.loyalty_points_to_redeem,
        )

        if not preview["valid"]:
            raise HTTPException(status_code=400, detail=preview["reason"] or "Invalid redemption")

        loyalty_discount_cents = preview["discount_cents"]

    try:
        pending_payload = {
            "customer_id": customer_id,
            "shop_id": request.shop_id,
            "status": "payment_pending",
            "subtotal": subtotal_dollars,
            "tax": 0,
            "total": 0,
            "metadata": {
                "pos_provider": "square",
                "payment_method": "card_in_app",
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "customer_note": request.customer_note,
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
        logger.exception(f"[Payment] Failed to create pending order (before charge): {e}")
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
            sc.table("orders").update({
                "loyalty_points_earned": points_awarded,
                "metadata": {
                    **order_metadata,
                    "loyalty_points_earned": points_awarded,
                    "loyalty_points_pending": points_pending,
                    "loyalty_points_available_at": points_available_at,
                },
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
        f"charged=${charged_dollars:.2f} pts_redeemed={request.loyalty_points_to_redeem} "
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
        "points_earned": points_awarded,
        "points_pending": points_pending,
        "points_available_at": points_available_at,
        "prep_minutes": prep_minutes,
        "message": f"Order placed! {shop_name} will have it ready in about {prep_minutes} minutes.",
    }
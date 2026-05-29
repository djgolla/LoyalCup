"""
POST /api/v1/payments/create

Robust payment flow — DB record is created BEFORE the card is charged.
This guarantees: if the charge fails, no card was taken. If DB update after
charge fails, the order still exists and we log the Square IDs for recovery.

Flow:
  1.  Validate nonce, shop, cart
  2.  Resolve loyalty config + validate redemption (no DB writes yet)
  3.  CREATE order row in DB  (status = payment_pending)
  4.  INSERT order_items rows
  5.  Charge Square — passing real order_id as reference + idempotent key
        failure here  → mark order payment_failed, raise → client never charged
  6.  UPDATE order to confirmed + persist Square IDs / amounts
        failure here  → CRITICAL log (payment taken, manual recovery needed)
                        still return success to the user (they were charged)
  7.  Deduct redeemed loyalty points
  8.  Award earned loyalty points
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator

from app.services.square_order_service import process_payment
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
    menu_item_id:   str
    quantity:       int
    unit_price:     float
    base_price:     Optional[float] = None
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
    shop_id:                  str
    items:                    List[PaymentItem]
    payment_nonce:            str
    loyalty_points_to_redeem: int = 0
    customer_note:            Optional[str] = None

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


def _mark_order_failed(db, order_id: str, reason: str) -> None:
    """Best-effort: mark a payment_pending order as payment_failed."""
    try:
        db.get_service_client().table("orders").update({
            "status":   "payment_failed",
            "metadata": {"failure_reason": reason},
        }).eq("id", order_id).execute()
    except Exception as e:
        logger.error(f"[Payment] Could not mark order {order_id} as payment_failed: {e}")


@router.post("/create")
async def create_payment(
    request: CreatePaymentRequest,
    user: dict = Depends(require_auth()),
):
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    # ── 1. Validate nonce ─────────────────────────────────────────────────────
    if not request.payment_nonce or not request.payment_nonce.strip():
        logger.warning("[Payment] Request missing or blank payment_nonce")
        raise HTTPException(status_code=400, detail="Payment nonce required")

    db = get_supabase()

    # ── 2. Validate shop ──────────────────────────────────────────────────────
    shop_resp = (
        db.get_service_client().table("shops")
        .select("id, status, name").eq("id", request.shop_id).limit(1).execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_resp.data[0]
    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently accepting orders")

    items_data       = [item.dict(exclude={"base_price"}) for item in request.items]
    subtotal_dollars = sum(item["unit_price"] * item.get("quantity", 1) for item in items_data)
    subtotal_cents   = int(round(subtotal_dollars * 100))

    # ── 3. Validate loyalty redemption upfront — no writes ────────────────────
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

    # ── 4. Create order in DB BEFORE charging (status = payment_pending) ──────
    #      If this fails we never charge. Card is safe.
    try:
        order_resp = (
            db.get_service_client().table("orders").insert({
                "customer_id": customer_id,
                "shop_id":     request.shop_id,
                "status":      "payment_pending",
                "subtotal":    subtotal_dollars,
                "tax":         0.0,
                "total":       subtotal_dollars,
                "metadata": {
                    "pos_provider":            "square",
                    "payment_method":          "card_in_app",
                    "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                },
            }).select().single().execute()
        )
        if not order_resp.data:
            raise RuntimeError("DB returned no data after order insert")
        order    = order_resp.data
        order_id = order["id"]
    except Exception as e:
        logger.error(f"[Payment] Failed to create order record before charge: {e}")
        raise HTTPException(
            status_code=500,
            detail="Could not initialize your order. Your card has not been charged. Please try again.",
        )

    # ── 5. Insert order items (still before charge) ───────────────────────────
    try:
        db.get_service_client().table("order_items").insert([
            {
                "order_id":       order_id,
                "menu_item_id":   item["menu_item_id"],
                "quantity":       item.get("quantity", 1),
                "unit_price":     item["unit_price"],
                "total_price":    item["unit_price"] * item.get("quantity", 1),
                "customizations": item.get("customizations", []),
            }
            for item in items_data
        ]).execute()
    except Exception as e:
        logger.error(f"[Payment] Failed to insert order items for order {order_id}: {e}")
        _mark_order_failed(db, order_id, f"order_items insert failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Could not save your order items. Your card has not been charged. Please try again.",
        )

    # ── 6. Charge Square ──────────────────────────────────────────────────────
    #      Real order_id passed as reference. Idempotency key is order-scoped
    #      so network retries can never double-charge.
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
    except (HTTPException, ValueError, RuntimeError) as charge_err:
        reason = str(charge_err) if not isinstance(charge_err, HTTPException) else charge_err.detail
        logger.warning(f"[Payment] Charge failed for order {order_id}: {reason}")
        _mark_order_failed(db, order_id, reason)
        if isinstance(charge_err, HTTPException):
            raise
        if isinstance(charge_err, ValueError):
            raise HTTPException(status_code=400, detail=reason)
        raise HTTPException(status_code=402, detail=reason)
    except Exception as charge_err:
        logger.exception(f"[Payment] Unexpected charge error for order {order_id}: {charge_err}")
        _mark_order_failed(db, order_id, str(charge_err))
        raise HTTPException(
            status_code=500,
            detail="Payment processing failed. Your card has not been charged. Please try again.",
        )

    # ── Card was successfully charged from this point forward ─────────────────
    charged_cents     = payment_result["charged_cents"]
    tax_cents         = payment_result["tax_cents"]
    square_order_id   = payment_result["square_order_id"]
    square_payment_id = payment_result.get("square_payment_id")
    currency          = payment_result["currency"]
    charged_dollars   = charged_cents / 100
    tax_dollars       = tax_cents / 100

    order_metadata = {
        "square_order_id":         square_order_id,
        "square_payment_id":       square_payment_id,
        "pos_provider":            "square",
        "currency":                currency,
        "loyalty_points_redeemed": request.loyalty_points_to_redeem,
        "payment_method":          "card_in_app" if square_payment_id else "loyalty_free",
    }
    if loyalty_discount_cents > 0:
        order_metadata["discount_amount"] = loyalty_discount_cents / 100

    # ── 7. Confirm the order in DB with real amounts + Square IDs ─────────────
    try:
        update_resp = (
            db.get_service_client().table("orders").update({
                "status":   "confirmed",
                "subtotal": subtotal_dollars,
                "tax":      tax_dollars,
                "total":    charged_dollars,
                "metadata": order_metadata,
            }).eq("id", order_id).select().single().execute()
        )
        if update_resp.data:
            order = update_resp.data
    except Exception as update_err:
        # CRITICAL: Payment succeeded but we couldn't update the DB record.
        # The order row still exists as payment_pending.
        # Log every ID for manual reconciliation — do NOT return an error
        # to the user since they were charged successfully.
        logger.critical(
            f"[Payment] PAYMENT_SUCCEEDED_ORDER_UPDATE_FAILED "
            f"order_id={order_id} square_payment_id={square_payment_id} "
            f"square_order_id={square_order_id} charged={charged_dollars:.2f} "
            f"error={update_err}"
        )

    # ── 8. Deduct redeemed loyalty points ─────────────────────────────────────
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
            logger.error(
                f"[Payment] Point deduction failed (already charged!) "
                f"order={order_id} pts={request.loyalty_points_to_redeem}: {e}"
            )

    # ── 9. Award points earned ────────────────────────────────────────────────
    points_awarded = 0
    try:
        award_result = await award_points_for_order(
            db=db,
            order_id=order_id,
            customer_id=customer_id,
            shop_id=request.shop_id,
            order_total=charged_dollars,
        )
        points_awarded = award_result.get("points", 0)

        if points_awarded > 0:
            try:
                db.get_service_client().table("orders").update({
                    "metadata": {
                        **order_metadata,
                        "loyalty_points_earned": points_awarded,
                    }
                }).eq("id", order_id).execute()
            except Exception as meta_err:
                logger.warning(
                    f"[Payment] Could not persist points_earned to metadata "
                    f"order={order_id}: {meta_err}"
                )
    except Exception as e:
        logger.warning(f"[Payment] Points award failed order={order_id}: {e}")

    logger.info(
        f"[Payment] SUCCESS order={order_id} square_payment={square_payment_id} "
        f"charged=${charged_dollars:.2f} pts_redeemed={request.loyalty_points_to_redeem} "
        f"pts_earned={points_awarded}"
    )

    return {
        "success":         True,
        "order_id":        order_id,
        "square_order_id": square_order_id,
        "charged":         charged_dollars,
        "tax":             tax_dollars,
        "currency":        currency,
        "status":          "confirmed",
        "points_earned":   points_awarded,
        "message":         "Payment successful! Your order is being prepared.",
    }
"""
POST /api/v1/payments/create

Safe atomic flow:
  1. Validate cart + shop
  2. Validate loyalty redemption upfront (no writes)
  3. CREATE order in DB with status=payment_pending   ← before any charge
  4. Charge Square
     - on failure → mark order payment_failed, raise 402 (card never charged)
  5. Mark order confirmed
  6. Save order items
  7. Deduct redeemed points
  8. Award earned points

This guarantees a customer can never be charged without an order row existing.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator

from app.services.square_order_service import process_payment
from app.services.loyalty_service import (
    get_shop_config,
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


@router.post("/create")
async def create_payment(
    request: CreatePaymentRequest,
    user: dict = Depends(require_auth()),
):
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()

    # ── Validate nonce ────────────────────────────────────────────────────────
    if not request.payment_nonce or not request.payment_nonce.strip():
        raise HTTPException(status_code=400, detail="Payment nonce required")

    # ── Validate shop ─────────────────────────────────────────────────────────
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

    # ── Validate loyalty redemption upfront (no DB writes yet) ───────────────
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

    # ── STEP 1: Create order in DB BEFORE charging ────────────────────────────
    # If this fails, nothing has been charged. Safe to raise immediately.
    try:
        pending_resp = (
            db.get_service_client().table("orders").insert({
                "customer_id": customer_id,
                "shop_id":     request.shop_id,
                "status":      "payment_pending",
                "subtotal":    subtotal_dollars,
                "tax":         0,
                "total":       0,
                "metadata": {
                    "pos_provider":            "square",
                    "payment_method":          "card_in_app",
                    "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                    "customer_note":           request.customer_note,
                },
            }).select().single().execute()
        )
        order    = pending_resp.data
        order_id = order["id"]
    except Exception as e:
        logger.exception(f"[Payment] Failed to create pending order (before charge): {e}")
        raise HTTPException(status_code=500, detail="Could not create order. Card was not charged.")

    # ── STEP 2: Charge Square ─────────────────────────────────────────────────
    # If this fails we mark the order payment_failed and raise — no charge happened.
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
        # Mark the pre-created order as payment_failed so it's traceable
        try:
            db.get_service_client().table("orders").update({
                "status":   "payment_failed",
                "metadata": {
                    **(order.get("metadata") or {}),
                    "failure_reason": str(e),
                },
            }).eq("id", order_id).execute()
        except Exception as mark_err:
            logger.error(f"[Payment] Could not mark order payment_failed order={order_id}: {mark_err}")

        logger.error(f"[Payment] Square charge failed order={order_id}: {e}")
        raise HTTPException(status_code=402, detail=str(e))

    charged_cents     = payment_result["charged_cents"]
    tax_cents         = payment_result["tax_cents"]
    square_order_id   = payment_result["square_order_id"]
    square_payment_id = payment_result.get("square_payment_id")
    currency          = payment_result["currency"]
    charged_dollars   = charged_cents / 100
    tax_dollars       = tax_cents / 100

    # ── STEP 3: Confirm order now that charge succeeded ───────────────────────
    order_metadata = {
        "square_order_id":         square_order_id,
        "square_payment_id":       square_payment_id,
        "pos_provider":            "square",
        "currency":                currency,
        "loyalty_points_redeemed": request.loyalty_points_to_redeem,
        "payment_method":          "card_in_app" if square_payment_id else "loyalty_free",
        "customer_note":           request.customer_note,
    }
    if loyalty_discount_cents > 0:
        order_metadata["discount_amount"] = loyalty_discount_cents / 100

    try:
        confirmed_resp = (
            db.get_service_client().table("orders").update({
                "status":   "confirmed",
                "subtotal": subtotal_dollars,
                "tax":      tax_dollars,
                "total":    charged_dollars,
                "metadata": order_metadata,
            }).eq("id", order_id).select().single().execute()
        )
        order = confirmed_resp.data
    except Exception as e:
        # Charge succeeded but we couldn't update the status — log loudly.
        # Order exists in DB as payment_pending; support can reconcile via square_payment_id.
        logger.error(
            f"[Payment] CHARGE SUCCEEDED but order confirm update failed! "
            f"order={order_id} square_payment={square_payment_id} error={e}"
        )
        # Still return success to the customer — the money moved, the order exists.
        # Don't raise here; a 500 would make the app show "payment failed" on a successful charge.

    # ── STEP 4: Save order items ──────────────────────────────────────────────
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
        logger.error(f"[Payment] order_items insert failed order={order_id}: {e}")
        # Non-fatal — order is confirmed and charged, items can be reconciled

    # ── STEP 5: Deduct redeemed points ────────────────────────────────────────
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

    # ── STEP 6: Award earned points ───────────────────────────────────────────
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
            db.get_service_client().table("orders").update({
                "metadata": {
                    **order_metadata,
                    "loyalty_points_earned": points_awarded,
                }
            }).eq("id", order_id).execute()
    except Exception as e:
        logger.warning(f"[Payment] Points award failed order={order_id}: {e}")

    logger.info(
        f"[Payment] SUCCESS order={order_id} square_payment={square_payment_id} "
        f"charged=${charged_dollars:.2f} pts_redeemed={request.loyalty_points_to_redeem} pts_earned={points_awarded}"
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
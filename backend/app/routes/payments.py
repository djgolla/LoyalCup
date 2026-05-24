"""
POST /api/v1/payments/create

Full payment flow:
  1. Validate loyalty redemption against actual balance (customer_global_points)
  2. Create Square order (tax calculated by Square at shop's location)
  3. Charge the card (or skip charge if fully covered by loyalty)
  4. Save order + items to Supabase
  5. Deduct loyalty points redeemed
  6. Award loyalty points earned
  7. Return confirmation
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator

from app.services.square_order_service import process_payment
from app.services.loyalty_service import award_points_for_order
from app.utils.security import require_auth
from app.database import get_supabase

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])
logger = logging.getLogger(__name__)


class PaymentItem(BaseModel):
    menu_item_id:   str
    quantity:       int
    unit_price:     float
    base_price:     Optional[float] = None  # alias sent by mobile — ignored, unit_price is authoritative
    customizations: List[dict] = []

    @validator("quantity")
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v

    @validator("unit_price")
    def price_non_negative(cls, v):
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
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v

    @validator("loyalty_points_to_redeem")
    def loyalty_non_negative(cls, v):
        if v < 0:
            raise ValueError("Cannot redeem negative points")
        return v

    @validator("customer_note")
    def note_max_length(cls, v):
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

    # ── Validate shop ────────────────────────────────────────────────────────
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, status, name")
        .eq("id", request.shop_id)
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_resp.data[0]
    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently accepting orders")

    # ── Validate loyalty redemption ──────────────────────────────────────────
    # Source of truth: customer_global_points (same table mobile reads)
    # 100 points = $1 = 100 cents discount
    loyalty_discount_cents = 0
    actual_global_balance  = 0

    if request.loyalty_points_to_redeem > 0:
        pts_resp = (
            db.get_service_client()
            .table("customer_global_points")
            .select("current_balance")
            .eq("customer_id", customer_id)
            .limit(1)
            .execute()
        )
        actual_global_balance = (
            (pts_resp.data[0].get("current_balance") or 0)
            if pts_resp.data else 0
        )
        if request.loyalty_points_to_redeem > actual_global_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient loyalty points. You have {actual_global_balance} points.",
            )
        loyalty_discount_cents = request.loyalty_points_to_redeem  # 1 point = 1 cent

    items_data       = [item.dict(exclude={"base_price"}) for item in request.items]
    subtotal_dollars = sum(item["unit_price"] * item.get("quantity", 1) for item in items_data)

    try:
        # ── Charge via Square ────────────────────────────────────────────────
        payment_result = await process_payment(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id="pending",
            items=items_data,
            payment_nonce=request.payment_nonce,
            loyalty_discount_cents=loyalty_discount_cents,
            customer_note=request.customer_note,
        )

        charged_cents     = payment_result["charged_cents"]
        tax_cents         = payment_result["tax_cents"]
        square_order_id   = payment_result["square_order_id"]
        square_payment_id = payment_result.get("square_payment_id")
        currency          = payment_result["currency"]
        charged_dollars   = charged_cents / 100
        tax_dollars       = tax_cents / 100

        # ── Save order ───────────────────────────────────────────────────────
        order_metadata = {
            "square_order_id":          square_order_id,
            "square_payment_id":        square_payment_id,
            "pos_provider":             "square",
            "currency":                 currency,
            "loyalty_points_redeemed":  request.loyalty_points_to_redeem,
            "payment_method":           "card_in_app" if square_payment_id else "loyalty_free",
        }
        if request.loyalty_points_to_redeem > 0:
            order_metadata["discount_amount"] = loyalty_discount_cents / 100

        order_resp = (
            db.get_service_client()
            .table("orders")
            .insert({
                "customer_id": customer_id,
                "shop_id":     request.shop_id,
                "status":      "confirmed",
                "subtotal":    subtotal_dollars,
                "tax":         tax_dollars,
                "total":       charged_dollars,
                "metadata":    order_metadata,
            })
            .select()
            .single()
            .execute()
        )
        order    = order_resp.data
        order_id = order["id"]

        # ── Save order items ─────────────────────────────────────────────────
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

        # ── Deduct redeemed points from customer_global_points ───────────────
        # Must happen before award so balance is accurate if this request is retried
        if request.loyalty_points_to_redeem > 0:
            try:
                new_balance = actual_global_balance - request.loyalty_points_to_redeem
                db.get_service_client().table("customer_global_points").update({
                    "current_balance": new_balance,
                    "total_spent": (
                        db.get_service_client()
                        .table("customer_global_points")
                        .select("total_spent")
                        .eq("customer_id", customer_id)
                        .single()
                        .execute()
                        .data or {}
                    ).get("total_spent", 0) + request.loyalty_points_to_redeem,
                }).eq("customer_id", customer_id).execute()

                # Record redemption transaction
                db.get_service_client().table("points_transactions").insert({
                    "customer_id":   customer_id,
                    "shop_id":       request.shop_id,
                    "order_id":      order_id,
                    "type":          "redeemed",
                    "points_type":   "global",
                    "amount":        -request.loyalty_points_to_redeem,
                    "balance_after": new_balance,
                    "description":   f"Redeemed {request.loyalty_points_to_redeem} pts for ${loyalty_discount_cents/100:.2f} off",
                }).execute()
            except Exception as e:
                logger.warning(f"[Payment] Point deduction failed for order {order_id}: {e}")

        # ── Award points earned ──────────────────────────────────────────────
        try:
            await award_points_for_order(
                db=db,
                order_id=order_id,
                customer_id=customer_id,
                shop_id=request.shop_id,
                order_total=charged_dollars,
            )
        except Exception as e:
            logger.warning(f"[Payment] Points award failed for order {order_id}: {e}")

        logger.info(
            f"[Payment] SUCCESS order={order_id} "
            f"square_payment={square_payment_id} "
            f"charged=${charged_dollars:.2f} "
            f"pts_redeemed={request.loyalty_points_to_redeem}"
        )

        return {
            "success":         True,
            "order_id":        order_id,
            "square_order_id": square_order_id,
            "charged":         charged_dollars,   # ← what checkout.js reads
            "tax":             tax_dollars,
            "currency":        currency,
            "status":          "confirmed",
            "message":         "Payment successful! Your order is being prepared.",
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"[Payment] Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"[Payment] Payment failed: {e}")
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        logger.exception(f"[Payment] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Payment processing failed. Please try again.")
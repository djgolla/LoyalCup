"""
POST /api/v1/payments/create

Full payment flow:
  1. Validate loyalty redemption against actual balance
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
    menu_item_id: str
    quantity: int
    unit_price: float
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
    shop_id: str
    items: List[PaymentItem]
    payment_nonce: str
    loyalty_points_to_redeem: int = 0
    customer_note: Optional[str] = None

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

    # ── Validate shop exists and is active ──────────────────────────────────
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

    # ── Validate loyalty points redemption ───────────────────────────────────
    loyalty_discount_cents = 0
    if request.loyalty_points_to_redeem > 0:
        loyalty_resp = (
            db.get_service_client()
            .table("loyalty_balances")
            .select("points_balance")
            .eq("customer_id", customer_id)
            .eq("shop_id", request.shop_id)
            .limit(1)
            .execute()
        )
        actual_balance = (loyalty_resp.data[0].get("points_balance") or 0) if loyalty_resp.data else 0
        if request.loyalty_points_to_redeem > actual_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient loyalty points. You have {actual_balance} points.",
            )
        loyalty_discount_cents = request.loyalty_points_to_redeem  # 1 point = 1 cent

    items_data = [item.dict() for item in request.items]

    # ── Compute expected subtotal for sanity check ───────────────────────────
    subtotal_dollars = sum(
        item["unit_price"] * item.get("quantity", 1) for item in items_data
    )

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
        square_payment_id = payment_result.get("square_payment_id")  # None for free orders
        currency          = payment_result["currency"]

        charged_dollars  = charged_cents / 100
        tax_dollars      = tax_cents / 100

        # ── Save order ───────────────────────────────────────────────────────
        order_insert = {
            "customer_id": customer_id,
            "shop_id":     request.shop_id,
            "status":      "confirmed",
            "subtotal":    subtotal_dollars,
            "tax":         tax_dollars,
            "total":       charged_dollars,
            "metadata": {
                "square_order_id":         square_order_id,
                "square_payment_id":       square_payment_id,
                "pos_provider":            "square",
                "currency":                currency,
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "payment_method":          "card_in_app" if square_payment_id else "loyalty_free",
            },
        }
        if request.loyalty_points_to_redeem > 0:
            order_insert["metadata"]["discount_amount"] = loyalty_discount_cents / 100

        order_resp = (
            db.get_service_client()
            .table("orders")
            .insert(order_insert)
            .select()
            .single()
            .execute()
        )
        order    = order_resp.data
        order_id = order["id"]

        # ── Save order items ─────────────────────────────────────────────────
        order_items = [
            {
                "order_id":       order_id,
                "menu_item_id":   item["menu_item_id"],
                "quantity":       item.get("quantity", 1),
                "unit_price":     item["unit_price"],
                "total_price":    item["unit_price"] * item.get("quantity", 1),
                "customizations": item.get("customizations", []),
            }
            for item in items_data
        ]
        db.get_service_client().table("order_items").insert(order_items).execute()

        # ── Update order metadata with real order ID ─────────────────────────
        try:
            db.get_service_client().table("orders").update({
                "metadata": {**order["metadata"], "loyalcup_order_id": order_id}
            }).eq("id", order_id).execute()
        except Exception:
            pass  # non-fatal

        # ── Deduct redeemed loyalty points ───────────────────────────────────
        if request.loyalty_points_to_redeem > 0:
            try:
                db.get_service_client().table("loyalty_balances").update({
                    "points_balance": actual_balance - request.loyalty_points_to_redeem
                }).eq("customer_id", customer_id).eq("shop_id", request.shop_id).execute()

                db.get_service_client().table("loyalty_transactions").insert({
                    "customer_id": customer_id,
                    "shop_id":     request.shop_id,
                    "order_id":    order_id,
                    "type":        "redeem",
                    "points":      -request.loyalty_points_to_redeem,
                    "description": f"Redeemed {request.loyalty_points_to_redeem} points on order",
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
            f"charged=${charged_dollars:.2f}"
        )

        return {
            "success":         True,
            "order_id":        order_id,
            "square_order_id": square_order_id,
            "charged":         charged_dollars,
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
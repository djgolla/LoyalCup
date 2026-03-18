"""
POST /api/v1/payments/create

Full payment flow:
  1. Receive payment nonce from Square In-App Payments SDK
  2. Create Square order (tax calculated by Square at shop's location)
  3. Charge the card
  4. Save order + payment result to Supabase
  5. Award loyalty points
  6. Return confirmation to app
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.square_order_service import process_payment
from app.services.loyalty_service import award_points_for_order
from app.utils.security import require_auth
from app.database import get_supabase

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])
logger = logging.getLogger(__name__)


class PaymentItem(BaseModel):
    menu_item_id: str
    quantity: int
    unit_price: float          # dollars
    customizations: List[dict] = []


class CreatePaymentRequest(BaseModel):
    shop_id: str
    items: List[PaymentItem]
    payment_nonce: str         # nonce from Square In-App Payments SDK
    loyalty_points_to_redeem: int = 0
    customer_note: Optional[str] = None


@router.post("/create")
async def create_payment(
    request: CreatePaymentRequest,
    user: dict = Depends(require_auth()),
):
    """
    End-to-end payment: charge card via Square, push to POS as PAID,
    save order to Supabase, award loyalty points.
    """
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()

    items_data = [item.dict() for item in request.items]

    # Loyalty discount: 100 points = $1 = 100 cents
    loyalty_discount_cents = request.loyalty_points_to_redeem  # 1 point = 1 cent

    try:
        # ── 1. Charge card + push to Square POS ──────────────────────────────
        payment_result = await process_payment(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id="pending",   # placeholder — replaced after order insert
            items=items_data,
            payment_nonce=request.payment_nonce,
            loyalty_discount_cents=loyalty_discount_cents,
            customer_note=request.customer_note,
        )

        charged_cents     = payment_result["charged_cents"]
        tax_cents         = payment_result["tax_cents"]
        square_order_id   = payment_result["square_order_id"]
        square_payment_id = payment_result["square_payment_id"]
        currency          = payment_result["currency"]

        # Convert to dollars for Supabase
        charged_dollars = charged_cents / 100
        tax_dollars     = tax_cents / 100
        subtotal_dollars = sum(
            item["unit_price"] * item.get("quantity", 1) for item in items_data
        )

        # ── 2. Save order to Supabase ─────────────────────────────────────────
        order_insert = {
            "customer_id": customer_id,
            "shop_id":     request.shop_id,
            "status":      "confirmed",     # already paid — skip 'pending'
            "subtotal":    subtotal_dollars,
            "tax":         tax_dollars,
            "total":       charged_dollars,
            "metadata": {
                "square_order_id":         square_order_id,
                "square_payment_id":       square_payment_id,
                "pos_provider":            "square",
                "currency":                currency,
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "payment_method":          "card_in_app",
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
        order = order_resp.data
        order_id = order["id"]

        # ── 3. Save order items ───────────────────────────────────────────────
        order_items = []
        for item in items_data:
            order_items.append({
                "order_id":     order_id,
                "menu_item_id": item["menu_item_id"],
                "quantity":     item.get("quantity", 1),
                "unit_price":   item["unit_price"],
                "total_price":  item["unit_price"] * item.get("quantity", 1),
                "customizations": item.get("customizations", []),
            })
        db.get_service_client().table("order_items").insert(order_items).execute()

        # ── 4. Update Square reference_id with real order ID ─────────────────
        # (best-effort — Square already processed the payment, this is just housekeeping)
        try:
            updated_metadata = {**order["metadata"], "loyalcup_order_id": order_id}
            db.get_service_client().table("orders").update(
                {"metadata": updated_metadata}
            ).eq("id", order_id).execute()
        except Exception:
            pass  # non-fatal

        # ── 5. Award loyalty points ───────────────────────────────────────────
        try:
            await award_points_for_order(
                db=db,
                order_id=order_id,
                customer_id=customer_id,
                shop_id=request.shop_id,
                order_total=charged_dollars,
            )
        except Exception as e:
            logger.warning(f"Points award failed for order {order_id}: {e}")
            # non-fatal — order was paid, points can be reconciled later

        logger.info(
            f"[Payment] SUCCESS order={order_id}  "
            f"square_payment={square_payment_id}  "
            f"charged=${charged_dollars:.2f}"
        )

        return {
            "success":          True,
            "order_id":         order_id,
            "square_order_id":  square_order_id,
            "charged":          charged_dollars,
            "tax":              tax_dollars,
            "currency":         currency,
            "status":           "confirmed",
            "message":          "Payment successful! Your order is being prepared.",
        }

    except ValueError as e:
        logger.warning(f"[Payment] Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"[Payment] Payment failed: {e}")
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        logger.exception(f"[Payment] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Payment processing failed. Please try again.")
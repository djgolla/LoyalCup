from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, validator
import logging

from app.services.square_order_service import process_payment, push_order_to_pos
from app.services.loyalty_service import award_points_for_order
from app.services.email_service import email_service
from app.services.push_service import send_order_push
from app.utils.security import require_auth, require_shop_worker
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])
logger = logging.getLogger(__name__)


class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    unit_price: float = 0.0
    base_price: float = 0.0
    customizations: List[dict] = []

    @validator("quantity")
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class CreateOrderRequest(BaseModel):
    shop_id: str
    items: List[OrderItem]
    payment_nonce: str                   # required — Square card token from mobile SDK
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


class UpdateStatusRequest(BaseModel):
    status: str


@router.post("/orders")
async def create_order(
    request: CreateOrderRequest,
    user: dict = Depends(require_auth()),
):
    """
    Full atomic order flow:
      1. Validate shop + loyalty balance
      2. Charge card via Square (creates Square order + charges nonce)
      3. Save order + items to Supabase (status = confirmed)
      4. Deduct loyalty points redeemed
      5. Award loyalty points earned
      6. Send order confirmation email
      7. Return confirmation with order_id + total_charged
    """
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

    # ── Validate loyalty points ──────────────────────────────────────────────
    loyalty_discount_cents = 0
    actual_balance         = 0
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
                detail=f"Insufficient points. You have {actual_balance} pts.",
            )
        loyalty_discount_cents = request.loyalty_points_to_redeem  # 1 pt = 1¢

    items_data = [
        {
            "menu_item_id":   item.menu_item_id,
            "quantity":       item.quantity,
            "unit_price":     item.unit_price or item.base_price,
            "base_price":     item.base_price or item.unit_price,
            "customizations": item.customizations,
        }
        for item in request.items
    ]

    subtotal_dollars = sum(
        item["unit_price"] * item["quantity"] for item in items_data
    )

    try:
        # ── Charge card via Square ───────────────────────────────────────────
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

        # ── Save order to Supabase ───────────────────────────────────────────
        order_insert = {
            "customer_id": customer_id,
            "shop_id":     request.shop_id,
            "status":      "confirmed",
            "subtotal":    subtotal_dollars,
            "tax":         tax_dollars,
            "total":       charged_dollars,
            "discount_amount": loyalty_discount_cents / 100 if loyalty_discount_cents else 0,
            "metadata": {
                "square_order_id":         square_order_id,
                "square_payment_id":       square_payment_id,
                "pos_provider":            "square",
                "currency":                currency,
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "payment_method":          "card_in_app" if square_payment_id else "loyalty_free",
                "customer_note":           request.customer_note,
            },
        }

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
        order_items_rows = [
            {
                "order_id":       order_id,
                "menu_item_id":   item["menu_item_id"],
                "quantity":       item["quantity"],
                "unit_price":     item["unit_price"],
                "total_price":    item["unit_price"] * item["quantity"],
                "customizations": item["customizations"],
            }
            for item in items_data
        ]
        db.get_service_client().table("order_items").insert(order_items_rows).execute()

        # patch real order id into metadata
        try:
            db.get_service_client().table("orders").update({
                "metadata": {**order["metadata"], "loyalcup_order_id": order_id}
            }).eq("id", order_id).execute()
        except Exception:
            pass

        # ── Deduct loyalty points redeemed ───────────────────────────────────
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
                    "description": f"Redeemed {request.loyalty_points_to_redeem} pts on order",
                }).execute()
            except Exception as e:
                logger.warning(f"[Orders] Point deduction failed for {order_id}: {e}")

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
            logger.warning(f"[Orders] Points award failed for {order_id}: {e}")

        # ── Confirmation email ───────────────────────────────────────────────
        try:
            full_order = await _get_order(db, order_id)
            if full_order:
                customer_email = full_order.get("customer", {}).get("email") or user.get("email")
                shop_name      = full_order.get("shops", {}).get("name", "the shop")
                if customer_email:
                    await email_service.send_order_confirmation_rich(
                        to_email=customer_email,
                        order_id=order_id,
                        shop_name=shop_name,
                        items=full_order.get("items", []),
                        subtotal=subtotal_dollars,
                        tax=tax_dollars,
                        total=charged_dollars,
                        customer_note=request.customer_note,
                    )
        except Exception as e:
            logger.warning(f"[Orders] Email failed for {order_id}: {e}")

        logger.info(
            f"[Orders] SUCCESS order={order_id} "
            f"square_payment={square_payment_id} charged=${charged_dollars:.2f}"
        )

        return {
            "success":         True,
            "order_id":        order_id,
            "square_order_id": square_order_id,
            "total_charged":   charged_dollars,
            "tax":             tax_dollars,
            "currency":        currency,
            "status":          "confirmed",
            "message":         "Order placed! It will print on the Square terminal now.",
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"[Orders] Payment failed: {e}")
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        logger.exception(f"[Orders] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Payment processing failed. Please try again.")


async def _get_order(db, order_id: str):
    """Internal helper — get full order with joins for email."""
    try:
        resp = (
            db.get_service_client()
            .table("orders")
            .select("*, shops(name), order_items(*, menu_items(name))")
            .eq("id", order_id)
            .single()
            .execute()
        )
        return resp.data
    except Exception:
        return None


@router.get("/orders")
async def get_customer_orders(
    user: dict = Depends(require_auth()),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        orders = await order_service.list_orders(
            customer_id=customer_id, status=status, limit=limit
        )
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/history")
async def get_customer_order_history(
    user: dict = Depends(require_auth()),
    limit: int = Query(20, le=100),
):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        orders = await order_service.get_order_history(
            customer_id=customer_id, limit=limit
        )
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, user: dict = Depends(require_auth())):
    try:
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        customer_id = user.get("sub")
        user_role   = user.get("user_metadata", {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in ["admin", "shop_worker", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Access denied")

        return {"order": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}/status")
async def get_order_status(order_id: str, user: dict = Depends(require_auth())):
    try:
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        customer_id = user.get("sub")
        user_role   = user.get("user_metadata", {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in ["admin", "shop_worker", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Access denied")

        return {"status": order.get("status"), "updated_at": order.get("updated_at")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(require_auth())):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        order = await order_service.cancel_order(order_id, customer_id)
        return {"message": "Order cancelled", "order": order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    status: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = Query(50, le=100),
):
    try:
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        orders = await order_service.get_shop_orders(shop_id=shop_id, status=status, limit=limit)
        if date:
            orders = [o for o in orders if o.get("created_at", "").startswith(date)]
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders/queue")
async def get_order_queue(shop_id: str, user: dict = Depends(require_shop_worker())):
    try:
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db
        result = {"pending": [], "confirmed": [], "accepted": [], "preparing": [], "ready": []}
        for status in result.keys():
            result[status] = await order_service.list_orders(shop_id=shop_id, status=status, limit=50)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/shops/{shop_id}/orders/{order_id}/status")
async def update_order_status(
    shop_id: str,
    order_id: str,
    request: UpdateStatusRequest,
    user: dict = Depends(require_shop_worker()),
):
    try:
        db = get_supabase()
        from app.services.order_service import order_service
        order_service.db = db

        order_before = await order_service.get_order(order_id)
        if not order_before:
            raise HTTPException(status_code=404, detail="Order not found")
        if order_before.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this shop")

        updated_order = await order_service.update_order_status(order_id, request.status)
        shop_name     = order_before.get("shops", {}).get("name", "the shop")
        customer_id   = order_before.get("customer_id")

        # Status update email
        try:
            if request.status in {"accepted", "ready", "cancelled"}:
                customer_email = order_before.get("customer", {}).get("email")
                if customer_email:
                    await email_service.send_order_status_update_rich(
                        to_email=customer_email,
                        order_id=order_id,
                        shop_name=shop_name,
                        status=request.status,
                        items=order_before.get("items", []),
                        total=float(order_before.get("total", 0)),
                    )
        except Exception as e:
            logger.warning(f"[Orders] Status email failed: {e}")

        # Push notification to customer
        try:
            if customer_id:
                profile = db.get_service_client().table("profiles") \
                    .select("push_token").eq("id", customer_id).single().execute()
                push_token = (profile.data or {}).get("push_token")
                if push_token:
                    await send_order_push(
                        push_token=push_token,
                        order_id=order_id,
                        status=request.status,
                        shop_name=shop_name,
                    )
        except Exception as e:
            logger.warning(f"[Orders] Push failed: {e}")

        return {"message": "Status updated", "order": updated_order}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
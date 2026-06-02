"""
Orders routes.

POST /api/v1/orders            — cash/manual order → sent to Square POS (no charge)
                                 Mobile card checkout goes through
                                 POST /api/v1/payments/create (payments.py)

GET  /api/v1/orders            — customer's own orders
GET  /api/v1/orders/history    — completed/cancelled orders
GET  /api/v1/orders/{id}       — order details
POST /api/v1/orders/{id}/cancel — customer cancel (newly placed only)

GET  /api/v1/shops/{id}/orders  — shop order list (owner history)

NOTE: There is no order-status workflow. Customers are given an ETA based on
the shop's avg_prep_time_minutes; orders go straight to the shop's Square POS.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, validator

from app.services.order_service import order_service
from app.services.square_order_service import push_order_to_pos
from app.services.notification_service import send_order_placed_push
from app.services.email_service import email_service
from app.utils.security import require_auth, require_shop_worker, get_user_role
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])
logger = logging.getLogger(__name__)


# ── Request models ───────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    menu_item_id:   str
    quantity:       int
    base_price:     float
    customizations: List[dict] = []

    @validator("quantity")
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class CreateOrderRequest(BaseModel):
    shop_id:       str
    items:         List[OrderItem]
    customer_note: Optional[str] = None

    @validator("items")
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v

    @validator("customer_note")
    def note_max_length(cls, v):
        if v and len(v) > 500:
            raise ValueError("Note too long (max 500 chars)")
        return v


# ── POST /orders — cash / manual order ───────────────────────────────────────
# Mobile card payments go through POST /api/v1/payments/create instead.

@router.post("/orders")
async def create_order(
    request: CreateOrderRequest,
    user: dict = Depends(require_auth()),
):
    """
    Create an order and send it to the shop's Square POS (no card charge).
    Used for cash / in-person payment.

    Reliability: if the shop has Square connected and the POS submission fails,
    the order is cancelled and we return an error — we NEVER tell the customer
    the order was placed if it didn't reach the shop.
    """
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()
    order_service.db = db

    # Validate shop (and grab prep time + name for the ETA notification)
    shop_resp = (
        db.get_service_client()
        .table("shops")
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
    shop_name    = shop.get("name", "the shop")

    items_data = [item.dict() for item in request.items]

    # Create the order row first (status=pending for cash)
    try:
        order = await order_service.create_order(
            shop_id=request.shop_id,
            customer_id=customer_id,
            items=items_data,
            status="pending",
            metadata={
                "pos_provider":   "square",
                "payment_method": "cash",
                "customer_note":  request.customer_note,
            },
        )
        order_id = order["id"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[Orders] create_order DB error: {e}")
        raise HTTPException(status_code=500, detail="Could not create order. Please try again.")

    # Send to Square POS. CRITICAL: if a connection exists and this fails,
    # cancel the order and fail loudly so the customer isn't misled.
    try:
        pos_order_id = await push_order_to_pos(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id=order_id,
            items=items_data,
            customer_note=request.customer_note,
        )
    except Exception as e:
        logger.error(f"[Orders] POS submission FAILED order={order_id}: {e}")
        try:
            db.get_service_client().table("orders").update({
                "status":   "cancelled",
                "metadata": {**(order.get("metadata") or {}), "failure_reason": f"pos_submit_failed: {e}"},
            }).eq("id", order_id).execute()
        except Exception as mark_err:
            logger.error(f"[Orders] Could not cancel failed order {order_id}: {mark_err}")
        raise HTTPException(
            status_code=502,
            detail="We couldn't send your order to the shop. You were not charged — please try again.",
        )

    if pos_order_id:
        meta = {**(order.get("metadata") or {}), "pos_order_id": pos_order_id, "square_order_id": pos_order_id}
        db.get_service_client().table("orders").update({"metadata": meta}).eq("id", order_id).execute()
        order["metadata"] = meta

    # One ETA push notification (fire and forget)
    try:
        profile = (
            db.get_service_client()
            .table("profiles")
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
        logger.warning(f"[Orders] ETA push failed order={order_id}: {e}")

    # Confirmation email — fire and forget
    try:
        full_order = await order_service.get_order(order_id)
        if full_order:
            customer_email = (full_order.get("customer", {}).get("email") or user.get("email"))
            if customer_email:
                await email_service.send_order_confirmation_rich(
                    to_email=customer_email,
                    order_id=order_id,
                    shop_name=shop_name,
                    items=full_order.get("items", []),
                    subtotal=float(full_order.get("subtotal", 0)),
                    tax=float(full_order.get("tax", 0)),
                    total=float(full_order.get("total", 0)),
                    customer_note=request.customer_note,
                )
    except Exception as e:
        logger.warning(f"[Orders] Confirmation email failed order={order_id}: {e}")

    return {
        "order":        order,
        "prep_minutes": prep_minutes,
        "message":      f"Order placed! {shop_name} will have it ready in about {prep_minutes} minutes.",
    }


# ── GET /orders — customer's orders ──────────────────────────────────────────

@router.get("/orders")
async def get_customer_orders(
    user: dict = Depends(require_auth()),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
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
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        customer_id = user.get("sub")
        user_role   = get_user_role(customer_id)  # role from DB, not user_metadata
        if order.get("customer_id") != customer_id and user_role not in ("admin", "shop_worker", "shop_owner"):
            raise HTTPException(status_code=403, detail="Access denied")

        return {"order": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(require_auth())):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        order_service.db = db
        order = await order_service.cancel_order(order_id, customer_id)
        return {"message": "Order cancelled", "order": order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Shop order list (owner history; no status workflow) ──────────────────────

@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    user:    dict = Depends(require_shop_worker()),
    status:  Optional[str] = None,
    date:    Optional[str] = None,
    limit:   int = Query(50, le=100),
):
    try:
        db = get_supabase()
        order_service.db = db
        orders = await order_service.get_shop_orders(
            shop_id=shop_id, status=status, limit=limit
        )
        if date:
            orders = [o for o in orders if o.get("created_at", "").startswith(date)]
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
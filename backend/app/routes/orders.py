"""
Orders routes.

POST /api/v1/orders            — cash/manual order → pushed to Square POS (no charge)
                                 Mobile checkout with card payment goes through
                                 POST /api/v1/payments/create (payments.py)

GET  /api/v1/orders            — customer's own orders
GET  /api/v1/orders/history    — completed/cancelled orders
GET  /api/v1/orders/{id}       — order details
GET  /api/v1/orders/{id}/status — lightweight status poll
POST /api/v1/orders/{id}/cancel — customer cancel (confirmed/pending only)

GET  /api/v1/shops/{id}/orders        — shop order list
GET  /api/v1/shops/{id}/orders/queue  — live queue by status bucket
PUT  /api/v1/shops/{id}/orders/{id}/status — barista status update + push/SMS
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, validator

from app.services.order_service import order_service
from app.services.square_order_service import push_order_to_pos
from app.services.notification_service import notify_customer_status_change
from app.services.email_service import email_service
from app.utils.security import require_auth, require_shop_worker
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])
logger = logging.getLogger(__name__)


# ── Request models ────────────────────────────────────────────────────────────

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


class UpdateStatusRequest(BaseModel):
    status: str

    @validator("status")
    def valid_status(cls, v):
        valid = {"confirmed", "accepted", "preparing", "ready", "completed", "cancelled"}
        if v not in valid:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(sorted(valid))}")
        return v


# ── POST /orders — cash / manual order ───────────────────────────────────────
# Mobile card payments go through POST /api/v1/payments/create instead.

@router.post("/orders")
async def create_order(
    request: CreateOrderRequest,
    user: dict = Depends(require_auth()),
):
    """
    Create an order and push it to the Square terminal (no card charge).
    Used for cash / in-person payments.
    For mobile card checkout use POST /api/v1/payments/create.
    """
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()
    order_service.db = db

    # Validate shop
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, status, name, square_merchant_id")
        .eq("id", request.shop_id)
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_resp.data[0]
    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently accepting orders")

    try:
        items_data = [item.dict() for item in request.items]

        # Create order in Supabase (status = pending for cash orders)
        order = await order_service.create_order(
            shop_id=request.shop_id,
            customer_id=customer_id,
            items=items_data,
            status="pending",
            metadata={
                "pos_provider":  "square",
                "payment_method": "cash",
                "customer_note": request.customer_note,
            },
        )
        order_id = order["id"]

        # Push to Square terminal (no charge) — non-fatal if it fails
        pos_order_id = await push_order_to_pos(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id=order_id,
            items=items_data,
            customer_note=request.customer_note,
        )
        if pos_order_id:
            meta = {**(order.get("metadata") or {}), "pos_order_id": pos_order_id}
            db.get_service_client().table("orders").update({"metadata": meta}).eq("id", order_id).execute()
            order["metadata"] = meta

        # Confirmation email — fire and forget
        try:
            full_order = await order_service.get_order(order_id)
            if full_order:
                customer_email = (
                    full_order.get("customer", {}).get("email") or user.get("email")
                )
                shop_name = (full_order.get("shops") or {}).get("name", shop.get("name", "the shop"))
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

        return {"order": order}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[Orders] create_order error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        user_role   = (user.get("user_metadata") or {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in ("admin", "shop_worker", "shop_owner"):
            raise HTTPException(status_code=403, detail="Access denied")

        return {"order": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}/status")
async def get_order_status(order_id: str, user: dict = Depends(require_auth())):
    """Lightweight poll for order tracking screen."""
    try:
        db = get_supabase()
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        customer_id = user.get("sub")
        user_role   = (user.get("user_metadata") or {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in ("admin", "shop_worker", "shop_owner"):
            raise HTTPException(status_code=403, detail="Access denied")

        return {
            "status":     order.get("status"),
            "updated_at": order.get("updated_at"),
            "order_id":   order_id,
        }
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


# ── Shop order management ─────────────────────────────────────────────────────

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


@router.get("/shops/{shop_id}/orders/queue")
async def get_order_queue(shop_id: str, user: dict = Depends(require_shop_worker())):
    """Returns live buckets: pending, accepted, preparing, ready."""
    try:
        db = get_supabase()
        order_service.db = db
        result = {"pending": [], "accepted": [], "preparing": [], "ready": []}
        for status in result.keys():
            result[status] = await order_service.list_orders(
                shop_id=shop_id, status=status, limit=50
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/shops/{shop_id}/orders/{order_id}/status")
async def update_order_status(
    shop_id:  str,
    order_id: str,
    request:  UpdateStatusRequest,
    user: dict = Depends(require_shop_worker()),
):
    """
    Barista marks order status.
    Fires push notification for all statuses.
    Fires SMS only on 'ready' (if Twilio configured).
    Email fires on accepted, ready, cancelled.
    """
    try:
        db = get_supabase()
        order_service.db = db

        order_before = await order_service.get_order(order_id)
        if not order_before:
            raise HTTPException(status_code=404, detail="Order not found")
        if order_before.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this shop")

        updated_order = await order_service.update_order_status(order_id, request.status)

        shop_name   = (order_before.get("shops") or {}).get("name", "the shop")
        customer_id = order_before.get("customer_id")

        # ── Push + SMS ──────────────────────────────────────────────────────
        if customer_id:
            try:
                profile = (
                    db.get_service_client()
                    .table("profiles")
                    .select("push_token, phone")
                    .eq("id", customer_id)
                    .single()
                    .execute()
                    .data or {}
                )
                await notify_customer_status_change(
                    push_token=profile.get("push_token"),
                    phone=profile.get("phone"),       # SMS only fires on "ready"
                    status=request.status,
                    shop_name=shop_name,
                    order_id=order_id,
                )
            except Exception as e:
                logger.warning(f"[Orders] Notification failed order={order_id}: {e}")

        # ── Email ───────────────────────────────────────────────────────────
        EMAIL_NOTIFY = {"accepted", "ready", "cancelled"}
        if request.status in EMAIL_NOTIFY:
            try:
                customer_email = (order_before.get("customer") or {}).get("email")
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
                logger.warning(f"[Orders] Status email failed order={order_id}: {e}")

        logger.info(
            f"[Orders] status updated order={order_id} "
            f"{order_before.get('status')}→{request.status} "
            f"worker={user.get('sub', '?')[:8]}"
        )
        return {"message": "Status updated", "order": updated_order}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[Orders] update_status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
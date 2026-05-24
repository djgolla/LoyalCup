"""
Orders routes — atomic Square payment + order creation + loyalty + notifications.
Refunds and order disputes are handled on the Square terminal — not here.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, validator
import logging

from app.services.square_order_service import process_payment
from app.services.loyalty_service import award_points_for_order
from app.services.notification_service import notify_customer_status_change
from app.utils.security import require_auth, require_shop_worker
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])
logger = logging.getLogger(__name__)


class OrderItem(BaseModel):
    menu_item_id:   str
    quantity:       int
    unit_price:     float = 0.0
    base_price:     float = 0.0
    customizations: list  = []

    @validator("quantity")
    def qty_positive(cls, v):
        if v <= 0: raise ValueError("Quantity must be positive")
        return v


class CreateOrderRequest(BaseModel):
    shop_id:                  str
    items:                    list
    payment_nonce:            str
    loyalty_points_to_redeem: int = 0
    customer_note:            Optional[str] = None

    @validator("items")
    def items_not_empty(cls, v):
        if not v: raise ValueError("Order must have at least one item")
        return v

    @validator("loyalty_points_to_redeem")
    def loyalty_non_negative(cls, v):
        if v < 0: raise ValueError("Cannot redeem negative points")
        return v

    @validator("customer_note")
    def note_max_length(cls, v):
        if v and len(v) > 500: raise ValueError("Note too long (max 500 chars)")
        return v


class UpdateStatusRequest(BaseModel):
    status: str

    @validator("status")
    def valid_status(cls, v):
        valid = {"confirmed","accepted","preparing","ready","completed","cancelled"}
        if v not in valid:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid)}")
        return v


# ── POST /orders — full atomic checkout ──────────────────────────────────────

@router.post("/orders")
async def create_order(
    request: CreateOrderRequest,
    user: dict = Depends(require_auth()),
):
    """
    Atomic flow: validate → charge Square → save order → award loyalty → notify.
    Refunds/disputes go through the Square terminal — not our system.
    """
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()

    # ── Validate shop ────────────────────────────────────────────────────────
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
    if not shop.get("square_merchant_id"):
        raise HTTPException(status_code=400, detail="This shop hasn't completed Square setup yet. Try again shortly.")

    # ── Validate loyalty balance ─────────────────────────────────────────────
    loyalty_discount_cents = 0
    actual_balance         = 0
    if request.loyalty_points_to_redeem > 0:
        lb = (
            db.get_service_client()
            .table("loyalty_balances")
            .select("points")
            .eq("user_id", customer_id)
            .eq("shop_id", request.shop_id)
            .limit(1)
            .execute()
        )
        actual_balance = (lb.data[0].get("points") or 0) if lb.data else 0
        if request.loyalty_points_to_redeem > actual_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough points. You have {actual_balance} pts, trying to redeem {request.loyalty_points_to_redeem}."
            )
        loyalty_discount_cents = request.loyalty_points_to_redeem  # 1 pt = 1¢

    items_data = [
        {
            "menu_item_id":   item["menu_item_id"],
            "quantity":       item["quantity"],
            "unit_price":     item.get("unit_price") or item.get("base_price") or 0,
            "base_price":     item.get("base_price")  or item.get("unit_price") or 0,
            "customizations": item.get("customizations") or [],
        }
        for item in (request.items if isinstance(request.items[0], dict) else [i.dict() for i in request.items])
    ]

    subtotal_dollars = sum(i["unit_price"] * i["quantity"] for i in items_data)

    try:
        # ── Charge Square ────────────────────────────────────────────────────
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

        # ── Save to Supabase ─────────────────────────────────────────────────
        order_insert = {
            "customer_id":     customer_id,
            "shop_id":         request.shop_id,
            "status":          "confirmed",
            "subtotal":        subtotal_dollars,
            "tax":             tax_dollars,
            "total":           charged_dollars,
            "metadata": {
                "square_order_id":         square_order_id,
                "square_payment_id":       square_payment_id,
                "pos_provider":            "square",
                "currency":                currency,
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "loyalty_discount_cents":  loyalty_discount_cents,
                "payment_method":          "card" if square_payment_id else "loyalty_free",
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

        # ── Order items ──────────────────────────────────────────────────────
        rows = [
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
        db.get_service_client().table("order_items").insert(rows).execute()

        # ── Deduct redeemed points ───────────────────────────────────────────
        if request.loyalty_points_to_redeem > 0:
            try:
                db.get_service_client().table("loyalty_balances").update({
                    "points": actual_balance - request.loyalty_points_to_redeem
                }).eq("user_id", customer_id).eq("shop_id", request.shop_id).execute()

                db.get_service_client().table("loyalty_transactions").insert({
                    "user_id":      customer_id,
                    "shop_id":      request.shop_id,
                    "order_id":     order_id,
                    "type":         "redeem",
                    "points_change": -request.loyalty_points_to_redeem,
                }).execute()
            except Exception as e:
                logger.warning(f"[Orders] Points deduction failed order={order_id}: {e}")

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
            logger.warning(f"[Orders] Points award failed order={order_id}: {e}")

        # ── Confirmation push ────────────────────────────────────────────────
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
            await notify_customer_status_change(
                push_token=profile.get("push_token"),
                phone=None,  # no SMS on confirm, only on ready
                status="confirmed",
                shop_name=shop.get("name", ""),
                order_id=order_id,
            )
        except Exception as e:
            logger.warning(f"[Orders] Confirm push failed: {e}")

        logger.info(
            f"[Orders] SUCCESS order={order_id} square_payment={square_payment_id} "
            f"charged=${charged_dollars:.2f} customer={customer_id[:8]}"
        )

        return {
            "success":         True,
            "order_id":        order_id,
            "square_order_id": square_order_id,
            "total_charged":   charged_dollars,
            "tax":             tax_dollars,
            "currency":        currency,
            "status":          "confirmed",
            "message":         "Order placed! It will print on the Square terminal.",
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


# ── GET /orders ───────────────────────────────────────────────────────────────

@router.get("/orders")
async def get_customer_orders(
    user: dict = Depends(require_auth()),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
):
    try:
        db          = get_supabase()
        customer_id = user.get("sub")
        q = (
            db.get_service_client()
            .table("orders")
            .select("*, shops(name, logo_url), order_items(quantity, unit_price, total_price, customizations, menu_items(name, image_url))")
            .eq("customer_id", customer_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if status:
            q = q.eq("status", status)
        result = q.execute()
        return {"orders": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/history")
async def get_order_history(
    user: dict = Depends(require_auth()),
    limit: int = Query(20, le=100),
):
    try:
        db          = get_supabase()
        customer_id = user.get("sub")
        result = (
            db.get_service_client()
            .table("orders")
            .select("id, status, total, subtotal, created_at, shops(name, logo_url), order_items(quantity, menu_items(name))")
            .eq("customer_id", customer_id)
            .in_("status", ["completed", "cancelled"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"orders": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, user: dict = Depends(require_auth())):
    try:
        db    = get_supabase()
        order = (
            db.get_service_client()
            .table("orders")
            .select("*, shops(name, logo_url, phone, address), order_items(quantity, unit_price, total_price, customizations, menu_items(name, image_url, description))")
            .eq("id", order_id)
            .single()
            .execute()
            .data
        )
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


# ── Shop order management ─────────────────────────────────────────────────────

@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
):
    try:
        db = get_supabase()
        q  = (
            db.get_service_client()
            .table("orders")
            .select("id, status, total, subtotal, created_at, metadata, order_items(quantity, unit_price, customizations, menu_items(name))")
            .eq("shop_id", shop_id)
            .order("created_at", ascending=True)
            .limit(limit)
        )
        if status:
            q = q.eq("status", status)
        result = q.execute()
        return {"orders": result.data or []}
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
    Barista marks order status. Fires push + SMS to customer.
    SMS only on 'ready'. Everything else is push-only.
    Refunds/disputes → Square terminal (not here).
    """
    try:
        db    = get_supabase()
        order = (
            db.get_service_client()
            .table("orders")
            .select("id, shop_id, customer_id, status, metadata")
            .eq("id", order_id)
            .single()
            .execute()
            .data
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order doesn't belong to this shop")

        valid_transitions = {
            "confirmed":  {"accepted", "cancelled"},
            "accepted":   {"preparing", "cancelled"},
            "preparing":  {"ready", "cancelled"},
            "ready":      {"completed"},
            "completed":  set(),
            "cancelled":  set(),
        }
        current = order.get("status", "confirmed")
        if request.status not in valid_transitions.get(current, set()):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot move from '{current}' to '{request.status}'"
            )

        # Update status
        db.get_service_client().table("orders").update({
            "status": request.status,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", order_id).execute()

        # Notify customer (push + SMS if ready)
        customer_id = order.get("customer_id")
        if customer_id:
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
                shop = (
                    db.get_service_client()
                    .table("shops")
                    .select("name")
                    .eq("id", shop_id)
                    .single()
                    .execute()
                    .data or {}
                )
                await notify_customer_status_change(
                    push_token=profile.get("push_token"),
                    phone=None,
                    status=request.status,
                    shop_name=shop.get("name", ""),
                    order_id=order_id,
                )
            except Exception as e:
                logger.warning(f"[Orders] Notification failed order={order_id}: {e}")

        logger.info(f"[Orders] status updated order={order_id} {current}→{request.status} by worker={user.get('sub','?')[:8]}")
        return {"success": True, "order_id": order_id, "status": request.status}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[Orders] update_status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
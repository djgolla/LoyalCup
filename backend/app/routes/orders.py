"""
Orders routes.

Launch flow is CARD ONLY:
  POST /api/v1/payments/create creates and pays orders.

This file handles:
  GET  /api/v1/orders
  GET  /api/v1/orders/history
  GET  /api/v1/orders/{id}
  POST /api/v1/orders/{id}/cancel
  POST /api/v1/orders/complete-ready
  POST /api/v1/orders/complete-ready/cron

Manual/cash order creation is intentionally disabled for launch.
"""
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends, Header
from pydantic import BaseModel

from app.services.order_service import order_service
from app.services.notification_service import send_order_ready_push
from app.utils.security import require_auth, require_shop_worker, get_user_role
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])
logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DisabledOrderRequest(BaseModel):
    shop_id: Optional[str] = None


def _get_profile_shop_id(sc, user_id: str) -> Optional[str]:
    resp = (
        sc.table("profiles")
        .select("shop_id")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not resp.data:
        return None
    return resp.data[0].get("shop_id")


def _shop_owner_owns_shop(sc, shop_id: str, user_id: str) -> bool:
    resp = (
        sc.table("shops")
        .select("id")
        .eq("id", shop_id)
        .eq("owner_id", user_id)
        .limit(1)
        .execute()
    )
    return bool(resp.data)


def _can_access_shop(sc, *, shop_id: str, user_id: str, role: str) -> bool:
    if role == "admin":
        return True

    if role == "shop_owner":
        return _shop_owner_owns_shop(sc, shop_id, user_id)

    if role == "shop_worker":
        return _get_profile_shop_id(sc, user_id) == shop_id

    return False


@router.post("/orders")
async def create_order_disabled(
    request: DisabledOrderRequest,
    user: dict = Depends(require_auth()),
):
    raise HTTPException(
        status_code=410,
        detail="Manual/cash orders are disabled. Use card checkout.",
    )


async def _complete_ready_orders_for_query(sc, query, now_iso: str) -> dict:
    try:
        orders = query.execute().data or []
    except Exception as e:
        logger.error(f"[Orders] complete-ready lookup failed: {e}")
        raise HTTPException(status_code=500, detail="Could not check ready orders")

    completed = 0
    notified = 0

    for order in orders:
        order_id = order["id"]
        metadata = order.get("metadata") or {}

        update_resp = (
            sc.table("orders")
            .update({
                "status": "completed",
                "completed_at": now_iso,
                "updated_at": now_iso,
                "metadata": {
                    **metadata,
                    "auto_completed": True,
                    "auto_completed_at": now_iso,
                },
            })
            .eq("id", order_id)
            .in_("status", ["confirmed", "pending"])
            .execute()
        )

        if not update_resp.data:
            continue

        completed += 1

        try:
            shop_name = "the shop"
            shop_id = order.get("shop_id")
            customer_id = order.get("customer_id")

            if shop_id:
                shop_resp = (
                    sc.table("shops")
                    .select("name")
                    .eq("id", shop_id)
                    .limit(1)
                    .execute()
                )
                if shop_resp.data:
                    shop_name = shop_resp.data[0].get("name") or shop_name

            push_token = None
            if customer_id:
                profile_resp = (
                    sc.table("profiles")
                    .select("push_token")
                    .eq("id", customer_id)
                    .limit(1)
                    .execute()
                )
                if profile_resp.data:
                    push_token = profile_resp.data[0].get("push_token")

            sent = await send_order_ready_push(
                push_token=push_token,
                shop_name=shop_name,
                order_id=order_id,
            )

            if sent:
                notified += 1
                latest_meta = update_resp.data[0].get("metadata") or {}
                sc.table("orders").update({
                    "metadata": {
                        **latest_meta,
                        "ready_push_sent": True,
                        "ready_push_sent_at": now_iso,
                    }
                }).eq("id", order_id).execute()

        except Exception as e:
            logger.warning(f"[Orders] ready push failed order={order_id}: {e}")

    return {
        "success": True,
        "completed": completed,
        "notified": notified,
    }


@router.post("/orders/complete-ready")
async def complete_ready_orders(user: dict = Depends(require_auth())):
    db = get_supabase()
    sc = db.get_service_client()

    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    now_iso = _now_iso()

    try:
        user_role = get_user_role(user_id)
    except Exception:
        user_role = "customer"

    query = (
        sc.table("orders")
        .select("id, customer_id, shop_id, status, ready_at, metadata")
        .in_("status", ["confirmed", "pending"])
        .not_.is_("ready_at", "null")
        .lte("ready_at", now_iso)
        .limit(50)
    )

    if user_role != "admin":
        query = query.eq("customer_id", user_id)

    return await _complete_ready_orders_for_query(sc, query, now_iso)


@router.post("/orders/complete-ready/cron")
async def complete_ready_orders_cron(
    x_order_completion_secret: Optional[str] = Header(None),
):
    expected = os.getenv("ORDER_COMPLETION_SECRET")
    if not expected:
        raise HTTPException(status_code=500, detail="ORDER_COMPLETION_SECRET is not configured")

    if not x_order_completion_secret or x_order_completion_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid completion secret")

    db = get_supabase()
    sc = db.get_service_client()
    now_iso = _now_iso()

    query = (
        sc.table("orders")
        .select("id, customer_id, shop_id, status, ready_at, metadata")
        .in_("status", ["confirmed", "pending"])
        .not_.is_("ready_at", "null")
        .lte("ready_at", now_iso)
        .limit(100)
    )

    return await _complete_ready_orders_for_query(sc, query, now_iso)


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

        await complete_ready_orders(user)

        orders = await order_service.list_orders(
            customer_id=customer_id,
            status=status,
            limit=limit,
        )
        return {"orders": orders}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Orders] get_customer_orders failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch orders")


@router.get("/orders/history")
async def get_customer_order_history(
    user: dict = Depends(require_auth()),
    limit: int = Query(20, le=100),
):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        order_service.db = db

        await complete_ready_orders(user)

        orders = await order_service.get_order_history(
            customer_id=customer_id,
            limit=limit,
        )
        return {"orders": orders}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Orders] get_customer_order_history failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch order history")


@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, user: dict = Depends(require_auth())):
    try:
        db = get_supabase()
        sc = db.get_service_client()
        order_service.db = db

        await complete_ready_orders(user)

        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        user_id = user.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_role = get_user_role(user_id)
        order_customer_id = order.get("customer_id")
        order_shop_id = order.get("shop_id")

        can_access = order_customer_id == user_id

        if not can_access and order_shop_id:
            can_access = _can_access_shop(
                sc,
                shop_id=order_shop_id,
                user_id=user_id,
                role=user_role,
            )

        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")

        return {"order": order}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Orders] get_order_details failed order={order_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch order")


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(require_auth())):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        order_service.db = db

        order = await order_service.cancel_order(order_id, customer_id)
        return {"order": order}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[Orders] cancel failed order={order_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not cancel order")


@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    status: Optional[str] = None,
    limit: int = Query(100, le=200),
    user: dict = Depends(require_shop_worker()),
):
    try:
        user_id = user.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")

        db = get_supabase()
        sc = db.get_service_client()
        order_service.db = db

        role = get_user_role(user_id)

        shop_check = (
            sc.table("shops")
            .select("id, owner_id")
            .eq("id", shop_id)
            .limit(1)
            .execute()
        )

        if not shop_check.data:
            raise HTTPException(status_code=404, detail="Shop not found")

        if not _can_access_shop(sc, shop_id=shop_id, user_id=user_id, role=role):
            raise HTTPException(status_code=403, detail="Not authorized for this shop")

        orders = await order_service.get_shop_orders(
            shop_id=shop_id,
            status=status,
            limit=limit,
        )

        return {"orders": orders}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Orders] get_shop_orders failed shop={shop_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch shop orders")
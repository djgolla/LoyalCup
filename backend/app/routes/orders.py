from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.services.order_service import order_service
from app.services.export_service import export_service
from app.services.square_order_service import push_order_to_pos
from app.services.email_service import email_service
from app.utils.security import require_auth, require_shop_worker
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])


class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    base_price: float
    customizations: List[dict] = []


class CreateOrderRequest(BaseModel):
    shop_id: str
    items: List[OrderItem]
    customer_note: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str


@router.post("/orders")
async def create_order(
    request: CreateOrderRequest, user: dict = Depends(require_auth())
):
    """Create new order from cart, push to Square POS, send email receipt"""
    try:
        customer_id = user.get("sub")
        if not customer_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        db = get_supabase()
        order_service.db = db

        # 1. Create the LoyalCup order in Supabase
        items_data = [item.dict() for item in request.items]
        order = await order_service.create_order(
            shop_id=request.shop_id, customer_id=customer_id, items=items_data
        )

        order_id = order["id"]

        # 2. Push to POS — routes to Square automatically
        pos_order_id = await push_order_to_pos(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id=order_id,
            items=items_data,
            customer_note=request.customer_note,
        )

        # 3. Store the external POS order ID in metadata if we got one
        if pos_order_id:
            existing_metadata = order.get("metadata") or {}
            updated_metadata = {
                **existing_metadata,
                "pos_order_id": pos_order_id,
                "pos_provider": "square",
            }
            db.get_service_client().table("orders").update(
                {"metadata": updated_metadata}
            ).eq("id", order_id).execute()
            order["metadata"] = updated_metadata

        # 4. Send order confirmation email (fire and forget — never block order)
        try:
            full_order = await order_service.get_order(order_id)
            if full_order:
                customer_email = full_order.get("customer", {}).get("email") or user.get("email")
                shop_name = full_order.get("shops", {}).get("name", "the shop")
                order_items = full_order.get("items", [])
                if customer_email:
                    await email_service.send_order_confirmation_rich(
                        to_email=customer_email,
                        order_id=order_id,
                        shop_name=shop_name,
                        items=order_items,
                        subtotal=float(full_order.get("subtotal", 0)),
                        tax=float(full_order.get("tax", 0)),
                        total=float(full_order.get("total", 0)),
                        customer_note=request.customer_note,
                    )
        except Exception as email_err:
            print(f"[Email] Failed to send order confirmation: {email_err}")

        return {"order": order}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    user: dict = Depends(require_auth()), limit: int = Query(20, le=100)
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
        user_role = user.get("user_metadata", {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in [
            "admin", "shop_worker", "shop_owner"
        ]:
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
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        customer_id = user.get("sub")
        user_role = user.get("user_metadata", {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in [
            "admin", "shop_worker", "shop_owner"
        ]:
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
    try:
        db = get_supabase()
        order_service.db = db
        result = {"pending": [], "accepted": [], "preparing": [], "ready": []}
        for status in result.keys():
            orders = await order_service.list_orders(
                shop_id=shop_id, status=status, limit=50
            )
            result[status] = orders
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
        order_service.db = db

        # Get order before update so we have customer info for email
        order_before = await order_service.get_order(order_id)
        if not order_before:
            raise HTTPException(status_code=404, detail="Order not found")
        if order_before.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this shop")

        updated_order = await order_service.update_order_status(order_id, request.status)

        # Send status update email for key statuses
        try:
            EMAIL_NOTIFY_STATUSES = {"accepted", "ready", "cancelled"}
            if request.status in EMAIL_NOTIFY_STATUSES:
                customer_email = order_before.get("customer", {}).get("email")
                shop_name = order_before.get("shops", {}).get("name", "the shop")
                if customer_email:
                    await email_service.send_order_status_update_rich(
                        to_email=customer_email,
                        order_id=order_id,
                        shop_name=shop_name,
                        status=request.status,
                        items=order_before.get("items", []),
                        total=float(order_before.get("total", 0)),
                    )
        except Exception as email_err:
            print(f"[Email] Failed to send status update: {email_err}")

        return {"message": "Status updated", "order": updated_order}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
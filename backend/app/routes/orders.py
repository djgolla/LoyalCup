from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.services.order_service import order_service
from app.services.export_service import export_service
from app.services.square_order_service import push_order_to_pos   # <-- updated
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
    """Create new order from cart, then push to the shop's connected POS"""
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

        # 2. Push to POS — routes to Square, Clover, Toast, etc. automatically
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
                "pos_provider": "square",  # will come from conn later when multi-POS
            }
            db.get_service_client().table("orders").update(
                {"metadata": updated_metadata}
            ).eq("id", order_id).execute()
            order["metadata"] = updated_metadata

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
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this shop")
        updated_order = await order_service.update_order_status(order_id, request.status)
        return {"message": "Status updated", "order": updated_order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders/stats")
async def get_order_stats(shop_id: str, user: dict = Depends(require_shop_worker())):
    try:
        db = get_supabase()
        order_service.db = db
        today = datetime.now().date().isoformat()
        all_orders = await order_service.list_orders(shop_id=shop_id, limit=1000)
        today_orders = [o for o in all_orders if o.get("created_at", "").startswith(today)]
        total_orders = len(today_orders)
        revenue = sum(float(o.get("total", 0)) for o in today_orders)
        avg_order_value = revenue / total_orders if total_orders > 0 else 0.0
        by_status = {"pending": 0, "accepted": 0, "preparing": 0, "ready": 0, "completed": 0, "cancelled": 0}
        for order in today_orders:
            s = order.get("status", "pending")
            if s in by_status:
                by_status[s] += 1
        return {"today": {"total_orders": total_orders, "revenue": revenue, "avg_order_value": avg_order_value, "by_status": by_status}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders/history")
async def get_order_history(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=100),
):
    try:
        db = get_supabase()
        order_service.db = db
        orders = await order_service.list_orders(
            shop_id=shop_id, status=status, limit=per_page * page
        )
        if start_date:
            orders = [o for o in orders if o.get("created_at", "") >= start_date]
        if end_date:
            orders = [o for o in orders if o.get("created_at", "") <= end_date]
        start_idx = (page - 1) * per_page
        paginated = orders[start_idx: start_idx + per_page]
        return {"orders": paginated, "pagination": {"page": page, "per_page": per_page, "total": len(orders)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders/export")
async def export_orders(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = Query("csv", regex="^(csv|pdf)$"),
):
    try:
        db = get_supabase()
        order_service.db = db
        orders = await order_service.list_orders(shop_id=shop_id, limit=10000)
        if start_date:
            orders = [o for o in orders if o.get("created_at", "") >= start_date]
        if end_date:
            orders = [o for o in orders if o.get("created_at", "") <= end_date]
        shop_result = db.table("shops").select("name").eq("id", shop_id).execute()
        shop_name = shop_result.data[0]["name"] if shop_result.data else "Shop"
        if format == "csv":
            csv_content = export_service.export_orders_to_csv(orders)
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=orders_{shop_id}_{datetime.now().strftime('%Y%m%d')}.csv"},
            )
        elif format == "pdf":
            pdf_content = export_service.export_orders_to_pdf(orders, shop_name)
            return Response(
                content=pdf_content,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=orders_{shop_id}_{datetime.now().strftime('%Y%m%d')}.pdf"},
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
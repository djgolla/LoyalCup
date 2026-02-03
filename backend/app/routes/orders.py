from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.services.order_service import order_service
from app.services.export_service import export_service
from app.utils.security import require_auth, require_shop_worker, verify_token
from app.database import get_supabase

router = APIRouter(
    prefix="/api/v1",
    tags=["orders"]
)

# pydantic models for request validation
class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    base_price: float
    customizations: List[dict] = []

class CreateOrderRequest(BaseModel):
    shop_id: str
    items: List[OrderItem]

class UpdateStatusRequest(BaseModel):
    status: str

# customer endpoints
@router.post("/orders")
async def create_order(
    request: CreateOrderRequest,
    user: dict = Depends(require_auth())
):
    """Create new order from cart"""
    try:
        # Get customer_id from authenticated user
        customer_id = user.get("sub")
        if not customer_id:
            raise HTTPException(
                status_code=401,
                detail="User ID not found in token"
            )
        
        # Set db client for order_service
        db = get_supabase()
        order_service.db = db
        
        # Create order
        items_data = [item.dict() for item in request.items]
        order = await order_service.create_order(
            shop_id=request.shop_id,
            customer_id=customer_id,
            items=items_data
        )
        
        return {"order": order}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders")
async def get_customer_orders(
    user: dict = Depends(require_auth()),
    status: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    """Get customer's order history"""
    try:
        customer_id = user.get("sub")
        
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        orders = await order_service.list_orders(
            customer_id=customer_id,
            status=status,
            limit=limit
        )
        
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}")
async def get_order_details(
    order_id: str,
    user: dict = Depends(require_auth())
):
    """Get specific order details"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        order = await order_service.get_order(order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify customer owns this order (or is admin/shop_worker)
        customer_id = user.get("sub")
        user_role = user.get("user_metadata", {}).get("role", "customer")
        
        if order.get("customer_id") != customer_id and user_role not in ["admin", "shop_worker", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {"order": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}/status")
async def get_order_status(
    order_id: str,
    user: dict = Depends(require_auth())
):
    """Get order status for polling/realtime"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        order = await order_service.get_order(order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify access
        customer_id = user.get("sub")
        user_role = user.get("user_metadata", {}).get("role", "customer")
        
        if order.get("customer_id") != customer_id and user_role not in ["admin", "shop_worker", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "status": order.get("status"),
            "updated_at": order.get("updated_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    user: dict = Depends(require_auth())
):
    """Cancel order if pending"""
    try:
        customer_id = user.get("sub")
        
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        order = await order_service.cancel_order(order_id, customer_id)
        
        return {"message": "Order cancelled", "order": order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# shop worker endpoints
@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    status: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    """Get shop's orders with filters"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        orders = await order_service.list_orders(
            shop_id=shop_id,
            status=status,
            limit=limit
        )
        
        # Filter by date if provided
        if date:
            orders = [o for o in orders if o.get("created_at", "").startswith(date)]
        
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shops/{shop_id}/orders/queue")
async def get_order_queue(
    shop_id: str,
    user: dict = Depends(require_shop_worker())
):
    """Get active order queue (pending, accepted, preparing, ready)"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        # Get orders for each active status
        result = {
            "pending": [],
            "accepted": [],
            "preparing": [],
            "ready": []
        }
        
        for status in result.keys():
            orders = await order_service.list_orders(
                shop_id=shop_id,
                status=status,
                limit=50
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
    user: dict = Depends(require_shop_worker())
):
    """Update order status"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        # Verify order belongs to this shop
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this shop")
        
        # Update status
        updated_order = await order_service.update_order_status(order_id, request.status)
        
        return {"message": "Status updated", "order": updated_order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shops/{shop_id}/orders/stats")
async def get_order_stats(
    shop_id: str,
    user: dict = Depends(require_shop_worker())
):
    """Get today's order statistics"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        # Get today's orders
        today = datetime.now().date().isoformat()
        all_orders = await order_service.list_orders(
            shop_id=shop_id,
            limit=1000
        )
        
        # Filter to today
        today_orders = [o for o in all_orders if o.get("created_at", "").startswith(today)]
        
        # Calculate stats
        total_orders = len(today_orders)
        revenue = sum(float(o.get("total", 0)) for o in today_orders)
        avg_order_value = revenue / total_orders if total_orders > 0 else 0.0
        
        by_status = {
            "pending": 0,
            "accepted": 0,
            "preparing": 0,
            "ready": 0,
            "completed": 0,
            "cancelled": 0
        }
        
        for order in today_orders:
            status = order.get("status", "pending")
            if status in by_status:
                by_status[status] += 1
        
        return {
            "today": {
                "total_orders": total_orders,
                "revenue": revenue,
                "avg_order_value": avg_order_value,
                "by_status": by_status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# shop owner endpoints
@router.get("/shops/{shop_id}/orders/history")
async def get_order_history(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=100)
):
    """Full order history with filters"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        # Get orders
        orders = await order_service.list_orders(
            shop_id=shop_id,
            status=status,
            limit=per_page * page  # Simple pagination
        )
        
        # Filter by date range if provided
        if start_date:
            orders = [o for o in orders if o.get("created_at", "") >= start_date]
        if end_date:
            orders = [o for o in orders if o.get("created_at", "") <= end_date]
        
        # Paginate
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_orders = orders[start_idx:end_idx]
        
        return {
            "orders": paginated_orders,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": len(orders)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shops/{shop_id}/orders/export")
async def export_orders(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = Query("csv", regex="^(csv|pdf)$")
):
    """Export orders as CSV or PDF"""
    try:
        # Set db client
        db = get_supabase()
        order_service.db = db
        
        # Get all orders for the shop
        orders = await order_service.list_orders(
            shop_id=shop_id,
            limit=10000  # High limit for export
        )
        
        # Filter by date range if provided
        if start_date:
            orders = [o for o in orders if o.get("created_at", "") >= start_date]
        if end_date:
            orders = [o for o in orders if o.get("created_at", "") <= end_date]
        
        # Get shop name for PDF
        shop_result = db.table("shops").select("name").eq("id", shop_id).execute()
        shop_name = shop_result.data[0]["name"] if shop_result.data else "Shop"
        
        # Generate export based on format
        if format == "csv":
            csv_content = export_service.export_orders_to_csv(orders)
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=orders_{shop_id}_{datetime.now().strftime('%Y%m%d')}.csv"
                }
            )
        elif format == "pdf":
            pdf_content = export_service.export_orders_to_pdf(orders, shop_name)
            return Response(
                content=pdf_content,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=orders_{shop_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

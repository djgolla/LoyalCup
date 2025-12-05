from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from services.order_service import OrderService

router = APIRouter(
    prefix="/api/v1",
    tags=["orders"]
)

order_service = OrderService()

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
async def create_order(request: CreateOrderRequest):
    # create new order from cart
    # TODO: get customer_id from auth token
    customer_id = "temp-customer-id"
    
    items_data = [item.dict() for item in request.items]
    order_data = order_service.create_order_data(
        shop_id=request.shop_id,
        customer_id=customer_id,
        items=items_data,
        points_per_dollar=10  # TODO: get from shop settings
    )
    
    # TODO: save to database
    # for now just return the created order
    return {"order": order_data}

@router.get("/orders")
async def get_customer_orders(
    status: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    # get customer's order history
    # TODO: get customer_id from auth and fetch from database
    return {"orders": []}

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str):
    # get specific order details
    # TODO: fetch from database and verify customer access
    return {"order": {"id": order_id}}

@router.get("/orders/{order_id}/status")
async def get_order_status(order_id: str):
    # get order status for polling/realtime
    # TODO: fetch from database
    return {"status": "pending", "updated_at": datetime.now().isoformat()}

@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str):
    # cancel order if pending
    # TODO: fetch order, verify customer owns it, check if can cancel, update status
    current_status = "pending"  # placeholder
    
    if not order_service.can_cancel_order(current_status):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status: {current_status}"
        )
    
    return {"message": "Order cancelled", "order_id": order_id}

# shop worker endpoints
@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    status: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    # get shop's orders with filters
    # TODO: verify worker has access to shop, fetch from database
    return {"orders": []}

@router.get("/shops/{shop_id}/orders/queue")
async def get_order_queue(shop_id: str):
    # get active order queue (pending, accepted, preparing, ready)
    # TODO: verify worker access, fetch active orders
    return {
        "pending": [],
        "accepted": [],
        "preparing": [],
        "ready": []
    }

@router.put("/shops/{shop_id}/orders/{order_id}/status")
async def update_order_status(
    shop_id: str,
    order_id: str,
    request: UpdateStatusRequest
):
    # update order status
    # TODO: verify worker access, fetch order, validate transition, update
    current_status = "pending"  # placeholder
    
    if not order_service.validate_status_transition(current_status, request.status):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {current_status} to {request.status}"
        )
    
    return {"message": "Status updated", "status": request.status}

@router.get("/shops/{shop_id}/orders/stats")
async def get_order_stats(shop_id: str):
    # get today's order statistics
    # TODO: verify worker access, calculate stats from today's orders
    return {
        "today": {
            "total_orders": 0,
            "revenue": 0.0,
            "avg_order_value": 0.0,
            "by_status": {
                "pending": 0,
                "accepted": 0,
                "preparing": 0,
                "ready": 0,
                "completed": 0,
                "cancelled": 0
            }
        }
    }

# shop owner endpoints
@router.get("/shops/{shop_id}/orders/history")
async def get_order_history(
    shop_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=100)
):
    # full order history with filters
    # TODO: verify owner access, fetch with pagination
    return {
        "orders": [],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": 0
        }
    }

@router.get("/shops/{shop_id}/orders/export")
async def export_orders(
    shop_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = Query("csv", regex="^(csv|json)$")
):
    # export orders as CSV or JSON
    # TODO: verify owner access, generate export file
    return {"message": "Export functionality not yet implemented"}

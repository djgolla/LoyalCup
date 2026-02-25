"""
Pydantic models for orders and order items.
Matches the orders and order_items tables in 001_init.sql.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, UUID4
from decimal import Decimal


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY = "ready"
    PICKED_UP = "picked_up"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderItemBase(BaseModel):
    """Base order item model."""
    menu_item_id: Optional[UUID4] = Field(None, description="Menu item ID")
    quantity: int = Field(..., description="Quantity of items", ge=1)
    unit_price: Decimal = Field(..., description="Price per unit", ge=0)
    total_price: Decimal = Field(..., description="Total price for this line item", ge=0)
    customizations: List[Dict[str, Any]] = Field(default=[], description="List of customizations applied")


class OrderItemCreate(OrderItemBase):
    """
    Order item creation model.
    Used when creating a new order item.
    """
    pass


class OrderItemResponse(OrderItemBase):
    """
    Order item response model.
    Returned when retrieving order item data.
    """
    id: UUID4 = Field(..., description="Order item's unique identifier")
    order_id: UUID4 = Field(..., description="Order ID this item belongs to")
    
    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """Base order model with common fields."""
    status: OrderStatus = Field(default=OrderStatus.PENDING, description="Current order status")
    subtotal: Decimal = Field(default=0, description="Order subtotal before tax", ge=0)
    tax: Decimal = Field(default=0, description="Tax amount", ge=0)
    total: Decimal = Field(default=0, description="Total order amount", ge=0)
    loyalty_points_earned: int = Field(default=0, description="Loyalty points earned from this order", ge=0)
    metadata: Dict[str, Any] = Field(default={}, description="Additional order metadata")


class OrderCreate(OrderBase):
    """
    Order creation model.
    Used when creating a new order.
    """
    shop_id: Optional[UUID4] = Field(None, description="Shop ID where order was placed")
    customer_id: Optional[UUID4] = Field(None, description="Customer ID who placed the order")
    items: List[OrderItemCreate] = Field(..., description="List of order items")


class OrderUpdate(BaseModel):
    """
    Order update model.
    All fields are optional for partial updates.
    """
    status: Optional[OrderStatus] = Field(None, description="Current order status")
    subtotal: Optional[Decimal] = Field(None, description="Order subtotal before tax", ge=0)
    tax: Optional[Decimal] = Field(None, description="Tax amount", ge=0)
    total: Optional[Decimal] = Field(None, description="Total order amount", ge=0)
    loyalty_points_earned: Optional[int] = Field(None, description="Loyalty points earned from this order", ge=0)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional order metadata")


class OrderResponse(OrderBase):
    """
    Order response model.
    Returned when retrieving order data.
    """
    id: UUID4 = Field(..., description="Order's unique identifier")
    shop_id: Optional[UUID4] = Field(None, description="Shop ID where order was placed")
    customer_id: Optional[UUID4] = Field(None, description="Customer ID who placed the order")
    created_at: datetime = Field(..., description="When the order was created")
    updated_at: datetime = Field(..., description="When the order was last updated")
    items: Optional[List[OrderItemResponse]] = Field(None, description="List of order items")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "shop_id": "234e5678-e89b-12d3-a456-426614174000",
                "customer_id": "345e6789-e89b-12d3-a456-426614174000",
                "status": "pending",
                "subtotal": 10.50,
                "tax": 0.95,
                "total": 11.45,
                "loyalty_points_earned": 11,
                "metadata": {},
                "created_at": "2024-01-01T12:00:00Z",
                "updated_at": "2024-01-01T12:00:00Z"
            }
        }

"""
Pydantic models for shop, menu categories, menu items, and customization templates.
Matches the shops, menu_categories, menu_items, and customization_templates tables in 001_init.sql.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, UUID4
from decimal import Decimal


class ShopBase(BaseModel):
    """Base shop model with common fields."""
    name: str = Field(..., description="Shop name")
    description: Optional[str] = Field(None, description="Shop description")
    logo_url: Optional[str] = Field(None, description="URL to shop logo")
    banner_url: Optional[str] = Field(None, description="URL to shop banner image")
    address: Optional[str] = Field(None, description="Shop street address")
    city: Optional[str] = Field(None, description="Shop city")
    state: Optional[str] = Field(None, description="Shop state")
    lat: Optional[float] = Field(None, description="Latitude coordinate")
    lng: Optional[float] = Field(None, description="Longitude coordinate")
    phone: Optional[str] = Field(None, description="Shop phone number")
    hours: Optional[Dict[str, Any]] = Field(None, description="Shop hours in JSON format")
    loyalty_points_per_dollar: int = Field(default=0, description="Loyalty points earned per dollar spent")
    participates_in_global_loyalty: bool = Field(default=False, description="Whether shop participates in global loyalty program")


class ShopCreate(ShopBase):
    """
    Shop creation model.
    Used when creating a new shop.
    """
    owner_id: Optional[UUID4] = Field(None, description="Owner's user ID")


class ShopUpdate(BaseModel):
    """
    Shop update model.
    All fields are optional for partial updates.
    """
    name: Optional[str] = Field(None, description="Shop name")
    description: Optional[str] = Field(None, description="Shop description")
    logo_url: Optional[str] = Field(None, description="URL to shop logo")
    banner_url: Optional[str] = Field(None, description="URL to shop banner image")
    address: Optional[str] = Field(None, description="Shop street address")
    city: Optional[str] = Field(None, description="Shop city")
    state: Optional[str] = Field(None, description="Shop state")
    lat: Optional[float] = Field(None, description="Latitude coordinate")
    lng: Optional[float] = Field(None, description="Longitude coordinate")
    phone: Optional[str] = Field(None, description="Shop phone number")
    hours: Optional[Dict[str, Any]] = Field(None, description="Shop hours in JSON format")
    loyalty_points_per_dollar: Optional[int] = Field(None, description="Loyalty points earned per dollar spent")
    participates_in_global_loyalty: Optional[bool] = Field(None, description="Whether shop participates in global loyalty program")


class ShopResponse(ShopBase):
    """
    Shop response model.
    Returned when retrieving shop data.
    """
    id: UUID4 = Field(..., description="Shop's unique identifier")
    owner_id: Optional[UUID4] = Field(None, description="Owner's user ID")
    created_at: datetime = Field(..., description="When the shop was created")
    
    class Config:
        from_attributes = True


class MenuCategoryBase(BaseModel):
    """Base menu category model."""
    name: str = Field(..., description="Category name")
    display_order: int = Field(default=0, description="Order in which category is displayed")


class MenuCategoryCreate(MenuCategoryBase):
    """Menu category creation model."""
    shop_id: UUID4 = Field(..., description="Shop ID this category belongs to")


class MenuCategoryResponse(MenuCategoryBase):
    """Menu category response model."""
    id: UUID4 = Field(..., description="Category's unique identifier")
    shop_id: UUID4 = Field(..., description="Shop ID this category belongs to")
    
    class Config:
        from_attributes = True


class MenuItemBase(BaseModel):
    """Base menu item model."""
    name: str = Field(..., description="Item name")
    description: Optional[str] = Field(None, description="Item description")
    base_price: Decimal = Field(..., description="Base price of the item", ge=0)
    image_url: Optional[str] = Field(None, description="URL to item image")
    is_available: bool = Field(default=True, description="Whether item is currently available")
    display_order: int = Field(default=0, description="Order in which item is displayed")


class MenuItemCreate(MenuItemBase):
    """Menu item creation model."""
    shop_id: UUID4 = Field(..., description="Shop ID this item belongs to")
    category_id: Optional[UUID4] = Field(None, description="Category ID this item belongs to")


class MenuItemUpdate(BaseModel):
    """Menu item update model."""
    name: Optional[str] = Field(None, description="Item name")
    description: Optional[str] = Field(None, description="Item description")
    base_price: Optional[Decimal] = Field(None, description="Base price of the item", ge=0)
    image_url: Optional[str] = Field(None, description="URL to item image")
    is_available: Optional[bool] = Field(None, description="Whether item is currently available")
    display_order: Optional[int] = Field(None, description="Order in which item is displayed")
    category_id: Optional[UUID4] = Field(None, description="Category ID this item belongs to")


class MenuItemResponse(MenuItemBase):
    """Menu item response model."""
    id: UUID4 = Field(..., description="Item's unique identifier")
    shop_id: UUID4 = Field(..., description="Shop ID this item belongs to")
    category_id: Optional[UUID4] = Field(None, description="Category ID this item belongs to")
    created_at: datetime = Field(..., description="When the item was created")
    
    class Config:
        from_attributes = True


class CustomizationOption(BaseModel):
    """Single customization option."""
    name: str = Field(..., description="Option name (e.g., 'Small', 'Oat Milk')")
    price: Decimal = Field(default=0, description="Additional price for this option", ge=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Oat Milk",
                "price": 0.75
            }
        }


class CustomizationTemplateBase(BaseModel):
    """Base customization template model."""
    name: str = Field(..., description="Template name (e.g., 'Size', 'Milk Type')")
    type: str = Field(..., description="Type: 'single_select' or 'multi_select'")
    is_required: bool = Field(default=False, description="Whether this customization is required")
    applies_to: str = Field(default="all_items", description="What items this template applies to")
    options: List[CustomizationOption] = Field(..., description="List of customization options")


class CustomizationTemplateCreate(CustomizationTemplateBase):
    """Customization template creation model."""
    shop_id: UUID4 = Field(..., description="Shop ID this template belongs to")


class CustomizationTemplateResponse(CustomizationTemplateBase):
    """Customization template response model."""
    id: UUID4 = Field(..., description="Template's unique identifier")
    shop_id: UUID4 = Field(..., description="Shop ID this template belongs to")
    
    class Config:
        from_attributes = True

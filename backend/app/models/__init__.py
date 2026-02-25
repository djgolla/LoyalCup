"""
Pydantic models for the LoyalCup API.
These models define the request/response schemas for all API endpoints.
"""
from app.models.user import (
    UserRole,
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
)
from app.models.shop import (
    ShopBase,
    ShopCreate,
    ShopUpdate,
    ShopResponse,
    MenuCategoryBase,
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuItemBase,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    CustomizationOption,
    CustomizationTemplateBase,
    CustomizationTemplateCreate,
    CustomizationTemplateResponse,
)
from app.models.order import (
    OrderStatus,
    OrderItemBase,
    OrderItemCreate,
    OrderItemResponse,
    OrderBase,
    OrderCreate,
    OrderUpdate,
    OrderResponse,
)
from app.models.loyalty import (
    LoyaltyTransactionType,
    LoyaltyBalanceResponse,
    LoyaltyRewardBase,
    LoyaltyRewardCreate,
    LoyaltyRewardResponse,
    LoyaltyTransactionResponse,
)

__all__ = [
    # User models
    "UserRole",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # Shop models
    "ShopBase",
    "ShopCreate",
    "ShopUpdate",
    "ShopResponse",
    "MenuCategoryBase",
    "MenuCategoryCreate",
    "MenuCategoryResponse",
    "MenuItemBase",
    "MenuItemCreate",
    "MenuItemUpdate",
    "MenuItemResponse",
    "CustomizationOption",
    "CustomizationTemplateBase",
    "CustomizationTemplateCreate",
    "CustomizationTemplateResponse",
    # Order models
    "OrderStatus",
    "OrderItemBase",
    "OrderItemCreate",
    "OrderItemResponse",
    "OrderBase",
    "OrderCreate",
    "OrderUpdate",
    "OrderResponse",
    # Loyalty models
    "LoyaltyTransactionType",
    "LoyaltyBalanceResponse",
    "LoyaltyRewardBase",
    "LoyaltyRewardCreate",
    "LoyaltyRewardResponse",
    "LoyaltyTransactionResponse",
]

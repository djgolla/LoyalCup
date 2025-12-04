"""
Pydantic models for loyalty balances, rewards, and transactions.
Matches the loyalty_balances, loyalty_rewards, and loyalty_transactions tables in 001_init.sql.
"""
from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, UUID4


class LoyaltyTransactionType(str, Enum):
    """Loyalty transaction type enumeration."""
    EARNED = "earned"
    REDEEMED = "redeemed"
    ADJUSTED = "adjusted"
    EXPIRED = "expired"


class LoyaltyBalanceResponse(BaseModel):
    """
    Loyalty balance response model.
    Returned when retrieving user's loyalty balance.
    """
    id: UUID4 = Field(..., description="Balance record's unique identifier")
    user_id: UUID4 = Field(..., description="User ID who owns this balance")
    shop_id: UUID4 = Field(..., description="Shop ID this balance is for")
    points: int = Field(..., description="Current point balance", ge=0)
    updated_at: datetime = Field(..., description="When the balance was last updated")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "234e5678-e89b-12d3-a456-426614174000",
                "shop_id": "345e6789-e89b-12d3-a456-426614174000",
                "points": 150,
                "updated_at": "2024-01-01T12:00:00Z"
            }
        }


class LoyaltyRewardBase(BaseModel):
    """Base loyalty reward model."""
    name: str = Field(..., description="Reward name")
    description: Optional[str] = Field(None, description="Reward description")
    points_required: int = Field(..., description="Points required to redeem this reward", ge=0)
    is_active: bool = Field(default=True, description="Whether this reward is currently active")


class LoyaltyRewardCreate(LoyaltyRewardBase):
    """
    Loyalty reward creation model.
    Used when creating a new loyalty reward.
    """
    shop_id: UUID4 = Field(..., description="Shop ID this reward belongs to")


class LoyaltyRewardResponse(LoyaltyRewardBase):
    """
    Loyalty reward response model.
    Returned when retrieving reward data.
    """
    id: UUID4 = Field(..., description="Reward's unique identifier")
    shop_id: UUID4 = Field(..., description="Shop ID this reward belongs to")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "shop_id": "234e5678-e89b-12d3-a456-426614174000",
                "name": "Free Coffee",
                "description": "Get a free medium coffee of your choice",
                "points_required": 100,
                "is_active": True
            }
        }


class LoyaltyTransactionResponse(BaseModel):
    """
    Loyalty transaction response model.
    Returned when retrieving transaction data.
    """
    id: UUID4 = Field(..., description="Transaction's unique identifier")
    user_id: UUID4 = Field(..., description="User ID who made this transaction")
    shop_id: UUID4 = Field(..., description="Shop ID where transaction occurred")
    order_id: Optional[UUID4] = Field(None, description="Order ID associated with this transaction")
    points_change: int = Field(..., description="Points change (positive for earned, negative for redeemed)")
    type: LoyaltyTransactionType = Field(..., description="Transaction type")
    created_at: datetime = Field(..., description="When the transaction was created")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "234e5678-e89b-12d3-a456-426614174000",
                "shop_id": "345e6789-e89b-12d3-a456-426614174000",
                "order_id": "456e7890-e89b-12d3-a456-426614174000",
                "points_change": 15,
                "type": "earned",
                "created_at": "2024-01-01T12:00:00Z"
            }
        }

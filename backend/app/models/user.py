"""
Pydantic models for user and profile data.
Matches the profiles table schema in 001_init.sql.
"""
from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, UUID4


class UserRole(str, Enum):
    """User role enumeration."""
    CUSTOMER = "customer"
    SHOP_WORKER = "shop_worker"
    SHOP_OWNER = "shop_owner"
    ADMIN = "admin"


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr = Field(..., description="User's email address")
    full_name: Optional[str] = Field(None, description="User's full name")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    role: UserRole = Field(default=UserRole.CUSTOMER, description="User's role in the system")


class UserCreate(UserBase):
    """
    User creation model.
    Used when creating a new user profile.
    """
    pass


class UserUpdate(BaseModel):
    """
    User update model.
    All fields are optional for partial updates.
    """
    email: Optional[EmailStr] = Field(None, description="User's email address")
    full_name: Optional[str] = Field(None, description="User's full name")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    role: Optional[UserRole] = Field(None, description="User's role in the system")


class UserResponse(UserBase):
    """
    User response model.
    Returned when retrieving user data.
    """
    id: UUID4 = Field(..., description="User's unique identifier")
    created_at: datetime = Field(..., description="When the user profile was created")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "full_name": "John Doe",
                "avatar_url": "https://example.com/avatar.jpg",
                "role": "customer",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }

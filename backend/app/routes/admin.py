"""
Admin API routes
All endpoints require admin role authentication
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
    responses={401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}},
)


# Request models

class ShopStatusUpdate(BaseModel):
    status: str  # pending, active, suspended


class UserRoleUpdate(BaseModel):
    role: str  # customer, shop_worker, shop_owner, admin


class UserStatusUpdate(BaseModel):
    status: str  # active, suspended


class PlatformSettingsUpdate(BaseModel):
    settings: dict


# Dependency for checking admin role
def require_admin(current_user: dict = None):
    """Verify user has admin role"""
    # Placeholder - implement with actual auth
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Dashboard endpoint

@router.get("/dashboard")
async def get_dashboard_stats(admin: dict = Depends(require_admin)):
    """Get platform overview statistics"""
    # Mock data for now
    return {
        "revenue": {
            "total": 12450.50,
            "change": 12.5,
            "trend": "up"
        },
        "orders": {
            "total": 847,
            "change": 8.2,
            "trend": "up"
        },
        "users": {
            "total": 2341,
            "change": 23.1,
            "trend": "up"
        },
        "shops": {
            "total": 45,
            "new": 2,
            "trend": "up"
        },
        "pending_actions": {
            "shops_awaiting_approval": 3,
            "reported_reviews": 2,
            "support_tickets": 1
        }
    }


# Shop management endpoints

@router.get("/shops")
async def list_shops(
    status: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    admin: dict = Depends(require_admin)
):
    """List all shops with filters"""
    # Mock data
    shops = [
        {
            "id": "1",
            "name": "Corner Coffee Co",
            "owner_email": "john@example.com",
            "status": "active",
            "featured": True,
            "revenue": 2340.00,
            "created_at": "2024-01-15"
        },
        {
            "id": "2",
            "name": "The Daily Grind",
            "owner_email": "jane@example.com",
            "status": "active",
            "featured": False,
            "revenue": 1890.00,
            "created_at": "2024-02-20"
        },
        {
            "id": "3",
            "name": "New Bean Cafe",
            "owner_email": "bob@example.com",
            "status": "pending",
            "featured": False,
            "revenue": 0.00,
            "created_at": "2024-12-01"
        }
    ]
    
    return {
        "shops": shops,
        "total": len(shops),
        "page": page,
        "per_page": per_page
    }


@router.get("/shops/{shop_id}")
async def get_shop_details(shop_id: str, admin: dict = Depends(require_admin)):
    """Get detailed shop information"""
    # Mock data
    return {
        "id": shop_id,
        "name": "Corner Coffee Co",
        "description": "Best coffee in town",
        "owner": {
            "id": "owner1",
            "name": "John Doe",
            "email": "john@example.com"
        },
        "status": "active",
        "featured": True,
        "address": "123 Main St",
        "city": "Seattle",
        "state": "WA",
        "stats": {
            "total_orders": 523,
            "total_revenue": 4567.89,
            "menu_items": 25,
            "avg_rating": 4.8
        },
        "created_at": "2024-01-15"
    }


@router.put("/shops/{shop_id}/status")
async def update_shop_status(
    shop_id: str,
    data: ShopStatusUpdate,
    admin: dict = Depends(require_admin)
):
    """Change shop status (approve, suspend, activate)"""
    valid_statuses = ["pending", "active", "suspended"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    # Log action to audit_log
    return {"status": "success", "new_status": data.status}


@router.put("/shops/{shop_id}/featured")
async def toggle_shop_featured(shop_id: str, admin: dict = Depends(require_admin)):
    """Toggle shop featured status"""
    return {"status": "success", "featured": True}


@router.delete("/shops/{shop_id}")
async def delete_shop(shop_id: str, admin: dict = Depends(require_admin)):
    """Permanently delete a shop"""
    return {"status": "success", "message": "Shop deleted"}


# User management endpoints

@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    admin: dict = Depends(require_admin)
):
    """List all users with filters"""
    # Mock data
    users = [
        {
            "id": "u1",
            "email": "customer@example.com",
            "full_name": "Alice Johnson",
            "role": "customer",
            "status": "active",
            "created_at": "2024-03-10"
        },
        {
            "id": "u2",
            "email": "owner@example.com",
            "full_name": "Bob Smith",
            "role": "shop_owner",
            "status": "active",
            "created_at": "2024-01-15"
        }
    ]
    
    return {
        "users": users,
        "total": len(users),
        "page": page,
        "per_page": per_page
    }


@router.get("/users/{user_id}")
async def get_user_details(user_id: str, admin: dict = Depends(require_admin)):
    """Get detailed user information"""
    return {
        "id": user_id,
        "email": "user@example.com",
        "full_name": "John Doe",
        "role": "customer",
        "status": "active",
        "stats": {
            "total_orders": 45,
            "total_spent": 456.78,
            "loyalty_points": 234
        },
        "created_at": "2024-02-20"
    }


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: UserRoleUpdate,
    admin: dict = Depends(require_admin)
):
    """Change user role"""
    valid_roles = ["customer", "shop_worker", "shop_owner", "admin"]
    if data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {valid_roles}"
        )
    
    return {"status": "success", "new_role": data.role}


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    data: UserStatusUpdate,
    admin: dict = Depends(require_admin)
):
    """Suspend or activate user"""
    valid_statuses = ["active", "suspended"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    return {"status": "success", "new_status": data.status}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """Delete user account"""
    return {"status": "success", "message": "User deleted"}


# Analytics endpoints

@router.get("/analytics/overview")
async def get_analytics_overview(
    days: int = 30,
    admin: dict = Depends(require_admin)
):
    """Get platform analytics overview"""
    return {
        "revenue_trend": [
            {"date": "2024-11-01", "value": 1234.56},
            {"date": "2024-11-02", "value": 1456.78}
        ],
        "order_trend": [
            {"date": "2024-11-01", "count": 45},
            {"date": "2024-11-02", "count": 52}
        ],
        "top_shops": [
            {"name": "Corner Coffee Co", "revenue": 2340.00},
            {"name": "The Daily Grind", "revenue": 1890.00}
        ]
    }


@router.get("/analytics/orders")
async def get_order_analytics(
    period: str = "month",
    admin: dict = Depends(require_admin)
):
    """Get order analytics"""
    return {
        "total": 847,
        "by_status": {
            "completed": 750,
            "pending": 45,
            "cancelled": 52
        },
        "trend": []
    }


@router.get("/analytics/revenue")
async def get_revenue_analytics(
    period: str = "month",
    admin: dict = Depends(require_admin)
):
    """Get revenue analytics"""
    return {
        "total": 12450.50,
        "by_shop": [],
        "trend": []
    }


@router.get("/analytics/growth")
async def get_growth_analytics(admin: dict = Depends(require_admin)):
    """Get user and shop growth metrics"""
    return {
        "users": {
            "total": 2341,
            "daily": [],
            "monthly": []
        },
        "shops": {
            "total": 45,
            "daily": [],
            "monthly": []
        }
    }


# Platform settings endpoints

@router.get("/settings")
async def get_platform_settings(admin: dict = Depends(require_admin)):
    """Get platform configuration settings"""
    return {
        "platform_name": "LoyalCup",
        "global_loyalty_enabled": True,
        "default_points_per_dollar": 10,
        "max_shops_per_owner": 5,
        "shop_approval_required": True,
        "maintenance_mode": False
    }


@router.put("/settings")
async def update_platform_settings(
    data: PlatformSettingsUpdate,
    admin: dict = Depends(require_admin)
):
    """Update platform settings"""
    return {"status": "success", "settings": data.settings}


# Audit log endpoint

@router.get("/audit-log")
async def get_audit_log(
    page: int = 1,
    per_page: int = 50,
    admin_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """View admin action history"""
    logs = [
        {
            "id": "log1",
            "admin_email": "admin@loyalcup.com",
            "action": "shop_status_changed_active",
            "entity_type": "shop",
            "entity_id": "shop1",
            "details": {"new_status": "active"},
            "ip_address": "192.168.1.1",
            "created_at": "2024-12-04T10:30:00Z"
        }
    ]
    
    return {
        "logs": logs,
        "total": len(logs),
        "page": page,
        "per_page": per_page
    }

"""
User management routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from app.services.auth_service import AuthService
from app.database import get_supabase
from app.utils.security import require_auth, require_admin

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
)

auth_service = AuthService()


class UpdateProfileRequest(BaseModel):
    full_name:  Optional[str] = None
    avatar_url: Optional[str] = None
    push_token: Optional[str] = None   # FIXED: added so app can save notification token
    phone:      Optional[str] = None   # FIXED: added so app can save phone for SMS


class UpdateRoleRequest(BaseModel):
    role: str


@router.get("/me")
async def get_my_profile(token_payload: dict = Depends(require_auth())):
    """Get own profile."""
    try:
        user_id = token_payload.get("sub")
        profile = await auth_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/profile")
async def get_profile_alias(token_payload: dict = Depends(require_auth())):
    """Mobile-compatible alias for the current user's profile."""
    return await get_my_profile(token_payload)


@router.put("/me")
async def update_my_profile(
    data: UpdateProfileRequest,
    token_payload: dict = Depends(require_auth())
):
    """Update own profile."""
    try:
        user_id = token_payload.get("sub")
        profile = await auth_service.update_user_profile(user_id, data.dict(exclude_unset=True))
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/profile")
async def update_profile_alias(
    data: UpdateProfileRequest,
    token_payload: dict = Depends(require_auth()),
):
    """Mobile-compatible alias for updating the current user's profile."""
    return await update_my_profile(data, token_payload)


@router.get("/order-count")
async def get_my_order_count(token_payload: dict = Depends(require_auth())):
    """Count real customer orders without exposing order rows to clients."""
    user_id = token_payload.get("sub")
    db = get_supabase()
    resp = (
        db.get_service_client()
        .table("orders")
        .select("id", count="exact")
        .eq("customer_id", user_id)
        .in_("status", ["confirmed", "pending", "completed"])
        .execute()
    )
    return {"count": resp.count or 0}


@router.get("/favorites")
async def get_my_favorites(token_payload: dict = Depends(require_auth())):
    user_id = token_payload.get("sub")
    db = get_supabase()
    resp = (
        db.get_service_client()
        .table("customer_favorites")
        .select("shop_id, shops(id, name, description, address, city, state, logo_url, hours, avg_rating, status)")
        .eq("customer_id", user_id)
        .execute()
    )

    rows = resp.data or []
    return {
        "favorites": [
            {
                "shop_id": row.get("shop_id"),
                "shop": row.get("shops"),
            }
            for row in rows
            if row.get("shops") and row["shops"].get("status") == "active"
        ]
    }


@router.post("/favorites")
async def add_my_favorite(
    payload: dict,
    token_payload: dict = Depends(require_auth()),
):
    shop_id = payload.get("shop_id") or payload.get("shopId")
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="shop_id is required")

    user_id = token_payload.get("sub")
    db = get_supabase()
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id")
        .eq("id", shop_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    try:
        db.get_service_client().table("customer_favorites").insert({
            "customer_id": user_id,
            "shop_id": shop_id,
        }).execute()
    except Exception as e:
        if "duplicate" not in str(e).lower() and "unique" not in str(e).lower():
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save favorite")

    return {"success": True, "shop_id": shop_id}


@router.delete("/favorites/{shop_id}")
async def remove_my_favorite(
    shop_id: str,
    token_payload: dict = Depends(require_auth()),
):
    user_id = token_payload.get("sub")
    db = get_supabase()
    db.get_service_client().table("customer_favorites").delete().eq("customer_id", user_id).eq("shop_id", shop_id).execute()
    return {"success": True, "shop_id": shop_id}


@router.get("/{user_id}")
async def get_user_by_id(
    user_id: str,
    token_payload: dict = Depends(require_admin())
):
    """Get user by ID (admin only)."""
    try:
        profile = await auth_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/")
async def list_users(
    token_payload: dict = Depends(require_admin()),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100)
):
    """List all users with pagination (admin only)."""
    try:
        result = await auth_service.list_users(page, per_page)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{user_id}/role")
async def change_user_role(
    user_id: str,
    data: UpdateRoleRequest,
    token_payload: dict = Depends(require_admin())
):
    """Change user role (admin only)."""
    try:
        profile = await auth_service.change_user_role(user_id, data.role)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"message": "Role updated successfully", "profile": profile}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

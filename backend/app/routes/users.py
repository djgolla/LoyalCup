"""
User management routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from app.services.auth_service import AuthService
from app.utils.security import require_auth, require_admin

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
)

auth_service = AuthService()


# Request/Response Models
class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: str


# Routes
@router.get("/me")
async def get_my_profile(token_payload: dict = Depends(require_auth())):
    """
    Get own profile.
    """
    try:
        user_id = token_payload.get("sub")
        profile = await auth_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/me")
async def update_my_profile(
    data: UpdateProfileRequest,
    token_payload: dict = Depends(require_auth())
):
    """
    Update own profile.
    """
    try:
        user_id = token_payload.get("sub")
        profile = await auth_service.update_user_profile(user_id, data.dict(exclude_unset=True))
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}")
async def get_user_by_id(
    user_id: str,
    token_payload: dict = Depends(require_admin())
):
    """
    Get user by ID (admin only).
    """
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
    """
    List all users with pagination (admin only).
    """
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
    """
    Change user role (admin only).
    """
    try:
        profile = await auth_service.change_user_role(user_id, data.role)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {
            "message": "Role updated successfully",
            "profile": profile
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

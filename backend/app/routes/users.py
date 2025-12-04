"""
User profile routes.
Handles user profile management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_supabase, SupabaseClient
from app.models.user import UserResponse, UserUpdate
from app.utils.security import get_current_user, require_admin


router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Get the current user's profile.
    
    Returns the authenticated user's profile information.
    """
    # TODO: Implement getting current user profile
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get current user profile to be implemented"
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Update the current user's profile.
    
    Allows the authenticated user to update their profile information.
    """
    # TODO: Implement updating current user profile
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Update current user profile to be implemented"
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Get a user by ID.
    
    Returns public profile information for the specified user.
    """
    # TODO: Implement getting user by ID
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get user by ID to be implemented"
    )


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(require_admin),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    List all users (admin only).
    
    Returns a paginated list of all users.
    """
    # TODO: Implement listing users
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="List users to be implemented"
    )

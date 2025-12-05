"""
Shop routes.
Handles shop management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_supabase, SupabaseClient
from app.models.shop import ShopCreate, ShopUpdate, ShopResponse
from app.services.shop_service import ShopService
from app.utils.security import get_current_user, require_shop_owner


router = APIRouter(
    prefix="/shops",
    tags=["Shops"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
async def create_shop(
    shop: ShopCreate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Create a new shop.
    
    Creates a new shop with the provided information.
    Requires shop_owner or admin role.
    """
    shop_service = ShopService(db)
    # TODO: Implement shop creation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Shop creation to be implemented"
    )


@router.get("/", response_model=List[ShopResponse])
async def list_shops(
    skip: int = 0,
    limit: int = 100,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    List all shops.
    
    Returns a paginated list of all shops.
    """
    shop_service = ShopService(db)
    # TODO: Implement shop listing
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Shop listing to be implemented"
    )


@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(
    shop_id: str,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Get a shop by ID.
    
    Returns detailed information about a specific shop.
    """
    shop_service = ShopService(db)
    # TODO: Implement shop retrieval
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Shop retrieval to be implemented"
    )


@router.put("/{shop_id}", response_model=ShopResponse)
async def update_shop(
    shop_id: str,
    shop_update: ShopUpdate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Update a shop.
    
    Updates shop information.
    Requires shop_owner or admin role.
    """
    shop_service = ShopService(db)
    # TODO: Implement shop update
    # TODO: Verify user owns this shop or is admin
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Shop update to be implemented"
    )


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shop(
    shop_id: str,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Delete a shop.
    
    Deletes a shop and all associated data.
    Requires shop_owner or admin role.
    """
    shop_service = ShopService(db)
    # TODO: Implement shop deletion
    # TODO: Verify user owns this shop or is admin
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Shop deletion to be implemented"
    )

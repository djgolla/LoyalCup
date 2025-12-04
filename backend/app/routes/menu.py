"""
Menu routes.
Handles menu items and categories endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_supabase, SupabaseClient
from app.models.shop import (
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    CustomizationTemplateCreate,
    CustomizationTemplateResponse
)
from app.services.shop_service import ShopService
from app.utils.security import get_current_user, require_shop_owner


router = APIRouter(
    prefix="/menu",
    tags=["Menu"],
    responses={404: {"description": "Not found"}},
)


# Menu Categories
@router.post("/categories", response_model=MenuCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: MenuCategoryCreate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Create a new menu category.
    
    Creates a new category for organizing menu items.
    Requires shop_owner or admin role.
    """
    # TODO: Implement category creation
    # TODO: Verify user owns the shop
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Category creation to be implemented"
    )


@router.get("/categories/{shop_id}", response_model=List[MenuCategoryResponse])
async def list_categories(
    shop_id: str,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    List all categories for a shop.
    
    Returns all menu categories for the specified shop.
    """
    # TODO: Implement category listing
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Category listing to be implemented"
    )


# Menu Items
@router.post("/items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    item: MenuItemCreate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Create a new menu item.
    
    Creates a new menu item for a shop.
    Requires shop_owner or admin role.
    """
    shop_service = ShopService(db)
    # TODO: Implement menu item creation
    # TODO: Verify user owns the shop
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Menu item creation to be implemented"
    )


@router.get("/items/{shop_id}", response_model=List[MenuItemResponse])
async def list_menu_items(
    shop_id: str,
    category_id: str = None,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    List all menu items for a shop.
    
    Returns all menu items for the specified shop, optionally filtered by category.
    """
    # TODO: Implement menu item listing
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Menu item listing to be implemented"
    )


@router.get("/items/detail/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: str,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Get a menu item by ID.
    
    Returns detailed information about a specific menu item.
    """
    # TODO: Implement menu item retrieval
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Menu item retrieval to be implemented"
    )


@router.put("/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: str,
    item_update: MenuItemUpdate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Update a menu item.
    
    Updates menu item information.
    Requires shop_owner or admin role.
    """
    shop_service = ShopService(db)
    # TODO: Implement menu item update
    # TODO: Verify user owns the shop
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Menu item update to be implemented"
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: str,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Delete a menu item.
    
    Deletes a menu item.
    Requires shop_owner or admin role.
    """
    # TODO: Implement menu item deletion
    # TODO: Verify user owns the shop
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Menu item deletion to be implemented"
    )


# Customization Templates
@router.post("/customizations", response_model=CustomizationTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_customization_template(
    template: CustomizationTemplateCreate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Create a new customization template.
    
    Creates a new template for item customizations (e.g., size, milk type).
    Requires shop_owner or admin role.
    """
    # TODO: Implement customization template creation
    # TODO: Verify user owns the shop
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Customization template creation to be implemented"
    )


@router.get("/customizations/{shop_id}", response_model=List[CustomizationTemplateResponse])
async def list_customization_templates(
    shop_id: str,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    List all customization templates for a shop.
    
    Returns all customization templates for the specified shop.
    """
    # TODO: Implement customization template listing
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Customization template listing to be implemented"
    )

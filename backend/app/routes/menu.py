"""
Menu Routes - API endpoints for menu and customization management
Includes public and shop owner endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.services.shop_service import shop_service
from app.utils.security import require_auth


router = APIRouter(
    prefix="/api/v1/shops",
    tags=["menu"]
)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CategoryCreate(BaseModel):
    name: str
    display_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    display_order: Optional[int] = None


class CategoryReorder(BaseModel):
    category_id: str
    display_order: int


class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    base_price: float
    is_available: bool = True
    display_order: int = 0


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    base_price: Optional[float] = None
    is_available: Optional[bool] = None
    display_order: Optional[int] = None


class CustomizationTemplateCreate(BaseModel):
    name: str
    type: str  # 'single_select' or 'multi_select'
    is_required: bool = False
    applies_to: str = 'all_items'
    options: List[Dict[str, Any]]  # [{"name": "Small", "price": 0.00}, ...]


class CustomizationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    is_required: Optional[bool] = None
    applies_to: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None


class ItemAvailability(BaseModel):
    is_available: bool


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# ============================================================================
# PUBLIC ENDPOINTS - CATEGORIES
# ============================================================================

@router.get("/{shop_id}/categories")
async def get_categories(shop_id: str):
    """Get menu categories for a shop"""
    categories = await shop_service.list_categories(shop_id)
    return {"categories": categories}


# ============================================================================
# PUBLIC ENDPOINTS - MENU ITEMS
# ============================================================================

@router.get("/{shop_id}/items")
async def get_menu_items(
    shop_id: str,
    category_id: Optional[str] = Query(None, description="Filter by category")
):
    """Get all menu items for a shop"""
    items = await shop_service.list_menu_items(shop_id, category_id)
    return {"items": items}


@router.get("/{shop_id}/items/{item_id}")
async def get_menu_item(shop_id: str, item_id: str):
    """Get item details with customizations"""
    item = await shop_service.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get applicable customization templates
    customizations = await shop_service.list_customization_templates(shop_id)
    
    return {
        "item": item,
        "customizations": customizations
    }


# ============================================================================
# SHOP OWNER ENDPOINTS - CATEGORIES
# ============================================================================

@router.post("/{shop_id}/categories")
async def create_category(shop_id: str, category_data: CategoryCreate, user: dict = Depends(require_auth())):
    """Create a category"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    category = await shop_service.create_category(
        shop_id, 
        category_data.name, 
        category_data.display_order
    )
    return {"category": category}


@router.put("/{shop_id}/categories/{category_id}")
async def update_category(
    shop_id: str, 
    category_id: str, 
    category_data: CategoryUpdate,
    user: dict = Depends(require_auth())
):
    """Update a category"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Filter out None values
    update_data = {k: v for k, v in category_data.dict().items() if v is not None}
    category = await shop_service.update_category(category_id, update_data)
    return {"category": category}


@router.delete("/{shop_id}/categories/{category_id}")
async def delete_category(shop_id: str, category_id: str, user: dict = Depends(require_auth())):
    """Delete a category"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await shop_service.delete_category(category_id)
    return {"success": success}


@router.put("/{shop_id}/categories/reorder")
async def reorder_categories(
    shop_id: str, 
    category_orders: List[CategoryReorder],
    user: dict = Depends(require_auth())
):
    """Reorder categories"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    orders = [{"id": c.category_id, "display_order": c.display_order} for c in category_orders]
    success = await shop_service.reorder_categories(shop_id, orders)
    return {"success": success}


# ============================================================================
# SHOP OWNER ENDPOINTS - MENU ITEMS
# ============================================================================

@router.post("/{shop_id}/items")
async def create_menu_item(shop_id: str, item_data: MenuItemCreate, user: dict = Depends(require_auth())):
    """Create a menu item"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    item = await shop_service.create_menu_item(shop_id, item_data.dict())
    return {"item": item}


@router.put("/{shop_id}/items/{item_id}")
async def update_menu_item(
    shop_id: str, 
    item_id: str, 
    item_data: MenuItemUpdate,
    user: dict = Depends(require_auth())
):
    """Update a menu item"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Filter out None values
    update_data = {k: v for k, v in item_data.dict().items() if v is not None}
    item = await shop_service.update_menu_item(item_id, update_data)
    return {"item": item}


@router.delete("/{shop_id}/items/{item_id}")
async def delete_menu_item(shop_id: str, item_id: str, user: dict = Depends(require_auth())):
    """Delete a menu item"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await shop_service.delete_menu_item(item_id)
    return {"success": success}


@router.put("/{shop_id}/items/{item_id}/availability")
async def toggle_item_availability(
    shop_id: str, 
    item_id: str, 
    availability: ItemAvailability,
    user: dict = Depends(require_auth())
):
    """Toggle menu item availability"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    item = await shop_service.toggle_item_availability(item_id, availability.is_available)
    return {"item": item}


@router.post("/{shop_id}/items/{item_id}/image")
async def upload_item_image(
    shop_id: str, 
    item_id: str, 
    file: UploadFile = File(...),
    user: dict = Depends(require_auth())
):
    """Upload menu item image"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    file_data = await file.read()
    image_url = await shop_service.upload_item_image(item_id, file_data, shop_id)
    return {"image_url": image_url}


# ============================================================================
# CUSTOMIZATION TEMPLATES
# ============================================================================

@router.get("/{shop_id}/customizations")
async def get_customization_templates(shop_id: str):
    """Get shop customization templates"""
    templates = await shop_service.list_customization_templates(shop_id)
    return {"templates": templates}


@router.post("/{shop_id}/customizations")
async def create_customization_template(
    shop_id: str, 
    template_data: CustomizationTemplateCreate,
    user: dict = Depends(require_auth())
):
    """Create a customization template"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    template = await shop_service.create_customization_template(
        shop_id, 
        template_data.dict()
    )
    return {"template": template}


@router.put("/{shop_id}/customizations/{template_id}")
async def update_customization_template(
    shop_id: str, 
    template_id: str, 
    template_data: CustomizationTemplateUpdate,
    user: dict = Depends(require_auth())
):
    """Update a customization template"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Filter out None values
    update_data = {k: v for k, v in template_data.dict().items() if v is not None}
    template = await shop_service.update_customization_template(template_id, update_data)
    return {"template": template}


@router.delete("/{shop_id}/customizations/{template_id}")
async def delete_customization_template(
    shop_id: str, 
    template_id: str,
    user: dict = Depends(require_auth())
):
    """Delete a customization template"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await shop_service.delete_customization_template(template_id)
    return {"success": success}

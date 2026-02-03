"""
Shop Routes - API endpoints for shop management
Includes public, shop owner, and admin endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.services.shop_service import shop_service
from app.utils.security import require_auth


router = APIRouter(
    prefix="/api/v1/shops",
    tags=["shops"]
)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ShopCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    hours: Optional[Dict[str, Any]] = None
    loyalty_points_per_dollar: int = 0
    participates_in_global_loyalty: bool = False


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    hours: Optional[Dict[str, Any]] = None
    loyalty_points_per_dollar: Optional[int] = None
    participates_in_global_loyalty: Optional[bool] = None


class ShopApplicationRequest(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    zip: str
    phone: str
    business_license: Optional[str] = None
    website: Optional[str] = None
    why_join: Optional[str] = None


# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@router.get("")
async def list_shops(
    city: Optional[str] = Query(None, description="Filter by city"),
    search: Optional[str] = Query(None, description="Search query"),
):
    """List all active shops with optional filters"""
    shops = await shop_service.list_shops(city=city, search=search, active_only=True)
    return {"shops": shops}


@router.get("/nearby")
async def find_nearby_shops(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(10, description="Radius in kilometers")
):
    """Find nearby shops"""
    shops = await shop_service.find_nearby_shops(lat=lat, lng=lng, radius_km=radius)
    return {"shops": shops}


@router.get("/{shop_id}")
async def get_shop(shop_id: str):
    """Get shop details with full menu"""
    shop = await shop_service.get_shop_by_id(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get menu items
    items = await shop_service.list_menu_items(shop_id)
    categories = await shop_service.list_categories(shop_id)
    
    return {
        "shop": shop,
        "menu": {
            "categories": categories,
            "items": items
        }
    }


@router.get("/{shop_id}/menu")
async def get_shop_menu(shop_id: str):
    """Get shop menu organized by category"""
    categories = await shop_service.list_categories(shop_id)
    items = await shop_service.list_menu_items(shop_id)
    
    # Organize items by category
    menu_by_category = {}
    for category in categories:
        category_items = [
            item for item in items 
            if item.get('category_id') == category['id']
        ]
        menu_by_category[category['name']] = {
            "category": category,
            "items": category_items
        }
    
    return {"menu": menu_by_category}


@router.post("/apply")
async def apply_shop_owner(
    application: ShopApplicationRequest,
    token_payload: dict = Depends(require_auth())
):
    """
    Apply to become a shop owner and create a new shop.
    Automatically upgrades user role to 'shop_owner' and creates shop with active status.
    """
    try:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user token")
        
        # Create shop application
        result = await shop_service.create_shop_application(
            user_id=user_id,
            application_data=application.dict()
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SHOP OWNER ENDPOINTS (require shop ownership)
# ============================================================================

@router.post("")
async def create_shop(shop_data: ShopCreate, user: dict = Depends(require_auth())):
    """Create new shop"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    shop = await shop_service.create_shop(shop_data.dict(), user_id)
    return {"shop": shop}


@router.put("/{shop_id}")
async def update_shop(shop_id: str, shop_data: ShopUpdate, user: dict = Depends(require_auth())):
    """Update shop details"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Filter out None values
    update_data = {k: v for k, v in shop_data.dict().items() if v is not None}
    shop = await shop_service.update_shop(shop_id, update_data)
    return {"shop": shop}


@router.delete("/{shop_id}")
async def delete_shop(shop_id: str, user: dict = Depends(require_auth())):
    """Deactivate shop"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await shop_service.delete_shop(shop_id)
    return {"success": success}


@router.post("/{shop_id}/logo")
async def upload_shop_logo(shop_id: str, file: UploadFile = File(...), user: dict = Depends(require_auth())):
    """Upload shop logo"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    file_data = await file.read()
    logo_url = await shop_service.upload_shop_image(shop_id, file_data, "logo")
    return {"logo_url": logo_url}


@router.post("/{shop_id}/banner")
async def upload_shop_banner(shop_id: str, file: UploadFile = File(...), user: dict = Depends(require_auth())):
    """Upload shop banner"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    file_data = await file.read()
    banner_url = await shop_service.upload_shop_image(shop_id, file_data, "banner")
    return {"banner_url": banner_url}


@router.get("/{shop_id}/analytics")
async def get_shop_analytics(shop_id: str, user: dict = Depends(require_auth())):
    """Get shop analytics"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Verify ownership
    if not shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    analytics = await shop_service.get_shop_analytics(shop_id)
    return {"analytics": analytics}


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin/shops")
async def list_all_shops():
    """List all shops including inactive (admin only)"""
    user_id = get_current_user_id()
    
    if not shop_service.is_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    shops = await shop_service.list_shops(active_only=False)
    return {"shops": shops}


@router.put("/admin/shops/{shop_id}/approve")
async def approve_shop(shop_id: str):
    """Approve new shop (admin only)"""
    user_id = get_current_user_id()
    
    if not shop_service.is_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    shop = await shop_service.update_shop(shop_id, {"approved": True})
    return {"shop": shop}


@router.put("/admin/shops/{shop_id}/feature")
async def feature_shop(shop_id: str):
    """Feature shop on homepage (admin only)"""
    user_id = get_current_user_id()
    
    if not shop_service.is_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    shop = await shop_service.update_shop(shop_id, {"featured": True})
    return {"shop": shop}

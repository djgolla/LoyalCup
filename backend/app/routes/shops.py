"""
Shop Routes - API endpoints for shop management
Includes public, shop owner, and admin endpoints
"""
import secrets
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator

from app.services.shop_service import shop_service
from app.utils.security import require_auth, require_admin
from app.database import get_supabase

router = APIRouter(
    prefix="/api/v1/shops",
    tags=["shops"]
)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

def _validate_prep_time(v):
    if v is None:
        return v
    if v < 1 or v > 120:
        raise ValueError("Average prep time must be between 1 and 120 minutes")
    return v


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
    # Customers are told their order will be ready in ~this many minutes.
    avg_prep_time_minutes: int = 10

    @validator("avg_prep_time_minutes")
    def _prep(cls, v):
        return _validate_prep_time(v)


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    hours: Optional[Dict[str, Any]] = None
    loyalty_points_per_dollar: Optional[int] = None
    participates_in_global_loyalty: Optional[bool] = None
    mobile_ordering_enabled: Optional[bool] = None
    website: Optional[str] = None
    zip: Optional[str] = None
    avg_prep_time_minutes: Optional[int] = None

    @validator("avg_prep_time_minutes")
    def _prep(cls, v):
        return _validate_prep_time(v)


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


@router.get("/stats/public")
async def get_public_stats():
    """Small public homepage counters via backend service role."""
    db = get_supabase()
    sc = db.get_service_client()

    shops = sc.table("shops").select("id", count="exact").eq("status", "active").execute()
    orders = sc.table("orders").select("id", count="exact").neq("status", "cancelled").execute()
    users = sc.table("profiles").select("id", count="exact").eq("status", "active").execute()

    return {
        "shopCount": shops.count or 0,
        "orderCount": orders.count or 0,
        "userCount": users.count or 0,
    }


@router.get("/{shop_id}")
async def get_shop(shop_id: str):
    """Get shop details with full menu"""
    shop = await shop_service.get_shop_by_id(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    items = await shop_service.list_menu_items(shop_id)
    categories = await shop_service.list_categories(shop_id)
    modifier_groups = await shop_service.list_modifier_groups(shop_id)
    offers = await shop_service.list_shop_offers(shop_id)
    return {
        "shop": shop,
        "menu": {
            "categories": categories,
            "items": items,
            "modifier_groups": modifier_groups,
            "offers": offers,
        }
    }


@router.get("/{shop_id}/menu")
async def get_shop_menu(shop_id: str):
    """Get shop menu organized by category"""
    categories = await shop_service.list_categories(shop_id)
    items      = await shop_service.list_menu_items(shop_id)
    menu_by_category = {}
    for category in categories:
        category_items = [i for i in items if i.get("category_id") == category["id"]]
        menu_by_category[category["name"]] = {"category": category, "items": category_items}
    return {"menu": menu_by_category}


@router.post("/apply")
async def apply_shop_owner(
    application: ShopApplicationRequest,
    token_payload: dict = Depends(require_auth())
):
    """Apply to become a shop owner."""
    try:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user token")
        result = await shop_service.create_shop_application(
            user_id=user_id,
            application_data={
                **application.dict(),
                "email": token_payload.get("email"),
            }
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SHOP OWNER ENDPOINTS
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
    if not await shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = {k: v for k, v in shop_data.dict().items() if v is not None}
    shop = await shop_service.update_shop(shop_id, update_data)
    return {"shop": shop}


@router.delete("/{shop_id}")
async def delete_shop(shop_id: str, user: dict = Depends(require_auth())):
    """Deactivate shop"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not await shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    success = await shop_service.delete_shop(shop_id)
    return {"success": success}


@router.post("/{shop_id}/logo")
async def upload_shop_logo(shop_id: str, file: UploadFile = File(...), user: dict = Depends(require_auth())):
    """Upload shop logo"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not await shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    file_data = await file.read()
    logo_url  = await shop_service.upload_shop_image(shop_id, file_data, "logo")
    return {"logo_url": logo_url}


@router.post("/{shop_id}/banner")
async def upload_shop_banner(shop_id: str, file: UploadFile = File(...), user: dict = Depends(require_auth())):
    """Upload shop banner"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not await shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    file_data  = await file.read()
    banner_url = await shop_service.upload_shop_image(shop_id, file_data, "banner")
    return {"banner_url": banner_url}


@router.post("/{shop_id}/asset")
async def upload_shop_asset(shop_id: str, file: UploadFile = File(...), user: dict = Depends(require_auth())):
    """Upload an owner-managed image without exposing storage write access to clients."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not await shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    file_data = await file.read()
    if len(file_data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be less than 5MB")

    url = await shop_service.upload_shop_asset(
        shop_id,
        file_data,
        file.filename or "image.jpg",
        file.content_type or "image/jpeg",
    )
    return {"url": url}


@router.get("/{shop_id}/analytics")
async def get_shop_analytics(shop_id: str, user: dict = Depends(require_auth())):
    """Get shop analytics"""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not await shop_service.verify_shop_ownership(shop_id, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    analytics = await shop_service.get_shop_analytics(shop_id)
    return {"analytics": analytics}


@router.post("/{shop_id}/generate-api-key")
async def generate_shop_api_key(shop_id: str, user: dict = Depends(require_auth())):
    """Generate a new API key for a shop. Shop owner only."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    db = get_supabase()

    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id")
        .eq("id", shop_id)
        .eq("owner_id", user_id)
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=403, detail="Not authorized")

    api_key = f"lc_shop_{secrets.token_urlsafe(32)}"

    try:
        db.get_service_client().table("shop_api_keys").insert({
            "shop_id": shop_id,
            "api_key": api_key,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "shop_id": shop_id,
        "api_key": api_key,
        "message": "API key generated successfully"
    }


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin/shops")
async def list_all_shops(_: dict = Depends(require_admin())):
    """List all shops including inactive (admin only)"""
    shops = await shop_service.list_shops(active_only=False)
    return {"shops": shops}


@router.put("/admin/shops/{shop_id}/approve")
async def approve_shop(shop_id: str, _: dict = Depends(require_admin())):
    """Approve new shop (admin only)"""
    shop = await shop_service.update_shop(shop_id, {"approved": True})
    return {"shop": shop}


@router.put("/admin/shops/{shop_id}/feature")
async def feature_shop(shop_id: str, _: dict = Depends(require_admin())):
    """Feature shop on homepage (admin only)"""
    shop = await shop_service.update_shop(shop_id, {"featured": True})
    return {"shop": shop}

"""
POS routes — Square OAuth, status, sync, readiness, location, offers.

GET  /api/v1/pos/status          — connection status (auth required)
GET  /api/v1/pos/readiness       — full setup readiness check
GET  /api/v1/pos/locations       — list Square locations
POST /api/v1/pos/connect         — start Square OAuth flow
POST /api/v1/pos/sync            — trigger catalog sync
POST /api/v1/pos/square/set-location — set active location
GET  /api/v1/pos/offers          — list active offers for a shop
POST /api/v1/pos/offers          — create offer
PATCH/DELETE /api/v1/pos/offers/{id}
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime

from app.database import get_supabase, SupabaseClient
from app.integrations.pos.registry import get_pos_adapters
from app.utils.security import require_auth, require_shop_owner
from app.config import settings

router = APIRouter(prefix="/api/v1/pos", tags=["pos"])
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Helper — verify caller owns / is associated with the shop
# ─────────────────────────────────────────────────────────────────────────────

def _assert_shop_access(user: dict, shop_id: str, db: SupabaseClient) -> None:
    """Raise 403 if user has no relationship to this shop."""
    user_id   = user.get("sub")
    user_role = (user.get("user_metadata") or {}).get("role", "customer")
    if user_role == "admin":
        return  # admins can access anything

    # Check profile.shop_id OR shops.owner_id
    profile = (
        db.get_service_client()
        .table("profiles")
        .select("shop_id, role")
        .eq("id", user_id)
        .single()
        .execute()
        .data or {}
    )
    if profile.get("shop_id") == shop_id:
        return
    shop = (
        db.get_service_client()
        .table("shops")
        .select("owner_id")
        .eq("id", shop_id)
        .single()
        .execute()
        .data or {}
    )
    if shop.get("owner_id") == user_id:
        return
    raise HTTPException(status_code=403, detail="Access denied to this shop")


# ─────────────────────────────────────────────────────────────────────────────
# GET /status
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/status")
async def get_pos_status(
    shop_id:  str = Query(...),
    provider: str = Query("square"),
    user: dict   = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    """
    Returns POS connection status.
    Called by mobile checkout (to get location_id) and web dashboard.
    Auth required — customers need it to fetch location_id for their order's shop.
    """
    conn = (
        db.get_service_client()
        .table("pos_connections")
        .select("provider, status, location_id, merchant_id, last_updated")
        .eq("shop_id", shop_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
        .data
    )

    if not conn:
        return {
            "status":       "not_connected",
            "connected":    False,
            "location_id":  None,
            "merchant_id":  None,
            "last_updated": None,
        }

    c = conn[0]
    return {
        "status":       c.get("status", "not_connected"),
        "connected":    c.get("status") == "connected",
        "location_id":  c.get("location_id"),
        "merchant_id":  c.get("merchant_id"),
        "last_updated": c.get("last_updated"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /readiness — full setup check for dashboard
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/readiness")
async def get_pos_readiness(
    shop_id: str = Query(...),
    user: dict   = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    _assert_shop_access(user, shop_id, db)

    conn = (
        db.get_service_client()
        .table("pos_connections")
        .select("provider, status, location_id, merchant_id, access_token")
        .eq("shop_id", shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
        .data
    )

    if not conn:
        return {"connected": False, "hasLocation": False, "merchantId": None, "locations": [], "ready": False}

    c            = conn[0]
    is_connected = c.get("status") == "connected"
    has_location = bool(c.get("location_id"))

    locations = []
    if is_connected and c.get("access_token"):
        try:
            adapter = get_pos_adapters().get("square")
            if adapter:
                locs      = await adapter.list_locations(c["access_token"])
                locations = [{"id": l.id, "name": l.name} for l in locs]
        except Exception as e:
            logger.warning(f"[POS readiness] location fetch failed for {shop_id}: {e}")

    return {
        "connected":   is_connected,
        "hasLocation": has_location,
        "merchantId":  c.get("merchant_id"),
        "locations":   locations,
        "ready":       is_connected and has_location,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /locations
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/locations")
async def list_locations(
    shop_id:  str = Query(...),
    provider: str = Query("square"),
    user: dict    = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    _assert_shop_access(user, shop_id, db)

    adapter = get_pos_adapters().get(provider)
    if not adapter:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    conn = (
        db.get_service_client()
        .table("pos_connections")
        .select("access_token, status")
        .eq("shop_id", shop_id)
        .eq("provider", provider)
        .single()
        .execute()
        .data
    )
    if not conn or conn.get("status") != "connected":
        raise HTTPException(status_code=400, detail="POS not connected for this shop")

    access_token = conn.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token — reconnect Square")

    try:
        locs = await adapter.list_locations(access_token)
        return {"locations": [{"id": l.id, "name": l.name} for l in locs]}
    except Exception as e:
        logger.error(f"[POS] list_locations failed shop={shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch locations from Square")


# ─────────────────────────────────────────────────────────────────────────────
# POST /connect — start OAuth, return authorization_url
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/connect")
async def connect_pos(
    provider: str = Query("square"),
    user: dict    = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    user_id = user.get("sub")

    # Resolve shop_id for this owner
    profile = (
        db.get_service_client()
        .table("profiles")
        .select("shop_id")
        .eq("id", user_id)
        .single()
        .execute()
        .data or {}
    )
    shop_id = profile.get("shop_id")
    if not shop_id:
        # Try shops table
        shop = (
            db.get_service_client()
            .table("shops")
            .select("id")
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        if shop:
            shop_id = shop[0]["id"]

    if not shop_id:
        raise HTTPException(status_code=400, detail="No shop found for your account. Complete shop setup first.")

    adapter = get_pos_adapters().get(provider)
    if not adapter:
        raise HTTPException(status_code=400, detail=f"Unsupported POS provider: {provider}")

    redirect_uri     = f"{settings.api_base_url}/api/v1/pos/callback/{provider}"
    authorization_url = adapter.get_authorization_url(
        shop_id=shop_id,
        redirect_uri=redirect_uri,
        state=user_id,
    )
    return {"authorization_url": authorization_url, "shop_id": shop_id}


# ─────────────────────────────────────────────────────────────────────────────
# POST /sync — trigger catalog sync
# ─────────────────────────────────────────────────────────────────────────────

class SyncRequest(BaseModel):
    shop_id:  str
    provider: str = "square"

@router.post("/sync")
async def sync_catalog(
    body: SyncRequest,
    user: dict = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    _assert_shop_access(user, body.shop_id, db)

    conn = (
        db.get_service_client()
        .table("pos_connections")
        .select("access_token, status, location_id")
        .eq("shop_id", body.shop_id)
        .eq("provider", body.provider)
        .single()
        .execute()
        .data
    )
    if not conn or conn.get("status") != "connected":
        raise HTTPException(status_code=400, detail="Square is not connected for this shop")

    access_token = conn.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token — reconnect Square")

    adapter = get_pos_adapters().get(body.provider)
    if not adapter:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    try:
        from app.services.pos_sync_service import sync_catalog_to_db
        result = await sync_catalog_to_db(
            db=db,
            shop_id=body.shop_id,
            adapter=adapter,
            access_token=access_token,
            location_id=conn.get("location_id"),
        )
        # bump last_updated
        db.get_service_client().table("pos_connections").update({
            "last_updated": datetime.utcnow().isoformat()
        }).eq("shop_id", body.shop_id).eq("provider", body.provider).execute()

        return result
    except Exception as e:
        logger.error(f"[POS] sync failed shop={body.shop_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /square/set-location
# ─────────────────────────────────────────────────────────────────────────────

class SetLocationRequest(BaseModel):
    shop_id:     str
    location_id: str

@router.post("/square/set-location")
async def set_square_location(
    body: SetLocationRequest,
    user: dict = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    _assert_shop_access(user, body.shop_id, db)

    db.get_service_client().table("pos_connections").update({
        "location_id":  body.location_id,
        "last_updated": datetime.utcnow().isoformat(),
    }).eq("shop_id", body.shop_id).eq("provider", "square").execute()

    return {"success": True, "location_id": body.location_id}


# ─────────────────────────────────────────────────────────────────────────────
# OFFERS — shop promotional offers shown on mobile home + shop screens
# ─────────────────────────────────────────────────────────────────────────────

class CreateOfferRequest(BaseModel):
    shop_id:        str
    title:          str
    description:    Optional[str] = None
    discount_type:  Optional[str] = None  # "percent" | "flat" | None
    discount_value: Optional[float] = None
    expires_at:     Optional[str] = None  # ISO datetime string
    is_active:      bool = True

    @validator("title")
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @validator("discount_type")
    def valid_discount_type(cls, v):
        if v and v not in ("percent", "flat"):
            raise ValueError("discount_type must be 'percent' or 'flat'")
        return v


class UpdateOfferRequest(BaseModel):
    title:          Optional[str]   = None
    description:    Optional[str]   = None
    discount_type:  Optional[str]   = None
    discount_value: Optional[float] = None
    expires_at:     Optional[str]   = None
    is_active:      Optional[bool]  = None


@router.get("/offers")
async def get_shop_offers(
    shop_id:  str = Query(...),
    active_only: bool = Query(False),
    db: SupabaseClient = Depends(get_supabase),
):
    """Public — mobile home screen and shop detail screen call this."""
    q = (
        db.get_service_client()
        .table("shop_offers")
        .select("*")
        .eq("shop_id", shop_id)
        .order("created_at", desc=True)
    )
    if active_only:
        now = datetime.utcnow().isoformat()
        q   = q.eq("is_active", True).or_(f"expires_at.is.null,expires_at.gte.{now}")

    result = q.execute()
    return {"offers": result.data or []}


@router.post("/offers")
async def create_offer(
    body: CreateOfferRequest,
    user: dict = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    _assert_shop_access(user, body.shop_id, db)

    row = {
        "shop_id":        body.shop_id,
        "title":          body.title,
        "description":    body.description,
        "discount_type":  body.discount_type,
        "discount_value": body.discount_value,
        "expires_at":     body.expires_at,
        "is_active":      body.is_active,
    }
    result = (
        db.get_service_client()
        .table("shop_offers")
        .insert(row)
        .select()
        .single()
        .execute()
    )
    return {"offer": result.data}


@router.patch("/offers/{offer_id}")
async def update_offer(
    offer_id: str,
    body: UpdateOfferRequest,
    user: dict = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    # Fetch to verify ownership
    existing = (
        db.get_service_client()
        .table("shop_offers")
        .select("shop_id")
        .eq("id", offer_id)
        .single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Offer not found")
    _assert_shop_access(user, existing["shop_id"], db)

    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.get_service_client()
        .table("shop_offers")
        .update(updates)
        .eq("id", offer_id)
        .select()
        .single()
        .execute()
    )
    return {"offer": result.data}


@router.delete("/offers/{offer_id}")
async def delete_offer(
    offer_id: str,
    user: dict = Depends(require_auth()),
    db: SupabaseClient = Depends(get_supabase),
):
    existing = (
        db.get_service_client()
        .table("shop_offers")
        .select("shop_id")
        .eq("id", offer_id)
        .single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Offer not found")
    _assert_shop_access(user, existing["shop_id"], db)

    db.get_service_client().table("shop_offers").delete().eq("id", offer_id).execute()
    return {"success": True}
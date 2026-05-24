"""
POS routes.

GET  /api/v1/pos/status     — get connection status + location info for a shop
GET  /api/v1/pos/locations  — list Square locations for a connected shop
POST /api/v1/pos/sync       — trigger catalog sync
GET  /api/v1/pos/readiness  — full readiness check (dashboard setup card)
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.database import get_supabase, SupabaseClient
from app.integrations.pos.registry import get_pos_adapters
from app.utils.security import require_auth, require_shop_owner
import logging

router = APIRouter(prefix="/api/v1/pos", tags=["pos"])
logger = logging.getLogger(__name__)


# ── GET /status — used by mobile checkout to get the shop's Square location_id
@router.get("/status")
async def get_pos_status(
    shop_id: str = Query(...),
    provider: str = Query("square"),
    db: SupabaseClient = Depends(get_supabase),
):
    """
    Returns POS connection status for a shop.
    Mobile checkout calls this to get location_id before rendering the Square card form.
    Web dashboard calls this to show connection details.
    """
    conn_resp = (
        db.get_service_client()
        .table("pos_connections")
        .select("provider, status, location_id, merchant_id, last_updated")
        .eq("shop_id", shop_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )

    if not conn_resp.data:
        return {
            "status":      "not_connected",
            "connected":   False,
            "location_id": None,
            "merchant_id": None,
            "last_updated": None,
        }

    conn         = conn_resp.data[0]
    is_connected = conn.get("status") == "connected"

    return {
        "status":       conn.get("status", "not_connected"),
        "connected":    is_connected,
        "location_id":  conn.get("location_id"),
        "merchant_id":  conn.get("merchant_id"),
        "last_updated": conn.get("last_updated"),
    }


# ── GET /readiness — full readiness check used by ShopOwnerDashboard setup card
@router.get("/readiness")
async def get_pos_readiness(
    shop_id: str = Query(...),
    db: SupabaseClient = Depends(get_supabase),
):
    """
    Returns full Square readiness state:
    - connected: Square OAuth connected
    - hasLocation: a location_id is set
    - merchantId: short merchant ID for display
    - locations: list of available locations (for picker)
    - ready: true only when connected + location set
    """
    conn_resp = (
        db.get_service_client()
        .table("pos_connections")
        .select("provider, status, location_id, merchant_id, access_token")
        .eq("shop_id", shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )

    if not conn_resp.data:
        return {
            "connected":   False,
            "hasLocation": False,
            "merchantId":  None,
            "locations":   [],
            "ready":       False,
        }

    conn         = conn_resp.data[0]
    is_connected = conn.get("status") == "connected"
    has_location = bool(conn.get("location_id"))

    locations = []
    if is_connected and conn.get("access_token"):
        try:
            adapters = get_pos_adapters()
            adapter  = adapters.get("square")
            if adapter:
                loc_list  = await adapter.list_locations(conn["access_token"])
                locations = [{"id": loc.id, "name": loc.name} for loc in loc_list]
        except Exception as e:
            logger.warning(f"[POS readiness] Could not fetch locations for {shop_id}: {e}")

    return {
        "connected":   is_connected,
        "hasLocation": has_location,
        "merchantId":  conn.get("merchant_id"),
        "locations":   locations,
        "ready":       is_connected and has_location,
    }


# ── GET /locations — list Square locations for a connected shop
@router.get("/locations")
async def list_locations(
    shop_id: str = Query(...),
    provider: str = Query(...),
    db: SupabaseClient = Depends(get_supabase),
):
    adapters = get_pos_adapters()
    adapter  = adapters.get(provider)
    if not adapter:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    conn_resp = (
        db.get_service_client()
        .table("pos_connections")
        .select("access_token, status")
        .eq("shop_id", shop_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )
    if not conn_resp.data or conn_resp.data[0].get("status") != "connected":
        raise HTTPException(status_code=400, detail="POS not connected")

    access_token = conn_resp.data[0].get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token stored")

    try:
        locations = await adapter.list_locations(access_token)
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        logger.error(f"[POS] list_locations failed for shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch locations from Square")

    return {"locations": [{"id": loc.id, "name": loc.name} for loc in locations]}
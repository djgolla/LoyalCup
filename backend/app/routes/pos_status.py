"""
GET /api/v1/pos/status  — current POS connection state for a shop
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase
from app.utils.security import require_auth
from app.integrations.square.adapter import SquareAdapter

router  = APIRouter()
logger  = logging.getLogger(__name__)
_square = SquareAdapter()


@router.get("/api/v1/pos/status")
async def pos_status(
    request: Request,
    db=Depends(get_supabase),
    user: dict = Depends(require_auth()),
):
    """
    Returns POS connection status for a shop.
    Query params: provider (required), shop_id (required)
    """
    provider = request.query_params.get("provider")
    shop_id  = request.query_params.get("shop_id")

    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider")
    if not shop_id:
        raise HTTPException(status_code=400, detail="Missing shop_id")

    user_id   = user.get("sub", "")
    user_role = (user.get("user_metadata") or {}).get("role", "")

    # FIXED: was db.service_client (AttributeError)
    svc = db.get_service_client()

    if user_role != "admin":
        shop_check = (
            svc.table("shops")
            .select("id")
            .eq("id", shop_id)
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
        )
        if not shop_check.data:
            raise HTTPException(status_code=403, detail="Not authorized for this shop")

    result = (
        svc.table("pos_connections")
        .select("id, status, merchant_id, location_id, token_expires_at, updated_at, access_token")
        .eq("shop_id", shop_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )

    if not result.data:
        return {
            "status":       "disconnected",
            "provider":     provider,
            "shop_id":      shop_id,
            "has_location": False,
            "locations":    [],
        }

    conn         = result.data[0]
    access_token = conn.get("access_token")

    locations = []
    if access_token and conn.get("status") == "connected":
        try:
            loc_objects = await _square.list_locations(access_token)
            locations = [{"id": l.id, "name": l.name} for l in loc_objects]
        except Exception as e:
            logger.warning(f"[POS Status] Could not fetch Square locations: {e}")

    return {
        "status":           conn.get("status", "disconnected"),
        "provider":         provider,
        "shop_id":          shop_id,
        "merchant_id":      conn.get("merchant_id"),
        "location_id":      conn.get("location_id"),
        "token_expires_at": conn.get("token_expires_at"),
        "last_updated":     conn.get("updated_at"),
        "has_location":     conn.get("location_id") is not None,
        "locations":        locations,
    }
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase

router = APIRouter()


@router.get("/api/v1/pos/status")
async def pos_status(request: Request, db=Depends(get_supabase)):
    """
    Returns the current POS connection status for a shop.
    Query params: provider (required), shop_id (required)
    """
    provider = request.query_params.get("provider")
    shop_id = request.query_params.get("shop_id")

    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider")
    if not shop_id:
        raise HTTPException(status_code=400, detail="Missing shop_id")

    result = db.service_client.table("pos_connections") \
        .select("id, status, merchant_id, location_id, token_expires_at, updated_at") \
        .eq("shop_id", shop_id) \
        .eq("provider", provider) \
        .limit(1) \
        .execute()

    if not result.data:
        return {"status": "disconnected", "provider": provider, "shop_id": shop_id}

    conn = result.data[0]
    return {
        "status": conn.get("status", "disconnected"),
        "provider": provider,
        "shop_id": shop_id,
        "merchant_id": conn.get("merchant_id"),
        "location_id": conn.get("location_id"),
        "token_expires_at": conn.get("token_expires_at"),
        "last_updated": conn.get("updated_at"),
        "has_location": conn.get("location_id") is not None,
    }
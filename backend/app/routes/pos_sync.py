"""
Manual POS menu re-sync endpoint.
Allows a shop owner to pull the latest menu from Square into LoyalCup
without going through the full OAuth flow again.
"""
import os
import httpx
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase
from app.integrations.square.sync import sync_square_catalog

router = APIRouter()
logger = logging.getLogger(__name__)

SQUARE_ENV = os.getenv("SQUARE_ENV", "sandbox")
SQUARE_API_BASE = (
    "https://connect.squareupsandbox.com/v2"
    if SQUARE_ENV == "sandbox"
    else "https://connect.squareup.com/v2"
)


@router.post("/api/v1/pos/sync")
async def pos_sync(request: Request, db=Depends(get_supabase)):
    """
    Re-sync a shop's menu from their connected POS.
    Body JSON: { "shop_id": "<uuid>", "provider": "square" }
    Requires shop owner to be authenticated (Authorization: Bearer <token>).
    """
    body = await request.json()
    shop_id = body.get("shop_id")
    provider = body.get("provider", "square")

    if not shop_id:
        raise HTTPException(status_code=400, detail="Missing shop_id")
    if provider != "square":
        raise HTTPException(status_code=400, detail="Only 'square' provider is currently supported")

    # Verify the requesting user owns this shop
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = auth_header.split("Bearer ", 1)[1].strip()

    try:
        user_resp = db.anon_client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")

    # Verify ownership
    shop = db.service_client.table("shops") \
        .select("id, owner_id") \
        .eq("id", shop_id) \
        .eq("owner_id", user.id) \
        .limit(1) \
        .execute()

    if not shop.data:
        raise HTTPException(status_code=403, detail="You do not own this shop.")

    # Load the stored access token
    conn = db.service_client.table("pos_connections") \
        .select("access_token, status, location_id") \
        .eq("shop_id", shop_id) \
        .eq("provider", provider) \
        .limit(1) \
        .execute()

    if not conn.data or conn.data[0].get("status") != "connected":
        raise HTTPException(
            status_code=400,
            detail="No active Square connection for this shop. Please connect Square first."
        )

    access_token = conn.data[0]["access_token"]

    # Fetch fresh catalog from Square
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Square-Version": "2024-03-21",
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            types = "CATEGORY,ITEM,ITEM_VARIATION,MODIFIER_LIST,IMAGE"
            catalog_resp = await client.get(
                f"{SQUARE_API_BASE}/catalog/list?types={types}",
                headers=headers,
            )
            catalog_resp.raise_for_status()
            catalog_objects = catalog_resp.json().get("objects", [])
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Square API error: {e.response.status_code} — {e.response.text}"
        )

    # Run the sync
    try:
        summary = await sync_square_catalog(
            shop_id=shop_id,
            catalog_objects=catalog_objects,
            db=db,
            source="square"
        )
    except Exception as e:
        logger.exception("Sync failed")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

    # Update last synced timestamp on the connection
    db.service_client.table("pos_connections") \
        .update({"last_synced_at": "now()"}) \
        .eq("shop_id", shop_id) \
        .eq("provider", provider) \
        .execute()

    return {
        "status": "success",
        "shop_id": shop_id,
        "provider": provider,
        "synced": summary,
    }
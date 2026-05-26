"""
Manual POS menu re-sync endpoint.
Allows a shop owner to pull the latest menu from Square into LoyalCup
without going through the full OAuth flow again.

Uses the Square token manager to auto-refresh expired tokens.
"""
import os
import httpx
import logging
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase
from app.integrations.square.sync import sync_square_catalog
from app.integrations.square.token_manager import (
    with_square_retry,
    SquareReauthRequired,
)

router = APIRouter()
logger = logging.getLogger(__name__)

SQUARE_ENV = os.getenv("SQUARE_ENV", "sandbox")
SQUARE_API_BASE = (
    "https://connect.squareupsandbox.com/v2"
    if SQUARE_ENV == "sandbox"
    else "https://connect.squareup.com/v2"
)


async def _fetch_catalog(access_token: str) -> list:
    """Pull the full Square catalog. Raises RuntimeError on 401 so the
    token manager can refresh and retry."""
    headers = {
        "Authorization":  f"Bearer {access_token}",
        "Square-Version": "2024-03-21",
    }
    types = "CATEGORY,ITEM,ITEM_VARIATION,MODIFIER_LIST,IMAGE"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            f"{SQUARE_API_BASE}/catalog/list?types={types}",
            headers=headers,
        )
        if resp.status_code == 401:
            raise RuntimeError(f"Square API 401: {resp.text}")
        if resp.status_code != 200:
            raise RuntimeError(f"Square catalog fetch failed {resp.status_code}: {resp.text}")
        return resp.json().get("objects", []) or []


@router.post("/api/v1/pos/sync")
async def pos_sync(request: Request, db=Depends(get_supabase)):
    """
    Re-sync a shop's menu from their connected POS.
    Body JSON: { "shop_id": "<uuid>", "provider": "square" }
    Requires shop owner to be authenticated (Authorization: Bearer <token>).
    """
    body     = await request.json()
    shop_id  = body.get("shop_id")
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
        user      = user_resp.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")

    # Verify ownership
    shop = (
        db.service_client.table("shops")
        .select("id, owner_id")
        .eq("id", shop_id)
        .eq("owner_id", user.id)
        .limit(1)
        .execute()
    )
    if not shop.data:
        raise HTTPException(status_code=403, detail="You do not own this shop.")

    # Fetch fresh catalog from Square with auto-refresh on 401
    try:
        catalog_objects = await with_square_retry(
            db, shop_id,
            _fetch_catalog,
        )
    except SquareReauthRequired:
        raise HTTPException(
            status_code=401,
            detail="Square connection expired. Please reconnect Square to continue.",
        )
    except Exception as e:
        logger.error(f"[POS Sync] Catalog fetch failed for {shop_id}: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Square API error: {str(e)}",
        )

    # Run the sync
    try:
        summary = await sync_square_catalog(
            shop_id=shop_id,
            catalog_objects=catalog_objects,
            db=db,
            source="square",
        )
    except Exception as e:
        logger.error(f"[POS Sync] Sync failed for {shop_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

    # Bump last_synced_at
    try:
        db.service_client.table("pos_connections").update({
            "last_synced_at": datetime.utcnow().isoformat()
        }).eq("shop_id", shop_id).eq("provider", provider).execute()
    except Exception as e:
        logger.warning(f"[POS Sync] Failed to update last_synced_at: {e}")

    return {
        "success":               True,
        "items_synced":          summary.get("items_synced", 0),
        "categories_synced":     summary.get("categories_synced", 0),
        "modifier_groups_synced": summary.get("modifier_groups_synced", 0),
        **summary,
    }
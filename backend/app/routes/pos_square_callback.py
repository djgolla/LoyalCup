import base64
import json
import os
import uuid
import httpx
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse

from app.integrations.square.adapter import SquareAdapter
from app.integrations.square.sync import sync_square_catalog
from app.database import get_supabase

router = APIRouter()

SQUARE_ENV = os.getenv("SQUARE_ENV", "sandbox")
SQUARE_API_BASE = (
    "https://connect.squareupsandbox.com/v2"
    if SQUARE_ENV == "sandbox"
    else "https://connect.squareup.com/v2"
)

from app.config import settings
FRONTEND_BASE = settings.frontend_url

async def fetch_square_merchant_and_catalog(access_token: str):
    """Fetch merchant profile + full catalog from Square."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Square-Version": "2024-03-21",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        # Merchant info
        merchant_resp = await client.get(
            f"{SQUARE_API_BASE}/merchants/me", headers=headers
        )
        merchant_resp.raise_for_status()
        merchant = merchant_resp.json().get("merchant", {})

        # Full catalog: categories, items, variations, modifier lists, images
        types = "CATEGORY,ITEM,ITEM_VARIATION,MODIFIER_LIST,IMAGE"
        catalog_resp = await client.get(
            f"{SQUARE_API_BASE}/catalog/list?types={types}",
            headers=headers,
        )
        catalog_resp.raise_for_status()
        catalog_objects = catalog_resp.json().get("objects", [])

    return merchant, catalog_objects


@router.get("/api/v1/pos/square/callback")
async def square_callback(request: Request, db=Depends(get_supabase)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing auth code or state.")

    # Decode state — must contain a real shop_id
    try:
        state_json = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid state param: {str(e)}")

    shop_id_raw = state_json.get("shop_id")
    try:
        shop_id = str(uuid.UUID(shop_id_raw))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid shop_id in state param. Please reconnect from your dashboard."
        )

    # Build redirect_uri from actual callback URL (strip query string)
    redirect_uri = str(request.url).split("?")[0]

    # Exchange authorization code for tokens
    adapter = SquareAdapter()
    tokens = await adapter.exchange_code_for_tokens(code, redirect_uri)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    token_expiry = tokens.get("expires_at")

    if not access_token:
        raise HTTPException(status_code=400, detail="Square did not return an access token.")

    # Fetch merchant profile + full catalog
    try:
        merchant, catalog_objects = await fetch_square_merchant_and_catalog(access_token)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch Square merchant/catalog data: {str(e)}"
        )

    merchant_id = merchant.get("id")

    # Upsert shop info with Square merchant data
    client = db.service_client
    shop_update = {
        "square_merchant_id": merchant_id,
    }
    # Only update name/logo if they look like defaults (don't overwrite manual customizations)
    existing_shop = client.table("shops").select("name, logo_url").eq("id", shop_id).limit(1).execute()
    if existing_shop.data:
        existing = existing_shop.data[0]
        if not existing.get("logo_url") and merchant.get("logo_url"):
            shop_update["logo_url"] = merchant.get("logo_url")

    client.table("shops").update(shop_update).eq("id", shop_id).execute()

    # Upsert pos_connection — one row per shop+provider, update on reconnect
    existing_conn = client.table("pos_connections") \
        .select("id") \
        .eq("shop_id", shop_id) \
        .eq("provider", "square") \
        .limit(1) \
        .execute()

    conn_payload = {
        "shop_id": shop_id,
        "provider": "square",
        "status": "connected",
        "merchant_id": merchant_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expires_at": token_expiry,
        "location_id": None,  # Will be set via /set-location after locations list shown
    }

    if existing_conn.data:
        client.table("pos_connections") \
            .update(conn_payload) \
            .eq("id", existing_conn.data[0]["id"]) \
            .execute()
    else:
        client.table("pos_connections").insert(conn_payload).execute()

    # --- THIS IS THE PREVIOUSLY MISSING PIECE ---
    # Sync the full Square catalog into LoyalCup's menu tables
    try:
        sync_summary = await sync_square_catalog(
            shop_id=shop_id,
            catalog_objects=catalog_objects,
            db=db,
            source="square"
        )
    except Exception as e:
        # Log but don't fail the whole connect — they can re-sync later
        import traceback
        traceback.print_exc()
        sync_summary = {"error": str(e)}

    # Redirect to frontend connect-square page with success status
    # The frontend will read ?status=connected&synced=true and show success UI
    synced = "true" if "error" not in sync_summary else "partial"
    items_count = sync_summary.get("items_synced", 0)
    frontend_url = (
        f"{FRONTEND_BASE}/shop-owner/connect-square"
        f"?status=connected&synced={synced}&items={items_count}"
    )
    return RedirectResponse(url=frontend_url)


def register(app):
    app.include_router(router)
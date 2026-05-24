"""
GET /api/v1/pos/square/callback

Square OAuth callback. Exchanges code for tokens, fetches catalog,
syncs catalog into LoyalCup, then redirects to frontend.
"""
import base64
import json
import logging
import uuid
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse

from app.integrations.square.adapter import SquareAdapter
from app.integrations.square.sync import sync_square_catalog
from app.database import get_supabase
from app.config import settings

router  = APIRouter()
logger  = logging.getLogger(__name__)
_square = SquareAdapter()


@router.get("/api/v1/pos/square/callback")
async def square_callback(request: Request, db=Depends(get_supabase)):
    code  = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")

    frontend_base = settings.frontend_url

    if error:
        logger.warning(f"[Square Callback] OAuth error from Square: {error}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason={error}"
        )

    if not code or not state:
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=missing_params"
        )

    try:
        state_json = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
    except Exception as e:
        logger.error(f"[Square Callback] Invalid state param: {e}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=invalid_state"
        )

    shop_id_raw = state_json.get("shop_id")
    try:
        shop_id = str(uuid.UUID(shop_id_raw))
    except Exception:
        logger.error(f"[Square Callback] Invalid shop_id in state: {shop_id_raw}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=invalid_shop"
        )

    try:
        tokens = await _square.exchange_code_for_tokens(
            code=code,
            redirect_uri=settings.square_callback_url,
        )
    except Exception as e:
        logger.error(f"[Square Callback] Token exchange failed: {e}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=token_exchange_failed"
        )

    access_token  = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    token_expiry  = tokens.get("expires_at")
    merchant_id   = tokens.get("merchant_id")

    if not access_token:
        logger.error("[Square Callback] No access_token in Square response")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=no_access_token"
        )

    if not merchant_id:
        try:
            import httpx
            from app.integrations.square.adapter import _square_api
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"{_square_api()}/merchants/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code == 200:
                    merchant_id = resp.json().get("merchant", {}).get("id")
        except Exception as e:
            logger.warning(f"[Square Callback] Could not fetch merchant profile: {e}")

    try:
        locations = await _square.list_locations(access_token)
    except Exception as e:
        logger.warning(f"[Square Callback] Could not list locations: {e}")
        locations = []

    auto_location_id = locations[0].id if len(locations) == 1 else None

    # ── FIXED: was db.service_client (AttributeError) ──────────────────────
    svc = db.get_service_client()

    existing_conn = (
        svc.table("pos_connections")
        .select("id")
        .eq("shop_id", shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )

    conn_payload = {
        "shop_id":          shop_id,
        "provider":         "square",
        "status":           "connected",
        "merchant_id":      merchant_id,
        "access_token":     access_token,
        "refresh_token":    refresh_token,
        "token_expires_at": token_expiry,
        "location_id":      auto_location_id,
    }

    if existing_conn.data:
        svc.table("pos_connections").update(conn_payload).eq(
            "id", existing_conn.data[0]["id"]
        ).execute()
    else:
        svc.table("pos_connections").insert(conn_payload).execute()

    svc.table("shops").update({"square_merchant_id": merchant_id}).eq("id", shop_id).execute()

    sync_summary: dict = {}
    items_count = 0
    try:
        snapshot = await _square.fetch_catalog(access_token)
        catalog_objects = []
        for cat in snapshot.categories:
            catalog_objects.append(cat.raw)
        for item in snapshot.items:
            catalog_objects.append(item.raw)
        for ms in snapshot.modifier_sets:
            catalog_objects.append(ms.raw)

        sync_summary = await sync_square_catalog(
            shop_id=shop_id,
            catalog_objects=catalog_objects,
            db=db,
            source="square",
            images_by_id=snapshot.images_by_id if hasattr(snapshot, "images_by_id") else None,
        )
        items_count = sync_summary.get("items_synced", 0)
        logger.info(f"[Square Callback] Catalog sync complete: {sync_summary}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"[Square Callback] Catalog sync failed: {e}")
        sync_summary = {"error": str(e)}

    synced = "true" if "error" not in sync_summary else "partial"

    location_param = ""
    if len(locations) > 1:
        location_param = "&needs_location=true"
    elif auto_location_id:
        location_param = f"&location_id={auto_location_id}"

    return RedirectResponse(
        url=(
            f"{frontend_base}/shop-owner/connect-square"
            f"?status=connected&synced={synced}&items={items_count}"
            f"{location_param}"
        )
    )


def register(app):
    app.include_router(router)
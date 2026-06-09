"""
GET /api/v1/pos/square/callback

Square OAuth callback. Exchanges code for tokens, fetches catalog,
syncs catalog into LoyalCup, then redirects to frontend.

SECURITY:
The state param must be signed by our backend. The callback also verifies
that the signed owner_id still owns the signed shop_id before storing tokens.
"""
import base64
import hashlib
import hmac
import json
import logging
import uuid
from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse

from app.integrations.square.adapter import SquareAdapter
from app.integrations.square.sync import sync_square_catalog
from app.database import get_supabase
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
_square = SquareAdapter()


def _decode_signed_state(state: str) -> dict:
    decoded = json.loads(base64.urlsafe_b64decode(state.encode()).decode())

    if "payload" not in decoded or "sig" not in decoded:
        raise ValueError("Missing signed state fields")

    payload = decoded["payload"]
    sig = decoded["sig"]

    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    expected = hmac.new(settings.jwt_secret.encode(), raw, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(sig, expected):
        raise ValueError("Invalid OAuth state signature")

    return payload


@router.get("/api/v1/pos/square/callback")
async def square_callback(request: Request, db=Depends(get_supabase)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")

    frontend_base = settings.frontend_url

    if error:
        logger.warning(f"[Square Callback] OAuth error from Square: {error}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=square_oauth_error"
        )

    if not code or not state:
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=missing_params"
        )

    try:
        state_payload = _decode_signed_state(state)
    except Exception as e:
        logger.error(f"[Square Callback] Invalid signed state param: {e}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=invalid_state"
        )

    shop_id_raw = state_payload.get("shop_id")
    owner_id = state_payload.get("owner_id")

    try:
        shop_id = str(uuid.UUID(shop_id_raw))
    except Exception:
        logger.error(f"[Square Callback] Invalid shop_id in state: {shop_id_raw}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=invalid_shop"
        )

    if not owner_id:
        logger.error("[Square Callback] Missing owner_id in signed state")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=invalid_owner"
        )

    svc = db.get_service_client()

    shop_check = (
        svc.table("shops")
        .select("id, owner_id")
        .eq("id", shop_id)
        .eq("owner_id", owner_id)
        .limit(1)
        .execute()
    )

    if not shop_check.data:
        logger.error(f"[Square Callback] Owner/shop mismatch owner={owner_id} shop={shop_id}")
        return RedirectResponse(
            url=f"{frontend_base}/shop-owner/connect-square?status=error&reason=not_authorized"
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

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    token_expiry = tokens.get("expires_at")
    merchant_id = tokens.get("merchant_id")

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

    existing_conn = (
        svc.table("pos_connections")
        .select("id")
        .eq("shop_id", shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )

    conn_payload = {
        "shop_id": shop_id,
        "provider": "square",
        "status": "connected",
        "merchant_id": merchant_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expires_at": token_expiry,
        "location_id": auto_location_id,
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
        logger.error(f"[Square Callback] Catalog sync failed: {e}", exc_info=True)
        sync_summary = {"error": "catalog_sync_failed"}

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
"""
Manual POS menu re-sync endpoint.
Allows a shop owner to pull the latest menu from Square into LoyalCup
without going through the full OAuth flow again.

Uses the Square token manager to auto-refresh expired tokens.

IMPORTANT: All env / API base resolution goes through the SquareAdapter
so we can NEVER have an OAuth-vs-sync env mismatch (which would 401 and
falsely flip the connection to reauth_required).
"""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase
from app.integrations.square.adapter import SquareAdapter
from app.integrations.square.sync import sync_square_catalog
from app.integrations.square.token_manager import (
    with_square_retry,
    SquareReauthRequired,
)

router  = APIRouter()
logger  = logging.getLogger(__name__)
_square = SquareAdapter()


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

    # ── Auth ─────────────────────────────────────────────────────────────
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

    # ── Ownership ────────────────────────────────────────────────────────
    shop_row = (
        db.service_client.table("shops")
        .select("id, owner_id")
        .eq("id", shop_id)
        .eq("owner_id", user.id)
        .limit(1)
        .execute()
    )
    if not shop_row.data:
        raise HTTPException(status_code=403, detail="You do not own this shop.")

    logger.info(f"[POS Sync] Starting sync for shop {shop_id} (user {user.id})")

    # ── Fetch catalog via the SAME adapter the OAuth callback uses ──────
    #
    # This guarantees we hit the same Square env (sandbox vs prod) the
    # token was issued for. Mismatched envs cause silent 401s which the
    # token manager then misinterprets as "refresh failed" and flips the
    # row to reauth_required — that was the loop you were seeing.
    try:
        snapshot = await with_square_retry(
            db, shop_id,
            lambda access_token: _square.fetch_catalog(access_token),
        )
    except SquareReauthRequired as e:
        logger.warning(f"[POS Sync] Reauth required for shop {shop_id}: {e}")
        raise HTTPException(
            status_code=401,
            detail="Square connection expired. Please reconnect Square to continue.",
        )
    except Exception as e:
        logger.error(f"[POS Sync] Catalog fetch failed for {shop_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Square API error: {str(e)}",
        )

    # Flatten snapshot back into raw catalog objects for the syncer.
    catalog_objects = []
    for cat in snapshot.categories:
        catalog_objects.append(cat.raw)
    for item in snapshot.items:
        catalog_objects.append(item.raw)
    for ms in snapshot.modifier_sets:
        catalog_objects.append(ms.raw)

    logger.info(
        f"[POS Sync] Square returned for shop {shop_id}: "
        f"{len(snapshot.categories)} categories, "
        f"{len(snapshot.items)} items, "
        f"{len(snapshot.modifier_sets)} modifier sets, "
        f"{len(snapshot.images_by_id or {})} images"
    )

    # ── Sync into LoyalCup tables ───────────────────────────────────────
    try:
        summary = await sync_square_catalog(
            shop_id=shop_id,
            catalog_objects=catalog_objects,
            db=db,
            source="square",
            images_by_id=snapshot.images_by_id if hasattr(snapshot, "images_by_id") else None,
        )
    except Exception as e:
        logger.error(f"[POS Sync] DB upsert failed for {shop_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

    logger.info(f"[POS Sync] Done for shop {shop_id}: {summary}")

    # ── Bump last_synced_at + clear any stale reauth flag ───────────────
    try:
        db.service_client.table("pos_connections").update({
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "status":         "connected",
        }).eq("shop_id", shop_id).eq("provider", provider).execute()
    except Exception as e:
        logger.warning(f"[POS Sync] Failed to update last_synced_at: {e}")

    # If Square gave us nothing, surface that loud and clear so the UI
    # can show a real message instead of "Sync complete · 0 items".
    if (
        summary.get("items_synced", 0) == 0
        and summary.get("categories_synced", 0) == 0
    ):
        return {
            "success":      False,
            "warning":      "Square returned no menu items for this account. "
                            "Add items in Square Dashboard, or confirm you OAuth'd "
                            "into the correct Square account / environment.",
            **summary,
        }

    return {
        "success":               True,
        "items_synced":          summary.get("items_synced", 0),
        "categories_synced":     summary.get("categories_synced", 0),
        "modifier_groups_synced": summary.get("modifier_groups_synced", 0),
        **summary,
    }


def register(app):
    app.include_router(router)
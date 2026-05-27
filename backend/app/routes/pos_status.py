"""
GET /api/v1/pos/status  — current POS connection state for a shop

Uses the token manager to auto-refresh expired Square tokens,
and surfaces a `needs_reauth` flag so the frontend can prompt
the shop owner to reconnect if refresh also fails.

Self-healing: if the DB row is marked `reauth_required` but the
stored tokens are actually still valid (e.g. row got stuck after a
transient Square 401), we try Square once. If Square accepts the
token, we flip the row back to `connected` automatically.
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase
from app.utils.security import require_auth
from app.integrations.square.adapter import SquareAdapter
from app.integrations.square.token_manager import (
    with_square_retry,
    SquareReauthRequired,
)

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

    svc = db.get_service_client()

    # Authorization: admin can read any shop; otherwise must own this shop.
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
        .select(
            "id, status, merchant_id, location_id, "
            "token_expires_at, updated_at, "
            "access_token, refresh_token"
        )
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
            "merchant_id":  None,
            "location_id":  None,
            "has_location": False,
            "needs_reauth": False,
            "last_updated": None,
            "locations":    [],
            "error":        None,
        }

    conn      = result.data[0]
    db_status = conn.get("status", "disconnected")

    locations    = []
    needs_reauth = db_status == "reauth_required"
    error_msg    = None

    # ------------------------------------------------------------------
    # Decide whether to actually hit Square to (a) load locations and
    # (b) self-heal a stale `reauth_required` flag.
    #
    # We hit Square if:
    #   - provider is square, AND
    #   - status is `connected`, OR
    #   - status is `reauth_required` BUT we still have tokens that
    #     might be valid (i.e. we have access_token or refresh_token).
    #     This is the self-healing path.
    # ------------------------------------------------------------------
    should_try_square = provider == "square" and (
        db_status == "connected"
        or (
            db_status == "reauth_required"
            and (conn.get("access_token") or conn.get("refresh_token"))
        )
    )

    if should_try_square:
        try:
            loc_objects = await with_square_retry(
                db, shop_id,
                lambda token: _square.list_locations(token),
            )
            locations = [{"id": l.id, "name": l.name} for l in loc_objects]

            # Self-heal: if Square just accepted our token but the row
            # was stuck on `reauth_required`, flip it back to connected.
            if db_status != "connected":
                try:
                    svc.table("pos_connections").update({
                        "status": "connected",
                    }).eq("id", conn["id"]).execute()
                    logger.info(
                        f"[POS Status] Self-healed shop {shop_id}: "
                        f"{db_status} -> connected"
                    )
                except Exception as e:
                    logger.warning(
                        f"[POS Status] Could not self-heal status for "
                        f"shop {shop_id}: {e}"
                    )
                db_status    = "connected"
                needs_reauth = False
                error_msg    = None

        except SquareReauthRequired as e:
            logger.warning(
                f"[POS Status] Square reauth required for shop {shop_id}: {e}"
            )
            needs_reauth = True
            db_status    = "reauth_required"
            error_msg    = "Square connection expired. Please reconnect Square."
        except Exception as e:
            logger.warning(
                f"[POS Status] Could not fetch Square locations for "
                f"shop {shop_id}: {e}"
            )
            error_msg = "Could not load Square locations. Try again or reconnect."

    return {
        "status":           db_status,
        "provider":         provider,
        "shop_id":          shop_id,
        "merchant_id":      conn.get("merchant_id"),
        "location_id":      conn.get("location_id"),
        "token_expires_at": conn.get("token_expires_at"),
        "last_updated":     conn.get("updated_at"),
        "has_location":     conn.get("location_id") is not None,
        "needs_reauth":     needs_reauth,
        "locations":        locations,
        "error":            error_msg,
    }


def register(app):
    app.include_router(router)
"""
GET /api/v1/pos/status  — current POS connection state for a shop

Owner/admin callers get full POS connection status + Square locations.

Customer/non-owner callers get a safe checkout-ready response only:
  status, provider, shop_id, location_id, has_location, needs_reauth, error

This lets mobile checkout verify that a shop can accept Square payments
without exposing access tokens, refresh tokens, or owner-only Square settings.
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from app.database import get_supabase
from app.utils.security import require_auth, get_user_role
from app.integrations.square.adapter import SquareAdapter
from app.integrations.square.token_manager import (
    with_square_retry,
    SquareReauthRequired,
)

router = APIRouter()
logger = logging.getLogger(__name__)
_square = SquareAdapter()


@router.get("/api/v1/pos/status")
async def pos_status(
    request: Request,
    db=Depends(get_supabase),
    user: dict = Depends(require_auth()),
):
    """
    Returns POS connection status for a shop.

    Query params:
      provider=square
      shop_id=<uuid>

    Owners/admins get full Square status.
    Customers/non-owners get only payment-readiness data needed for checkout.
    """
    provider = request.query_params.get("provider")
    shop_id = request.query_params.get("shop_id")

    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider")
    if not shop_id:
        raise HTTPException(status_code=400, detail="Missing shop_id")
    if provider != "square":
        raise HTTPException(status_code=400, detail="Only square is currently supported")

    user_id = user.get("sub", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    svc = db.get_service_client()

    # Resolve role, but do not let a missing/broken profile crash checkout
    # into a fake "payments not setup" state without a useful backend log.
    try:
        user_role = get_user_role(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"[POS Status] Could not resolve role for user {user_id}: {e}")
        user_role = "customer"

    # Check whether this user owns the shop.
    is_owner = False
    shop_check = (
        svc.table("shops")
        .select("id, owner_id, status")
        .eq("id", shop_id)
        .limit(1)
        .execute()
    )

    if not shop_check.data:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop = shop_check.data[0]
    if shop.get("owner_id") == user_id:
        is_owner = True

    is_admin = user_role == "admin"
    can_see_full_pos_details = is_admin or is_owner

    # Pull POS connection.
    # Owners/admins need tokens so token manager can refresh/self-heal.
    # Customers should NEVER receive or require tokens.
    select_fields = (
        "id, status, merchant_id, location_id, "
        "token_expires_at, updated_at, access_token, refresh_token"
        if can_see_full_pos_details
        else "id, status, merchant_id, location_id, token_expires_at, updated_at"
    )

    result = (
        svc.table("pos_connections")
        .select(select_fields)
        .eq("shop_id", shop_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )

    if not result.data:
        return {
            "status": "disconnected",
            "provider": provider,
            "shop_id": shop_id,
            "merchant_id": None if can_see_full_pos_details else None,
            "location_id": None,
            "token_expires_at": None if can_see_full_pos_details else None,
            "last_updated": None,
            "has_location": False,
            "needs_reauth": False,
            "locations": [] if can_see_full_pos_details else [],
            "error": None,
        }

    conn = result.data[0]
    db_status = conn.get("status", "disconnected")
    location_id = conn.get("location_id")

    # Customer/non-owner path:
    # Mobile checkout only needs this location_id. Do not hit Square, do not
    # return tokens, do not require shop ownership.
    if not can_see_full_pos_details:
        needs_reauth = db_status == "reauth_required"
        error_msg = None

        if db_status != "connected":
            error_msg = "Square is not connected for this shop."
        elif not location_id:
            error_msg = "Square location is not set for this shop."

        return {
            "status": db_status,
            "provider": provider,
            "shop_id": shop_id,
            "merchant_id": None,
            "location_id": location_id if db_status == "connected" else None,
            "token_expires_at": None,
            "last_updated": conn.get("updated_at"),
            "has_location": location_id is not None,
            "needs_reauth": needs_reauth,
            "locations": [],
            "error": error_msg,
        }

    # Owner/admin path:
    # Full status + Square locations + token self-healing.
    locations = []
    needs_reauth = db_status == "reauth_required"
    error_msg = None

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
                db,
                shop_id,
                lambda token: _square.list_locations(token),
            )
            locations = [{"id": l.id, "name": l.name} for l in loc_objects]

            # Self-heal: if Square accepted our token but the row was stale.
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

                db_status = "connected"
                needs_reauth = False
                error_msg = None

        except SquareReauthRequired as e:
            logger.warning(f"[POS Status] Square reauth required for shop {shop_id}: {e}")
            needs_reauth = True
            db_status = "reauth_required"
            error_msg = "Square connection expired. Please reconnect Square."

        except Exception as e:
            logger.warning(f"[POS Status] Could not fetch Square locations for shop {shop_id}: {e}")
            error_msg = "Could not load Square locations. Try again or reconnect."

    return {
        "status": db_status,
        "provider": provider,
        "shop_id": shop_id,
        "merchant_id": conn.get("merchant_id"),
        "location_id": conn.get("location_id"),
        "token_expires_at": conn.get("token_expires_at"),
        "last_updated": conn.get("updated_at"),
        "has_location": conn.get("location_id") is not None,
        "needs_reauth": needs_reauth,
        "locations": locations,
        "error": error_msg,
    }


def register(app):
    app.include_router(router)
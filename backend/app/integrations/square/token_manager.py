"""
Square token manager — handles auto-refresh of expired access tokens.

Square access tokens expire after 30 days. Refresh tokens last much longer
but can also be revoked. This module wraps Square API calls so they
transparently refresh on 401 / near-expiry.

If refresh also fails, the connection is marked status='reauth_required'
and callers see SquareReauthRequired so the UI can prompt the owner.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Callable, Any, Awaitable

from app.integrations.square.adapter import SquareAdapter

logger  = logging.getLogger(__name__)
_square = SquareAdapter()


class SquareReauthRequired(Exception):
    """Raised when Square auth is dead and shop owner must reconnect."""
    pass


def _parse_expiry(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _mark_reauth(svc, shop_id: str) -> None:
    try:
        svc.table("pos_connections").update({
            "status": "reauth_required",
        }).eq("shop_id", shop_id).eq("provider", "square").execute()
        logger.warning(f"[Square TokenMgr] Marked shop {shop_id} as reauth_required")
    except Exception as e:
        logger.warning(f"[Square TokenMgr] Could not mark reauth_required for {shop_id}: {e}")


async def _refresh_and_store(svc, conn: dict) -> Optional[str]:
    """Refresh the token via Square and persist. Returns new access_token or None on failure."""
    refresh_token = conn.get("refresh_token")
    if not refresh_token:
        return None
    try:
        new_tokens = await _square.refresh_access_token(refresh_token)
    except Exception as e:
        logger.warning(f"[Square TokenMgr] Refresh failed for shop {conn.get('shop_id')}: {e}")
        return None

    new_access = new_tokens.get("access_token")
    if not new_access:
        return None

    try:
        svc.table("pos_connections").update({
            "access_token":     new_access,
            "refresh_token":    new_tokens.get("refresh_token", refresh_token),
            "token_expires_at": new_tokens.get("expires_at"),
            "status":           "connected",
        }).eq("id", conn["id"]).execute()
        logger.info(f"[Square TokenMgr] Refreshed token for shop {conn.get('shop_id')}")
    except Exception as e:
        logger.error(f"[Square TokenMgr] Failed to persist refreshed token: {e}")
        # Even if persist fails, return the fresh token so the current request succeeds.

    return new_access


async def get_valid_square_token(db, shop_id: str) -> str:
    """
    Returns a valid Square access token for a shop, refreshing proactively
    if the stored token is expired or near expiry.

    Raises SquareReauthRequired if there is no usable token (no connection,
    status not 'connected', no refresh token, or refresh failed).
    """
    svc  = db.get_service_client()
    resp = (
        svc.table("pos_connections")
        .select("id, shop_id, status, access_token, refresh_token, token_expires_at")
        .eq("shop_id", shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise SquareReauthRequired("No Square connection for this shop")
    conn = resp.data[0]

    if conn.get("status") != "connected":
        raise SquareReauthRequired(f"Square connection status: {conn.get('status')}")

    access_token = conn.get("access_token")
    expires_at   = _parse_expiry(conn.get("token_expires_at"))

    # If we know expiry and it's > 5 min away, use the stored token.
    if access_token and expires_at and expires_at > datetime.now(timezone.utc) + timedelta(minutes=5):
        return access_token

    # Token missing / expired / near-expiry / unknown expiry — try refresh.
    new_access = await _refresh_and_store(svc, conn)
    if new_access:
        return new_access

    # Last resort: if refresh failed but we still have a stored access_token,
    # return it. with_square_retry will catch 401 and retry refresh if needed.
    if access_token:
        return access_token

    _mark_reauth(svc, shop_id)
    raise SquareReauthRequired("No usable Square access token; refresh failed")


async def with_square_retry(
    db,
    shop_id: str,
    fn: Callable[[str], Awaitable[Any]],
) -> Any:
    """
    Run a Square API call with auto-refresh on 401.

    fn is an async function that receives an access_token and returns the result.

    Example:
        result = await with_square_retry(
            db, shop_id,
            lambda token: _square.list_locations(token),
        )
    """
    token = await get_valid_square_token(db, shop_id)

    try:
        return await fn(token)
    except RuntimeError as e:
        msg = str(e)
        if "401" not in msg and "UNAUTHORIZED" not in msg.upper():
            raise

    # 401 hit — force a refresh and retry once.
    logger.info(f"[Square TokenMgr] Got 401 for shop {shop_id}, forcing refresh")
    svc  = db.get_service_client()
    resp = (
        svc.table("pos_connections")
        .select("id, shop_id, status, access_token, refresh_token, token_expires_at")
        .eq("shop_id", shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise SquareReauthRequired("No Square connection for this shop")
    conn = resp.data[0]

    new_access = await _refresh_and_store(svc, conn)
    if not new_access:
        _mark_reauth(svc, shop_id)
        raise SquareReauthRequired("Square refresh failed — reconnect required")

    try:
        return await fn(new_access)
    except RuntimeError as e:
        msg = str(e)
        if "401" in msg or "UNAUTHORIZED" in msg.upper():
            _mark_reauth(svc, shop_id)
            raise SquareReauthRequired("Square still rejecting after refresh — reconnect required")
        raise
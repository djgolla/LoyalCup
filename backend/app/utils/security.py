"""
Security utilities for JWT validation and role-based access control.

IMPORTANT: Authorization roles are ALWAYS read from profiles.role in the
database — NEVER from the JWT's user_metadata, which is editable by the user
and would allow privilege escalation (a customer setting their own role to
"admin"). profiles.role can only be changed by an admin via the service-role
key, so it is the single source of truth for authorization.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import settings
from app.database import get_supabase

security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify a JWT access token issued by Supabase Auth.
    Supabase JWT secrets are plain strings — do NOT base64-decode them.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        # Do not leak internal error details to the caller.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_role(user_id: str) -> str:
    """
    Single source of truth for a user's authorization role: profiles.role.

    Also enforces account status — a suspended user is rejected everywhere
    that goes through a role check.

    Returns the role string (e.g. "customer", "shop_worker", "shop_owner",
    "admin"). Raises 403 if no profile exists or the account is suspended.
    """
    db = get_supabase()
    resp = (
        db.get_service_client()
        .table("profiles")
        .select("role, status")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this user",
        )

    profile = resp.data[0]
    if profile.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended",
        )

    return profile.get("role", "customer")


def require_auth():
    """Dependency: requires a valid token with a user id (sub)."""
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        return token_payload
    return dependency


def require_role(*allowed_roles: str):
    """
    Dependency factory: requires the authenticated user's DB role to be one
    of `allowed_roles`. The resolved role is attached to the returned payload
    as `db_role` for convenience in route handlers.
    """
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        role = get_user_role(user_id)  # ← DB lookup, NOT user_metadata
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(allowed_roles)}",
            )

        token_payload["db_role"] = role
        return token_payload
    return dependency


def require_admin():
    return require_role("admin")


def require_shop_owner(shop_id: Optional[str] = None):
    return require_role("shop_owner", "admin")


def require_shop_worker(shop_id: Optional[str] = None):
    return require_role("shop_worker", "shop_owner", "admin")
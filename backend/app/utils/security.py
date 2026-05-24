"""
Security utilities for JWT validation and role-based access control.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings

security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token from Supabase Auth.
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
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_auth():
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        return token_payload
    return dependency


def require_role(required_role: str):
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_role = token_payload.get("user_metadata", {}).get("role", "customer")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}",
            )
        return token_payload
    return dependency


def require_admin():
    return require_role("admin")


def require_shop_owner(shop_id: Optional[str] = None):
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_role = token_payload.get("user_metadata", {}).get("role", "customer")
        if user_role not in ["shop_owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions. Must be shop owner or admin.",
            )
        return token_payload
    return dependency


def require_shop_worker(shop_id: Optional[str] = None):
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_role = token_payload.get("user_metadata", {}).get("role", "customer")
        if user_role not in ["shop_worker", "shop_owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions. Must be shop worker, owner, or admin.",
            )
        return token_payload
    return dependency
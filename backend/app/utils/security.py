"""
Security utilities for JWT validation and role-based access control.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()


def get_jwt_secret() -> str:
    """Get Supabase JWT secret from environment."""
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise ValueError("SUPABASE_JWT_SECRET environment variable is required")
    return secret


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token from Supabase Auth.
    Returns the decoded token payload.
    
    Note: Audience verification is disabled because Supabase uses role-based
    authentication where the audience field may vary. Role verification is
    handled separately through the role-based access control functions.
    """
    try:
        token = credentials.credentials
        jwt_secret = get_jwt_secret()
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}  # Disabled for Supabase compatibility
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_auth():
    """
    Dependency to require any authenticated user.
    Returns the user payload from the JWT token.
    """
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        return token_payload
    return dependency


def require_role(required_role: str):
    """
    Dependency to require a specific role.
    Returns the user payload if they have the required role.
    """
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_role = token_payload.get("user_metadata", {}).get("role", "customer")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )
        return token_payload
    return dependency


def require_admin():
    """
    Dependency to require admin role.
    """
    return require_role("admin")


def require_shop_owner(shop_id: Optional[str] = None):
    """
    Dependency to require shop_owner role.
    Optionally verify ownership of a specific shop.
    """
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_role = token_payload.get("user_metadata", {}).get("role", "customer")
        if user_role not in ["shop_owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions. Must be shop owner or admin."
            )
        # If shop_id is provided, we would verify ownership here
        # This would require a database query to check if the user owns the shop
        # For now, we just check the role
        return token_payload
    return dependency


def require_shop_worker(shop_id: Optional[str] = None):
    """
    Dependency to require shop_worker role or higher.
    Optionally verify employment at a specific shop.
    """
    def dependency(token_payload: dict = Depends(verify_token)) -> dict:
        user_role = token_payload.get("user_metadata", {}).get("role", "customer")
        if user_role not in ["shop_worker", "shop_owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions. Must be shop worker, owner, or admin."
            )
        # If shop_id is provided, we would verify employment here
        # This would require a database query to check if the user works at the shop
        return token_payload
    return dependency

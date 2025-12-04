"""
Security utilities for JWT validation and role-based access control.
"""
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.models.user import UserRole
from app.utils.exceptions import UnauthorizedException, ForbiddenException


security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        UnauthorizedException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        raise UnauthorizedException(detail=f"Invalid token: {str(e)}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get the current user from the JWT token.
    
    Args:
        credentials: HTTP authorization credentials
        
    Returns:
        User data from token payload
        
    Raises:
        UnauthorizedException: If token is invalid
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(detail="Invalid token payload")
    
    return payload


async def require_role(required_role: UserRole):
    """
    Dependency factory for role-based access control.
    
    Args:
        required_role: The role required to access the endpoint
        
    Returns:
        Dependency function that checks user role
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        
        # Admin has access to everything
        if user_role == UserRole.ADMIN.value:
            return current_user
        
        # Check if user has the required role
        if user_role != required_role.value:
            raise ForbiddenException(
                detail=f"This action requires {required_role.value} role"
            )
        
        return current_user
    
    return role_checker


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Require admin role.
    
    Args:
        current_user: Current user from token
        
    Returns:
        User data if user is admin
        
    Raises:
        ForbiddenException: If user is not admin
    """
    if current_user.get("role") != UserRole.ADMIN.value:
        raise ForbiddenException(detail="Admin access required")
    return current_user


async def require_shop_owner(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Require shop owner or admin role.
    
    Args:
        current_user: Current user from token
        
    Returns:
        User data if user is shop owner or admin
        
    Raises:
        ForbiddenException: If user is not shop owner or admin
    """
    user_role = current_user.get("role")
    if user_role not in [UserRole.SHOP_OWNER.value, UserRole.ADMIN.value]:
        raise ForbiddenException(detail="Shop owner access required")
    return current_user

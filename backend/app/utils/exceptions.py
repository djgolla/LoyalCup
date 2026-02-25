"""
Custom exception classes for the LoyalCup API.
Provides structured error handling throughout the application.
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class LoyalCupException(HTTPException):
    """Base exception for LoyalCup API."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundException(LoyalCupException):
    """Exception raised when a resource is not found."""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with identifier '{identifier}' not found"
        )


class UnauthorizedException(LoyalCupException):
    """Exception raised when user is not authorized."""
    
    def __init__(self, detail: str = "Not authorized to perform this action"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ForbiddenException(LoyalCupException):
    """Exception raised when user doesn't have permission."""
    
    def __init__(self, detail: str = "Forbidden: insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class BadRequestException(LoyalCupException):
    """Exception raised for invalid request data."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class ConflictException(LoyalCupException):
    """Exception raised when there's a conflict (e.g., duplicate resource)."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class DatabaseException(LoyalCupException):
    """Exception raised for database errors."""
    
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )

"""
Rate limiting middleware using SlowAPI.
Protects API endpoints from abuse and ensures fair usage.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from app.config import settings

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_requests}/{settings.rate_limit_window} seconds"]
)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Handle rate limit exceeded errors.
    
    Args:
        request: The FastAPI request
        exc: The RateLimitExceeded exception
        
    Returns:
        JSON response with 429 status code
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "detail": str(exc.detail)
        }
    )

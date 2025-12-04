"""
LoyalCup API - Main application entry point.

This is the FastAPI application that serves as the backend for LoyalCup,
a loyalty-focused coffee shop ordering platform.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routes import auth, users, shops, menu, orders, loyalty
from app.utils.exceptions import LoyalCupException


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(LoyalCupException)
async def loyalcup_exception_handler(request: Request, exc: LoyalCupException):
    """Handle custom LoyalCup exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Returns the current health status of the API.
    """
    return {
        "status": "healthy",
        "version": settings.api_version,
        "environment": settings.environment
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.
    
    Returns basic API information.
    """
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
        "docs": "/api/docs"
    }


# Include routers with API versioning prefix
API_V1_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
app.include_router(shops.router, prefix=API_V1_PREFIX)
app.include_router(menu.router, prefix=API_V1_PREFIX)
app.include_router(orders.router, prefix=API_V1_PREFIX)
app.include_router(loyalty.router, prefix=API_V1_PREFIX)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Execute tasks on application startup."""
    print(f"Starting {settings.api_title} v{settings.api_version}")
    print(f"Environment: {settings.environment}")
    print(f"API Documentation: /api/docs")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Execute tasks on application shutdown."""
    print(f"Shutting down {settings.api_title}")


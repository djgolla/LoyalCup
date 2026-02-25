from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from app.routes import auth, users, shops, menu, orders, loyalty, admin
from app.config import settings
from app.middleware.rate_limit import limiter, rate_limit_handler
from app.utils.logging import setup_logging, get_logger
from app.database import get_supabase
import time

# Setup structured logging
setup_logging(level="INFO" if settings.environment == "production" else "DEBUG")
logger = get_logger(__name__)

# Initialize Sentry for error tracking
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=settings.sentry_traces_sample_rate,
        environment=settings.sentry_environment,
    )
    logger.info("Sentry error tracking initialized")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add rate limiting state
if settings.rate_limit_enabled:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    logger.info(f"Rate limiting enabled: {settings.rate_limit_requests} requests per {settings.rate_limit_window}s")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],  # Allow configured origins plus wildcard for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information."""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log request
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s",
        extra={
            "extra_fields": {
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_seconds": duration,
                "client_host": request.client.host if request.client else None
            }
        }
    )
    
    return response

# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shops.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(loyalty.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "LoyalCup API",
        "version": settings.api_version,
        "description": "Complete production-ready platform for coffee shop ordering and loyalty",
        "environment": settings.environment,
        "documentation": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    Checks database connectivity and returns system status.
    """
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.environment,
        "version": settings.api_version,
        "checks": {}
    }
    
    # Check database connectivity
    try:
        supabase = get_supabase()
        # Simple query to check if database is accessible
        result = supabase.table("profiles").select("id").limit(1).execute()
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
        logger.error(f"Database health check failed: {e}")
    
    # Check rate limiter
    if settings.rate_limit_enabled:
        health_status["checks"]["rate_limiter"] = "enabled"
    else:
        health_status["checks"]["rate_limiter"] = "disabled"
    
    # Check email service
    if settings.sendgrid_api_key:
        health_status["checks"]["email_service"] = "configured"
    else:
        health_status["checks"]["email_service"] = "not_configured"
    
    # Check error tracking
    if settings.sentry_dsn:
        health_status["checks"]["error_tracking"] = "enabled"
    else:
        health_status["checks"]["error_tracking"] = "disabled"
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)


@app.get("/api/health/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes/container orchestration.
    Returns 200 only when the service is ready to accept traffic.
    """
    try:
        # Check if database is ready
        supabase = get_supabase()
        supabase.table("profiles").select("id").limit(1).execute()
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            content={"status": "not_ready", "error": str(e)},
            status_code=503
        )


@app.get("/api/health/live")
async def liveness_check():
    """
    Liveness check for Kubernetes/container orchestration.
    Returns 200 if the service is running (even if degraded).
    """
    return {"status": "alive"}

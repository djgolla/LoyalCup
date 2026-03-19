import time
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.middleware.rate_limit import limiter, rate_limit_handler
from app.utils.logging import setup_logging, get_logger
from app.database import get_supabase

from app.routes import (
    auth,
    users,
    shops,
    menu,
    orders,
    loyalty,
    admin,
    payments,
    billing,
    pos_status,
    pos_connect,
    pos_square_callback,
    pos_square_set_location,
)
from app.routes import pos_sync

setup_logging(level="INFO" if settings.environment == "production" else "DEBUG")
logger = get_logger(__name__)

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=settings.sentry_traces_sample_rate,
        environment=settings.sentry_environment,
    )
    logger.info("Sentry initialized")

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS must be first middleware, before rate limiter ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://loyalcupapp.com",
        "https://www.loyalcupapp.com",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.rate_limit_enabled:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s"
    )
    return response


# ---- ROUTERS ----
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shops.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(loyalty.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(billing.router)
app.include_router(pos_status.router)
app.include_router(pos_connect.router)
app.include_router(pos_square_callback.router)
app.include_router(pos_square_set_location.router)
app.include_router(pos_sync.router)


@app.get("/")
async def root():
    return {
        "name": "LoyalCup API",
        "version": settings.api_version,
        "environment": settings.environment,
        "documentation": "/api/docs",
    }


@app.get("/health")
async def health_check():
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.environment,
        "version": settings.api_version,
        "checks": {},
    }
    try:
        supabase = get_supabase()
        supabase.table("profiles").select("id").limit(1).execute()
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    health_status["checks"]["rate_limiter"] = "enabled" if settings.rate_limit_enabled else "disabled"
    health_status["checks"]["email_service"] = "configured" if settings.sendgrid_api_key else "not_configured"
    health_status["checks"]["error_tracking"] = "enabled" if settings.sentry_dsn else "disabled"
    health_status["checks"]["stripe"] = "configured" if settings.stripe_secret_key else "not_configured"
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)


@app.get("/api/health/ready")
async def readiness_check():
    try:
        supabase = get_supabase()
        supabase.table("profiles").select("id").limit(1).execute()
        return {"status": "ready"}
    except Exception as e:
        return JSONResponse(content={"status": "not_ready", "error": str(e)}, status_code=503)


@app.get("/api/health/live")
async def liveness_check():
    return {"status": "alive"}
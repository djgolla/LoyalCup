"""
POST /api/v1/pos/connect?provider=square

Initiates Square OAuth. Returns the authorization_url the frontend
redirects the user to.

SECURITY:
The OAuth state is signed with HMAC so nobody can forge a callback for
another shop_id.
"""
import base64
import hashlib
import hmac
import json
import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.database import get_supabase
from app.utils.security import require_auth
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def _square_base() -> str:
    return (
        "https://connect.squareupsandbox.com"
        if settings.square_env == "sandbox"
        else "https://connect.squareup.com"
    )


def _sign_state_payload(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    sig = hmac.new(settings.jwt_secret.encode(), raw, hashlib.sha256).hexdigest()
    wrapped = {
        "payload": payload,
        "sig": sig,
    }
    return base64.urlsafe_b64encode(json.dumps(wrapped, separators=(",", ":")).encode()).decode()


def _square_authorization_url(shop_id: str, owner_id: str) -> str:
    app_id = settings.square_application_id

    state = _sign_state_payload({
        "shop_id": shop_id,
        "owner_id": owner_id,
        "provider": "square",
    })

    scopes = [
        "MERCHANT_PROFILE_READ",
        "ORDERS_WRITE",
        "ORDERS_READ",
        "PAYMENTS_WRITE",
        "PAYMENTS_READ",
        "INVENTORY_READ",
        "ITEMS_READ",
    ]

    qs = urlencode({
        "client_id": app_id,
        "scope": " ".join(scopes),
        "session": "false",
        "state": state,
        "redirect_uri": settings.square_callback_url,
    })

    return f"{_square_base()}/oauth2/authorize?{qs}"


@router.post("/api/v1/pos/connect")
async def pos_connect(
    request: Request,
    user: dict = Depends(require_auth()),
    db=Depends(get_supabase),
):
    provider = request.query_params.get("provider", "").lower()
    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}

    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider query param")
    if provider != "square":
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if not settings.square_application_id:
        raise HTTPException(status_code=500, detail="Square application ID not configured on server")
    if not settings.square_callback_url:
        raise HTTPException(status_code=500, detail="Square callback URL not configured on server")

    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    query = (
        db.get_service_client()
        .table("shops")
        .select("id, status")
        .eq("owner_id", user_id)
    )

    requested_shop_id = body.get("shop_id") or request.query_params.get("shop_id")
    if requested_shop_id:
        query = query.eq("id", requested_shop_id)

    shop_resp = query.order("created_at").limit(1).execute()

    if not shop_resp.data:
        raise HTTPException(
            status_code=404,
            detail="No shop found. Complete your shop setup before connecting Square.",
        )

    shop = shop_resp.data[0]
    shop_id = shop["id"]

    auth_url = _square_authorization_url(shop_id=shop_id, owner_id=user_id)

    logger.info(f"[POS Connect] Square OAuth URL generated for shop {shop_id}")
    return JSONResponse({"authorization_url": auth_url, "shop_id": shop_id})


def register(app):
    app.include_router(router)

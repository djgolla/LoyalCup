"""
Square Webhook Handler

Order STATUS syncing has been removed — LoyalCup no longer tracks
preparing/ready/picked_up. This endpoint remains only to acknowledge Square
events (and keep the subscription healthy), with signature verification that
fails CLOSED in production.
"""
import base64
import hashlib
import hmac
import json
import logging
import os
from fastapi import APIRouter, Request, HTTPException

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

SQUARE_WEBHOOK_SIG_KEY = os.getenv("SQUARE_WEBHOOK_SIGNATURE_KEY", "")


def _verify_square_signature(body: bytes, signature: str, url: str) -> bool:
    """Verify Square's HMAC-SHA256 signature. Fail CLOSED in production."""
    if not SQUARE_WEBHOOK_SIG_KEY:
        if settings.environment == "production":
            logger.error("[SquareWebhook] No signing key in production — rejecting")
            return False
        logger.warning("[SquareWebhook] No signing key set — skipping (non-production only)")
        return True
    combined = url + body.decode("utf-8")
    expected = hmac.new(
        SQUARE_WEBHOOK_SIG_KEY.encode("utf-8"),
        combined.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return hmac.compare_digest(base64.b64encode(expected).decode("utf-8"), signature or "")


@router.post("/api/v1/pos/square/webhook")
async def square_webhook(request: Request):
    body      = await request.body()
    signature = request.headers.get("x-square-hmacsha256-signature", "")
    url       = str(request.url)

    if not _verify_square_signature(body, signature, url):
        logger.warning("[SquareWebhook] Signature mismatch — rejecting")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Acknowledge and ignore — we no longer drive order status from Square.
    logger.info(f"[SquareWebhook] Event received and ignored: {payload.get('type', 'unknown')}")
    return {"received": True, "action": "ignored"}


def register(app):
    app.include_router(router)
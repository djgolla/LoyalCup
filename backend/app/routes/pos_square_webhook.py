"""
Square Webhook Handler
Receives order state change events from Square and syncs status into LoyalCup orders.
"""
import base64
import hashlib
import hmac
import json
import logging
import os
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from app.database import get_supabase

router = APIRouter()
logger = logging.getLogger(__name__)

SQUARE_WEBHOOK_SIG_KEY = os.getenv("SQUARE_WEBHOOK_SIGNATURE_KEY", "")

SQUARE_STATE_MAP = {
    "OPEN":        "accepted",
    "IN_PROGRESS": "preparing",
    "COMPLETED":   "picked_up",
    "CANCELED":    "cancelled",
}


def _verify_square_signature(body: bytes, signature: str, url: str) -> bool:
    if not SQUARE_WEBHOOK_SIG_KEY:
        logger.warning("[SquareWebhook] No signature key set — skipping verification (dev mode)")
        return True
    combined = url + body.decode("utf-8")
    expected = hmac.new(
        SQUARE_WEBHOOK_SIG_KEY.encode("utf-8"),
        combined.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    expected_b64 = base64.b64encode(expected).decode("utf-8")
    return hmac.compare_digest(expected_b64, signature or "")


@router.post("/api/v1/pos/square/webhook")
async def square_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-square-hmacsha256-signature", "")
    url = str(request.url)

    if not _verify_square_signature(body, signature, url):
        logger.warning("[SquareWebhook] Signature mismatch — rejecting")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = payload.get("type", "")
    logger.info(f"[SquareWebhook] Event: {event_type}")

    if event_type not in ("order.updated", "order.created", "order.fulfillment.updated"):
        return {"received": True, "action": "ignored"}

    data = payload.get("data", {}).get("object", {})

    if event_type == "order.fulfillment.updated":
        fulfillment = data.get("fulfillment", {})
        new_state = fulfillment.get("state")
        square_order_id = fulfillment.get("order_id")
        await _sync_by_square_order_id(square_order_id, new_state)
        return {"received": True}

    order_obj = data.get("order_updated") or data.get("order") or {}
    state = order_obj.get("state")
    reference_id = order_obj.get("reference_id")

    if not reference_id or not state:
        logger.debug("[SquareWebhook] No reference_id or state — skipping")
        return {"received": True, "action": "no_reference"}

    loyalcup_status = SQUARE_STATE_MAP.get(state)
    if not loyalcup_status:
        logger.debug(f"[SquareWebhook] Unmapped Square state: {state}")
        return {"received": True, "action": "unmapped_state"}

    await _update_order_status(reference_id, loyalcup_status, source="square_webhook")
    return {"received": True}


async def _sync_by_square_order_id(square_order_id: str, state: str):
    if not square_order_id or not state:
        return
    loyalcup_status = SQUARE_STATE_MAP.get(state)
    if not loyalcup_status:
        return
    try:
        db = get_supabase()
        resp = (
            db.service_client
            .table("orders")
            .select("id, status")
            .eq("metadata->>square_order_id", square_order_id)
            .limit(1)
            .execute()
        )
        if resp.data:
            await _update_order_status(resp.data[0]["id"], loyalcup_status, source="square_fulfillment_webhook")
    except Exception as e:
        logger.exception(f"[SquareWebhook] _sync_by_square_order_id failed: {e}")


async def _update_order_status(order_id: str, new_status: str, source: str = "webhook"):
    STATUS_ORDER = ["pending", "accepted", "preparing", "ready", "picked_up", "completed", "cancelled"]
    try:
        db = get_supabase()
        resp = (
            db.service_client
            .table("orders")
            .select("id, status")
            .eq("id", order_id)
            .limit(1)
            .execute()
        )
        if not resp.data:
            logger.warning(f"[SquareWebhook] Order {order_id} not found")
            return

        current = resp.data[0]["status"]

        if current in ("completed", "cancelled"):
            logger.debug(f"[SquareWebhook] Order {order_id} already terminal ({current}) — skipping")
            return

        current_idx = STATUS_ORDER.index(current) if current in STATUS_ORDER else -1
        new_idx = STATUS_ORDER.index(new_status) if new_status in STATUS_ORDER else -1

        if new_idx <= current_idx:
            logger.debug(f"[SquareWebhook] Skipping backward transition {current} → {new_status}")
            return

        db.service_client.table("orders").update({
            "status": new_status,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", order_id).execute()

        logger.info(f"[SquareWebhook] ({source}) Order {order_id}: {current} → {new_status} ✓")

    except Exception as e:
        logger.exception(f"[SquareWebhook] Failed to update order {order_id}: {e}")
"""
Notification service — push notifications (Expo) + SMS (Twilio optional).

Order lifecycle notifications:
  confirmed  → "We got your order!"
  accepted   → "Barista is on it!"
  ready      → "🎉 Your order is ready!" (push + SMS)
  cancelled  → "Order cancelled."

SMS is only sent on "ready" and only if TWILIO_* env vars are set.
If Twilio isn't configured, push-only is fine.
"""
import logging
import httpx
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

# ── Expo Push ─────────────────────────────────────────────────────────────────

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

PUSH_MESSAGES = {
    "confirmed":  ("Order Received! ☕",   "We got your order and it's being confirmed."),
    "accepted":   ("It's Happening! 🎉",   "Your barista has your order and is getting started."),
    "preparing":  ("Brewing Now ☕",        "Your order is being prepared right now."),
    "ready":      ("Ready for Pickup! 🎉", "Head to the counter — your order is ready!"),
    "completed":  ("Enjoy! ⭐",             "Thanks for your order. Leave a review in the app!"),
    "cancelled":  ("Order Cancelled",      "Your order was cancelled. No charge was made."),
}

SMS_READY_TEMPLATE = "☕ Your order at {shop_name} is ready for pickup! Order #{short_id}"


async def send_push_notification(
    push_token: str,
    status: str,
    shop_name: str = "",
    order_id: str = "",
) -> bool:
    """Send an Expo push notification for a status change. Returns True on success."""
    if not push_token or not push_token.startswith("ExponentPushToken"):
        return False

    title, body = PUSH_MESSAGES.get(status, ("LoyalCup", f"Your order is now {status}."))
    if shop_name and status == "ready":
        body = f"Your order at {shop_name} is ready! Head to the counter."

    payload = {
        "to":    push_token,
        "title": title,
        "body":  body,
        "sound": "default",
        "data":  {"order_id": order_id, "status": status},
        "badge": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload)
            if resp.status_code == 200:
                logger.info(f"[Push] sent status={status} order={order_id[:8]}")
                return True
            else:
                logger.warning(f"[Push] failed {resp.status_code}: {resp.text[:200]}")
                return False
    except Exception as e:
        logger.warning(f"[Push] exception: {e}")
        return False


async def send_sms_notification(
    phone: str,
    status: str,
    shop_name: str = "",
    order_id: str = "",
) -> bool:
    """
    Send an SMS via Twilio when order is ready.
    Only fires if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER are set.
    Silently skips if not configured — never blocks order flow.
    """
    if status != "ready":
        return False  # only SMS for ready

    account_sid  = getattr(settings, "twilio_account_sid",  None)
    auth_token   = getattr(settings, "twilio_auth_token",   None)
    from_number  = getattr(settings, "twilio_from_number",  None)

    if not all([account_sid, auth_token, from_number]):
        logger.debug("[SMS] Twilio not configured — skipping SMS")
        return False

    if not phone:
        return False

    # Normalize phone
    digits = ''.join(c for c in phone if c.isdigit() or c == '+')
    if not digits.startswith('+'):
        digits = '+1' + digits.lstrip('1') if len(digits) == 10 else '+' + digits

    short_id = order_id[:8].upper() if order_id else '—'
    body     = SMS_READY_TEMPLATE.format(shop_name=shop_name or "the shop", short_id=short_id)

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                data={"To": digits, "From": from_number, "Body": body},
                auth=(account_sid, auth_token),
            )
            if resp.status_code in (200, 201):
                logger.info(f"[SMS] sent to {digits[:6]}*** order={short_id}")
                return True
            else:
                logger.warning(f"[SMS] failed {resp.status_code}: {resp.text[:200]}")
                return False
    except Exception as e:
        logger.warning(f"[SMS] exception: {e}")
        return False


async def notify_customer_status_change(
    push_token: Optional[str],
    phone: Optional[str],
    status: str,
    shop_name: str = "",
    order_id: str = "",
) -> None:
    """
    Fire-and-forget both push + SMS for a status update.
    Always called with await but internally catches all errors.
    Safe to call from order status update without blocking.
    """
    if push_token:
        try:
            await send_push_notification(
                push_token=push_token,
                status=status,
                shop_name=shop_name,
                order_id=order_id,
            )
        except Exception as e:
            logger.warning(f"[Notify] push failed: {e}")

    if phone and status == "ready":
        try:
            await send_sms_notification(
                phone=phone,
                status=status,
                shop_name=shop_name,
                order_id=order_id,
            )
        except Exception as e:
            logger.warning(f"[Notify] SMS failed: {e}")
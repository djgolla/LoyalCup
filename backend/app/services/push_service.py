"""
Expo Push Notification service.
Sends order status updates to mobile customers.
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

PUSH_COPY = {
    "accepted": {
        "title": "Order Accepted ✅",
        "body": "Your order has been accepted! The barista is getting started.",
    },
    "preparing": {
        "title": "Brewing in Progress ☕",
        "body": "Your order is being carefully prepared.",
    },
    "ready": {
        "title": "Your Order is Ready! 🎉",
        "body": "Head to the counter — your order is hot and waiting!",
    },
    "completed": {
        "title": "Order Complete ⭐",
        "body": "Thanks for using LoyalCup! Don't forget to leave a review.",
    },
    "cancelled": {
        "title": "Order Cancelled ❌",
        "body": "Your order was cancelled. Contact the shop if you have questions.",
    },
}


async def send_order_push(
    push_token: str,
    order_id: str,
    status: str,
    shop_name: str,
) -> bool:
    """
    Send a push notification for an order status update.
    Returns True on success, False on failure (never raises).
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        logger.warning(f"[Push] Invalid or missing token: {push_token!r}")
        return False

    copy = PUSH_COPY.get(status)
    if not copy:
        logger.debug(f"[Push] No copy configured for status '{status}', skipping")
        return False

    payload = {
        "to": push_token,
        "title": copy["title"],
        "body": f"{shop_name} — {copy['body']}",
        "data": {"order_id": order_id, "status": status},
        "sound": "default",
        "priority": "high" if status == "ready" else "normal",
        "channelId": "orders",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
            )
        result = response.json()
        ticket = result.get("data", {})
        if ticket.get("status") == "ok":
            logger.info(f"[Push] Sent '{status}' notification for order {order_id[:8]}")
            return True
        else:
            logger.warning(f"[Push] Ticket error: {ticket}")
            return False
    except Exception as e:
        logger.error(f"[Push] Failed to send notification: {e}")
        return False
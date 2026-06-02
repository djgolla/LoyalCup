"""
Notification service — single order-placed push (Expo).

There is no order-status workflow anymore. When an order is successfully
placed we send ONE push telling the customer roughly when it'll be ready,
based on the shop's avg_prep_time_minutes.
"""
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_order_placed_push(
    push_token: Optional[str],
    shop_name: str,
    prep_minutes: int,
    order_id: str = "",
) -> bool:
    """
    Send the single 'order placed' Expo push with an ETA.
    Safe to call without a token — silently no-ops. Never raises.
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        return False

    title = "Order placed! ☕"
    body  = f"{shop_name} will have your order ready in about {prep_minutes} minutes. Head over and pick it up!"

    payload = {
        "to":    push_token,
        "title": title,
        "body":  body,
        "sound": "default",
        "data":  {"order_id": order_id, "type": "order_placed", "prep_minutes": prep_minutes},
        "badge": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload)
            if resp.status_code == 200:
                logger.info(f"[Push] order-placed sent order={order_id[:8]}")
                return True
            logger.warning(f"[Push] failed {resp.status_code}: {resp.text[:200]}")
            return False
    except Exception as e:
        logger.warning(f"[Push] exception: {e}")
        return False
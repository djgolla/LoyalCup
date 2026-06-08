"""
Notification service — Expo push notifications for orders.

Launch flow:
  1. Card order succeeds.
  2. Customer gets "order placed" push with ETA.
  3. At ready_at, backend marks order completed and sends "ready for pickup" push.
"""
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def _send_expo_push(
    *,
    push_token: Optional[str],
    title: str,
    body: str,
    data: dict,
) -> bool:
    if not push_token or not push_token.startswith("ExponentPushToken"):
        return False

    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data,
        "badge": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload)

        if resp.status_code == 200:
            logger.info(
                f"[Push] sent type={data.get('type')} "
                f"order={str(data.get('order_id', ''))[:8]}"
            )
            return True

        logger.warning(f"[Push] failed {resp.status_code}: {resp.text[:200]}")
        return False

    except Exception as e:
        logger.warning(f"[Push] exception: {e}")
        return False


async def send_order_placed_push(
    push_token: Optional[str],
    shop_name: str,
    prep_minutes: int,
    order_id: str = "",
) -> bool:
    """
    Send the 'order placed' push with ETA.
    Safe to call without a token. Never raises.
    """
    return await _send_expo_push(
        push_token=push_token,
        title="Order placed! ☕",
        body=f"{shop_name} will have your order ready in about {prep_minutes} minutes. Head over and pick it up!",
        data={
            "order_id": order_id,
            "type": "order_placed",
            "prep_minutes": prep_minutes,
        },
    )


async def send_order_ready_push(
    push_token: Optional[str],
    shop_name: str,
    order_id: str = "",
) -> bool:
    """
    Send the 'ready for pickup' push when ready_at has passed.
    Safe to call without a token. Never raises.
    """
    return await _send_expo_push(
        push_token=push_token,
        title="Order ready for pickup! 🎉",
        body=f"Your order from {shop_name} should be ready now. Head over and pick it up!",
        data={
            "order_id": order_id,
            "type": "order_ready",
        },
    )
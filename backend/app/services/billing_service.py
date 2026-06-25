import logging
from typing import Any, Dict, List, Optional

import stripe

from app.config import settings

logger = logging.getLogger(__name__)

BASE_LOCATION_PRICE_ID = settings.stripe_price_id
ADDITIONAL_LOCATION_PRICE_ID = settings.stripe_location_price_id
BASE_LOCATION_AMOUNT = 150
ADDITIONAL_LOCATION_AMOUNT = 50
BILLABLE_EXCLUDED_STATUSES = {"cancelled", "suspended"}

stripe.api_key = settings.stripe_secret_key


def _is_billable_shop(shop: Dict[str, Any]) -> bool:
    return (shop.get("status") or "").lower() not in BILLABLE_EXCLUDED_STATUSES


def list_owner_billing_shops(sc, owner_id: str) -> List[Dict[str, Any]]:
    resp = (
        sc.table("shops")
        .select("id, name, status, stripe_customer_id, stripe_subscription_id, subscription_status")
        .eq("owner_id", owner_id)
        .order("created_at")
        .execute()
    )
    return resp.data or []


def billable_location_count(shops: List[Dict[str, Any]]) -> int:
    return len([shop for shop in shops if _is_billable_shop(shop)])


def additional_location_quantity(location_count: int) -> int:
    return max(0, int(location_count or 0) - 1)


def build_checkout_line_items(location_count: int) -> List[Dict[str, Any]]:
    if not BASE_LOCATION_PRICE_ID:
        raise ValueError("Base subscription price is not configured")

    additional_qty = additional_location_quantity(location_count)
    if additional_qty > 0 and not ADDITIONAL_LOCATION_PRICE_ID:
        raise ValueError("Additional-location subscription price is not configured")

    line_items = [{"price": BASE_LOCATION_PRICE_ID, "quantity": 1}]
    if additional_qty > 0:
        line_items.append({
            "price": ADDITIONAL_LOCATION_PRICE_ID,
            "quantity": additional_qty,
        })
    return line_items


def billing_amount_summary(location_count: int) -> Dict[str, int]:
    additional_qty = additional_location_quantity(location_count)
    return {
        "location_count": max(0, int(location_count or 0)),
        "additional_location_count": additional_qty,
        "base_monthly_amount": BASE_LOCATION_AMOUNT,
        "additional_location_monthly_amount": ADDITIONAL_LOCATION_AMOUNT,
        "estimated_monthly_amount": BASE_LOCATION_AMOUNT + (additional_qty * ADDITIONAL_LOCATION_AMOUNT),
    }


def find_owner_billing_shop(shops: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    return next(
        (
            shop for shop in shops
            if shop.get("stripe_subscription_id")
            or shop.get("stripe_customer_id")
            or shop.get("status") == "active"
            or shop.get("subscription_status") == "active"
        ),
        shops[0] if shops else None,
    )


def find_active_subscription_id(shops: List[Dict[str, Any]]) -> Optional[str]:
    for shop in shops:
        if shop.get("stripe_subscription_id"):
            return shop.get("stripe_subscription_id")
    return None


def sync_owner_subscription_location_quantity(
    sc,
    owner_id: str,
    *,
    subscription_id: Optional[str] = None,
    proration_behavior: str = "always_invoice",
) -> Dict[str, Any]:
    """
    Sync Stripe's additional-location subscription item with the owner's
    current billable LoyalCup shop count. The first location is covered by the
    base price; every extra billable location increments the add-on quantity.
    """
    if not settings.stripe_secret_key:
        raise ValueError("Stripe is not configured")

    shops = list_owner_billing_shops(sc, owner_id)
    location_count = billable_location_count(shops)
    additional_qty = additional_location_quantity(location_count)
    subscription_id = subscription_id or find_active_subscription_id(shops)

    if not subscription_id:
        return {
            "synced": False,
            "reason": "no_subscription",
            **billing_amount_summary(location_count),
        }

    if additional_qty > 0 and not ADDITIONAL_LOCATION_PRICE_ID:
        raise ValueError("Additional-location subscription price is not configured")

    subscription = stripe.Subscription.retrieve(
        subscription_id,
        expand=["items.data.price"],
    )

    additional_item = None
    for item in subscription["items"]["data"]:
        price = item.get("price") or {}
        if price.get("id") == ADDITIONAL_LOCATION_PRICE_ID:
            additional_item = item
            break

    if additional_qty > 0:
        if additional_item:
            stripe.SubscriptionItem.modify(
                additional_item["id"],
                quantity=additional_qty,
                proration_behavior=proration_behavior,
            )
        else:
            stripe.SubscriptionItem.create(
                subscription=subscription_id,
                price=ADDITIONAL_LOCATION_PRICE_ID,
                quantity=additional_qty,
                proration_behavior=proration_behavior,
            )
    elif additional_item:
        stripe.SubscriptionItem.delete(
            additional_item["id"],
            proration_behavior=proration_behavior,
        )

    logger.info(
        "[Billing] Synced Stripe location quantity owner=%s subscription=%s additional_qty=%s",
        owner_id,
        subscription_id,
        additional_qty,
    )

    return {
        "synced": True,
        "subscription_id": subscription_id,
        **billing_amount_summary(location_count),
    }

# backend/app/routes/billing.py

"""
Stripe Billing — Shop owner subscription management.
Idempotent webhook handling: each event type is safe to receive multiple times.

IMPORTANT: We ONLY activate shops if:
1. Subscription is created (webhook fires)
2. AND payment was actually collected
"""
import logging
import httpx
import stripe
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel
from typing import Optional

from app.utils.security import require_auth
from app.database import get_supabase
from app.config import settings

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])
logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key
PRICE_ID = settings.stripe_price_id
WEBHOOK_SECRET = settings.stripe_webhook_secret


class CreateCheckoutRequest(BaseModel):
    promo_code: Optional[str] = None


async def _geocode_shop(shop_id: str, address: str, city: str, state: str, zip_code: str, db) -> None:
    parts = [p for p in [address, city, state, zip_code] if p]
    if not parts:
        logger.warning(f"[Billing] Shop {shop_id} has no address to geocode")
        return

    query = ", ".join(parts)

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"format": "json", "limit": 1, "q": query},
                headers={"User-Agent": "LoyalCup/1.0"},
            )
            data = resp.json()

        if data:
            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            db.get_service_client().table("shops").update(
                {"lat": lat, "lng": lng}
            ).eq("id", shop_id).execute()
            logger.info(f"[Billing] Shop {shop_id} geocoded → {lat}, {lng}")
        else:
            logger.warning(f"[Billing] Nominatim returned no results for shop {shop_id}: '{query}'")

    except Exception as e:
        logger.warning(f"[Billing] Geocoding failed for shop {shop_id} (non-fatal): {e}")


@router.post("/create-checkout")
async def create_checkout_session(
    body: CreateCheckoutRequest,
    user: dict = Depends(require_auth()),
):
    user_id = user.get("sub")
    user_email = user.get("email") or ""

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not PRICE_ID:
        raise HTTPException(status_code=500, detail="Subscription price not configured")
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    db = get_supabase()
    sc = db.get_service_client()

    shop_resp = (
        sc.table("shops")
        .select("id, name, stripe_customer_id, stripe_subscription_id, status")
        .eq("owner_id", user_id)
        .order("created_at")
        .limit(1)
        .execute()
    )

    if not shop_resp.data:
        raise HTTPException(
            status_code=404,
            detail="Shop not found — please complete your application first"
        )

    shop = shop_resp.data[0]

    if shop.get("stripe_subscription_id") and shop.get("status") == "active":
        raise HTTPException(status_code=400, detail="Your shop already has an active subscription")

    try:
        stripe_customer_id = shop.get("stripe_customer_id")

        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                name=shop.get("name", ""),
                metadata={"shop_id": shop["id"], "owner_id": user_id},
            )
            stripe_customer_id = customer.id

            sc.table("shops").update(
                {"stripe_customer_id": stripe_customer_id}
            ).eq("id", shop["id"]).execute()

        session_params = {
            "customer": stripe_customer_id,
            "payment_method_types": ["card"],
            "line_items": [{"price": PRICE_ID, "quantity": 1}],
            "mode": "subscription",
            "success_url": f"{settings.frontend_url}/shop-owner/subscribe?success=true",
            "cancel_url": f"{settings.frontend_url}/shop-owner/subscribe?cancelled=true",
            "metadata": {"shop_id": shop["id"], "owner_id": user_id},
            "subscription_data": {
                "metadata": {"shop_id": shop["id"], "owner_id": user_id},
            },
            "allow_promotion_codes": True,
        }

        if body.promo_code:
            try:
                promo = stripe.PromotionCode.list(code=body.promo_code, active=True, limit=1)
                if promo.data:
                    session_params["discounts"] = [{"promotion_code": promo.data[0].id}]
                    session_params.pop("allow_promotion_codes", None)
                    logger.info(f"[Billing] Promo code applied: {body.promo_code}")
                else:
                    raise HTTPException(status_code=400, detail=f"Promo code '{body.promo_code}' is not valid")
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"[Billing] Promo code lookup failed: {e}")

        session = stripe.checkout.Session.create(**session_params)
        logger.info(f"[Billing] Checkout session created for shop {shop['id']}")

        return {"checkout_url": session.url, "session_id": session.id}

    except HTTPException:
        raise
    except stripe.StripeError as e:
        logger.error(f"[Billing] Stripe error creating checkout: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    if not WEBHOOK_SECRET:
        logger.error("[Billing] STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook not configured")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        logger.warning("[Billing] Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"[Billing] Webhook parse error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")

    db = get_supabase()
    sc = db.get_service_client()
    event_type = event["type"]

    logger.info(f"[Billing] Webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        obj = event["data"]["object"]
        shop_id = obj["metadata"].get("shop_id")
        owner_id = obj["metadata"].get("owner_id")
        subscription_id = obj.get("subscription")
        payment_status = obj.get("payment_status")

        if not shop_id or not subscription_id:
            logger.warning("[Billing] checkout.session.completed missing shop_id or subscription_id")
            return {"received": True}

        if payment_status != "paid":
            logger.warning(f"[Billing] checkout.session.completed but payment_status={payment_status}, skipping")
            return {"received": True}

        logger.info(f"[Billing] Payment verified for shop {shop_id}, activating...")

        try:
            sub_obj = stripe.Subscription.retrieve(subscription_id)
            price_id = (
                sub_obj["items"]["data"][0]["price"]["id"]
                if sub_obj["items"]["data"] else PRICE_ID
            )
        except Exception as e:
            logger.warning(f"[Billing] Could not retrieve subscription {subscription_id}: {e}")
            price_id = PRICE_ID

        sc.table("shops").update({
            "stripe_subscription_id": subscription_id,
            "subscription_status": "active",
            "subscription_price_id": price_id,
            "status": "active",
        }).eq("id", shop_id).execute()

        if owner_id:
            try:
                sc.table("profiles").update({
                    "role": "shop_owner",
                    "shop_id": shop_id,
                }).eq("id", owner_id).execute()

                db.get_service_client().auth.admin.update_user_by_id(
                    owner_id,
                    {"user_metadata": {"role": "shop_owner"}},
                )

                logger.info(f"[Billing] User {owner_id} promoted to shop_owner")
            except Exception as e:
                logger.warning(f"[Billing] Could not promote user role: {e}")

            try:
                sc.table("shops").update({
                    "stripe_customer_id": obj.get("customer"),
                    "stripe_subscription_id": subscription_id,
                    "subscription_status": "active",
                    "subscription_price_id": price_id,
                    "status": "active",
                }).eq("owner_id", owner_id).in_("status", ["pending_payment", "pending"]).execute()
                logger.info(f"[Billing] Activated all pending shops for owner {owner_id}")
            except Exception as e:
                logger.warning(f"[Billing] Could not activate sibling shops for owner {owner_id}: {e}")

        logger.info(f"[Billing] Shop {shop_id} ACTIVATED ✓")

        try:
            addr_resp = (
                sc.table("shops")
                .select("address, city, state, zip, lat, lng")
                .eq("id", shop_id)
                .single()
                .execute()
            )
            addr = addr_resp.data or {}

            if addr.get("lat") is None and addr.get("lng") is None:
                await _geocode_shop(
                    shop_id=shop_id,
                    address=addr.get("address") or "",
                    city=addr.get("city") or "",
                    state=addr.get("state") or "",
                    zip_code=addr.get("zip") or "",
                    db=db,
                )
            else:
                logger.info(f"[Billing] Shop {shop_id} already has coordinates, skipping geocode")
        except Exception as e:
            logger.warning(f"[Billing] Could not fetch address for geocoding shop {shop_id} (non-fatal): {e}")

    elif event_type == "customer.subscription.updated":
        sub = event["data"]["object"]
        shop_id = sub["metadata"].get("shop_id")
        subscription_id = sub.get("id")

        if shop_id or subscription_id:
            stripe_status = sub["status"]
            shop_status_map = {
                "active": "active",
                "past_due": "active",
                "canceled": "cancelled",
                "unpaid": "suspended",
            }

            update = {"subscription_status": stripe_status}

            if stripe_status in ("canceled", "unpaid"):
                update["status"] = shop_status_map.get(stripe_status, "suspended")

            query = sc.table("shops").update(update)
            if subscription_id:
                query = query.eq("stripe_subscription_id", subscription_id)
            else:
                query = query.eq("id", shop_id)
            query.execute()
            logger.info(f"[Billing] Subscription {subscription_id or shop_id} → {stripe_status}")

    elif event_type == "customer.subscription.deleted":
        sub = event["data"]["object"]
        shop_id = sub["metadata"].get("shop_id")
        subscription_id = sub.get("id")

        if shop_id or subscription_id:
            update_query = sc.table("shops").update({
                "subscription_status": "cancelled",
                "stripe_subscription_id": None,
                "status": "cancelled",
            })
            if subscription_id:
                update_query = update_query.eq("stripe_subscription_id", subscription_id)
            else:
                update_query = update_query.eq("id", shop_id)
            update_query.execute()

            logger.info(f"[Billing] Subscription {subscription_id or shop_id} cancelled")

    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")

        if customer_id:
            sc.table("shops").update({
                "subscription_status": "past_due",
            }).eq("stripe_customer_id", customer_id).execute()

            logger.warning(f"[Billing] Payment failed for customer {customer_id}")

    elif event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")

        if customer_id and invoice.get("billing_reason") == "subscription_cycle":
            sc.table("shops").update({
                "subscription_status": "active",
                "status": "active",
            }).eq("stripe_customer_id", customer_id).execute()

            logger.info(f"[Billing] Renewal payment succeeded for {customer_id}")

    return {"received": True}


@router.get("/status")
async def get_subscription_status(user: dict = Depends(require_auth())):
    user_id = user.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_supabase()
    sc = db.get_service_client()

    shop_resp = (
        sc.table("shops")
        .select("id, name, subscription_status, stripe_subscription_id, stripe_customer_id, status")
        .eq("owner_id", user_id)
        .order("created_at")
        .execute()
    )

    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")

    shops = shop_resp.data or []
    shop = next(
        (
            row for row in shops
            if row.get("status") == "active"
            or row.get("subscription_status") == "active"
            or row.get("stripe_subscription_id")
        ),
        shops[0],
    )

    return {
        "subscribed": any(
            row.get("status") == "active"
            or row.get("subscription_status") == "active"
            for row in shops
        ),
        "shop_id": shop.get("id"),
        "shops": shops,
        "status": shop.get("subscription_status") or "none",
        "shop_status": shop.get("status"),
        "subscription_id": shop.get("stripe_subscription_id"),
    }


@router.post("/portal")
async def create_billing_portal(user: dict = Depends(require_auth())):
    user_id = user.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_supabase()
    sc = db.get_service_client()

    shop_resp = (
        sc.table("shops")
        .select("id, stripe_customer_id")
        .eq("owner_id", user_id)
        .not_.is_("stripe_customer_id", "null")
        .order("created_at")
        .limit(1)
        .execute()
    )

    if not shop_resp.data or not shop_resp.data[0].get("stripe_customer_id"):
        raise HTTPException(status_code=404, detail="No billing account found")

    try:
        portal = stripe.billing_portal.Session.create(
            customer=shop_resp.data[0]["stripe_customer_id"],
            return_url=f"{settings.frontend_url}/shop-owner/settings",
        )
        return {"portal_url": portal.url}

    except stripe.StripeError as e:
        logger.error(f"[Billing] Portal error: {e}")
        raise HTTPException(status_code=500, detail="Could not create billing portal")

"""
Stripe Billing — Shop owner subscription management
"""
import logging
import stripe
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from app.utils.security import require_auth
from app.database import get_supabase
from app.config import settings

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])
logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key
PRICE_ID       = settings.stripe_price_id
WEBHOOK_SECRET = settings.stripe_webhook_secret


class CreateCheckoutRequest(BaseModel):
    promo_code: Optional[str] = None


@router.post("/create-checkout")
async def create_checkout_session(
    body: CreateCheckoutRequest,
    user: dict = Depends(require_auth()),
):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Pull email directly from the JWT claims — always present, never null
    user_email = user.get("email") or ""

    db = get_supabase()

    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, name, stripe_customer_id, stripe_subscription_id, status")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found — please complete the application first")

    shop = shop_resp.data[0]

    # Already subscribed and active
    if shop.get("stripe_subscription_id") and shop.get("status") == "active":
        raise HTTPException(status_code=400, detail="Shop already has an active subscription")

    try:
        stripe_customer_id = shop.get("stripe_customer_id")

        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user_email,           # ← from JWT, not shop table
                name=shop.get("name", ""),
                metadata={"shop_id": shop["id"], "owner_id": user_id},
            )
            stripe_customer_id = customer.id
            db.get_service_client().table("shops").update(
                {"stripe_customer_id": stripe_customer_id}
            ).eq("id", shop["id"]).execute()

        session_params = {
            "customer": stripe_customer_id,
            "payment_method_types": ["card"],
            "line_items": [{"price": PRICE_ID, "quantity": 1}],
            "mode": "subscription",
            "success_url": f"{settings.frontend_url}/shop-owner/subscribe?success=true",
            "cancel_url":  f"{settings.frontend_url}/shop-owner/subscribe?cancelled=true",
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
            except Exception as e:
                logger.warning(f"[Billing] Promo code lookup failed: {e}")

        session = stripe.checkout.Session.create(**session_params)
        logger.info(f"[Billing] Checkout session created for shop {shop['id']}")
        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.StripeError as e:
        logger.error(f"[Billing] Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
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
    event_type = event["type"]
    logger.info(f"[Billing] Webhook received: {event_type}")

    if event_type in ("checkout.session.completed", "customer.subscription.created"):
        if event_type == "checkout.session.completed":
            session         = event["data"]["object"]
            shop_id         = session["metadata"].get("shop_id")
            owner_id        = session["metadata"].get("owner_id")
            subscription_id = session.get("subscription")
        else:
            sub             = event["data"]["object"]
            shop_id         = sub["metadata"].get("shop_id")
            owner_id        = sub["metadata"].get("owner_id")
            subscription_id = sub["id"]

        if shop_id and subscription_id:
            sub_obj  = stripe.Subscription.retrieve(subscription_id)
            price_id = sub_obj["items"]["data"][0]["price"]["id"] if sub_obj["items"]["data"] else PRICE_ID

            db.get_service_client().table("shops").update({
                "stripe_subscription_id": subscription_id,
                "subscription_status":    "active",
                "subscription_price_id":  price_id,
                "status":                 "active",
            }).eq("id", shop_id).execute()

            if owner_id:
                try:
                    db.get_service_client().auth.admin.update_user_by_id(
                        owner_id,
                        {"user_metadata": {"role": "shop_owner"}},
                    )
                    logger.info(f"[Billing] Promoted user {owner_id} to shop_owner")
                except Exception as e:
                    logger.warning(f"[Billing] Could not promote user role: {e}")

            logger.info(f"[Billing] Shop {shop_id} ACTIVATED via payment ✓")

    elif event_type == "customer.subscription.updated":
        sub     = event["data"]["object"]
        shop_id = sub["metadata"].get("shop_id")
        if shop_id:
            stripe_status = sub["status"]
            db.get_service_client().table("shops").update({
                "subscription_status": stripe_status,
            }).eq("id", shop_id).execute()
            logger.info(f"[Billing] Shop {shop_id} subscription updated: {stripe_status}")

    elif event_type == "customer.subscription.deleted":
        sub     = event["data"]["object"]
        shop_id = sub["metadata"].get("shop_id")
        if shop_id:
            db.get_service_client().table("shops").update({
                "subscription_status":    "cancelled",
                "stripe_subscription_id": None,
            }).eq("id", shop_id).execute()
            logger.info(f"[Billing] Shop {shop_id} subscription cancelled")

    elif event_type == "invoice.payment_failed":
        invoice     = event["data"]["object"]
        customer_id = invoice.get("customer")
        if customer_id:
            db.get_service_client().table("shops").update({
                "subscription_status": "past_due",
            }).eq("stripe_customer_id", customer_id).execute()
            logger.warning(f"[Billing] Payment failed for Stripe customer {customer_id}")

    return {"received": True}


@router.get("/status")
async def get_subscription_status(user: dict = Depends(require_auth())):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_supabase()
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, subscription_status, stripe_subscription_id, stripe_customer_id, status")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop = shop_resp.data[0]
    return {
        "subscribed":      shop.get("subscription_status") == "active",
        "status":          shop.get("subscription_status") or "none",
        "shop_status":     shop.get("status"),
        "subscription_id": shop.get("stripe_subscription_id"),
    }


@router.post("/portal")
async def create_billing_portal(user: dict = Depends(require_auth())):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_supabase()
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, stripe_customer_id")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
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
        raise HTTPException(status_code=500, detail=str(e))
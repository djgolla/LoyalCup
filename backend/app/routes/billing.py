"""
Stripe Billing — Shop owner subscription management.
Idempotent webhook handling: each event type is safe to receive multiple times.
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
    user_id    = user.get("sub")
    user_email = user.get("email") or ""

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not PRICE_ID:
        raise HTTPException(status_code=500, detail="Subscription price not configured")

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
            db.get_service_client().table("shops").update(
                {"stripe_customer_id": stripe_customer_id}
            ).eq("id", shop["id"]).execute()

        session_params = {
            "customer":             stripe_customer_id,
            "payment_method_types": ["card"],
            "line_items":           [{"price": PRICE_ID, "quantity": 1}],
            "mode":                 "subscription",
            "success_url":          f"{settings.frontend_url}/shop-owner/subscribe?success=true",
            "cancel_url":           f"{settings.frontend_url}/shop-owner/subscribe?cancelled=true",
            "metadata":             {"shop_id": shop["id"], "owner_id": user_id},
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

    db         = get_supabase()
    event_type = event["type"]
    logger.info(f"[Billing] Webhook: {event_type}")

    # ── Subscription activated ────────────────────────────────────────────────
    # We handle BOTH checkout.session.completed (first sub) AND
    # customer.subscription.created (in case session event arrives late).
    # Both are idempotent — we check current shop status before writing.
    if event_type in ("checkout.session.completed", "customer.subscription.created"):
        if event_type == "checkout.session.completed":
            obj             = event["data"]["object"]
            shop_id         = obj["metadata"].get("shop_id")
            owner_id        = obj["metadata"].get("owner_id")
            subscription_id = obj.get("subscription")
        else:
            obj             = event["data"]["object"]
            shop_id         = obj["metadata"].get("shop_id")
            owner_id        = obj["metadata"].get("owner_id")
            subscription_id = obj["id"]

        if not shop_id or not subscription_id:
            logger.warning(f"[Billing] {event_type} missing shop_id or subscription_id")
            return {"received": True}

        # Idempotency check — skip if already active with this subscription
        current = (
            db.get_service_client()
            .table("shops")
            .select("status, stripe_subscription_id")
            .eq("id", shop_id)
            .limit(1)
            .execute()
        )
        if current.data:
            c = current.data[0]
            if c.get("stripe_subscription_id") == subscription_id and c.get("status") == "active":
                logger.info(f"[Billing] Shop {shop_id} already active — skipping duplicate event")
                return {"received": True}

        try:
            sub_obj  = stripe.Subscription.retrieve(subscription_id)
            price_id = (
                sub_obj["items"]["data"][0]["price"]["id"]
                if sub_obj["items"]["data"] else PRICE_ID
            )
        except Exception as e:
            logger.warning(f"[Billing] Could not retrieve subscription {subscription_id}: {e}")
            price_id = PRICE_ID

        db.get_service_client().table("shops").update({
            "stripe_subscription_id": subscription_id,
            "subscription_status":    "active",
            "subscription_price_id":  price_id,
            "status":                 "active",
        }).eq("id", shop_id).execute()

        # Promote user role to shop_owner (safe to call if already shop_owner)
        if owner_id:
            try:
                db.get_service_client().auth.admin.update_user_by_id(
                    owner_id,
                    {"user_metadata": {"role": "shop_owner"}},
                )
                logger.info(f"[Billing] User {owner_id} promoted to shop_owner")
            except Exception as e:
                logger.warning(f"[Billing] Could not promote user role: {e}")

        logger.info(f"[Billing] Shop {shop_id} ACTIVATED ✓")

    # ── Subscription updated (plan change, renewal, etc.) ─────────────────────
    elif event_type == "customer.subscription.updated":
        sub     = event["data"]["object"]
        shop_id = sub["metadata"].get("shop_id")
        if shop_id:
            stripe_status = sub["status"]
            # Map Stripe statuses to our shop statuses
            shop_status_map = {
                "active":   "active",
                "past_due": "active",   # still active, just payment failed — handled by invoice.payment_failed
                "canceled": "cancelled",
                "unpaid":   "suspended",
            }
            update = {"subscription_status": stripe_status}
            if stripe_status in ("canceled", "unpaid"):
                update["status"] = shop_status_map.get(stripe_status, "suspended")
            db.get_service_client().table("shops").update(update).eq("id", shop_id).execute()
            logger.info(f"[Billing] Shop {shop_id} subscription → {stripe_status}")

    # ── Subscription cancelled ────────────────────────────────────────────────
    elif event_type == "customer.subscription.deleted":
        sub     = event["data"]["object"]
        shop_id = sub["metadata"].get("shop_id")
        if shop_id:
            db.get_service_client().table("shops").update({
                "subscription_status":    "cancelled",
                "stripe_subscription_id": None,
            }).eq("id", shop_id).execute()
            logger.info(f"[Billing] Shop {shop_id} subscription cancelled")

    # ── Payment failed → mark past_due ───────────────────────────────────────
    elif event_type == "invoice.payment_failed":
        invoice     = event["data"]["object"]
        customer_id = invoice.get("customer")
        if customer_id:
            db.get_service_client().table("shops").update({
                "subscription_status": "past_due",
            }).eq("stripe_customer_id", customer_id).execute()
            logger.warning(f"[Billing] Payment failed for Stripe customer {customer_id}")

    # ── Payment succeeded → clear past_due ───────────────────────────────────
    elif event_type == "invoice.payment_succeeded":
        invoice     = event["data"]["object"]
        customer_id = invoice.get("customer")
        if customer_id and invoice.get("billing_reason") == "subscription_cycle":
            db.get_service_client().table("shops").update({
                "subscription_status": "active",
                "status":              "active",
            }).eq("stripe_customer_id", customer_id).execute()
            logger.info(f"[Billing] Renewal payment succeeded for {customer_id}")

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
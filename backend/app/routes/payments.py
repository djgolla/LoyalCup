"""
Stripe payment routes for order checkout.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
import stripe
import os
from app.utils.security import require_auth
from app.database import get_supabase

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(
    prefix="/api/v1/payments",
    tags=["payments"],
)


class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    price: float
    name: str


class CreatePaymentIntentRequest(BaseModel):
    shop_id: str
    items: List[OrderItem]
    total: float


@router.post("/create-payment-intent")
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    user: dict = Depends(require_auth())
):
    """
    Create a Stripe Payment Intent for order checkout.
    Returns client_secret for mobile app to complete payment.
    """
    try:
        user_id = user.get("sub")
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(request.total * 100),  # Convert to cents
            currency="usd",
            metadata={
                "user_id": user_id,
                "shop_id": request.shop_id,
                "items": str([item.dict() for item in request.items])
            },
            automatic_payment_methods={"enabled": True},
        )
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(
    stripe_signature: str = Header(None, alias="stripe-signature")
):
    """
    Handle Stripe webhook events.
    Creates order in database after successful payment.
    """
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    try:
        # This would be the raw body in production
        # For now, just handle the event
        event = stripe.Event.construct_from(
            stripe.Webhook.construct_event(
                payload=request.body,
                sig_header=stripe_signature,
                secret=webhook_secret
            ),
            stripe.api_key
        )
        
        # Handle successful payment
        if event.type == "payment_intent.succeeded":
            payment_intent = event.data.object
            
            # Get metadata
            user_id = payment_intent.metadata.get("user_id")
            shop_id = payment_intent.metadata.get("shop_id")
            items = eval(payment_intent.metadata.get("items"))
            
            # Create order in database
            db = get_supabase()
            order_data = {
                "shop_id": shop_id,
                "customer_id": user_id,
                "items": items,
                "total": payment_intent.amount / 100,
                "status": "pending",
                "payment_intent_id": payment_intent.id,
                "payment_status": "paid"
            }
            
            result = await db.execute_query(
                table="orders",
                operation="insert",
                data=order_data
            )
            
            return {"status": "success"}
        
        return {"status": "ignored"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
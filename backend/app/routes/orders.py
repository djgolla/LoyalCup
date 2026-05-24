"""
Order routes.

POST /api/v1/orders  — mobile customer places order (Square payment required)
GET  /api/v1/orders  — customer order list
GET  /api/v1/orders/history
GET  /api/v1/orders/{order_id}
GET  /api/v1/orders/{order_id}/status
POST /api/v1/orders/{order_id}/cancel
GET  /api/v1/shops/{shop_id}/orders      — shop owner / worker view
GET  /api/v1/shops/{shop_id}/orders/queue
PUT  /api/v1/shops/{shop_id}/orders/{order_id}/status — shop updates status
"""
import logging
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel, validator

from app.services.order_service import order_service
from app.services.square_order_service import process_payment
from app.services.export_service import export_service
from app.services.email_service import email_service
from app.services.push_service import send_order_push
from app.utils.security import require_auth, require_shop_worker
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["orders"])
logger = logging.getLogger(__name__)


class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    unit_price: float           # price customer sees (may override base_price)
    base_price: float = 0.0    # fallback
    customizations: List[dict] = []


class CreateOrderRequest(BaseModel):
    shop_id:                  str
    items:                    List[OrderItem]
    payment_nonce:            str             # Square nonce — required for mobile ordering
    loyalty_points_to_redeem: int = 0
    customer_note:            Optional[str] = None

    @validator("items")
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v

    @validator("payment_nonce")
    def nonce_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Payment nonce is required. All orders must be paid via Square.")
        return v


class UpdateStatusRequest(BaseModel):
    status: str


@router.post("/orders")
async def create_order(
    request: CreateOrderRequest,
    user: dict = Depends(require_auth()),
):
    """
    Mobile customer places + pays for an order.
    - Validates shop is active and accepting orders
    - Validates Square is connected with a location
    - Charges customer via Square (creates Square order + payment)
    - Saves order as 'confirmed' in Supabase
    - Sends confirmation email
    """
    customer_id = user.get("sub")
    if not customer_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_supabase()
    order_service.db = db

    # ── Validate shop ─────────────────────────────────────────────────────────
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, name, status, mobile_ordering_enabled")
        .eq("id", request.shop_id)
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_resp.data[0]

    if shop.get("status") != "active":
        raise HTTPException(status_code=400, detail="This shop is not currently active")
    if not shop.get("mobile_ordering_enabled", True):
        raise HTTPException(
            status_code=400,
            detail="Mobile ordering is currently disabled for this shop. Please order in-store."
        )

    # ── Validate Square is connected + has location ───────────────────────────
    pos_resp = (
        db.get_service_client()
        .table("pos_connections")
        .select("status, location_id, access_token")
        .eq("shop_id", request.shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )
    if not pos_resp.data or pos_resp.data[0].get("status") != "connected":
        raise HTTPException(
            status_code=503,
            detail="This shop's payment system is not set up yet. Please contact the shop."
        )
    if not pos_resp.data[0].get("location_id"):
        raise HTTPException(
            status_code=503,
            detail="This shop hasn't finished configuring their Square location. Please contact the shop."
        )

    # ── Validate loyalty redemption ───────────────────────────────────────────
    loyalty_discount_cents = 0
    actual_balance = 0
    if request.loyalty_points_to_redeem > 0:
        loyalty_resp = (
            db.get_service_client()
            .table("loyalty_balances")
            .select("points_balance")
            .eq("customer_id", customer_id)
            .eq("shop_id", request.shop_id)
            .limit(1)
            .execute()
        )
        actual_balance = (loyalty_resp.data[0].get("points_balance") or 0) if loyalty_resp.data else 0
        if request.loyalty_points_to_redeem > actual_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient loyalty points. You have {actual_balance} points."
            )
        loyalty_discount_cents = request.loyalty_points_to_redeem  # 1 point = 1 cent

    items_data = [item.dict() for item in request.items]

    # ── Process Square payment ────────────────────────────────────────────────
    try:
        payment_result = await process_payment(
            db=db,
            shop_id=request.shop_id,
            loyalcup_order_id="pending",     # updated after order insert
            items=items_data,
            payment_nonce=request.payment_nonce,
            loyalty_discount_cents=loyalty_discount_cents,
            customer_note=request.customer_note,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"[Orders] Square payment failed: {e}")
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        logger.exception(f"[Orders] Unexpected payment error: {e}")
        raise HTTPException(status_code=500, detail="Payment processing failed. Please try again.")

    charged_cents     = payment_result["charged_cents"]
    tax_cents         = payment_result["tax_cents"]
    total_cents       = payment_result["total_cents"]
    square_order_id   = payment_result["square_order_id"]
    square_payment_id = payment_result.get("square_payment_id")
    currency          = payment_result["currency"]

    # ── Save order to Supabase as 'confirmed' (paid) ──────────────────────────
    try:
        order = await order_service.create_order(
            shop_id=request.shop_id,
            customer_id=customer_id,
            items=items_data,
            status="confirmed",                          # ← paid, waiting to be made
            subtotal=round((total_cents - tax_cents) / 100, 2),
            tax=round(tax_cents / 100, 2),
            total=round(charged_cents / 100, 2),
            metadata={
                "square_order_id":         square_order_id,
                "square_payment_id":       square_payment_id,
                "pos_provider":            "square",
                "currency":                currency,
                "loyalty_points_redeemed": request.loyalty_points_to_redeem,
                "customer_note":           request.customer_note,
            },
        )
    except Exception as e:
        # Payment went through but order save failed — log critically
        logger.critical(
            f"[Orders] PAYMENT CHARGED but order save FAILED. "
            f"square_payment_id={square_payment_id} square_order_id={square_order_id} "
            f"customer={customer_id} shop={request.shop_id} error={e}"
        )
        raise HTTPException(
            status_code=500,
            detail="Payment was processed but we couldn't save your order. Please contact support immediately."
        )

    order_id = order["id"]

    # ── Deduct loyalty points ─────────────────────────────────────────────────
    if request.loyalty_points_to_redeem > 0:
        try:
            db.get_service_client().table("loyalty_balances").update({
                "points_balance": actual_balance - request.loyalty_points_to_redeem
            }).eq("customer_id", customer_id).eq("shop_id", request.shop_id).execute()

            db.get_service_client().table("loyalty_transactions").insert({
                "customer_id": customer_id,
                "shop_id":     request.shop_id,
                "order_id":    order_id,
                "type":        "redeem",
                "points":      -request.loyalty_points_to_redeem,
                "description": f"Redeemed {request.loyalty_points_to_redeem} points",
            }).execute()
        except Exception as e:
            logger.warning(f"[Orders] Loyalty deduction failed for order {order_id}: {e}")

    # ── Confirmation email ────────────────────────────────────────────────────
    try:
        customer_email = user.get("email")
        if customer_email:
            await email_service.send_order_confirmation_rich(
                to_email=customer_email,
                order_id=order_id,
                shop_name=shop["name"],
                items=items_data,
                subtotal=round((total_cents - tax_cents) / 100, 2),
                tax=round(tax_cents / 100, 2),
                total=round(charged_cents / 100, 2),
                customer_note=request.customer_note,
            )
    except Exception as e:
        logger.warning(f"[Orders] Confirmation email failed: {e}")

    logger.info(
        f"[Orders] Order {order_id} created — "
        f"shop={request.shop_id} total=${charged_cents/100:.2f} "
        f"square_payment={square_payment_id}"
    )

    return {
        "order":             order,
        "order_id":          order_id,
        "square_order_id":   square_order_id,
        "square_payment_id": square_payment_id,
        "total_charged":     round(charged_cents / 100, 2),
        "status":            "confirmed",
        "message":           "Order placed! Your barista has been notified.",
    }


@router.get("/orders")
async def get_customer_orders(
    user: dict = Depends(require_auth()),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        order_service.db = db
        orders = await order_service.list_orders(customer_id=customer_id, status=status, limit=limit)
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/history")
async def get_customer_order_history(
    user: dict = Depends(require_auth()),
    limit: int = Query(20, le=100),
):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        order_service.db = db
        orders = await order_service.get_order_history(customer_id=customer_id, limit=limit)
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, user: dict = Depends(require_auth())):
    try:
        db = get_supabase()
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        customer_id = user.get("sub")
        user_role = user.get("user_metadata", {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in ["admin", "shop_worker", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Access denied")
        return {"order": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}/status")
async def get_order_status(order_id: str, user: dict = Depends(require_auth())):
    try:
        db = get_supabase()
        order_service.db = db
        order = await order_service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        customer_id = user.get("sub")
        user_role = user.get("user_metadata", {}).get("role", "customer")
        if order.get("customer_id") != customer_id and user_role not in ["admin", "shop_worker", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Access denied")
        return {"status": order.get("status"), "updated_at": order.get("updated_at")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(require_auth())):
    try:
        customer_id = user.get("sub")
        db = get_supabase()
        order_service.db = db
        order = await order_service.cancel_order(order_id, customer_id)
        return {"message": "Order cancelled", "order": order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders")
async def get_shop_orders(
    shop_id: str,
    user: dict = Depends(require_shop_worker()),
    status: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = Query(100, le=200),
):
    try:
        db = get_supabase()
        order_service.db = db
        orders = await order_service.get_shop_orders(shop_id=shop_id, status=status, limit=limit)
        if date:
            orders = [o for o in orders if o.get("created_at", "").startswith(date)]
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/orders/queue")
async def get_order_queue(shop_id: str, user: dict = Depends(require_shop_worker())):
    try:
        db = get_supabase()
        order_service.db = db
        # 'confirmed' is the new 'pending' for paid mobile orders
        result = {"confirmed": [], "pending": [], "accepted": [], "preparing": [], "ready": []}
        for status_key in result.keys():
            orders = await order_service.get_shop_orders(shop_id=shop_id, status=status_key, limit=50)
            result[status_key] = orders
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/shops/{shop_id}/orders/{order_id}/status")
async def update_order_status(
    shop_id: str,
    order_id: str,
    request: UpdateStatusRequest,
    user: dict = Depends(require_shop_worker()),
):
    try:
        db = get_supabase()
        order_service.db = db

        order_before = await order_service.get_order(order_id)
        if not order_before:
            raise HTTPException(status_code=404, detail="Order not found")
        if order_before.get("shop_id") != shop_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this shop")

        updated_order = await order_service.update_order_status(order_id, request.status)
        shop_name     = order_before.get("shops", {}).get("name", "the shop")
        customer_id   = order_before.get("customer_id")

        # Email notifications for key statuses
        try:
            if request.status in {"accepted", "ready", "cancelled"}:
                customer_email = order_before.get("customer", {}).get("email")
                if customer_email:
                    await email_service.send_order_status_update_rich(
                        to_email=customer_email,
                        order_id=order_id,
                        shop_name=shop_name,
                        status=request.status,
                        items=order_before.get("items", []),
                        total=float(order_before.get("total", 0)),
                    )
        except Exception as e:
            logger.warning(f"[Orders] Status email failed: {e}")

        # Push notification to customer
        try:
            if customer_id:
                profile_res = (
                    db.get_service_client()
                    .table("profiles")
                    .select("push_token")
                    .eq("id", customer_id)
                    .single()
                    .execute()
                )
                push_token = (profile_res.data or {}).get("push_token")
                if push_token:
                    await send_order_push(
                        push_token=push_token,
                        order_id=order_id,
                        status=request.status,
                        shop_name=shop_name,
                    )
        except Exception as e:
            logger.warning(f"[Orders] Push notification failed: {e}")

        return {"message": "Status updated", "order": updated_order}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
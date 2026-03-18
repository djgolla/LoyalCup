"""
Awards loyalty points after a confirmed payment.
Mirrors the logic in the mobile loyaltyService.js but runs server-side
so it's authoritative and can't be bypassed.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

GLOBAL_POINTS_PER_DOLLAR = 10
DEFAULT_SHOP_POINTS_PER_DOLLAR = 5


async def award_points_for_order(
    *,
    db,
    order_id: str,
    customer_id: str,
    shop_id: str,
    order_total: float,
) -> dict:
    """Award global or shop-specific points based on shop settings."""
    try:
        # Get shop loyalty settings
        settings_resp = (
            db.get_service_client()
            .table("shop_loyalty_settings")
            .select("*")
            .eq("shop_id", shop_id)
            .limit(1)
            .execute()
        )
        settings = settings_resp.data[0] if settings_resp.data else None

        use_global       = not settings or settings.get("use_global_system", True)
        points_per_dollar = (
            GLOBAL_POINTS_PER_DOLLAR
            if use_global
            else (settings.get("points_per_dollar") or DEFAULT_SHOP_POINTS_PER_DOLLAR)
        )
        multiplier = (
            float(settings.get("bonus_multiplier", 1.0))
            if settings and settings.get("bonus_active")
            else 1.0
        )

        points_to_award = int(order_total * points_per_dollar * multiplier)
        if points_to_award <= 0:
            return {"success": True, "points": 0}

        table  = "customer_global_points" if use_global else "customer_shop_points"
        filter_kwargs = {"customer_id": customer_id}
        if not use_global:
            filter_kwargs["shop_id"] = shop_id

        # Upsert the balance
        existing_resp = (
            db.get_service_client()
            .table(table)
            .select("*")
            .eq("customer_id", customer_id)
            .__class__
        )
        # Build query dynamically
        q = db.get_service_client().table(table).select("*").eq("customer_id", customer_id)
        if not use_global:
            q = q.eq("shop_id", shop_id)
        existing_resp = q.limit(1).execute()
        existing = existing_resp.data[0] if existing_resp.data else None

        if existing:
            update_data = {
                "total_earned":    existing["total_earned"] + points_to_award,
                "current_balance": existing["current_balance"] + points_to_award,
            }
            upd = db.get_service_client().table(table).update(update_data).eq("customer_id", customer_id)
            if not use_global:
                upd = upd.eq("shop_id", shop_id)
            upd.execute()
            new_balance = existing["current_balance"] + points_to_award
        else:
            insert_data = {
                "customer_id":     customer_id,
                "total_earned":    points_to_award,
                "total_spent":     0,
                "current_balance": points_to_award,
            }
            if not use_global:
                insert_data["shop_id"] = shop_id
            ins_resp = (
                db.get_service_client()
                .table(table)
                .insert(insert_data)
                .select()
                .single()
                .execute()
            )
            new_balance = ins_resp.data["current_balance"]

        # Record transaction
        txn: dict = {
            "customer_id":  customer_id,
            "shop_id":      shop_id,
            "order_id":     order_id,
            "type":         "earned",
            "points_type":  "global" if use_global else "shop",
            "amount":       points_to_award,
            "balance_after": new_balance,
            "description":  f"Earned from order",
        }
        db.get_service_client().table("points_transactions").insert(txn).execute()

        logger.info(f"[Loyalty] Awarded {points_to_award} points to customer {customer_id}")
        return {"success": True, "points": points_to_award}

    except Exception as e:
        logger.exception(f"[Loyalty] Failed to award points for order {order_id}: {e}")
        return {"success": False, "error": str(e)}
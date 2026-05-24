"""
Awards loyalty points after a confirmed payment.
Uses customer_global_points / customer_shop_points — matches real schema.
"""
import logging

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
        settings_resp = (
            db.get_service_client()
            .table("shop_loyalty_settings")
            .select("*")
            .eq("shop_id", shop_id)
            .limit(1)
            .execute()
        )
        settings = settings_resp.data[0] if settings_resp.data else None

        use_global = not settings or settings.get("use_global_system", True)
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

        if use_global:
            table = "customer_global_points"
            q = (
                db.get_service_client()
                .table(table)
                .select("*")
                .eq("customer_id", customer_id)
                .limit(1)
                .execute()
            )
        else:
            table = "customer_shop_points"
            q = (
                db.get_service_client()
                .table(table)
                .select("*")
                .eq("customer_id", customer_id)
                .eq("shop_id", shop_id)
                .limit(1)
                .execute()
            )

        existing = q.data[0] if q.data else None

        if existing:
            update_data = {
                "total_earned": existing["total_earned"] + points_to_award,
                "current_balance": existing["current_balance"] + points_to_award,
            }
            upd = (
                db.get_service_client()
                .table(table)
                .update(update_data)
                .eq("customer_id", customer_id)
            )
            if not use_global:
                upd = upd.eq("shop_id", shop_id)
            upd.execute()
            new_balance = existing["current_balance"] + points_to_award
        else:
            insert_data = {
                "customer_id": customer_id,
                "total_earned": points_to_award,
                "total_spent": 0,
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

        # Record transaction in points_transactions
        # customer_id, shop_id, order_id, type, points_type, amount, balance_after, description all exist
        txn = {
            "customer_id": customer_id,
            "shop_id": shop_id,
            "order_id": order_id,
            "type": "earned",
            "points_type": "global" if use_global else "shop",
            "amount": points_to_award,
            "balance_after": new_balance,
            "description": "Earned from order",
        }
        db.get_service_client().table("points_transactions").insert(txn).execute()

        logger.info(f"[Loyalty] Awarded {points_to_award} pts to customer {customer_id}")
        return {"success": True, "points": points_to_award}

    except Exception as e:
        logger.exception(f"[Loyalty] Failed to award points for order {order_id}: {e}")
        return {"success": False, "error": str(e)}
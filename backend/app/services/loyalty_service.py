"""
Loyalty engine — single source of truth.

SHOP-SPECIFIC ONLY. There is no global/cross-shop program. Every shop runs its
own loyalty program; points earned at a shop are only redeemable at that shop.

Pending points model:
  - current_balance = redeemable/available points only
  - pending_balance = earned points waiting to become redeemable
  - earned transactions are inserted with status='pending'
  - available_at controls when pending points release
  - release_available_points() lazily moves eligible pending points into current_balance

Tables:
  - shop_loyalty_settings
  - customer_shop_points
  - points_transactions
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

DEFAULT_PPD = 10
DEFAULT_MIN_PTS = 200
DEFAULT_POINT_VALUE = 0.005

PENDING_REDEEM_DELAY_MINUTES = 15
_MAX_RETRIES = 5


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _available_at_iso() -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=PENDING_REDEEM_DELAY_MINUTES)).isoformat()


def get_shop_config(db, shop_id: str) -> Dict[str, Any]:
    """
    Return the effective loyalty config for a shop.
    If the shop has no settings row yet, returns platform defaults.
    """
    try:
        resp = (
            db.get_service_client()
            .table("shop_loyalty_settings")
            .select("*")
            .eq("shop_id", shop_id)
            .limit(1)
            .execute()
        )
        row = resp.data[0] if resp.data else None
    except Exception as e:
        logger.warning(f"[Loyalty] shop_loyalty_settings read failed for {shop_id}: {e}")
        row = None

    if not row:
        return {
            "shop_id": shop_id,
            "points_per_dollar": DEFAULT_PPD,
            "min_redemption_points": DEFAULT_MIN_PTS,
            "points_to_dollar_value": DEFAULT_POINT_VALUE,
            "bonus_active": False,
            "bonus_multiplier": 1.0,
            "bonus_description": None,
            "is_active": True,
        }

    return {
        "shop_id": shop_id,
        "points_per_dollar": int(row.get("points_per_dollar") or DEFAULT_PPD),
        "min_redemption_points": int(row.get("min_redemption_points") or DEFAULT_MIN_PTS),
        "points_to_dollar_value": float(row.get("points_to_dollar_value") or DEFAULT_POINT_VALUE),
        "bonus_active": bool(row.get("bonus_active", False)),
        "bonus_multiplier": float(row.get("bonus_multiplier") or 1.0),
        "bonus_description": row.get("bonus_description"),
        "is_active": bool(row.get("is_active", True)),
    }


def compute_redemption(
    *,
    config: Dict[str, Any],
    subtotal_cents: int,
    points_balance: int,
    requested_points: int,
) -> Dict[str, Any]:
    """
    Validate a redemption request against config + cart + available balance.
    Pending points are intentionally excluded before this function is called.
    """
    step = max(1, int(config["min_redemption_points"]))
    point_val = float(config["points_to_dollar_value"])
    cents_per_pt = point_val * 100.0

    max_by_cart = int(subtotal_cents / cents_per_pt) if cents_per_pt > 0 else 0
    abs_max = min(points_balance, max_by_cart)
    abs_max = (abs_max // step) * step

    valid = True
    reason: Optional[str] = None

    if requested_points <= 0:
        applied = 0
    elif requested_points > points_balance:
        valid, reason, applied = False, f"You only have {points_balance} points.", 0
    elif requested_points < step:
        valid, reason, applied = False, f"Minimum redemption is {step} points.", 0
    elif requested_points % step != 0:
        valid, reason, applied = False, f"Must redeem in multiples of {step} points.", 0
    elif requested_points > abs_max:
        valid, reason, applied = False, f"Can only redeem up to {abs_max} points on this order.", 0
    else:
        applied = requested_points

    discount_cents = int(round(applied * cents_per_pt))

    chips = []
    if abs_max >= step:
        for ratio in (0.25, 0.50, 0.75):
            v = int((abs_max * ratio) // step) * step
            if v > 0 and v < abs_max and v not in chips:
                chips.append(v)
        chips.append(abs_max)

    return {
        "valid": valid,
        "reason": reason,
        "applied_points": applied,
        "discount_cents": discount_cents,
        "max_redeemable_points": abs_max,
        "max_redeemable_cents": int(round(abs_max * cents_per_pt)),
        "step_points": step,
        "point_value_cents": cents_per_pt,
        "suggested_chips_points": chips,
    }


def _balance_row(db, customer_id: str, shop_id: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    table = "customer_shop_points"
    resp = (
        db.get_service_client()
        .table(table)
        .select("*")
        .eq("customer_id", customer_id)
        .eq("shop_id", shop_id)
        .limit(1)
        .execute()
    )
    return table, (resp.data[0] if resp.data else None)


def release_available_points(
    db,
    customer_id: Optional[str] = None,
    shop_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Lazy release pending points whose available_at has passed.
    This avoids needing cron right now.
    """
    sc = db.get_service_client()
    now = _now_iso()

    query = (
        sc.table("points_transactions")
        .select("*")
        .eq("type", "earned")
        .eq("points_type", "shop")
        .eq("status", "pending")
        .lte("available_at", now)
        .order("created_at", desc=False)
        .limit(100)
    )

    if customer_id:
        query = query.eq("customer_id", customer_id)
    if shop_id:
        query = query.eq("shop_id", shop_id)

    txns = query.execute().data or []

    released_transactions = 0
    released_points = 0

    for txn in txns:
        txn_id = txn["id"]
        amount = int(txn.get("amount") or 0)

        if amount <= 0:
            continue

        claimed = (
            sc.table("points_transactions")
            .update({"status": "releasing"})
            .eq("id", txn_id)
            .eq("status", "pending")
            .execute()
        )

        if not claimed.data:
            continue

        cid = txn["customer_id"]
        sid = txn["shop_id"]
        table, row = _balance_row(db, cid, sid)

        if not row:
            ins = (
                sc.table(table)
                .insert({
                    "customer_id": cid,
                    "shop_id": sid,
                    "total_earned": amount,
                    "total_spent": 0,
                    "current_balance": amount,
                    "pending_balance": 0,
                })
                .execute()
            )
            new_balance = int((ins.data or [{}])[0].get("current_balance") or amount)
        else:
            current = int(row.get("current_balance") or 0)
            pending = int(row.get("pending_balance") or 0)

            new_balance = current + amount
            new_pending = max(0, pending - amount)

            sc.table(table).update({
                "current_balance": new_balance,
                "pending_balance": new_pending,
                "updated_at": now,
            }).eq("customer_id", cid).eq("shop_id", sid).execute()

        sc.table("points_transactions").update({
            "status": "available",
            "balance_after": new_balance,
            "metadata": {
                **(txn.get("metadata") or {}),
                "released_at": now,
            },
        }).eq("id", txn_id).execute()

        released_transactions += 1
        released_points += amount

    return {
        "released_transactions": released_transactions,
        "released_points": released_points,
    }


def get_balance(db, customer_id: str, shop_id: str) -> Dict[str, Any]:
    """
    Returns this customer's available + pending point balance at this shop.
    current_balance remains redeemable only.
    """
    release_available_points(db, customer_id=customer_id, shop_id=shop_id)

    cfg = get_shop_config(db, shop_id)
    _, row = _balance_row(db, customer_id, shop_id)

    current = int(row.get("current_balance") or 0) if row else 0
    pending = int(row.get("pending_balance") or 0) if row else 0

    return {
        "shop_id": shop_id,
        "points_type": "shop",
        "current_balance": current,
        "pending_balance": pending,
        "total_balance": current + pending,
        "total_earned": int(row.get("total_earned") or 0) if row else 0,
        "total_spent": int(row.get("total_spent") or 0) if row else 0,
        "config": cfg,
    }


async def award_points_for_order(
    *,
    db,
    order_id: str,
    customer_id: str,
    shop_id: str,
    order_total: float,
) -> Dict[str, Any]:
    """
    Award shop points as pending.
    Points show immediately but are not redeemable until available_at.
    """
    try:
        cfg = get_shop_config(db, shop_id)
        if not cfg.get("is_active", True):
            return {"success": True, "points": 0, "reason": "loyalty inactive for shop"}

        ppd = int(cfg["points_per_dollar"])
        mult = float(cfg["bonus_multiplier"]) if cfg.get("bonus_active") else 1.0

        points = int(order_total * ppd * mult)
        if points <= 0:
            return {"success": True, "points": 0}

        sc = db.get_service_client()
        now = _now_iso()
        available_at = _available_at_iso()

        existing_txn = (
            sc.table("points_transactions")
            .select("*")
            .eq("order_id", order_id)
            .eq("type", "earned")
            .eq("points_type", "shop")
            .limit(1)
            .execute()
        )

        if existing_txn.data:
            existing = existing_txn.data[0]
            existing_points = int(existing.get("amount") or 0)
            existing_status = existing.get("status")
            return {
                "success": True,
                "points": existing_points,
                "points_pending": existing_points if existing_status == "pending" else 0,
                "points_available_at": existing.get("available_at"),
                "points_type": "shop",
                "already_awarded": True,
            }

        table, existing = _balance_row(db, customer_id, shop_id)

        if existing:
            current_balance = int(existing.get("current_balance") or 0)
            pending_balance = int(existing.get("pending_balance") or 0)
            total_earned = int(existing.get("total_earned") or 0)

            sc.table(table).update({
                "pending_balance": pending_balance + points,
                "total_earned": total_earned + points,
                "updated_at": now,
            }).eq("customer_id", customer_id).eq("shop_id", shop_id).execute()

            balance_after = current_balance
        else:
            ins = (
                sc.table(table)
                .insert({
                    "customer_id": customer_id,
                    "shop_id": shop_id,
                    "total_earned": points,
                    "total_spent": 0,
                    "current_balance": 0,
                    "pending_balance": points,
                })
                .execute()
            )

            if not ins.data:
                raise RuntimeError("Loyalty balance insert returned no data")

            balance_after = 0

        sc.table("points_transactions").insert({
            "customer_id": customer_id,
            "shop_id": shop_id,
            "order_id": order_id,
            "type": "earned",
            "points_type": "shop",
            "amount": points,
            "balance_after": balance_after,
            "description": "Earned from order · pending for 15 minutes"
                + (f" ({mult:g}× bonus)" if mult != 1.0 else ""),
            "status": "pending",
            "available_at": available_at,
            "metadata": {
                "pending_minutes": PENDING_REDEEM_DELAY_MINUTES,
                "awarded_at": now,
            },
        }).execute()

        logger.info(
            f"[Loyalty] pending award customer={customer_id} shop={shop_id} "
            f"pts=+{points} available_at={available_at}"
        )

        return {
            "success": True,
            "points": points,
            "points_pending": points,
            "points_available_at": available_at,
            "points_type": "shop",
        }

    except Exception as e:
        logger.exception(f"[Loyalty] award failed order={order_id}: {e}")
        return {"success": False, "error": str(e), "points": 0}


async def redeem_points_for_order(
    *,
    db,
    order_id: str,
    customer_id: str,
    shop_id: str,
    points_to_redeem: int,
) -> Dict[str, Any]:
    """
    Deduct available shop points + write a ledger row.
    Pending points are never included in current_balance, so they cannot redeem.
    """
    if points_to_redeem <= 0:
        return {"success": True, "points": 0, "discount_cents": 0}

    release_available_points(db, customer_id=customer_id, shop_id=shop_id)

    cfg = get_shop_config(db, shop_id)
    step = int(cfg["min_redemption_points"])

    if points_to_redeem < step:
        raise ValueError(f"Minimum redemption is {step} points.")
    if points_to_redeem % step != 0:
        raise ValueError(f"Must redeem in multiples of {step} points.")

    discount_cents = int(round(points_to_redeem * float(cfg["points_to_dollar_value"]) * 100))
    new_balance = 0

    for attempt in range(_MAX_RETRIES):
        table, row = _balance_row(db, customer_id, shop_id)
        current = int(row.get("current_balance") or 0) if row else 0

        if points_to_redeem > current:
            raise ValueError(f"Insufficient points. You have {current}.")

        new_balance = current - points_to_redeem
        new_spent = int(row.get("total_spent") or 0) + points_to_redeem

        result = (
            db.get_service_client()
            .table(table)
            .update({
                "current_balance": new_balance,
                "total_spent": new_spent,
                "updated_at": _now_iso(),
            })
            .eq("customer_id", customer_id)
            .eq("shop_id", shop_id)
            .eq("current_balance", current)
            .gte("current_balance", points_to_redeem)
            .execute()
        )

        if result.data:
            break

    else:
        _, row = _balance_row(db, customer_id, shop_id)
        current = int(row.get("current_balance") or 0) if row else 0
        if points_to_redeem > current:
            raise ValueError(f"Insufficient points. You have {current}.")
        raise RuntimeError(
            f"Could not apply redemption after {_MAX_RETRIES} attempts "
            f"(concurrent conflict) customer={customer_id} shop={shop_id}"
        )

    db.get_service_client().table("points_transactions").insert({
        "customer_id": customer_id,
        "shop_id": shop_id,
        "order_id": order_id,
        "type": "redeemed",
        "points_type": "shop",
        "amount": -points_to_redeem,
        "balance_after": new_balance,
        "description": f"Redeemed {points_to_redeem} pts for ${discount_cents/100:.2f} off",
        "status": "redeemed",
        "available_at": _now_iso(),
    }).execute()

    logger.info(
        f"[Loyalty] redeem customer={customer_id} shop={shop_id} "
        f"pts=-{points_to_redeem} disc=${discount_cents/100:.2f}"
    )

    return {
        "success": True,
        "points": points_to_redeem,
        "discount_cents": discount_cents,
        "new_balance": new_balance,
        "points_type": "shop",
    }
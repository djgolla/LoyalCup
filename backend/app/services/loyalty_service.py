"""
Loyalty engine — single source of truth.

SHOP-SPECIFIC ONLY. There is no global/cross-shop program. Every shop runs its
own loyalty program; points earned at a shop are only redeemable at that shop.

Tables used (already in production schema, no migrations needed):
  - shop_loyalty_settings   (one row per shop: earn rate, redemption step, point value, bonus)
  - customer_shop_points    (per customer x shop balance)
  - points_transactions     (ledger: type in {earned, redeemed}, points_type always 'shop')

All math is integer cents. points_to_dollar_value is dollars-per-point
(e.g. 0.005 → 200 pts = $1).

Concurrency:
  award_points_for_order and redeem_points_for_order use optimistic locking.
  The UPDATE is guarded by WHERE current_balance = <value-we-read>. If a
  concurrent request changed the balance between our read and write, the
  UPDATE affects 0 rows and we retry (up to _MAX_RETRIES times). This is
  safe without any Postgres functions or schema changes.
  Redeeming additionally guards with WHERE current_balance >= points_to_redeem
  so it is physically impossible to overdraft a balance even under concurrent load.
"""
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Platform defaults applied when a shop hasn't configured its program yet.
DEFAULT_PPD          = 10
DEFAULT_MIN_PTS      = 200
DEFAULT_POINT_VALUE  = 0.005   # 200 pts = $1

_MAX_RETRIES = 5   # optimistic-lock retries for award / redeem


# ─────────────────────────────────────────────────────────────────────────────
# Config resolution
# ─────────────────────────────────────────────────────────────────────────────

def get_shop_config(db, shop_id: str) -> Dict[str, Any]:
    """
    Return the effective loyalty config for a shop.
    If the shop has no settings row yet, returns platform defaults so the program
    still works out of the box. The shop owner can override every value.
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
            "shop_id":                shop_id,
            "points_per_dollar":      DEFAULT_PPD,
            "min_redemption_points":  DEFAULT_MIN_PTS,
            "points_to_dollar_value": DEFAULT_POINT_VALUE,
            "bonus_active":           False,
            "bonus_multiplier":       1.0,
            "bonus_description":      None,
            "is_active":              True,
        }

    return {
        "shop_id":                shop_id,
        "points_per_dollar":      int(row.get("points_per_dollar")        or DEFAULT_PPD),
        "min_redemption_points":  int(row.get("min_redemption_points")    or DEFAULT_MIN_PTS),
        "points_to_dollar_value": float(row.get("points_to_dollar_value") or DEFAULT_POINT_VALUE),
        "bonus_active":           bool(row.get("bonus_active", False)),
        "bonus_multiplier":       float(row.get("bonus_multiplier") or 1.0),
        "bonus_description":      row.get("bonus_description"),
        "is_active":              bool(row.get("is_active", True)),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Redemption math
# ─────────────────────────────────────────────────────────────────────────────

def compute_redemption(
    *,
    config: Dict[str, Any],
    subtotal_cents: int,
    points_balance: int,
    requested_points: int,
) -> Dict[str, Any]:
    """
    Validate a redemption request against config + cart + balance.
    Returns dict with applied_points, discount_cents, suggested chips, etc.
    Pure math — no DB writes.
    """
    step         = max(1, int(config["min_redemption_points"]))
    point_val    = float(config["points_to_dollar_value"])   # dollars per point
    cents_per_pt = point_val * 100.0

    max_by_cart = int(subtotal_cents / cents_per_pt) if cents_per_pt > 0 else 0
    abs_max     = min(points_balance, max_by_cart)
    abs_max     = (abs_max // step) * step   # snap down to nearest step

    valid  = True
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

    chips: list = []
    if abs_max >= step:
        for ratio in (0.25, 0.50, 0.75):
            v = int((abs_max * ratio) // step) * step
            if v > 0 and v < abs_max and v not in chips:
                chips.append(v)
        chips.append(abs_max)

    return {
        "valid":                   valid,
        "reason":                  reason,
        "applied_points":          applied,
        "discount_cents":          discount_cents,
        "max_redeemable_points":   abs_max,
        "max_redeemable_cents":    int(round(abs_max * cents_per_pt)),
        "step_points":             step,
        "point_value_cents":       cents_per_pt,
        "suggested_chips_points":  chips,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Balance helpers
# ─────────────────────────────────────────────────────────────────────────────

def _balance_row(db, customer_id: str, shop_id: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Return (table_name, row_or_none) for this customer's balance at this shop."""
    table = "customer_shop_points"
    resp = (
        db.get_service_client().table(table)
        .select("*").eq("customer_id", customer_id).eq("shop_id", shop_id).limit(1)
        .execute()
    )
    return table, (resp.data[0] if resp.data else None)


def get_balance(db, customer_id: str, shop_id: str) -> Dict[str, Any]:
    """Returns this customer's point balance at this shop."""
    cfg    = get_shop_config(db, shop_id)
    _, row = _balance_row(db, customer_id, shop_id)

    return {
        "shop_id":         shop_id,
        "points_type":     "shop",
        "current_balance": int(row["current_balance"])          if row else 0,
        "total_earned":    int(row.get("total_earned") or 0)    if row else 0,
        "total_spent":     int(row.get("total_spent") or 0)     if row else 0,
        "config":          cfg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Earning  —  optimistic locking, up to _MAX_RETRIES attempts
# ─────────────────────────────────────────────────────────────────────────────

async def award_points_for_order(
    *, db, order_id: str, customer_id: str, shop_id: str, order_total: float,
) -> Dict[str, Any]:
    """
    Award shop points for an order, writing a ledger row.
    Uses optimistic locking so concurrent orders for the same customer never
    silently lose points. Never raises — failures are logged and returned as
    success=False.
    """
    try:
        cfg = get_shop_config(db, shop_id)
        if not cfg.get("is_active", True):
            return {"success": True, "points": 0, "reason": "loyalty inactive for shop"}

        ppd  = int(cfg["points_per_dollar"])
        mult = float(cfg["bonus_multiplier"]) if cfg.get("bonus_active") else 1.0

        points = int(order_total * ppd * mult)
        if points <= 0:
            return {"success": True, "points": 0}

        new_balance = 0

        for attempt in range(_MAX_RETRIES):
            table, existing = _balance_row(db, customer_id, shop_id)

            if existing:
                old_balance = int(existing["current_balance"])
                new_balance = old_balance + points
                new_earned  = int(existing.get("total_earned") or 0) + points

                # Optimistic lock: only update if balance hasn't changed since we read it.
                result = (
                    db.get_service_client().table(table)
                    .update({"current_balance": new_balance, "total_earned": new_earned})
                    .eq("customer_id", customer_id)
                    .eq("shop_id", shop_id)
                    .eq("current_balance", old_balance)   # ← optimistic lock
                    .select().execute()
                )

                if result.data:
                    new_balance = int(result.data[0]["current_balance"])
                    break   # success
                # else: concurrent write — retry with fresh read

            else:
                # First-ever order for this customer at this shop. Insert a new row.
                try:
                    ins = (
                        db.get_service_client().table(table)
                        .insert({
                            "customer_id":     customer_id,
                            "shop_id":         shop_id,
                            "total_earned":    points,
                            "total_spent":     0,
                            "current_balance": points,
                        }).select().single().execute()
                    )
                    new_balance = int(ins.data["current_balance"])
                    break   # success
                except Exception:
                    # Unique violation — another request inserted first. Retry as update.
                    if attempt < _MAX_RETRIES - 1:
                        continue
                    raise

        else:
            raise RuntimeError(
                f"Could not update loyalty balance after {_MAX_RETRIES} attempts "
                f"(concurrent conflict) customer={customer_id} shop={shop_id}"
            )

        # Write ledger row
        db.get_service_client().table("points_transactions").insert({
            "customer_id":   customer_id,
            "shop_id":       shop_id,
            "order_id":      order_id,
            "type":          "earned",
            "points_type":   "shop",
            "amount":        points,
            "balance_after": new_balance,
            "description":   "Earned from order"
                + (f" ({mult:g}× bonus)" if mult != 1.0 else ""),
        }).execute()

        logger.info(
            f"[Loyalty] award customer={customer_id} shop={shop_id} pts=+{points}"
        )
        return {"success": True, "points": points, "points_type": "shop"}

    except Exception as e:
        logger.exception(f"[Loyalty] award failed order={order_id}: {e}")
        return {"success": False, "error": str(e), "points": 0}


# ─────────────────────────────────────────────────────────────────────────────
# Redemption  —  optimistic locking + balance guard, up to _MAX_RETRIES attempts
# ─────────────────────────────────────────────────────────────────────────────

async def redeem_points_for_order(
    *, db, order_id: str, customer_id: str, shop_id: str, points_to_redeem: int,
) -> Dict[str, Any]:
    """
    Deduct shop points + write a ledger row.
    Must be called after the charge succeeded and the order row exists.

    Uses optimistic locking: the UPDATE is guarded by both the current balance
    value (so concurrent writes retry) AND current_balance >= points_to_redeem
    (so it is physically impossible to overdraft a balance even under concurrent
    load with no DB-level locking required).

    Raises ValueError on bad input or truly insufficient funds.
    Raises RuntimeError only after all retries are exhausted.
    """
    if points_to_redeem <= 0:
        return {"success": True, "points": 0, "discount_cents": 0}

    cfg  = get_shop_config(db, shop_id)
    step = int(cfg["min_redemption_points"])

    if points_to_redeem < step:
        raise ValueError(f"Minimum redemption is {step} points.")
    if points_to_redeem % step != 0:
        raise ValueError(f"Must redeem in multiples of {step} points.")

    discount_cents = int(round(points_to_redeem * float(cfg["points_to_dollar_value"]) * 100))
    new_balance    = 0

    for attempt in range(_MAX_RETRIES):
        table, row = _balance_row(db, customer_id, shop_id)
        current    = int(row["current_balance"]) if row else 0

        if points_to_redeem > current:
            raise ValueError(f"Insufficient points. You have {current}.")

        new_balance = current - points_to_redeem
        new_spent   = int(row.get("total_spent") or 0) + points_to_redeem

        # Optimistic lock + overdraft guard. Both conditions must hold.
        result = (
            db.get_service_client().table(table)
            .update({"current_balance": new_balance, "total_spent": new_spent})
            .eq("customer_id", customer_id)
            .eq("shop_id", shop_id)
            .eq("current_balance", current)           # ← optimistic lock
            .gte("current_balance", points_to_redeem) # ← overdraft guard
            .select().execute()
        )

        if result.data:
            new_balance = int(result.data[0]["current_balance"])
            break   # success
        # else: concurrent write — re-read and retry

    else:
        # After all retries, do a final fresh read to check actual balance
        _, row  = _balance_row(db, customer_id, shop_id)
        current = int(row["current_balance"]) if row else 0
        if points_to_redeem > current:
            raise ValueError(f"Insufficient points. You have {current}.")
        raise RuntimeError(
            f"Could not apply redemption after {_MAX_RETRIES} attempts "
            f"(concurrent conflict) customer={customer_id} shop={shop_id}"
        )

    # Write ledger row
    db.get_service_client().table("points_transactions").insert({
        "customer_id":   customer_id,
        "shop_id":       shop_id,
        "order_id":      order_id,
        "type":          "redeemed",
        "points_type":   "shop",
        "amount":        -points_to_redeem,
        "balance_after": new_balance,
        "description":   f"Redeemed {points_to_redeem} pts for ${discount_cents/100:.2f} off",
    }).execute()

    logger.info(
        f"[Loyalty] redeem customer={customer_id} shop={shop_id} "
        f"pts=-{points_to_redeem} disc=${discount_cents/100:.2f}"
    )
    return {
        "success":        True,
        "points":         points_to_redeem,
        "discount_cents": discount_cents,
        "new_balance":    new_balance,
        "points_type":    "shop",
    }
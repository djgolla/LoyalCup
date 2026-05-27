"""
Loyalty engine — single source of truth.

Tables used (already in production schema, no migrations needed):
  - global_loyalty_settings        (singleton row, seeded once)
  - shop_loyalty_settings          (one row per shop, use_global_system toggle)
  - customer_global_points         (per customer, cross-shop balance)
  - customer_shop_points           (per customer x shop, when shop opts out of global)
  - points_transactions            (ledger: type ∈ {earned, redeemed}, points_type ∈ {global, shop})

All math is integer cents. point_value_dollars is the numeric (e.g. 0.005 → 200 pts = $1).
"""
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Hard fallbacks if a settings row is missing for some reason
FALLBACK_GLOBAL_PPD       = 10
FALLBACK_GLOBAL_MIN_PTS   = 200
FALLBACK_POINT_VALUE      = 0.005  # 200 pts = $1


# ─────────────────────────────────────────────────────────────────────────────
# Config resolution
# ─────────────────────────────────────────────────────────────────────────────
def get_global_config(db) -> Dict[str, Any]:
    """Read the single global_loyalty_settings row, with safe defaults."""
    try:
        resp = (
            db.get_service_client()
            .table("global_loyalty_settings")
            .select("*")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if resp.data:
            row = resp.data[0]
            return {
                "points_per_dollar":      int(row.get("points_per_dollar")      or FALLBACK_GLOBAL_PPD),
                "min_redemption_points":  int(row.get("min_redemption_points")  or FALLBACK_GLOBAL_MIN_PTS),
                "points_to_dollar_value": float(row.get("points_to_dollar_value") or FALLBACK_POINT_VALUE),
                "is_active":              bool(row.get("is_active", True)),
            }
    except Exception as e:
        logger.warning(f"[Loyalty] global_loyalty_settings read failed: {e}")

    return {
        "points_per_dollar":      FALLBACK_GLOBAL_PPD,
        "min_redemption_points":  FALLBACK_GLOBAL_MIN_PTS,
        "points_to_dollar_value": FALLBACK_POINT_VALUE,
        "is_active":              True,
    }


def get_shop_config(db, shop_id: str) -> Dict[str, Any]:
    """
    Return the *effective* loyalty config for a shop.
    If the shop has no row OR opts into the global program, returns global config
    with `use_global_system=True`. Otherwise returns the shop's custom values.
    """
    glob = get_global_config(db)
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

    if not row or row.get("use_global_system", True):
        return {
            "shop_id":                shop_id,
            "use_global_system":      True,
            "points_per_dollar":      glob["points_per_dollar"],
            "min_redemption_points":  glob["min_redemption_points"],
            "points_to_dollar_value": glob["points_to_dollar_value"],
            "bonus_active":           bool(row.get("bonus_active"))            if row else False,
            "bonus_multiplier":       float(row.get("bonus_multiplier") or 1.0) if row else 1.0,
            "bonus_description":      (row.get("bonus_description")            if row else None),
            "is_active":              bool(row.get("is_active", True))          if row else True,
        }

    return {
        "shop_id":                shop_id,
        "use_global_system":      False,
        "points_per_dollar":      int(row.get("points_per_dollar")      or glob["points_per_dollar"]),
        "min_redemption_points":  int(row.get("min_redemption_points")  or glob["min_redemption_points"]),
        "points_to_dollar_value": float(row.get("points_to_dollar_value") or glob["points_to_dollar_value"]),
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
    """
    step          = max(1, int(config["min_redemption_points"]))
    point_val     = float(config["points_to_dollar_value"])  # dollars per point
    cents_per_pt  = point_val * 100.0

    # How many points cap things at the cart subtotal
    max_by_cart = int(subtotal_cents / cents_per_pt) if cents_per_pt > 0 else 0
    abs_max     = min(points_balance, max_by_cart)
    # Snap absolute max down to a step
    abs_max     = (abs_max // step) * step

    # Validate user request
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

    # 4 suggested chips (snapped, deduped, ≤ abs_max, last one = abs_max)
    chips: list[int] = []
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
def _balance_row(db, customer_id: str, shop_id: str, use_global: bool) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Return (table_name, row_or_none) for the right balance bucket."""
    if use_global:
        table = "customer_global_points"
        q = (db.get_service_client().table(table).select("*").eq("customer_id", customer_id).limit(1))
    else:
        table = "customer_shop_points"
        q = (db.get_service_client().table(table)
             .select("*").eq("customer_id", customer_id).eq("shop_id", shop_id).limit(1))
    resp = q.execute()
    return table, (resp.data[0] if resp.data else None)


def get_balance(db, customer_id: str, shop_id: str) -> Dict[str, Any]:
    """Returns the right balance bucket for this customer at this shop."""
    cfg = get_shop_config(db, shop_id)
    use_global = cfg["use_global_system"]
    _, row = _balance_row(db, customer_id, shop_id, use_global)

    return {
        "shop_id":         shop_id,
        "points_type":     "global" if use_global else "shop",
        "current_balance": int(row["current_balance"]) if row else 0,
        "total_earned":    int(row.get("total_earned") or 0) if row else 0,
        "total_spent":     int(row.get("total_spent") or 0)  if row else 0,
        "config":          cfg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Earning
# ─────────────────────────────────────────────────────────────────────────────
async def award_points_for_order(
    *, db, order_id: str, customer_id: str, shop_id: str, order_total: float,
) -> Dict[str, Any]:
    """
    Award points to the right bucket (global or per-shop), writing a ledger row.
    Called from the payments handler after Square charge succeeds.
    Never raises — failures are logged and returned as success=False.
    """
    try:
        cfg = get_shop_config(db, shop_id)
        if not cfg.get("is_active", True):
            return {"success": True, "points": 0, "reason": "loyalty inactive for shop"}

        use_global = cfg["use_global_system"]
        ppd        = int(cfg["points_per_dollar"])
        mult       = float(cfg["bonus_multiplier"]) if cfg.get("bonus_active") else 1.0

        points = int(order_total * ppd * mult)
        if points <= 0:
            return {"success": True, "points": 0}

        table, existing = _balance_row(db, customer_id, shop_id, use_global)

        if existing:
            new_balance = int(existing["current_balance"]) + points
            upd = (db.get_service_client().table(table).update({
                "total_earned":    int(existing.get("total_earned") or 0) + points,
                "current_balance": new_balance,
            }).eq("customer_id", customer_id))
            if not use_global:
                upd = upd.eq("shop_id", shop_id)
            upd.execute()
        else:
            insert = {
                "customer_id":     customer_id,
                "total_earned":    points,
                "total_spent":     0,
                "current_balance": points,
            }
            if not use_global:
                insert["shop_id"] = shop_id
            ins = db.get_service_client().table(table).insert(insert).select().single().execute()
            new_balance = int(ins.data["current_balance"])

        db.get_service_client().table("points_transactions").insert({
            "customer_id":   customer_id,
            "shop_id":       shop_id,
            "order_id":      order_id,
            "type":          "earned",
            "points_type":   "global" if use_global else "shop",
            "amount":        points,
            "balance_after": new_balance,
            "description":   "Earned from order"
                + (f" ({mult:g}× bonus)" if mult != 1.0 else ""),
        }).execute()

        logger.info(f"[Loyalty] award customer={customer_id} shop={shop_id} pts=+{points} bucket={'global' if use_global else 'shop'}")
        return {"success": True, "points": points, "points_type": "global" if use_global else "shop"}

    except Exception as e:
        logger.exception(f"[Loyalty] award failed order={order_id}: {e}")
        return {"success": False, "error": str(e), "points": 0}


# ─────────────────────────────────────────────────────────────────────────────
# Redemption — applied atomically from the payments handler
# ─────────────────────────────────────────────────────────────────────────────
async def redeem_points_for_order(
    *, db, order_id: str, customer_id: str, shop_id: str, points_to_redeem: int,
) -> Dict[str, Any]:
    """
    Deduct points + write a ledger row. Must be called *after* the charge succeeded
    and the order row exists. Caller is responsible for computing the discount.
    Re-validates against live balance + config; raises ValueError on bad state.
    """
    if points_to_redeem <= 0:
        return {"success": True, "points": 0, "discount_cents": 0}

    cfg = get_shop_config(db, shop_id)
    use_global = cfg["use_global_system"]
    step = int(cfg["min_redemption_points"])
    if points_to_redeem % step != 0:
        raise ValueError(f"Must redeem in multiples of {step} points.")
    if points_to_redeem < step:
        raise ValueError(f"Minimum redemption is {step} points.")

    table, row = _balance_row(db, customer_id, shop_id, use_global)
    current = int(row["current_balance"]) if row else 0
    if points_to_redeem > current:
        raise ValueError(f"Insufficient points. You have {current}.")

    new_balance = current - points_to_redeem
    upd = (db.get_service_client().table(table).update({
        "current_balance": new_balance,
        "total_spent":     int(row.get("total_spent") or 0) + points_to_redeem,
    }).eq("customer_id", customer_id))
    if not use_global:
        upd = upd.eq("shop_id", shop_id)
    upd.execute()

    discount_cents = int(round(points_to_redeem * float(cfg["points_to_dollar_value"]) * 100))

    db.get_service_client().table("points_transactions").insert({
        "customer_id":   customer_id,
        "shop_id":       shop_id,
        "order_id":      order_id,
        "type":          "redeemed",
        "points_type":   "global" if use_global else "shop",
        "amount":        -points_to_redeem,
        "balance_after": new_balance,
        "description":   f"Redeemed {points_to_redeem} pts for ${discount_cents/100:.2f} off",
    }).execute()

    logger.info(f"[Loyalty] redeem customer={customer_id} shop={shop_id} pts=-{points_to_redeem} disc=${discount_cents/100:.2f}")
    return {
        "success":        True,
        "points":         points_to_redeem,
        "discount_cents": discount_cents,
        "new_balance":    new_balance,
        "points_type":    "global" if use_global else "shop",
    }
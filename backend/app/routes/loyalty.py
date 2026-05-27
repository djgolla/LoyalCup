"""
Loyalty REST API.

Public:
  GET  /api/v1/loyalty/global-config
  GET  /api/v1/loyalty/shop-config/{shop_id}            ← effective config (global or custom)

Customer (auth):
  GET  /api/v1/loyalty/me                               ← global balance + per-shop balances + last 10 txns
  GET  /api/v1/loyalty/balance/{shop_id}                ← which bucket applies + balance + config
  GET  /api/v1/loyalty/transactions
  POST /api/v1/loyalty/preview-redeem                   ← dry-run; never writes

Shop owner (auth + ownership check):
  GET  /api/v1/loyalty/shop-settings/{shop_id}          ← raw row (may be null if no override)
  PUT  /api/v1/loyalty/shop-settings/{shop_id}

  GET  /api/v1/loyalty/shop-stats/{shop_id}
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.loyalty_service import (
    get_global_config,
    get_shop_config,
    get_balance,
    compute_redemption,
)
from app.utils.security import require_auth
from app.database import get_supabase

router = APIRouter(prefix="/api/v1/loyalty", tags=["loyalty"])
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────
class ShopLoyaltyUpdate(BaseModel):
    use_global_system:      bool
    points_per_dollar:      Optional[int]   = Field(None, ge=0,  le=1000)
    min_redemption_points:  Optional[int]   = Field(None, ge=1,  le=100000)
    points_to_dollar_value: Optional[float] = Field(None, gt=0,  le=1.0)
    bonus_active:           Optional[bool]  = False
    bonus_multiplier:       Optional[float] = Field(None, ge=1.0, le=10.0)
    bonus_description:      Optional[str]   = None


class PreviewRedeemBody(BaseModel):
    shop_id:          str
    subtotal_cents:   int = Field(..., ge=0)
    requested_points: int = Field(..., ge=0)


# ─────────────────────────────────────────────────────────────────────────────
# Public config
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/global-config")
async def api_global_config():
    db = get_supabase()
    return get_global_config(db)


@router.get("/shop-config/{shop_id}")
async def api_shop_config(shop_id: str):
    db = get_supabase()
    return get_shop_config(db, shop_id)


# ─────────────────────────────────────────────────────────────────────────────
# Customer
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me")
async def my_loyalty(user: dict = Depends(require_auth())):
    """Snapshot for the rewards screen."""
    customer_id = user.get("sub")
    db = get_supabase()
    sc = db.get_service_client()

    global_row = (
        sc.table("customer_global_points")
        .select("*").eq("customer_id", customer_id).limit(1).execute()
    ).data
    shop_rows = (
        sc.table("customer_shop_points")
        .select("*, shops(id, name, logo_url, color)")
        .eq("customer_id", customer_id)
        .gt("current_balance", 0)
        .execute()
    ).data or []
    txns = (
        sc.table("points_transactions")
        .select("*, shops(name, logo_url)")
        .eq("customer_id", customer_id)
        .order("created_at", desc=True)
        .limit(10).execute()
    ).data or []

    glob_cfg = get_global_config(db)

    return {
        "global": {
            "current_balance": (global_row[0]["current_balance"] if global_row else 0),
            "total_earned":    (global_row[0]["total_earned"]    if global_row else 0),
            "total_spent":     (global_row[0]["total_spent"]     if global_row else 0),
            "config":          glob_cfg,
        },
        "shops":        shop_rows,
        "transactions": txns,
    }


@router.get("/balance/{shop_id}")
async def my_balance_for_shop(shop_id: str, user: dict = Depends(require_auth())):
    """Used by checkout. Returns the *correct* bucket + effective config in one shot."""
    db = get_supabase()
    return get_balance(db, user.get("sub"), shop_id)


@router.get("/transactions")
async def my_transactions(limit: int = 50, user: dict = Depends(require_auth())):
    db = get_supabase()
    resp = (
        db.get_service_client()
        .table("points_transactions")
        .select("*, shops(name, logo_url)")
        .eq("customer_id", user.get("sub"))
        .order("created_at", desc=True)
        .limit(min(max(limit, 1), 200))
        .execute()
    )
    return {"transactions": resp.data or []}


@router.post("/preview-redeem")
async def preview_redeem(body: PreviewRedeemBody, user: dict = Depends(require_auth())):
    """Dry-run a redemption — never writes. Used by checkout UI."""
    db = get_supabase()
    bal = get_balance(db, user.get("sub"), body.shop_id)
    result = compute_redemption(
        config=bal["config"],
        subtotal_cents=body.subtotal_cents,
        points_balance=bal["current_balance"],
        requested_points=body.requested_points,
    )
    return {**result, "balance": bal["current_balance"], "config": bal["config"]}


# ─────────────────────────────────────────────────────────────────────────────
# Shop owner
# ─────────────────────────────────────────────────────────────────────────────
def _require_shop_owner(db, user_id: str, shop_id: str) -> None:
    resp = (
        db.get_service_client().table("shops").select("owner_id")
        .eq("id", shop_id).limit(1).execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    if resp.data[0]["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="You do not own this shop")


@router.get("/shop-settings/{shop_id}")
async def shop_settings_get(shop_id: str, user: dict = Depends(require_auth())):
    db = get_supabase()
    _require_shop_owner(db, user.get("sub"), shop_id)
    return get_shop_config(db, shop_id)


@router.put("/shop-settings/{shop_id}")
async def shop_settings_put(
    shop_id: str,
    body: ShopLoyaltyUpdate,
    user: dict = Depends(require_auth()),
):
    db = get_supabase()
    _require_shop_owner(db, user.get("sub"), shop_id)

    payload = {
        "shop_id":           shop_id,
        "use_global_system": body.use_global_system,
        "bonus_active":      bool(body.bonus_active),
        "bonus_multiplier":  float(body.bonus_multiplier or 1.0),
        "bonus_description": body.bonus_description,
        "is_active":         True,
    }
    if not body.use_global_system:
        if body.points_per_dollar is None or body.min_redemption_points is None or body.points_to_dollar_value is None:
            raise HTTPException(
                status_code=400,
                detail="Custom program requires points_per_dollar, min_redemption_points, and points_to_dollar_value.",
            )
        payload["points_per_dollar"]      = int(body.points_per_dollar)
        payload["min_redemption_points"]  = int(body.min_redemption_points)
        payload["points_to_dollar_value"] = float(body.points_to_dollar_value)

    sc = db.get_service_client()
    existing = sc.table("shop_loyalty_settings").select("id").eq("shop_id", shop_id).limit(1).execute()
    if existing.data:
        sc.table("shop_loyalty_settings").update(payload).eq("shop_id", shop_id).execute()
    else:
        sc.table("shop_loyalty_settings").insert(payload).execute()

    return get_shop_config(db, shop_id)


@router.get("/shop-stats/{shop_id}")
async def shop_stats(shop_id: str, user: dict = Depends(require_auth())):
    db = get_supabase()
    _require_shop_owner(db, user.get("sub"), shop_id)
    sc = db.get_service_client()

    members_resp = (
        sc.table("customer_shop_points")
        .select("customer_id", count="exact")
        .eq("shop_id", shop_id)
        .execute()
    )
    txn_resp = (
        sc.table("points_transactions")
        .select("amount, type")
        .eq("shop_id", shop_id)
        .execute()
    )
    issued   = sum(t["amount"]      for t in (txn_resp.data or []) if t["type"] == "earned")
    redeemed = sum(abs(t["amount"]) for t in (txn_resp.data or []) if t["type"] == "redeemed")
    return {
        "shop_id":        shop_id,
        "active_members": members_resp.count or 0,
        "total_issued":   issued,
        "total_redeemed": redeemed,
        "config":         get_shop_config(db, shop_id),
    }
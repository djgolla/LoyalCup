"""
Loyalty REST API.

SHOP-SPECIFIC ONLY — no global/cross-shop program.

Public:
  GET  /api/v1/loyalty/shop-config/{shop_id}     ← effective config for a shop

Customer (auth):
  GET  /api/v1/loyalty/me                         ← all per-shop balances + last 10 txns
  GET  /api/v1/loyalty/balance/{shop_id}          ← balance + config for one shop
  GET  /api/v1/loyalty/transactions
  POST /api/v1/loyalty/preview-redeem             ← dry-run; never writes

Shop owner (auth + ownership check):
  GET  /api/v1/loyalty/shop-settings/{shop_id}
  PUT  /api/v1/loyalty/shop-settings/{shop_id}
  GET  /api/v1/loyalty/shop-stats/{shop_id}
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.loyalty_service import (
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
    points_per_dollar:      int   = Field(..., ge=0, le=1000)
    min_redemption_points:  int   = Field(..., ge=1, le=100000)
    points_to_dollar_value: float = Field(..., gt=0, le=1.0)
    bonus_active:           Optional[bool]  = False
    bonus_multiplier:       Optional[float] = Field(None, ge=1.0, le=10.0)
    bonus_description:      Optional[str]   = None
    is_active:              Optional[bool]  = True


class PreviewRedeemBody(BaseModel):
    shop_id:          str
    subtotal_cents:   int = Field(..., ge=0)
    requested_points: int = Field(..., ge=0)


# ─────────────────────────────────────────────────────────────────────────────
# Public config
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/shop-config/{shop_id}")
async def api_shop_config(shop_id: str):
    db = get_supabase()
    return get_shop_config(db, shop_id)


# ─────────────────────────────────────────────────────────────────────────────
# Customer
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me")
async def my_loyalty(user: dict = Depends(require_auth())):
    """Snapshot for the rewards screen — per-shop balances + recent transactions."""
    customer_id = user.get("sub")
    db = get_supabase()
    sc = db.get_service_client()

    shop_rows = (
        sc.table("customer_shop_points")
        .select("*, shops(id, name, logo_url, color)")
        .eq("customer_id", customer_id)
        .gt("current_balance", 0)
        .order("current_balance", desc=True)
        .execute()
    ).data or []
    txns = (
        sc.table("points_transactions")
        .select("*, shops(name, logo_url)")
        .eq("customer_id", customer_id)
        .order("created_at", desc=True)
        .limit(10).execute()
    ).data or []

    return {
        "shops":        shop_rows,
        "transactions": txns,
    }


@router.get("/balance/{shop_id}")
async def my_balance_for_shop(shop_id: str, user: dict = Depends(require_auth())):
    """Used by checkout. Returns the customer's balance + effective config for one shop."""
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
        "shop_id":                shop_id,
        "points_per_dollar":      int(body.points_per_dollar),
        "min_redemption_points":  int(body.min_redemption_points),
        "points_to_dollar_value": float(body.points_to_dollar_value),
        "bonus_active":           bool(body.bonus_active),
        "bonus_multiplier":       float(body.bonus_multiplier or 1.0),
        "bonus_description":      body.bonus_description,
        "is_active":              bool(body.is_active if body.is_active is not None else True),
    }

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
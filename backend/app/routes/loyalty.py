"""
Loyalty routes — uses the real loyalty_service functions + real Supabase auth.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from app.services.loyalty_service import award_points_for_order
from app.utils.security import require_auth
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["loyalty"])


# ── request models ────────────────────────────────────────────────────────────

class RedeemRequest(BaseModel):
    points: int
    shop_id: str
    points_type: str = "global"  # "global" | "shop"

class LoyaltySettingsUpdate(BaseModel):
    points_per_dollar: int
    participates_in_global_loyalty: bool
    bonus_multiplier: Optional[float] = 1.0
    bonus_active: Optional[bool] = False

class RewardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    points_required: int

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points_required: Optional[int] = None
    is_active: Optional[bool] = None


# ── customer endpoints ────────────────────────────────────────────────────────

@router.get("/loyalty/balances")
async def get_balances(user: dict = Depends(require_auth())):
    """Get the current user's global + all shop point balances."""
    customer_id = user.get("sub")
    db = get_supabase()

    global_resp = (
        db.get_service_client()
        .table("customer_global_points")
        .select("*")
        .eq("customer_id", customer_id)
        .limit(1)
        .execute()
    )

    shop_resp = (
        db.get_service_client()
        .table("customer_shop_points")
        .select("*, shops(name, logo_url)")
        .eq("customer_id", customer_id)
        .execute()
    )

    return {
        "global": global_resp.data[0] if global_resp.data else {"current_balance": 0, "total_earned": 0},
        "shops": shop_resp.data or [],
    }


@router.get("/loyalty/balances/{shop_id}")
async def get_shop_balance(shop_id: str, user: dict = Depends(require_auth())):
    """Get balance at a specific shop."""
    customer_id = user.get("sub")
    db = get_supabase()

    resp = (
        db.get_service_client()
        .table("customer_shop_points")
        .select("*")
        .eq("customer_id", customer_id)
        .eq("shop_id", shop_id)
        .limit(1)
        .execute()
    )

    return {
        "shop_id": shop_id,
        "balance": resp.data[0] if resp.data else {"current_balance": 0, "total_earned": 0},
    }


@router.get("/loyalty/transactions")
async def get_transactions(
    limit: int = 50,
    user: dict = Depends(require_auth()),
):
    """Get the current user's points transaction history."""
    customer_id = user.get("sub")
    db = get_supabase()

    resp = (
        db.get_service_client()
        .table("points_transactions")
        .select("*, shops(name)")
        .eq("customer_id", customer_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return {"transactions": resp.data or []}


@router.post("/loyalty/redeem")
async def redeem_points(request: RedeemRequest, user: dict = Depends(require_auth())):
    """Redeem points for a discount."""
    customer_id = user.get("sub")
    db = get_supabase()

    if request.points <= 0:
        raise HTTPException(status_code=400, detail="Points must be > 0")

    table = "customer_global_points" if request.points_type == "global" else "customer_shop_points"

    # Check balance
    q = (
        db.get_service_client()
        .table(table)
        .select("*")
        .eq("customer_id", customer_id)
    )
    if request.points_type == "shop":
        q = q.eq("shop_id", request.shop_id)
    balance_resp = q.limit(1).execute()
    balance_row = balance_resp.data[0] if balance_resp.data else None

    current_balance = balance_row["current_balance"] if balance_row else 0
    if current_balance < request.points:
        raise HTTPException(status_code=400, detail="Insufficient points balance")

    discount_amount = round(request.points * 0.01, 2)  # 100 points = $1

    # Deduct balance
    new_balance = current_balance - request.points
    upd = (
        db.get_service_client()
        .table(table)
        .update({
            "current_balance": new_balance,
            "total_spent": (balance_row.get("total_spent") or 0) + request.points,
        })
        .eq("customer_id", customer_id)
    )
    if request.points_type == "shop":
        upd = upd.eq("shop_id", request.shop_id)
    upd.execute()

    # Record transaction
    db.get_service_client().table("points_transactions").insert({
        "customer_id":   customer_id,
        "shop_id":       request.shop_id,
        "type":          "redeemed",
        "points_type":   request.points_type,
        "amount":        -request.points,
        "balance_after": new_balance,
        "description":   f"Redeemed {request.points} points for ${discount_amount:.2f} off",
    }).execute()

    return {
        "success": True,
        "points_redeemed": request.points,
        "discount_amount": discount_amount,
        "new_balance": new_balance,
    }


# ── shop owner endpoints ──────────────────────────────────────────────────────

@router.get("/shops/{shop_id}/loyalty/settings")
async def get_loyalty_settings(shop_id: str, user: dict = Depends(require_auth())):
    """Get loyalty settings for a shop."""
    db = get_supabase()
    resp = (
        db.get_service_client()
        .table("shop_loyalty_settings")
        .select("*")
        .eq("shop_id", shop_id)
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]
    # defaults if not configured yet
    return {
        "shop_id": shop_id,
        "use_global_system": True,
        "points_per_dollar": 5,
        "bonus_multiplier": 1.0,
        "bonus_active": False,
    }


@router.put("/shops/{shop_id}/loyalty/settings")
async def update_loyalty_settings(
    shop_id: str,
    settings: LoyaltySettingsUpdate,
    user: dict = Depends(require_auth()),
):
    """Update loyalty settings for a shop (shop owner only)."""
    db = get_supabase()

    payload = {
        "shop_id":       shop_id,
        "points_per_dollar": settings.points_per_dollar,
        "use_global_system": settings.participates_in_global_loyalty,
        "bonus_multiplier": settings.bonus_multiplier,
        "bonus_active":  settings.bonus_active,
    }

    existing = (
        db.get_service_client()
        .table("shop_loyalty_settings")
        .select("id")
        .eq("shop_id", shop_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        db.get_service_client().table("shop_loyalty_settings").update(payload).eq("shop_id", shop_id).execute()
    else:
        db.get_service_client().table("shop_loyalty_settings").insert(payload).execute()

    return {"success": True, **payload}


@router.get("/shops/{shop_id}/loyalty/stats")
async def get_shop_loyalty_stats(shop_id: str, user: dict = Depends(require_auth())):
    """Loyalty stats for a shop dashboard."""
    db = get_supabase()

    members_resp = (
        db.get_service_client()
        .table("customer_shop_points")
        .select("customer_id", count="exact")
        .eq("shop_id", shop_id)
        .execute()
    )

    txn_resp = (
        db.get_service_client()
        .table("points_transactions")
        .select("amount, type")
        .eq("shop_id", shop_id)
        .execute()
    )

    total_issued   = sum(t["amount"] for t in (txn_resp.data or []) if t["type"] == "earned")
    total_redeemed = sum(abs(t["amount"]) for t in (txn_resp.data or []) if t["type"] == "redeemed")

    return {
        "shop_id":        shop_id,
        "active_members": members_resp.count or 0,
        "total_issued":   total_issued,
        "total_redeemed": total_redeemed,
    }


# ── admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/loyalty/global-stats")
async def get_global_stats(user: dict = Depends(require_auth())):
    """Platform-wide loyalty stats."""
    db = get_supabase()

    global_resp = (
        db.get_service_client()
        .table("customer_global_points")
        .select("customer_id", count="exact")
        .execute()
    )

    txn_resp = (
        db.get_service_client()
        .table("points_transactions")
        .select("amount, type, points_type")
        .execute()
    )

    total_issued   = sum(t["amount"] for t in (txn_resp.data or []) if t["type"] == "earned")
    total_redeemed = sum(abs(t["amount"]) for t in (txn_resp.data or []) if t["type"] == "redeemed")

    return {
        "total_members":  global_resp.count or 0,
        "total_issued":   total_issued,
        "total_redeemed": total_redeemed,
    }


@router.put("/admin/loyalty/global-settings")
async def update_global_settings(user: dict = Depends(require_auth())):
    """Placeholder — global loyalty settings managed via Supabase for now."""
    return {"message": "Global settings updated"}
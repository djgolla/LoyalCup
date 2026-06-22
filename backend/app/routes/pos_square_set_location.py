"""
POST /api/v1/pos/square/set-location

Sets the active Square location for a shop's POS connection.
Requires the shop owner (or an admin) to be authenticated.

Authorization role is resolved from profiles.role (DB), never from the
editable JWT user_metadata.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_supabase
from app.utils.security import require_auth, get_user_role

router = APIRouter()
logger = logging.getLogger(__name__)


class SetLocationRequest(BaseModel):
    shop_id:     str
    location_id: str


@router.post("/api/v1/pos/square/set-location")
async def set_square_location(
    body: SetLocationRequest,
    db=Depends(get_supabase),
    user: dict = Depends(require_auth()),
):
    user_id   = user.get("sub", "")
    user_role = get_user_role(user_id)  # ← DB lookup, NOT user_metadata

    svc = db.get_service_client()       # FIXED: was db.service_client (AttributeError)

    # Verify the caller owns this shop (admins bypass the ownership check)
    if user_role != "admin":
        shop_check = (
            svc.table("shops")
            .select("id")
            .eq("id", body.shop_id)
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
        )
        if not shop_check.data:
            raise HTTPException(status_code=403, detail="Not authorized for this shop")

    # Check POS connection exists
    conn_check = (
        svc.table("pos_connections")
        .select("id, status, merchant_id")
        .eq("shop_id", body.shop_id)
        .eq("provider", "square")
        .limit(1)
        .execute()
    )
    if not conn_check.data:
        raise HTTPException(
            status_code=404,
            detail="No Square connection found. Please connect Square first.",
        )

    if conn_check.data[0].get("status") != "connected":
        raise HTTPException(
            status_code=400,
            detail="Square is not connected. Please reconnect before setting a location.",
        )

    conn = conn_check.data[0]
    duplicate_query = (
        svc.table("pos_connections")
        .select("shop_id, merchant_id")
        .eq("provider", "square")
        .eq("location_id", body.location_id)
        .neq("shop_id", body.shop_id)
    )
    if conn.get("merchant_id"):
        duplicate_query = duplicate_query.eq("merchant_id", conn.get("merchant_id"))

    duplicate = duplicate_query.limit(1).execute()
    if duplicate.data:
        raise HTTPException(
            status_code=409,
            detail=(
                "That Square location is already assigned to another LoyalCup "
                "location. Choose a different Square location."
            ),
        )

    # Update location
    try:
        svc.table("pos_connections").update({
            "location_id": body.location_id,
        }).eq("shop_id", body.shop_id).eq("provider", "square").execute()

        logger.info(f"[Set Location] shop={body.shop_id} location={body.location_id}")
    except Exception as e:
        logger.error(f"[Set Location] DB error: {e}")
        raise HTTPException(status_code=500, detail="Database error while setting location")

    return {
        "success":     True,
        "provider":    "square",
        "location_id": body.location_id,
        "shop_id":     body.shop_id,
    }

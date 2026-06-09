from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.utils.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.patch("/shops/{shop_id}/approve")
async def approve_shop(
    shop_id: str,
    _: dict = Depends(require_admin()),
):
    """Approve/activate a shop. Admin only."""
    db = get_supabase()
    sc = db.get_service_client()

    try:
        response = (
            sc.table("shops")
            .update({"status": "active"})
            .eq("id", shop_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Shop not found")

        return {"message": "Shop approved", "shop": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not approve shop")


@router.get("/shops/pending")
async def get_pending_shops(
    _: dict = Depends(require_admin()),
):
    """Get all shops pending approval. Admin only."""
    db = get_supabase()
    sc = db.get_service_client()

    try:
        response = (
            sc.table("shops")
            .select("id, owner_id, name, description, address, city, state, zip, phone, website, business_license, status, created_at")
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )

        return {"shops": response.data or []}

    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not fetch pending shops")
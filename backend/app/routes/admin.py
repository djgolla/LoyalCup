from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_supabase
from supabase import Client

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.patch("/shops/{shop_id}/approve")
async def approve_shop(
    shop_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Approve a shop (admin only)"""
    try:
        response = supabase.table("shops")\
            .update({"is_approved": True})\
            .eq("id", shop_id)\
            .execute()
        
        return {"message": "Shop approved", "shop": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shops/pending")
async def get_pending_shops(supabase: Client = Depends(get_supabase)):
    """Get all shops pending approval"""
    try:
        response = supabase.table("shops")\
            .select("*")\
            .eq("is_approved", False)\
            .execute()
        
        return {"shops": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
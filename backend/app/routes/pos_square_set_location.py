from fastapi import APIRouter, Request, Depends, HTTPException
from app.database import get_supabase

router = APIRouter()

@router.post("/api/v1/pos/square/set-location")
async def set_square_location(request: Request, db=Depends(get_supabase)):
    form = await request.json()
    shop_id = form.get("shop_id")
    location_id = form.get("location_id")
    if not shop_id or not location_id:
        raise HTTPException(status_code=400, detail="Missing shop_id or location_id")
    try:
        await db.execute_query(
            table="pos_connections",
            operation="update",
            data={"location_id": location_id},
            filters={"shop_id": shop_id, "provider": "square"},
            use_service_role=True
        )
    except Exception as e:
        print("DB ERROR (set-location):", str(e))
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    return {"status": "updated", "provider": "square", "location_id": location_id, "shop_id": shop_id}
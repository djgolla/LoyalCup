"""
Reviews — customers review shops after completing an order.
Real schema: reviews.user_id, reviews.body (NOT customer_id, NOT comment)
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from app.utils.security import require_auth
from app.database import get_supabase

router = APIRouter(prefix="/api/v1", tags=["reviews"])
logger = logging.getLogger(__name__)


class CreateReviewRequest(BaseModel):
    shop_id:  str
    order_id: Optional[str] = None
    rating:   int = Field(..., ge=1, le=5)
    body:     Optional[str] = None  # real column is "body"


class UpdateReviewRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    body:   Optional[str] = None


@router.post("/reviews")
async def create_review(body: CreateReviewRequest, user: dict = Depends(require_auth())):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = get_supabase()

    if body.order_id:
        order_resp = (
            db.get_service_client()
            .table("orders")
            .select("id, status, customer_id, shop_id")
            .eq("id", body.order_id)
            .single()
            .execute()
        )
        if not order_resp.data:
            raise HTTPException(status_code=404, detail="Order not found")
        order = order_resp.data
        if order["customer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not your order")
        if order["status"] not in ("picked_up", "completed"):
            raise HTTPException(status_code=400, detail="Can only review completed orders")
        if order["shop_id"] != body.shop_id:
            raise HTTPException(status_code=400, detail="Order does not match shop")

    try:
        resp = (
            db.get_service_client()
            .table("reviews")
            .insert({
                "shop_id":  body.shop_id,
                "user_id":  user_id,       # real column: user_id
                "order_id": body.order_id,
                "rating":   body.rating,
                "body":     body.body,     # real column: body
            })
            .select()
            .single()
            .execute()
        )
        return {"review": resp.data}
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="You already reviewed this order")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}/reviews")
async def get_shop_reviews(
    shop_id: str,
    limit:  int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    db = get_supabase()
    try:
        # join on user_id to get reviewer profile
        resp = (
            db.get_service_client()
            .table("reviews")
            .select("*, reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url)")
            .eq("shop_id", shop_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        # use shops table avg_rating + review_count (denormalized columns)
        shop_resp = (
            db.get_service_client()
            .table("shops")
            .select("avg_rating, review_count")
            .eq("id", shop_id)
            .single()
            .execute()
        )
        shop_data = shop_resp.data or {}

        return {
            "reviews":      resp.data or [],
            "review_count": shop_data.get("review_count", 0),
            "avg_rating":   shop_data.get("avg_rating"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/my")
async def get_my_reviews(user: dict = Depends(require_auth()), limit: int = Query(20, le=100)):
    user_id = user.get("sub")
    db = get_supabase()
    try:
        resp = (
            db.get_service_client()
            .table("reviews")
            .select("*, shops(name, logo_url)")
            .eq("user_id", user_id)   # real column: user_id
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"reviews": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(require_auth())):
    user_id   = user.get("sub")
    user_role = user.get("user_metadata", {}).get("role", "customer")
    db = get_supabase()

    review_resp = (
        db.get_service_client()
        .table("reviews")
        .select("id, user_id")
        .eq("id", review_id)
        .single()
        .execute()
    )
    if not review_resp.data:
        raise HTTPException(status_code=404, detail="Review not found")

    if review_resp.data["user_id"] != user_id and user_role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.get_service_client().table("reviews").delete().eq("id", review_id).execute()
    return {"deleted": True}
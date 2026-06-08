"""
Reviews — customers review shops after completed orders.
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
    shop_id: str
    order_id: str
    rating: int = Field(..., ge=1, le=5)
    body: Optional[str] = None


class UpdateReviewRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    body: Optional[str] = None


@router.post("/reviews")
async def create_review(req: CreateReviewRequest, user: dict = Depends(require_auth())):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = get_supabase()
    sc = db.get_service_client()

    try:
        order_resp = (
            sc.table("orders")
            .select("id, status, customer_id, shop_id, created_at")
            .eq("id", req.order_id)
            .single()
            .execute()
        )
    except Exception as e:
        logger.error(f"[Reviews] Order lookup error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    if not order_resp.data:
        raise HTTPException(status_code=404, detail="Order not found")

    order = order_resp.data

    if order["customer_id"] != user_id:
        raise HTTPException(status_code=403, detail="This is not your order")

    if order["shop_id"] != req.shop_id:
        raise HTTPException(status_code=400, detail="Order does not match this shop")

    if order["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Can only review completed orders. This order is {order['status']}",
        )

    try:
        insert_resp = (
            sc.table("reviews")
            .insert({
                "shop_id": req.shop_id,
                "user_id": user_id,
                "order_id": req.order_id,
                "rating": req.rating,
                "body": req.body,
            })
            .execute()
        )

        review = insert_resp.data[0] if insert_resp.data else None
        return {"review": review}

    except Exception as e:
        error_str = str(e).lower()
        if "unique" in error_str or "already" in error_str:
            raise HTTPException(status_code=409, detail="You already reviewed this order")
        if "permission" in error_str or "policy" in error_str:
            raise HTTPException(status_code=403, detail="Not authorized to create review")
        logger.error(f"[Reviews] Insert failed: {e}")
        raise HTTPException(status_code=500, detail="Could not save review")


@router.get("/shops/{shop_id}/reviews")
async def get_shop_reviews(
    shop_id: str,
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    db = get_supabase()
    sc = db.get_service_client()

    try:
        resp = (
            sc.table("reviews")
            .select("id, rating, body, created_at, user_id, reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url)")
            .eq("shop_id", shop_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        shop_resp = (
            sc.table("shops")
            .select("avg_rating, review_count")
            .eq("id", shop_id)
            .single()
            .execute()
        )

        shop_data = shop_resp.data or {}

        return {
            "reviews": resp.data or [],
            "review_count": shop_data.get("review_count", 0),
            "avg_rating": shop_data.get("avg_rating"),
        }

    except Exception as e:
        logger.error(f"[Reviews] get_shop_reviews error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch reviews")


@router.get("/reviews/my")
async def get_my_reviews(
    user: dict = Depends(require_auth()),
    limit: int = Query(20, le=100),
):
    user_id = user.get("sub")
    db = get_supabase()

    try:
        resp = (
            db.get_service_client()
            .table("reviews")
            .select("id, shop_id, order_id, rating, body, created_at, shops(name, logo_url)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"reviews": resp.data or []}

    except Exception as e:
        logger.error(f"[Reviews] get_my_reviews error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch your reviews")


@router.put("/reviews/{review_id}")
async def update_review(
    review_id: str,
    req: UpdateReviewRequest,
    user: dict = Depends(require_auth()),
):
    user_id = user.get("sub")
    db = get_supabase()
    sc = db.get_service_client()

    try:
        review_resp = (
            sc.table("reviews")
            .select("id, user_id")
            .eq("id", review_id)
            .single()
            .execute()
        )
    except Exception as e:
        logger.error(f"[Reviews] Review lookup error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    if not review_resp.data:
        raise HTTPException(status_code=404, detail="Review not found")

    if review_resp.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your review")

    update_data = {}
    if req.rating is not None:
        update_data["rating"] = req.rating
    if req.body is not None:
        update_data["body"] = req.body

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        resp = (
            sc.table("reviews")
            .update(update_data)
            .eq("id", review_id)
            .execute()
        )

        review = resp.data[0] if resp.data else None
        logger.info(f"[Reviews] Review updated: {review_id}")
        return {"review": review}

    except Exception as e:
        logger.error(f"[Reviews] Update failed: {e}")
        raise HTTPException(status_code=500, detail="Could not update review")


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(require_auth())):
    user_id = user.get("sub")
    db = get_supabase()
    sc = db.get_service_client()

    try:
        review_resp = (
            sc.table("reviews")
            .select("id, user_id")
            .eq("id", review_id)
            .single()
            .execute()
        )
    except Exception as e:
        logger.error(f"[Reviews] Review lookup error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    if not review_resp.data:
        raise HTTPException(status_code=404, detail="Review not found")

    if review_resp.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your review")

    try:
        sc.table("reviews").delete().eq("id", review_id).execute()
        logger.info(f"[Reviews] Review deleted: {review_id}")
        return {"deleted": True}

    except Exception as e:
        logger.error(f"[Reviews] Delete failed: {e}")
        raise HTTPException(status_code=500, detail="Could not delete review")
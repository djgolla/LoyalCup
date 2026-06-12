"""
Reviews — customers review shops after completed orders.
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

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


REVIEW_TABLES: Tuple[Tuple[str, str], ...] = (
    ("reviews", "body"),
    ("shop_reviews", "comment"),
)


def _normalize_review(row: Dict[str, Any], body_column: str, profiles: Optional[Dict[str, Dict[str, Any]]] = None):
    review = dict(row or {})
    body = review.get("body")
    if body is None:
        body = review.get(body_column)
    review["body"] = body
    review.pop("comment", None)
    if profiles is not None:
        reviewer = profiles.get(review.get("user_id")) or {}
        review["reviewer"] = {
            "full_name": reviewer.get("full_name"),
            "avatar_url": reviewer.get("avatar_url"),
        }
    return review


def _fetch_profiles(sc, user_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not user_ids:
        return {}
    try:
        resp = (
            sc.table("profiles")
            .select("id, full_name, avatar_url")
            .in_("id", list(set(user_ids)))
            .execute()
        )
        return {row["id"]: row for row in (resp.data or [])}
    except Exception as e:
        logger.warning(f"[Reviews] Profile lookup skipped: {e}")
        return {}


def _fetch_shop_rating(sc, shop_id: str, reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
    for fields, avg_key in (("avg_rating, review_count", "avg_rating"), ("average_rating, review_count", "average_rating")):
        try:
            resp = sc.table("shops").select(fields).eq("id", shop_id).single().execute()
            data = resp.data or {}
            return {
                "review_count": data.get("review_count", len(reviews)),
                "avg_rating": data.get(avg_key),
            }
        except Exception:
            continue

    ratings = [float(row["rating"]) for row in reviews if row.get("rating") is not None]
    return {
        "review_count": len(reviews),
        "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else None,
    }


def _find_review(sc, review_id: str):
    for table_name, body_column in REVIEW_TABLES:
        try:
            resp = (
                sc.table(table_name)
                .select(f"id, user_id, {body_column}, rating")
                .eq("id", review_id)
                .single()
                .execute()
            )
            if resp.data:
                return table_name, body_column, resp.data
        except Exception:
            continue
    return None, None, None


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

    last_error = None
    for table_name, body_column in REVIEW_TABLES:
        try:
            insert_resp = (
                sc.table(table_name)
                .insert({
                    "shop_id": req.shop_id,
                    "user_id": user_id,
                    "order_id": req.order_id,
                    "rating": req.rating,
                    body_column: req.body,
                })
                .execute()
            )

            review = insert_resp.data[0] if insert_resp.data else None
            return {"review": _normalize_review(review, body_column)}
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            if "unique" in error_str or "already" in error_str:
                raise HTTPException(status_code=409, detail="You already reviewed this order")
            if "permission" in error_str or "policy" in error_str:
                raise HTTPException(status_code=403, detail="Not authorized to create review")

    logger.error(f"[Reviews] Insert failed: {last_error}")
    raise HTTPException(status_code=500, detail="Could not save review")


@router.get("/shops/{shop_id}/reviews")
async def get_shop_reviews(
    shop_id: str,
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    db = get_supabase()
    sc = db.get_service_client()

    last_error = None
    for table_name, body_column in REVIEW_TABLES:
        try:
            resp = (
                sc.table(table_name)
                .select(f"id, rating, {body_column}, created_at, user_id")
                .eq("shop_id", shop_id)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            rows = resp.data or []
            profiles = _fetch_profiles(sc, [row["user_id"] for row in rows if row.get("user_id")])
            reviews = [_normalize_review(row, body_column, profiles) for row in rows]
            rating_data = _fetch_shop_rating(sc, shop_id, reviews)
            return {
                "reviews": reviews,
                "review_count": rating_data["review_count"],
                "avg_rating": rating_data["avg_rating"],
            }
        except Exception as e:
            last_error = e
            logger.warning(f"[Reviews] {table_name} fetch failed: {e}")

    logger.error(f"[Reviews] get_shop_reviews error: {last_error}")
    raise HTTPException(status_code=500, detail="Could not fetch reviews")


@router.get("/reviews/my")
async def get_my_reviews(
    user: dict = Depends(require_auth()),
    limit: int = Query(20, le=100),
):
    user_id = user.get("sub")
    db = get_supabase()

    sc = db.get_service_client()
    last_error = None
    for table_name, body_column in REVIEW_TABLES:
        try:
            resp = (
                sc.table(table_name)
                .select(f"id, shop_id, order_id, rating, {body_column}, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return {
                "reviews": [
                    _normalize_review(row, body_column)
                    for row in (resp.data or [])
                ]
            }
        except Exception as e:
            last_error = e
            logger.warning(f"[Reviews] {table_name} my-review fetch failed: {e}")

    logger.error(f"[Reviews] get_my_reviews error: {last_error}")
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

    table_name, body_column, review = _find_review(sc, review_id)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your review")

    update_data = {}
    if req.rating is not None:
        update_data["rating"] = req.rating
    if req.body is not None:
        update_data[body_column] = req.body

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        resp = (
            sc.table(table_name)
            .update(update_data)
            .eq("id", review_id)
            .execute()
        )

        review = _normalize_review(resp.data[0], body_column) if resp.data else None
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

    table_name, _, review = _find_review(sc, review_id)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your review")

    try:
        sc.table(table_name).delete().eq("id", review_id).execute()
        logger.info(f"[Reviews] Review deleted: {review_id}")
        return {"deleted": True}

    except Exception as e:
        logger.error(f"[Reviews] Delete failed: {e}")
        raise HTTPException(status_code=500, detail="Could not delete review")

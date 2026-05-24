"""
POST /api/v1/pos/connect?provider=square

Initiates Square OAuth. Returns the authorization_url the frontend
redirects the user to.
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.database import get_supabase
from app.utils.security import require_auth
from app.integrations.square.adapter import SquareAdapter
from app.config import settings

router  = APIRouter()
logger  = logging.getLogger(__name__)
_square = SquareAdapter()


@router.post("/api/v1/pos/connect")
async def pos_connect(
    request: Request,
    user: dict = Depends(require_auth()),
    db=Depends(get_supabase),
):
    provider = request.query_params.get("provider", "").lower()

    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider query param")
    if provider != "square":
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if not settings.square_application_id:
        raise HTTPException(status_code=500, detail="Square application ID not configured on server")
    if not settings.square_callback_url:
        raise HTTPException(status_code=500, detail="Square callback URL not configured on server")

    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Look up this user's shop
    shop_resp = (
        db.get_service_client()
        .table("shops")
        .select("id, status")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not shop_resp.data:
        raise HTTPException(
            status_code=404,
            detail="No shop found. Complete your shop setup before connecting Square.",
        )

    shop    = shop_resp.data[0]
    shop_id = shop["id"]

    # Build the Square OAuth URL using the adapter (consistent redirect_uri = settings value)
    auth_url = _square.get_authorization_url(
        shop_id=shop_id,
        redirect_uri=settings.square_callback_url,
    )

    logger.info(f"[POS Connect] Square OAuth URL generated for shop {shop_id}")
    return JSONResponse({"authorization_url": auth_url, "shop_id": shop_id})


def register(app):
    app.include_router(router)
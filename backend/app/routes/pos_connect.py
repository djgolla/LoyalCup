import os
import base64
import json
import traceback
import sys
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.database import get_supabase

router = APIRouter()


def get_current_shop_id_from_token(request: Request, db) -> str:
    """
    Extract the authenticated user's shop_id from their JWT (via Supabase).
    The Authorization header must be: Bearer <supabase_access_token>
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split("Bearer ", 1)[1].strip()

    # Use the anon client to verify the token and get user
    try:
        user_resp = db.anon_client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

    user_id = user.id

    # Look up the shop owned by this user
    shop_result = db.service_client.table("shops") \
        .select("id") \
        .eq("owner_id", user_id) \
        .limit(1) \
        .execute()

    if not shop_result.data:
        raise HTTPException(
            status_code=404,
            detail="No shop found for this user. Please complete shop setup first."
        )

    return shop_result.data[0]["id"]


@router.post("/api/v1/pos/connect")
async def pos_connect(request: Request, db=Depends(get_supabase)):
    try:
        provider = request.query_params.get("provider")

        SQUARE_CLIENT_ID = (
            os.environ.get("SQUARE_APPLICATION_ID")
            or os.environ.get("square_application_id")
        )
        SQUARE_CALLBACK_URL = (
            os.environ.get("SQUARE_CALLBACK_URL")
            or os.environ.get("square_callback_url")
        )

        if not provider:
            raise HTTPException(status_code=400, detail="Missing provider")
        if provider != "square":
            raise HTTPException(status_code=400, detail="Unsupported provider")
        if not SQUARE_CLIENT_ID or not SQUARE_CALLBACK_URL:
            raise HTTPException(
                status_code=500,
                detail="Missing SQUARE_APPLICATION_ID or SQUARE_CALLBACK_URL env vars"
            )

        # Get the real shop_id from the logged-in user's token
        shop_id = get_current_shop_id_from_token(request, db)

        # Build state param with real shop_id
        state_data = {"shop_id": shop_id}
        state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

        scopes = [
            "MERCHANT_PROFILE_READ",
            "PAYMENTS_READ",
            "PAYMENTS_WRITE",
            "ORDERS_READ",
            "ORDERS_WRITE",
            "INVENTORY_READ",
            "ITEMS_READ",
        ]
        scopes_str = "%20".join(scopes)

        if SQUARE_CLIENT_ID.startswith("sandbox-"):
            SQUARE_AUTH_BASE = "https://connect.squareupsandbox.com/oauth2/authorize"
        else:
            SQUARE_AUTH_BASE = "https://connect.squareup.com/oauth2/authorize"

        auth_url = (
            f"{SQUARE_AUTH_BASE}"
            f"?client_id={SQUARE_CLIENT_ID}"
            f"&scope={scopes_str}"
            f"&session=False"
            f"&redirect_uri={SQUARE_CALLBACK_URL}"
            f"&state={state}"
        )

        return JSONResponse({"authorization_url": auth_url, "shop_id": shop_id})

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc(file=sys.stdout)
        raise HTTPException(status_code=500, detail=str(e))


def register(app):
    app.include_router(router)
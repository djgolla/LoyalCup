import sys
import os
import traceback
import base64
import json
import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/api/v1/pos/connect")
async def pos_connect(request: Request):
    try:
        await request.body()
        provider = request.query_params.get("provider")
        print("\n--- SQUARE ENV DEBUG ---")
        print("provider:", repr(provider))
        print("os.environ['SQUARE_APPLICATION_ID']:", repr(os.environ.get("SQUARE_APPLICATION_ID")))
        print("os.environ['square_application_id']:", repr(os.environ.get("square_application_id")))
        print("os.environ['SQUARE_CALLBACK_URL']:", repr(os.environ.get("SQUARE_CALLBACK_URL")))
        print("os.environ['square_callback_url']:", repr(os.environ.get("square_callback_url")))
        print("os.environ['SQUARE_APPLICATION_SECRET']:", repr(os.environ.get("SQUARE_APPLICATION_SECRET")))
        print("os.environ['square_application_secret']:", repr(os.environ.get("square_application_secret")))
        print("os.environ['SQUARE_ENV']:", repr(os.environ.get("SQUARE_ENV")))
        print("os.environ['square_env']:", repr(os.environ.get("square_env")))
        print("--- END SQUARE ENV DEBUG ---\n")

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
                detail="Missing SQUARE_APPLICATION_ID or SQUARE_CALLBACK_URL env vars (check Docker/host env and .env file)"
            )

        # BUILD STATE PARAM (base64-encoded JSON)
        # (You can add real user/shop info instead of "anonymous" here if you want)
        state_data = {
            "shop_id": str(uuid.uuid4()),
            "user": "anonymous"
        }
        state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

        scopes = [
            "MERCHANT_PROFILE_READ",
            "PAYMENTS_READ",
            "PAYMENTS_WRITE",
            "ORDERS_READ",
            "ORDERS_WRITE",
            "INVENTORY_READ"
        ]
        scopes_str = "%20".join(scopes)

        # THE CRITICAL FIX: Correct sandbox and prod URLs
        if SQUARE_CLIENT_ID.startswith("sandbox-"):
            SQUARE_AUTH_BASE = "https://connect.squareupsandbox.com/oauth2/authorize"
        else:
            SQUARE_AUTH_BASE = "https://connect.squareup.com/oauth2/authorize"

        # INCLUDE 'state' param, which is required by your callback!
        auth_url = (
            f"{SQUARE_AUTH_BASE}"
            f"?client_id={SQUARE_CLIENT_ID}"
            f"&scope={scopes_str}"
            f"&session=False"
            f"&redirect_uri={SQUARE_CALLBACK_URL}"
            f"&state={state}"
        )
        print("DEBUG AUTH URL:", auth_url)

        return JSONResponse({"authorization_url": auth_url})

    except Exception as e:
        print("==== UNHANDLED ERROR IN pos_connect ====")
        traceback.print_exc(file=sys.stdout)
        print("==== END ERROR ====")
        raise e

def register(app):
    app.include_router(router)
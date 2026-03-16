import sys
import traceback
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from app.config import settings

router = APIRouter()

@router.post("/api/v1/pos/connect")
async def pos_connect(request: Request):
    try:
        await request.body()
        provider = request.query_params.get("provider")
        print("\n--- SQUARE DEBUG START ---")
        print("provider:", repr(provider))
        print("square_env:", repr(settings.square_env))
        print("square_application_id:", repr(settings.square_application_id))
        print("square_callback_url:", repr(settings.square_callback_url))
        print("square_application_secret:", repr(settings.square_application_secret))
        print("--- END SQUARE DEBUG ---\n")

        if not provider:
            raise HTTPException(status_code=400, detail="Missing provider")
        if provider != "square":
            raise HTTPException(status_code=400, detail="Unsupported provider")

        SQUARE_CLIENT_ID = settings.square_application_id
        SQUARE_CALLBACK_URL = settings.square_callback_url

        if not SQUARE_CLIENT_ID or not SQUARE_CALLBACK_URL:
            raise HTTPException(
                status_code=500,
                detail="Missing square_application_id or square_callback_url env vars"
            )

        scopes = [
            "MERCHANT_PROFILE_READ",
            "PAYMENTS_READ",
            "PAYMENTS_WRITE",
            "ORDERS_READ",
            "ORDERS_WRITE",
            "INVENTORY_READ"
        ]
        scopes_str = "%20".join(scopes)
        auth_url = (
            f"https://connect.squareup.com/oauth2/authorize"
            f"?client_id={SQUARE_CLIENT_ID}"
            f"&scope={scopes_str}"
            f"&session=False"
            f"&redirect_uri={SQUARE_CALLBACK_URL}"
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
import os
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/api/v1/pos/connect")
async def pos_connect(request: Request):
    # HACK: Force read() on request body (even if empty) to avoid 422 in strict mode
    await request.body()

    provider = request.query_params.get("provider")
    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider")
    if provider != "square":
        raise HTTPException(status_code=400, detail="Unsupported provider")

    SQUARE_CLIENT_ID = os.environ.get("SQUARE_CLIENT_ID")
    SQUARE_CALLBACK_URL = os.environ.get("SQUARE_CALLBACK_URL")
    if not SQUARE_CLIENT_ID or not SQUARE_CALLBACK_URL:
        raise HTTPException(status_code=500, detail="Missing SQUARE_CLIENT_ID or SQUARE_CALLBACK_URL env vars")

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
    return JSONResponse({"authorization_url": auth_url})

def register(app):
    app.include_router(router)
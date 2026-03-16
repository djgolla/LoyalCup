import base64
import json
import uuid
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.integrations.square.adapter import SquareAdapter
from app.database import get_supabase

router = APIRouter()

@router.get("/api/v1/pos/square/callback")
async def square_callback(request: Request, db=Depends(get_supabase)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing auth code or state.")

    print("SQUARE CALLBACK:")
    print("code ->", code)
    print("state ->", state)

    # Decode state param
    try:
        state_json = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid state param: {str(e)}")
    shop_id_raw = state_json.get("shop_id")
    user_id = state_json.get("user")
    # Always use/generate a real UUID for shop_id
    try:
        shop_uuid = str(uuid.UUID(shop_id_raw))
    except Exception:
        shop_uuid = str(uuid.uuid4())

    redirect_uri = str(request.url._url.split("?")[0])

    adapter = SquareAdapter()
    tokens = await adapter.exchange_code_for_tokens(code, redirect_uri)

    print("Square OAuth tokens:", tokens)

    # Ensure shop exists in shops table (fill in not-null columns!)
    try:
        shop = await db.get_by_id(
            table="shops",
            id_value=shop_uuid,
            id_column="id"
        )
        if not shop:
            shop_insert = {
                "id": shop_uuid,
                "name": "Square Connected Shop",  # REQUIRED; customize as desired
                "created_at": None,
                "updated_at": None
            }
            print("Inserting new shop:", shop_insert)
            await db.execute_query(
                table="shops",
                operation="insert",
                data=shop_insert,
                use_service_role=True
            )
    except Exception as e:
        print("DB ERROR (shops):", str(e))
        raise HTTPException(status_code=500, detail=f"Database error (shops): {str(e)}")

    # Insert POS connection
    data = {
        "shop_id": shop_uuid,
        "provider": "square",
        "status": "connected",
        "merchant_id": tokens.get("merchant_id"),
        "location_id": None,
        "access_token": tokens.get("access_token"),
        "refresh_token": tokens.get("refresh_token"),
    }

    print("DB INSERT DATA ->", data)

    try:
        await db.execute_query(
            table="pos_connections",
            operation="insert",
            data=data,
            use_service_role=True
        )
    except Exception as e:
        print("DB ERROR (pos_connections):", str(e))
        raise HTTPException(status_code=500, detail=f"Database error (pos_connections): {str(e)}")

    # FIX: Redirect to your frontend/app so the user sees "Connected!"
    # Change this to match your real frontend route—add params if you want:
    frontend_url = "http://localhost:5173/?status=square_connected"
    return RedirectResponse(url=frontend_url)

def register(app):
    app.include_router(router)
import base64
import json
import uuid
import httpx
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.integrations.square.adapter import SquareAdapter
from app.database import get_supabase

router = APIRouter()

# Util: fetch merchant and catalog/menu data from Square API
async def fetch_square_merchant_and_menu(access_token):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Square-Version": "2024-03-21"
    }
    async with httpx.AsyncClient() as client:
        # 1. Merchant info
        merchant_resp = await client.get(
            "https://connect.squareupsandbox.com/v2/merchants/me", headers=headers)
        merchant_resp.raise_for_status()
        merchant = merchant_resp.json()["merchant"]

        # 2. Full menu/catalog (categories, items, modifiers, images, prices)
        types = "CATEGORY,ITEM,MODIFIER_LIST,ITEM_VARIATION,IMAGE"
        catalog_resp = await client.get(
            f"https://connect.squareupsandbox.com/v2/catalog/list?types={types}",
            headers=headers,
        )
        catalog_resp.raise_for_status()
        catalog_objects = catalog_resp.json().get("objects", [])
    return merchant, catalog_objects

@router.get("/api/v1/pos/square/callback")
async def square_callback(request: Request, db=Depends(get_supabase)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing auth code or state.")

    # Decode state param (should contain shop_id/user etc.)
    try:
        state_json = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid state param: {str(e)}")
    shop_id_raw = state_json.get("shop_id")
    user_id = state_json.get("user")
    try:
        shop_uuid = str(uuid.UUID(shop_id_raw))
    except Exception:
        shop_uuid = str(uuid.uuid4())

    redirect_uri = str(request.url._url.split("?")[0])

    # Exchange code for tokens
    adapter = SquareAdapter()
    tokens = await adapter.exchange_code_for_tokens(code, redirect_uri)
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token from Square.")

    # ---- FETCH SHOP/MENU DATA FROM SQUARE ----
    merchant, catalog_objects = await fetch_square_merchant_and_menu(access_token)

    # ---- UPSERT SHOP IN DB USING REAL DATA ----
    db_shop = await db.get_by_id("shops", shop_uuid, "id")
    shop_data = {
        "id": shop_uuid,  # Universal shop id (should merge with user's existing shop logic)
        "name": merchant.get("business_name") or merchant.get("name", "Square Shop"),
        "logo_url": merchant.get("logo_url"),
        "square_merchant_id": merchant.get("id"),
        "square_website_url": merchant.get("website_url"),
        # Add more fields as desired!
    }
    if db_shop:
        # Update existing shop by id
        await db.execute_query(
            table="shops",
            operation="update",
            data=shop_data,
            use_service_role=True,
            id_column="id",
            id_value=shop_uuid
        )
    else:
        # Insert new if not found (should not happen if user/shop is always pre-created)
        await db.execute_query(
            table="shops",
            operation="insert",
            data=shop_data,
            use_service_role=True
        )

    # ---- UPSERT POS CONNECTION ----
    conn_data = {
        "shop_id": shop_uuid,
        "provider": "square",
        "status": "connected",
        "merchant_id": merchant.get("id"),
        "location_id": None,  # Fill from merchant/callback if you prefer
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
    }
    await db.execute_query(
        table="pos_connections",
        operation="insert",
        data=conn_data,
        use_service_role=True
    )

    # ---- SYNC MENU & MODIFIERS (CALL YOUR OWN UNIVERSAL MENU SYNC LOGIC) ----
    # Write a function to map catalog_objects to your "categories", "items", "modifiers", etc!
    # Example: await sync_square_catalog(shop_uuid, catalog_objects, db)
    # TODO: Implement sync_square_catalog to map all object types to your tables

    # Redirect to frontend with provider+status
    frontend_url = f"http://localhost:5173/shop-owner/connect-square"
    return RedirectResponse(url=frontend_url)

def register(app):
    app.include_router(router)
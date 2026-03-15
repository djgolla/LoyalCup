from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from typing import Optional
import base64
import json

from app.database import get_supabase, SupabaseClient
from app.integrations.pos.registry import get_pos_adapters

router = APIRouter(prefix="/api/v1/pos/square", tags=["pos"])

@router.get("/callback", response_class=HTMLResponse)
async def square_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: SupabaseClient = Depends(get_supabase),
):
    """
    Square OAuth callback endpoint.
    Now works with `shop_id` passed via `state` for maximum safety/simplicity.
    """
    if error:
        return HTMLResponse(f"<h1>Square connect failed</h1><pre>{error}</pre>", status_code=400)
    if not code:
        return HTMLResponse("<h1>Missing code</h1>", status_code=400)

    # Extract shop_id from state, if present and encoded
    shop_id = None
    if state:
        try:
            state_data = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
            shop_id = state_data.get("shop_id")
        except Exception:
            pass

    if not shop_id:
        return HTMLResponse("<h1>Missing shop_id (was not found in OAuth state param)</h1>", status_code=400)

    adapter = get_pos_adapters()["square"]
    redirect_uri = "https://arabesquely-unpoetical-steffanie.ngrok-free.dev/api/v1/pos/square/callback"
    tokens = await adapter.exchange_code_for_tokens(code, redirect_uri)

    record = {
        "shop_id": shop_id,
        "provider": "square",
        "status": "connected",
        "access_token": tokens.get("access_token"),
        "refresh_token": tokens.get("refresh_token"),
        "merchant_id": tokens.get("merchant_id"),
        "location_id": None,
    }

    existing = await db.execute_query(
        "pos_connections",
        "select",
        filters={"shop_id": shop_id, "provider": "square"},
    )
    if existing:
        await db.execute_query("pos_connections", "update", data=record, filters={"id": existing[0]["id"]})
    else:
        await db.execute_query("pos_connections", "insert", data=record)

    state_html = f"<p><b>state</b>: {state}</p>" if state else ""
    return HTMLResponse(f"<h1>Square connected ✅</h1>{state_html}<p>You can close this tab.</p>")
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.database import get_supabase, SupabaseClient
from app.integrations.pos.registry import get_pos_adapters

router = APIRouter(prefix="/api/v1/pos", tags=["pos"])

# ---- removed @router.post("/connect") endpoint that conflicts ----

# Leave only working POS endpoints, e.g.:
@router.get("/locations")
async def list_locations(
    shop_id: str = Query(...),
    provider: str = Query(...),
    db: SupabaseClient = Depends(get_supabase),
):
    adapters = get_pos_adapters()
    adapter = adapters.get(provider)
    if not adapter:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    conns = await db.execute_query(
        "pos_connections", "select", filters={"shop_id": shop_id, "provider": provider}
    )
    if not conns or not conns[0].get("access_token"):
        raise HTTPException(status_code=400, detail="POS not connected")

    try:
        locations = await adapter.list_locations(conns[0]["access_token"])
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))

    return {"locations": [loc.__dict__ for loc in locations]}

# ...any other safe POS routes...
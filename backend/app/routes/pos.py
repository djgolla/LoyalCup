import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.database import get_supabase, SupabaseClient
from app.integrations.pos.registry import get_pos_adapters

router = APIRouter(prefix="/api/v1/pos", tags=["pos"])


class ConnectRequest(BaseModel):
    shop_id: str
    provider: str  # square | toast | clover
    redirect_uri: str  # must match provider app settings


class ExchangeRequest(BaseModel):
    shop_id: str
    provider: str
    code: str
    redirect_uri: str
    location_id: Optional[str] = None


@router.post("/connect")
async def connect_pos(req: ConnectRequest):
    adapters = get_pos_adapters()
    if req.provider not in adapters:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    state = secrets.token_urlsafe(24)
    try:
        url = adapters[req.provider].get_authorization_url(
            req.shop_id, req.redirect_uri, state
        )
        return {"authorization_url": url, "state": state}
    except NotImplementedError as e:
        # Provider scaffolded but not implemented yet
        raise HTTPException(status_code=501, detail=str(e))


@router.post("/exchange")
async def exchange_code(req: ExchangeRequest, db: SupabaseClient = Depends(get_supabase)):
    adapters = get_pos_adapters()
    if req.provider not in adapters:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    adapter = adapters[req.provider]
    try:
        tokens = await adapter.exchange_code_for_tokens(req.code, req.redirect_uri)
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))

    upsert = {
        "shop_id": req.shop_id,
        "provider": req.provider,
        "status": "connected",
        "access_token": tokens.get("access_token"),
        "refresh_token": tokens.get("refresh_token"),
        "merchant_id": tokens.get("merchant_id"),
        "location_id": req.location_id,
    }

    existing = await db.execute_query(
        "pos_connections",
        "select",
        filters={"shop_id": req.shop_id, "provider": req.provider},
    )
    if existing:
        await db.execute_query(
            "pos_connections", "update", data=upsert, filters={"id": existing[0]["id"]}
        )
    else:
        await db.execute_query("pos_connections", "insert", data=upsert)

    return {"ok": True, "provider": req.provider, "merchant_id": tokens.get("merchant_id")}


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


@router.post("/sync-catalog")
async def sync_catalog(
    shop_id: str,
    provider: str,
    location_id: Optional[str] = None,
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
        snapshot = await adapter.fetch_catalog(
            conns[0]["access_token"], location_id or conns[0].get("location_id")
        )
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))

    return {
        "categories": [c.__dict__ for c in snapshot.categories],
        "items": [i.__dict__ for i in snapshot.items],
        "modifier_sets": [
            {**ms.__dict__, "modifiers": [m.__dict__ for m in ms.modifiers]}
            for ms in snapshot.modifier_sets
        ],
    }
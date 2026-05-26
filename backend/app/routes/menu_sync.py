"""
Menu sync health endpoint.
The real Square catalog sync lives in app.integrations.square.sync.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/menu-sync", tags=["menu-sync"])


@router.get("/status")
async def menu_sync_status():
    """Simple health check so main.py include_router doesn't crash."""
    return {"status": "ok"}
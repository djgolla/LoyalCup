from fastapi import APIRouter, Request, HTTPException, Depends

router = APIRouter()

@router.get("/api/v1/pos/status")
async def pos_status(request: Request):
    provider = request.query_params.get("provider")
    if not provider:
        raise HTTPException(status_code=400, detail="Missing provider")
    # --- SIMPLE DUMMY IMPLEMENTATION ---
    # Replace this logic with your own DB check later
    # This just simulates "not yet connected"
    return {"status": "disconnected"}
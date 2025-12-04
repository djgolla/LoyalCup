from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
import os

from models import provider

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "invalid location"}},
)


PROVIDERS = {
    "google": provider.Google(
        clientID=os.getenv("GOOGLE_CLIENT_ID"),
        clientSecret=os.getenv("GOOGLE_CLIENT_SECRET"),
        redirectURI=os.getenv("GOOGLE_REDIRECT"),
    )
}


@router.get("/login/{pr}/")
async def read_items(pr):
    return RedirectResponse(PROVIDERS[pr].getAuthUrl())


@router.get("/callback/{pr}")
async def read_item(pr: str, code: str):
    return {"status": "success", "jwt": PROVIDERS[pr].callback(code)}

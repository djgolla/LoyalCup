import os
import httpx
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode
import base64
import json

from app.integrations.pos.base import (
    POSAdapter, POSCatalogSnapshot, POSCatalogCategory, POSCatalogItem,
    POSCatalogModifier, POSCatalogModifierSet, POSLocation
)

SQUARE_ENV = os.getenv("SQUARE_ENV", "sandbox")  # 'sandbox' | 'production'
SQUARE_BASE = "https://connect.squareupsandbox.com" if SQUARE_ENV == "sandbox" else "https://connect.squareup.com"
SQUARE_API = "https://connect.squareupsandbox.com/v2" if SQUARE_ENV == "sandbox" else "https://connect.squareup.com/v2"

print("=== SQUARE ENV DIAGNOSTICS ===")
print("SQUARE_APPLICATION_ID:", repr(os.getenv("SQUARE_APPLICATION_ID")))
print("SQUARE_APPLICATION_SECRET:", repr(os.getenv("SQUARE_APPLICATION_SECRET")))
print("SQUARE_ENV:", repr(SQUARE_ENV))
print("SQUARE_BASE:", SQUARE_BASE)

class SquareAdapter(POSAdapter):
    provider = "square"

    def get_authorization_url(self, shop_id: str, redirect_uri: str, state: Optional[str] = None) -> str:
        app_id = os.getenv("SQUARE_APPLICATION_ID")
        state_obj = {"shop_id": shop_id}
        if state is not None:
            state_obj["user"] = state
        encoded_state = base64.urlsafe_b64encode(json.dumps(state_obj).encode()).decode()

        scopes = [
            "MERCHANT_PROFILE_READ",
        ]
        qs = urlencode({
            "client_id": app_id,
            "scope": " ".join(scopes),
            "session": "false",
            "state": encoded_state,
            "redirect_uri": redirect_uri,
        })
        url = f"{SQUARE_BASE}/oauth2/authorize?{qs}"
        print("=== SQUARE AUTH URL ===")
        print(url)
        return url

    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        app_secret = os.getenv("SQUARE_APPLICATION_SECRET")
        app_id = os.getenv("SQUARE_APPLICATION_ID")
        print("\n=== EXCHANGING SQUARE CODE ===")
        print("client_id:", app_id)
        print("client_secret:", "***REDACTED***")
        print("code:", code)
        print("redirect_uri:", redirect_uri)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{SQUARE_BASE}/oauth2/token",
                json={
                    "client_id": app_id,
                    "client_secret": app_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            try:
                resp.raise_for_status()
                print("=== SQUARE TOKEN EXCHANGE SUCCESS ===")
                print("Token response:", resp.json())
                return resp.json()
            except Exception as e:
                print("\n=== SQUARE TOKEN ERROR ===")
                print("Status:", resp.status_code)
                print("Response:", resp.text)
                raise

    async def list_locations(self, access_token: str) -> List[POSLocation]:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{SQUARE_API}/locations",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            resp.raise_for_status()
            data = resp.json().get("locations", [])
            return [POSLocation(id=l["id"], name=l.get("name") or l.get("business_name") or "Location") for l in data]

    async def fetch_catalog(self, access_token: str, location_id: Optional[str]) -> POSCatalogSnapshot:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{SQUARE_API}/catalog/search",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"object_types": ["CATEGORY", "ITEM", "MODIFIER_LIST", "MODIFIER"]},
            )
            resp.raise_for_status()
            objs = resp.json().get("objects", []) or []

        categories: List[POSCatalogCategory] = []
        items: List[POSCatalogItem] = []
        modifier_lists_by_id: Dict[str, Dict[str, Any]] = {}
        modifiers_by_id: Dict[str, Dict[str, Any]] = {}

        for obj in objs:
            t = obj.get("type")
            if t == "CATEGORY":
                categories.append(POSCatalogCategory(id=obj["id"], name=obj["category_data"]["name"], raw=obj))
            elif t == "ITEM":
                item_data = obj.get("item_data", {})
                price_cents = None
                currency = "USD"
                variations = item_data.get("variations") or []
                if variations:
                    money = (variations[0].get("item_variation_data") or {}).get("price_money")
                    if money:
                        price_cents = money.get("amount")
                        currency = money.get("currency") or "USD"

                category_id = None
                reporting_category = item_data.get("reporting_category")
                if reporting_category:
                    category_id = reporting_category.get("id")

                items.append(POSCatalogItem(
                    id=obj["id"],
                    name=item_data.get("name") or "Item",
                    description=item_data.get("description"),
                    price_cents=price_cents,
                    currency=currency,
                    category_id=category_id,
                    is_available=True,
                    raw=obj
                ))
            elif t == "MODIFIER_LIST":
                modifier_lists_by_id[obj["id"]] = obj
            elif t == "MODIFIER":
                modifiers_by_id[obj["id"]] = obj

        modifier_sets: List[POSCatalogModifierSet] = []
        for mod_list in modifier_lists_by_id.values():
            d = mod_list.get("modifier_list_data") or {}
            mods: List[POSCatalogModifier] = []
            for m in d.get("modifiers") or []:
                mid = m.get("modifier_id")
                if not mid:
                    continue
                full = modifiers_by_id.get(mid)
                if not full:
                    continue
                md = full.get("modifier_data") or {}
                money = md.get("price_money")
                price_cents = money.get("amount") if money else None
                mods.append(POSCatalogModifier(
                    id=full["id"],
                    name=md.get("name") or "Modifier",
                    price_cents=price_cents,
                    raw=full
                ))

            modifier_sets.append(POSCatalogModifierSet(
                id=mod_list["id"],
                name=d.get("name") or "Modifiers",
                min_selected=d.get("selection_type") == "SINGLE" and 1 or 0,
                max_selected=1 if d.get("selection_type") == "SINGLE" else None,
                modifiers=mods,
                raw=mod_list
            ))

        return POSCatalogSnapshot(categories=categories, items=items, modifier_sets=modifier_sets)

    async def create_order(self, access_token: str, location_id: str, order_payload: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{SQUARE_API}/orders",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"order": {"location_id": location_id, **order_payload}},
            )
            resp.raise_for_status()
            return resp.json()
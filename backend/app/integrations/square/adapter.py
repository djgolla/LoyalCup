"""
Square POS adapter — unified env via settings, consistent API base.
"""
import uuid
import httpx
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode
import base64
import json

from app.integrations.pos.base import (
    POSAdapter, POSCatalogSnapshot, POSCatalogCategory, POSCatalogItem,
    POSCatalogModifier, POSCatalogModifierSet, POSLocation
)
from app.config import settings

# ── env-driven API base ───────────────────────────────────────────────────────
def _square_base() -> str:
    return (
        "https://connect.squareupsandbox.com"
        if settings.square_env == "sandbox"
        else "https://connect.squareup.com"
    )

def _square_api() -> str:
    return _square_base() + "/v2"


class SquareAdapter(POSAdapter):
    provider = "square"

    def get_authorization_url(self, shop_id: str, redirect_uri: str, state: Optional[str] = None) -> str:
        app_id = settings.square_application_id
        state_obj = {"shop_id": shop_id}
        if state is not None:
            state_obj["user"] = state
        encoded_state = base64.urlsafe_b64encode(json.dumps(state_obj).encode()).decode()

        scopes = [
            "MERCHANT_PROFILE_READ",
            "ORDERS_WRITE",
            "ORDERS_READ",
            "PAYMENTS_WRITE",
            "PAYMENTS_READ",
            "INVENTORY_READ",
            "ITEMS_READ",
        ]
        qs = urlencode({
            "client_id": app_id,
            "scope": " ".join(scopes),
            "session": "false",
            "state": encoded_state,
            "redirect_uri": redirect_uri,
        })
        return f"{_square_base()}/oauth2/authorize?{qs}"

    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{_square_base()}/oauth2/token",
                json={
                    "client_id": settings.square_application_id,
                    "client_secret": settings.square_application_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Square token exchange failed {resp.status_code}: {resp.text}"
                )
            return resp.json()

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh an expired Square access token."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{_square_base()}/oauth2/token",
                json={
                    "client_id": settings.square_application_id,
                    "client_secret": settings.square_application_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Square token refresh failed {resp.status_code}: {resp.text}"
                )
            return resp.json()

    async def list_locations(self, access_token: str) -> List[POSLocation]:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{_square_api()}/locations",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"Square list_locations failed {resp.status_code}: {resp.text}")
            data = resp.json().get("locations", []) or []
            return [
                POSLocation(
                    id=loc["id"],
                    name=loc.get("name") or loc.get("business_name") or "Location",
                )
                for loc in data
                if loc.get("status") != "INACTIVE"
            ]

    async def fetch_catalog(self, access_token: str, location_id: Optional[str] = None) -> POSCatalogSnapshot:
        """
        Paginated catalog fetch via POST /catalog/search.
        Handles cursors so large catalogs don't get truncated.
        """
        object_types = ["CATEGORY", "ITEM", "MODIFIER_LIST"]
        all_objects: List[Dict[str, Any]] = []
        cursor: Optional[str] = None

        async with httpx.AsyncClient(timeout=60) as client:
            while True:
                body: Dict[str, Any] = {"object_types": object_types, "include_related_objects": True}
                if cursor:
                    body["cursor"] = cursor
                resp = await client.post(
                    f"{_square_api()}/catalog/search",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=body,
                )
                if resp.status_code != 200:
                    raise RuntimeError(f"Square catalog fetch failed {resp.status_code}: {resp.text}")
                payload = resp.json()
                all_objects.extend(payload.get("objects") or [])
                # Also grab related objects (images, etc.)
                all_objects.extend(payload.get("related_objects") or [])
                cursor = payload.get("cursor")
                if not cursor:
                    break

        # De-duplicate by id
        seen: set = set()
        objects: List[Dict[str, Any]] = []
        for obj in all_objects:
            if obj.get("id") not in seen:
                seen.add(obj["id"])
                objects.append(obj)

        categories: List[POSCatalogCategory] = []
        items: List[POSCatalogItem] = []
        modifier_lists_by_id: Dict[str, Dict[str, Any]] = {}
        images_by_id: Dict[str, str] = {}

        for obj in objects:
            t = obj.get("type")
            if t == "CATEGORY":
                categories.append(POSCatalogCategory(
                    id=obj["id"],
                    name=obj["category_data"]["name"],
                    raw=obj,
                ))
            elif t == "ITEM":
                item_data   = obj.get("item_data", {})
                price_cents = None
                currency    = "USD"
                variations  = item_data.get("variations") or []
                if variations:
                    money = (variations[0].get("item_variation_data") or {}).get("price_money")
                    if money:
                        price_cents = money.get("amount")
                        currency    = money.get("currency") or "USD"
                category_id = None
                for cat_ref in [
                    item_data.get("reporting_category"),
                    *(item_data.get("categories") or []),
                ]:
                    if cat_ref and cat_ref.get("id"):
                        category_id = cat_ref["id"]
                        break
                items.append(POSCatalogItem(
                    id=obj["id"],
                    name=item_data.get("name") or "Item",
                    description=item_data.get("description"),
                    price_cents=price_cents,
                    currency=currency,
                    category_id=category_id,
                    is_available=True,
                    raw=obj,
                ))
            elif t == "MODIFIER_LIST":
                modifier_lists_by_id[obj["id"]] = obj
            elif t == "IMAGE":
                url = (obj.get("image_data") or {}).get("url")
                if url:
                    images_by_id[obj["id"]] = url

        modifier_sets: List[POSCatalogModifierSet] = []
        for mod_list in modifier_lists_by_id.values():
            d    = mod_list.get("modifier_list_data") or {}
            mods: List[POSCatalogModifier] = []
            for m in d.get("modifiers") or []:
                # Inline modifier object — has its own id + modifier_data
                mod_id = m.get("id")
                if not mod_id:
                    continue
                md    = m.get("modifier_data") or {}
                money = md.get("price_money")
                mods.append(POSCatalogModifier(
                    id=mod_id,
                    name=md.get("name") or "Option",
                    price_cents=money.get("amount") if money else None,
                    raw=m,
                ))
            modifier_sets.append(POSCatalogModifierSet(
                id=mod_list["id"],
                name=d.get("name") or "Options",
                min_selected=1 if d.get("selection_type") == "SINGLE" else 0,
                max_selected=1 if d.get("selection_type") == "SINGLE" else None,
                modifiers=mods,
                raw=mod_list,
            ))

        return POSCatalogSnapshot(
            categories=categories,
            items=items,
            modifier_sets=modifier_sets,
            images_by_id=images_by_id,
        )

    async def create_order(
        self,
        access_token: str,
        location_id: str,
        order_payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create an OPEN order on Square POS — returns order with calculated tax."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{_square_api()}/orders",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "idempotency_key": str(uuid.uuid4()),
                    "order": {
                        "location_id": location_id,
                        **order_payload,
                    },
                },
            )
            if resp.status_code != 200:
                err = resp.json()
                raise RuntimeError(
                    f"Square create_order failed {resp.status_code}: "
                    f"{err.get('errors', resp.text)}"
                )
            return resp.json()

    async def charge_payment(
        self,
        access_token: str,
        location_id: str,
        source_id: str,
        amount_cents: int,
        currency: str = "USD",
        order_id: Optional[str] = None,
        reference_id: Optional[str] = None,
        customer_note: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Charge a card via Square Payments API.
        source_id is the nonce from the Square In-App Payments SDK.
        """
        if amount_cents <= 0:
            raise ValueError(
                "Cannot charge $0 or negative amount. Handle free orders before calling charge_payment."
            )

        payload: Dict[str, Any] = {
            "idempotency_key": str(uuid.uuid4()),
            "source_id": source_id,
            "amount_money": {
                "amount": amount_cents,
                "currency": currency,
            },
            "location_id": location_id,
            "autocomplete": True,
        }
        if order_id:
            payload["order_id"] = order_id
        if reference_id:
            payload["reference_id"] = reference_id
        if customer_note:
            payload["note"] = customer_note

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{_square_api()}/payments",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code != 200:
                err = resp.json()
                errors = err.get("errors", [])
                # Surface human-readable Square error
                msg = errors[0].get("detail") if errors else resp.text
                raise RuntimeError(f"Square payment failed: {msg}")
            return resp.json()
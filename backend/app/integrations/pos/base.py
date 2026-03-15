from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Protocol

@dataclass
class POSLocation:
    id: str
    name: str

@dataclass
class POSCatalogItem:
    id: str
    name: str
    description: Optional[str]
    price_cents: Optional[int]
    currency: str
    category_id: Optional[str]
    is_available: bool
    raw: Dict[str, Any]

@dataclass
class POSCatalogCategory:
    id: str
    name: str
    raw: Dict[str, Any]

@dataclass
class POSCatalogModifier:
    id: str
    name: str
    price_cents: Optional[int]
    raw: Dict[str, Any]

@dataclass
class POSCatalogModifierSet:
    id: str
    name: str
    min_selected: Optional[int]
    max_selected: Optional[int]
    modifiers: List[POSCatalogModifier]
    raw: Dict[str, Any]

@dataclass
class POSCatalogSnapshot:
    categories: List[POSCatalogCategory]
    items: List[POSCatalogItem]
    modifier_sets: List[POSCatalogModifierSet]

class POSAdapter(Protocol):
    provider: str

    def get_authorization_url(self, shop_id: str, redirect_uri: str, state: str) -> str: ...
    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]: ...
    async def list_locations(self, access_token: str) -> List[POSLocation]: ...
    async def fetch_catalog(self, access_token: str, location_id: Optional[str]) -> POSCatalogSnapshot: ...
    async def create_order(self, access_token: str, location_id: str, order_payload: Dict[str, Any]) -> Dict[str, Any]: ...
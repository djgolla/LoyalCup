from typing import Any, Dict, List, Optional
from app.integrations.pos.base import POSAdapter, POSCatalogSnapshot, POSLocation

class ToastAdapter(POSAdapter):
    provider = "toast"

    def get_authorization_url(self, shop_id: str, redirect_uri: str, state: str) -> str:
        raise NotImplementedError("Toast OAuth flow not implemented yet")

    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        raise NotImplementedError("Toast token exchange not implemented yet")

    async def list_locations(self, access_token: str) -> List[POSLocation]:
        raise NotImplementedError("Toast locations not implemented yet")

    async def fetch_catalog(self, access_token: str, location_id: Optional[str]) -> POSCatalogSnapshot:
        raise NotImplementedError("Toast catalog sync not implemented yet")

    async def create_order(self, access_token: str, location_id: str, order_payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Toast create order not implemented yet")
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class OrderService:
    """
    Service layer for order operations.

    Launch flow is CARD ONLY:
      - Card checkout creates orders in payments.py.
      - Orders become confirmed after Square payment succeeds.
      - Orders auto-complete after ready_at passes.
      - Loyalty is awarded in payments.py only, never here.
    """

    TAX_RATE = 0.0875

    VALID_TRANSITIONS = {
        "payment_pending": ["confirmed", "payment_failed"],
        "payment_failed": [],
        "confirmed": ["completed"],
        "pending": ["completed"],
        "completed": [],
        "cancelled": [],
    }

    def __init__(self, supabase_client=None):
        self.db = supabase_client

    def calculate_item_price(self, base_price: float, customizations: List[Dict]) -> float:
        total = base_price
        for custom in customizations:
            if "price" in custom:
                total += custom["price"]
        return round(total, 2)

    def calculate_order_totals(self, items: List[Dict]) -> Dict:
        subtotal = 0.0
        for item in items:
            quantity = item.get("quantity", 1)
            base_price = item.get("base_price", 0.0)
            customizations = item.get("customizations", [])
            item_price = self.calculate_item_price(base_price, customizations)
            subtotal += item_price * quantity

        subtotal = round(subtotal, 2)
        tax = round(subtotal * self.TAX_RATE, 2)
        total = round(subtotal + tax, 2)

        return {
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
        }

    def validate_status_transition(self, current_status: str, new_status: str) -> bool:
        if current_status not in self.VALID_TRANSITIONS:
            return False
        return new_status in self.VALID_TRANSITIONS[current_status]

    def can_cancel_order(self, status: str) -> bool:
        return False

    async def create_order(
        self,
        shop_id: str,
        customer_id: str,
        items: List[Dict[str, Any]],
        status: str = "pending",
        subtotal: Optional[float] = None,
        tax: Optional[float] = None,
        total: Optional[float] = None,
        metadata: Optional[Dict] = None,
        ready_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Kept for internal/server-side use only.
        Public manual/cash order route is disabled in orders.py for launch.
        """
        if not self.db:
            raise RuntimeError("Database not initialized")

        if subtotal is None or total is None:
            calc = self.calculate_order_totals(items)
            subtotal = subtotal if subtotal is not None else calc["subtotal"]
            tax = tax if tax is not None else calc["tax"]
            total = total if total is not None else calc["total"]

        order_data: Dict[str, Any] = {
            "shop_id": shop_id,
            "customer_id": customer_id,
            "status": status,
            "subtotal": subtotal,
            "tax": tax or 0.0,
            "total": total,
        }

        if metadata:
            order_data["metadata"] = metadata

        if ready_at:
            order_data["ready_at"] = ready_at

        response = (
            self.db.get_service_client()
            .table("orders")
            .insert(order_data)
            .execute()
        )

        if not response.data:
            raise RuntimeError("Failed to create order — DB returned no data")

        order = response.data[0]
        order_id = order["id"]

        order_items = []
        for item in items:
            unit_price = item.get("unit_price") or self.calculate_item_price(
                item.get("base_price", 0.0),
                item.get("customizations", []),
            )
            quantity = max(1, item.get("quantity", 1))

            order_items.append({
                "order_id": order_id,
                "menu_item_id": item.get("menu_item_id"),
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": round(unit_price * quantity, 2),
                "customizations": item.get("customizations", []),
            })

        if order_items:
            self.db.get_service_client().table("order_items").insert(order_items).execute()

        return order

    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        if not self.db:
            return None

        try:
            order_response = (
                self.db.get_service_client()
                .table("orders")
                .select("*, shops(name, logo_url, address, avg_prep_time_minutes), customer:profiles(full_name, email, avatar_url)")
                .eq("id", order_id)
                .single()
                .execute()
            )

            if not order_response.data:
                return None

            order = order_response.data

            items_response = (
                self.db.get_service_client()
                .table("order_items")
                .select("*, menu_items(name, description, base_price, image_url)")
                .eq("order_id", order_id)
                .execute()
            )

            order["items"] = items_response.data or []
            return order

        except Exception as e:
            print(f"Error getting order {order_id}: {e}")
            return None

    async def list_orders(
        self,
        customer_id: Optional[str] = None,
        shop_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []

        try:
            query = (
                self.db.get_service_client()
                .table("orders")
                .select("*, shops(name, logo_url, avg_prep_time_minutes)")
            )

            if customer_id:
                query = query.eq("customer_id", customer_id)

            if shop_id:
                query = query.eq("shop_id", shop_id)

            if status:
                query = query.eq("status", status)

            response = query.order("created_at", desc=True).limit(limit).execute()
            return response.data or []

        except Exception as e:
            print(f"Error listing orders: {e}")
            return []

    async def update_order_status(self, order_id: str, new_status: str) -> Dict[str, Any]:
        """
        Minimal internal transition for accounting/reviews.
        No loyalty awards happen here.
        """
        if not self.db:
            raise ValueError("Database not available")

        order_response = (
            self.db.get_service_client()
            .table("orders")
            .select("*")
            .eq("id", order_id)
            .single()
            .execute()
        )

        if not order_response.data:
            raise ValueError(f"Order {order_id} not found")

        order = order_response.data
        current_status = order.get("status")

        if not self.validate_status_transition(current_status, new_status):
            raise ValueError(
                f"Cannot move order from '{current_status}' to '{new_status}'. "
                f"Valid next statuses: {self.VALID_TRANSITIONS.get(current_status, [])}"
            )

        update_payload = {
            "status": new_status,
            "updated_at": _now_iso(),
        }

        if new_status == "completed":
            update_payload["completed_at"] = _now_iso()

        update_response = (
            self.db.get_service_client()
            .table("orders")
            .update(update_payload)
            .eq("id", order_id)
            .execute()
        )

        return update_response.data[0] if update_response.data else order

    async def cancel_order(self, order_id: str, customer_id: str) -> Dict[str, Any]:
        if not self.db:
            raise ValueError("Database not available")

        order_response = (
            self.db.get_service_client()
            .table("orders")
            .select("*")
            .eq("id", order_id)
            .eq("customer_id", customer_id)
            .single()
            .execute()
        )

        if not order_response.data:
            raise ValueError(f"Order {order_id} not found or access denied")

        order = order_response.data

        if not self.can_cancel_order(order.get("status")):
            raise ValueError(
                "Mobile order cancellation is not available after checkout. "
                "Please contact the shop directly for changes or refunds."
            )

        update_response = (
            self.db.get_service_client()
            .table("orders")
            .update({
                "status": "cancelled",
                "updated_at": _now_iso(),
            })
            .eq("id", order_id)
            .execute()
        )

        return update_response.data[0] if update_response.data else order

    async def get_order_history(self, customer_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.db:
            return []

        try:
            orders_response = (
                self.db.get_service_client()
                .table("orders")
                .select("*, shops(name, logo_url, avg_prep_time_minutes)")
                .eq("customer_id", customer_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            orders = orders_response.data or []

            for order in orders:
                items_response = (
                    self.db.get_service_client()
                    .table("order_items")
                    .select("*, menu_items(name, description, image_url)")
                    .eq("order_id", order["id"])
                    .execute()
                )
                order["items"] = items_response.data or []

            return orders

        except Exception as e:
            print(f"Error getting order history: {e}")
            return []

    async def get_shop_orders(
        self,
        shop_id: str,
        status: str = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []

        try:
            query = (
                self.db.get_service_client()
                .table("orders")
                .select(
                    "*, customer:profiles(full_name, email, avatar_url), "
                    "order_items(id, quantity, unit_price, total_price, customizations, "
                    "menu_items(name, image_url))"
                )
                .eq("shop_id", shop_id)
            )

            if status:
                query = query.eq("status", status)

            response = query.order("created_at", desc=False).limit(limit).execute()
            return response.data or []

        except Exception as e:
            print(f"Error getting shop orders: {e}")
            return []


order_service = OrderService()

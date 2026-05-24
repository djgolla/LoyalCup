from datetime import datetime
from typing import Dict, List, Optional, Any


class OrderService:
    """Service layer for order operations"""

    TAX_RATE = 0.0875  # fallback for cash/manual orders — Square calculates real tax

    VALID_TRANSITIONS = {
        "confirmed":  ["accepted", "cancelled"],
        "pending":    ["accepted", "cancelled"],
        "accepted":   ["preparing", "cancelled"],
        "preparing":  ["ready", "cancelled"],
        "ready":      ["picked_up"],
        "picked_up":  ["completed"],
        "completed":  [],
        "cancelled":  [],
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
        """Fallback totals when Square hasn't calculated yet (cash orders)."""
        subtotal = 0.0
        for item in items:
            quantity       = item.get("quantity", 1)
            base_price     = item.get("base_price", 0.0)
            customizations = item.get("customizations", [])
            item_price     = self.calculate_item_price(base_price, customizations)
            subtotal      += item_price * quantity
        subtotal = round(subtotal, 2)
        tax      = round(subtotal * self.TAX_RATE, 2)
        total    = round(subtotal + tax, 2)
        return {"subtotal": subtotal, "tax": tax, "total": total}

    def validate_status_transition(self, current_status: str, new_status: str) -> bool:
        if current_status not in self.VALID_TRANSITIONS:
            return False
        return new_status in self.VALID_TRANSITIONS[current_status]

    def calculate_loyalty_points(self, total: float, points_per_dollar: int) -> int:
        if points_per_dollar <= 0:
            return 0
        return int(total * points_per_dollar)

    def can_cancel_order(self, status: str) -> bool:
        return status in ("pending", "confirmed")

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
    ) -> Dict[str, Any]:
        if not self.db:
            raise RuntimeError("Database not initialized")

        if subtotal is None or total is None:
            calc     = self.calculate_order_totals(items)
            subtotal = subtotal if subtotal is not None else calc["subtotal"]
            tax      = tax      if tax      is not None else calc["tax"]
            total    = total    if total    is not None else calc["total"]

        # orders real columns: customer_id, shop_id, status, subtotal, tax, total, metadata
        order_data: Dict[str, Any] = {
            "shop_id":     shop_id,
            "customer_id": customer_id,
            "status":      status,
            "subtotal":    subtotal,
            "tax":         tax or 0.0,
            "total":       total,
        }
        if metadata:
            order_data["metadata"] = metadata

        response = (
            self.db.get_service_client()
            .table("orders")
            .insert(order_data)
            .execute()
        )
        if not response.data:
            raise RuntimeError("Failed to create order — DB returned no data")

        order    = response.data[0]
        order_id = order["id"]

        order_items = []
        for item in items:
            unit_price = item.get("unit_price") or self.calculate_item_price(
                item.get("base_price", 0.0), item.get("customizations", [])
            )
            quantity = max(1, item.get("quantity", 1))
            order_items.append({
                "order_id":       order_id,
                "menu_item_id":   item.get("menu_item_id"),
                "quantity":       quantity,
                "unit_price":     unit_price,
                "total_price":    round(unit_price * quantity, 2),
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
                .select("*, shops(name, logo_url), customer:profiles(full_name, email, avatar_url)")
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
                .select("*, shops(name, logo_url)")
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

        order          = order_response.data
        current_status = order.get("status")

        if not self.validate_status_transition(current_status, new_status):
            raise ValueError(
                f"Cannot move order from '{current_status}' to '{new_status}'. "
                f"Valid next statuses: {self.VALID_TRANSITIONS.get(current_status, [])}"
            )

        update_response = (
            self.db.get_service_client()
            .table("orders")
            .update({"status": new_status, "updated_at": datetime.utcnow().isoformat()})
            .eq("id", order_id)
            .execute()
        )
        updated_order = update_response.data[0] if update_response.data else order

        # Award loyalty points on completion
        # Uses award_points_for_order function directly — loyalty_service has no class instance
        if new_status == "completed":
            try:
                from app.services.loyalty_service import award_points_for_order
                await award_points_for_order(
                    db=self.db,
                    order_id=order_id,
                    customer_id=order["customer_id"],
                    shop_id=order["shop_id"],
                    order_total=float(order.get("total", 0)),
                )
            except Exception as e:
                print(f"[Loyalty] Failed to award points for order {order_id}: {e}")

        return updated_order

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
                f"Cannot cancel order with status '{order.get('status')}'. "
                "Only new orders (confirmed/pending) can be cancelled."
            )
        update_response = (
            self.db.get_service_client()
            .table("orders")
            .update({"status": "cancelled", "updated_at": datetime.utcnow().isoformat()})
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
                .select("*, shops(name, logo_url)")
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
        self, shop_id: str, status: str = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []
        try:
            query = (
                self.db.get_service_client()
                .table("orders")
                .select("*, customer:profiles(full_name, email, avatar_url), order_items(id, quantity, unit_price, total_price, customizations, menu_items(name, image_url))")
                .eq("shop_id", shop_id)
            )
            if status:
                query = query.eq("status", status)
            response = query.order("created_at", desc=False).limit(limit).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting shop orders: {e}")
            return []


# Global service instance
order_service = OrderService()
"""
Shop Service - Business logic for shop and menu management
Handles CRUD operations, analytics, and geolocation queries.

SECURITY:
Public shop/menu methods return safe public fields only. They do not expose
owner_id, business_license, Square IDs, Stripe subscription fields, or other
internal/private columns.
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
import math


PUBLIC_SHOP_FIELDS = (
    "id, name, description, logo_url, banner_url, address, city, state, "
    "lat, lng, phone, hours, color, status, featured, website, zip, "
    "avg_rating, review_count, mobile_ordering_enabled, avg_prep_time_minutes, "
    "created_at"
)

OWNER_SHOP_FIELDS = (
    "id, owner_id, name, description, logo_url, banner_url, address, city, state, "
    "lat, lng, phone, hours, loyalty_points_per_dollar, participates_in_global_loyalty, "
    "created_at, color, updated_at, status, featured, business_license, website, zip, "
    "square_merchant_id, square_website_url, avg_rating, review_count, "
    "mobile_ordering_enabled, subscription_status, avg_prep_time_minutes"
)

PUBLIC_CATEGORY_FIELDS = (
    "id, shop_id, name, display_order, description, pos_id, pos_source, is_active"
)

PUBLIC_MENU_ITEM_FIELDS = (
    "id, shop_id, category_id, name, description, base_price, image_url, "
    "is_available, display_order, addons, sizes, pos_id, pos_source, "
    "modifier_group_ids, is_active, is_out_of_stock"
)

PUBLIC_CUSTOMIZATION_TEMPLATE_FIELDS = (
    "id, shop_id, name, type, is_required, applies_to, options"
)


class ShopService:
    """Service layer for shop operations"""
    
    def __init__(self, supabase_client=None):
        """Initialize shop service with optional Supabase client"""
        self.db = supabase_client

    def _client(self):
        if not self.db:
            return None
        return self.db.get_service_client()

    def _safe_shop_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extra defensive cleanup in case a future select accidentally includes
        private fields.
        """
        blocked = {
            "owner_id",
            "business_license",
            "square_merchant_id",
            "stripe_customer_id",
            "stripe_subscription_id",
            "subscription_price_id",
            "subscription_status",
        }
        return {k: v for k, v in (row or {}).items() if k not in blocked}
    
    # ============================================================================
    # SHOP OPERATIONS
    # ============================================================================
    
    async def list_shops(
        self, 
        city: Optional[str] = None,
        search: Optional[str] = None,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """List shops with optional filters. Public callers get safe fields only."""
        if not self.db:
            return []
        
        try:
            select_fields = PUBLIC_SHOP_FIELDS if active_only else OWNER_SHOP_FIELDS
            query = self._client().table("shops").select(select_fields)
            
            if active_only:
                query = query.eq("status", "active")
            
            if city:
                query = query.ilike("city", f"%{city}%")
            
            if search:
                safe_search = search.replace(",", " ").strip()
                query = query.or_(f"name.ilike.%{safe_search}%,description.ilike.%{safe_search}%")
            
            response = query.order("created_at", desc=True).execute()
            rows = response.data or []

            if active_only:
                return [self._safe_shop_row(row) for row in rows]

            return rows

        except Exception as e:
            print(f"Error listing shops: {e}")
            return []
    
    async def get_shop_by_id(self, shop_id: str) -> Optional[Dict[str, Any]]:
        """Get safe public shop details by ID."""
        if not self.db:
            return None
        
        try:
            response = (
                self._client()
                .table("shops")
                .select(PUBLIC_SHOP_FIELDS)
                .eq("id", shop_id)
                .eq("status", "active")
                .single()
                .execute()
            )
            return self._safe_shop_row(response.data)
        except Exception as e:
            print(f"Error getting shop {shop_id}: {e}")
            return None
    
    async def get_owner_shop_by_id(self, shop_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
        """Get fuller shop details for the owning shop owner only."""
        if not self.db:
            return None
        
        try:
            response = (
                self._client()
                .table("shops")
                .select(OWNER_SHOP_FIELDS)
                .eq("id", shop_id)
                .eq("owner_id", owner_id)
                .single()
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"Error getting owner shop {shop_id}: {e}")
            return None
    
    async def create_shop(self, shop_data: Dict[str, Any], owner_id: str) -> Dict[str, Any]:
        """Create a new shop"""
        if not self.db:
            shop_data["owner_id"] = owner_id
            shop_data["created_at"] = datetime.now().isoformat()
            return shop_data
        
        try:
            shop_data["owner_id"] = owner_id
            response = (
                self._client()
                .table("shops")
                .insert(shop_data)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating shop: {e}")
            raise
    
    async def update_shop(self, shop_id: str, shop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update shop details"""
        if not self.db:
            return shop_data
        
        try:
            response = (
                self._client()
                .table("shops")
                .update(shop_data)
                .eq("id", shop_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating shop {shop_id}: {e}")
            raise
    
    async def delete_shop(self, shop_id: str) -> bool:
        """Deactivate shop (soft delete)"""
        if not self.db:
            return True
        
        try:
            (
                self._client()
                .table("shops")
                .update({"status": "suspended"})
                .eq("id", shop_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Error deleting shop {shop_id}: {e}")
            return False
    
    async def create_shop_application(self, user_id: str, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a shop application and upgrade user to shop_owner.
        Validates that user doesn't already own a shop.
        """
        if not self.db:
            return {
                "shop": application_data,
                "message": "Shop application created successfully"
            }
        
        try:
            existing_shop = (
                self._client()
                .table("shops")
                .select("id")
                .eq("owner_id", user_id)
                .execute()
            )
            
            if existing_shop.data and len(existing_shop.data) > 0:
                raise ValueError("User already owns a shop")
            
            shop_data = {
                "name": application_data.get("name"),
                "description": application_data.get("description"),
                "address": application_data.get("address"),
                "city": application_data.get("city"),
                "state": application_data.get("state"),
                "zip": application_data.get("zip"),
                "phone": application_data.get("phone"),
                "business_license": application_data.get("business_license"),
                "website": application_data.get("website"),
                "owner_id": user_id,
                "status": "active",
            }
            
            shop_response = (
                self._client()
                .table("shops")
                .insert(shop_data)
                .execute()
            )
            
            if not shop_response.data or len(shop_response.data) == 0:
                raise Exception("Failed to create shop")
            
            shop = shop_response.data[0]
            
            profile_response = (
                self._client()
                .table("profiles")
                .update({"role": "shop_owner", "shop_id": shop.get("id")})
                .eq("id", user_id)
                .execute()
            )
            
            if not profile_response.data:
                raise Exception("Failed to update user role")
            
            return {
                "shop": shop,
                "message": "Shop application approved! Welcome to LoyalCup."
            }
        except ValueError as e:
            raise e
        except Exception as e:
            print(f"Error creating shop application: {e}")
            raise Exception(f"Failed to create shop application: {str(e)}")
    
    async def find_nearby_shops(
        self, 
        lat: float, 
        lng: float, 
        radius_km: float = 10
    ) -> List[Dict[str, Any]]:
        """
        Find shops within radius of coordinates.
        Uses safe public fields and avoids raw SQL interpolation.
        """
        if not self.db:
            return []

        try:
            lat = float(lat)
            lng = float(lng)
            radius_km = max(1.0, min(float(radius_km), 100.0))
        except Exception:
            return []

        try:
            response = (
                self._client()
                .table("shops")
                .select(PUBLIC_SHOP_FIELDS)
                .eq("status", "active")
                .not_.is_("lat", "null")
                .not_.is_("lng", "null")
                .execute()
            )

            shops = response.data or []
            with_distance = []

            for shop in shops:
                try:
                    shop_lat = float(shop.get("lat"))
                    shop_lng = float(shop.get("lng"))
                    distance = self._distance_km(lat, lng, shop_lat, shop_lng)
                    if distance <= radius_km:
                        safe_shop = self._safe_shop_row(shop)
                        safe_shop["distance_km"] = round(distance, 2)
                        with_distance.append(safe_shop)
                except Exception:
                    continue

            with_distance.sort(key=lambda s: s.get("distance_km", 999999))
            return with_distance[:50]

        except Exception as e:
            print(f"Nearby shop lookup failed, falling back to all shops: {e}")
            return await self.list_shops(active_only=True)

    def _distance_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        r = 6371.0
        p1 = math.radians(lat1)
        p2 = math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lng2 - lng1)

        a = (
            math.sin(dp / 2) ** 2
            + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c
    
    async def upload_shop_image(
        self, 
        shop_id: str, 
        file_data: bytes, 
        image_type: str
    ) -> str:
        """Upload shop logo or banner to Supabase Storage"""
        if not self.db:
            return f"https://storage.example.com/{shop_id}/{image_type}.jpg"
        
        try:
            bucket = "shop-images"
            path = f"{shop_id}/{image_type}.jpg"
            
            storage = self._client().storage
            
            try:
                storage.from_(bucket).upload(
                    path, 
                    file_data, 
                    {"content-type": "image/jpeg", "upsert": "true"}
                )
            except Exception:
                try:
                    storage.from_(bucket).remove([path])
                except Exception:
                    pass
                storage.from_(bucket).upload(
                    path, 
                    file_data, 
                    {"content-type": "image/jpeg"}
                )
            
            url = storage.from_(bucket).get_public_url(path)
            
            field = "logo_url" if image_type == "logo" else "banner_url"
            (
                self._client()
                .table("shops")
                .update({field: url})
                .eq("id", shop_id)
                .execute()
            )
            
            return url
        except Exception as e:
            print(f"Error uploading shop image: {e}")
            raise
    
    async def get_shop_analytics(self, shop_id: str) -> Dict[str, Any]:
        """Get shop analytics (orders, revenue, etc.)"""
        if not self.db:
            return {
                "total_orders": 0,
                "total_revenue": 0.0,
                "orders_today": 0,
                "revenue_today": 0.0,
                "avg_order_value": 0.0,
                "top_items": []
            }
        
        try:
            orders_response = (
                self._client()
                .table("orders")
                .select("total")
                .eq("shop_id", shop_id)
                .eq("status", "completed")
                .execute()
            )
            
            orders = orders_response.data or []
            total_orders = len(orders)
            total_revenue = sum(float(order.get("total", 0)) for order in orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
            
            today = datetime.now().date().isoformat()
            today_response = (
                self._client()
                .table("orders")
                .select("total")
                .eq("shop_id", shop_id)
                .gte("created_at", today)
                .execute()
            )
            
            today_orders = today_response.data or []
            orders_today = len(today_orders)
            revenue_today = sum(float(order.get("total", 0)) for order in today_orders)
            
            return {
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "orders_today": orders_today,
                "revenue_today": revenue_today,
                "avg_order_value": avg_order_value,
                "top_items": await self._get_top_items(shop_id)
            }
        except Exception as e:
            print(f"Error getting analytics for shop {shop_id}: {e}")
            return {
                "total_orders": 0,
                "total_revenue": 0.0,
                "orders_today": 0,
                "revenue_today": 0.0,
                "avg_order_value": 0.0,
                "top_items": []
            }
    
    # ============================================================================
    # MENU CATEGORY OPERATIONS
    # ============================================================================
    
    async def list_categories(self, shop_id: str) -> List[Dict[str, Any]]:
        """Get all public menu categories for a shop"""
        if not self.db:
            return []
        
        try:
            response = (
                self._client()
                .table("categories")
                .select(PUBLIC_CATEGORY_FIELDS)
                .eq("shop_id", shop_id)
                .eq("is_active", True)
                .order("display_order")
                .execute()
            )
            return response.data or []
        except Exception as e:
            print(f"Error listing categories for shop {shop_id}: {e}")
            return []
    
    async def create_category(
        self, 
        shop_id: str, 
        name: str, 
        display_order: int = 0
    ) -> Dict[str, Any]:
        """Create a menu category"""
        if not self.db:
            return {
                "id": "uuid",
                "shop_id": shop_id,
                "name": name,
                "display_order": display_order
            }
        
        try:
            response = (
                self._client()
                .table("categories")
                .insert({
                    "shop_id": shop_id,
                    "name": name,
                    "display_order": display_order,
                    "is_active": True,
                })
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating category: {e}")
            raise
    
    async def update_category(
        self, 
        category_id: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update menu category"""
        if not self.db:
            return data
        
        try:
            response = (
                self._client()
                .table("categories")
                .update(data)
                .eq("id", category_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating category {category_id}: {e}")
            raise
    
    async def delete_category(self, category_id: str) -> bool:
        """Soft delete menu category"""
        if not self.db:
            return True
        
        try:
            (
                self._client()
                .table("categories")
                .update({"is_active": False})
                .eq("id", category_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Error deleting category {category_id}: {e}")
            return False
    
    async def reorder_categories(
        self, 
        shop_id: str, 
        category_orders: List[Dict[str, int]]
    ) -> bool:
        """Reorder menu categories"""
        if not self.db:
            return True
        
        try:
            for item in category_orders:
                category_id = item.get("category_id") or item.get("id")
                if not category_id:
                    continue

                (
                    self._client()
                    .table("categories")
                    .update({"display_order": item["display_order"]})
                    .eq("id", category_id)
                    .eq("shop_id", shop_id)
                    .execute()
                )
            return True
        except Exception as e:
            print(f"Error reordering categories: {e}")
            return False
    
    # ============================================================================
    # MENU ITEM OPERATIONS
    # ============================================================================
    
    async def list_menu_items(
        self, 
        shop_id: str, 
        category_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get public menu items for a shop, optionally filtered by category"""
        if not self.db:
            return []
        
        try:
            query = (
                self._client()
                .table("menu_items")
                .select(PUBLIC_MENU_ITEM_FIELDS)
                .eq("shop_id", shop_id)
                .eq("is_active", True)
            )
            
            if category_id:
                query = query.eq("category_id", category_id)
            
            response = query.order("display_order").execute()
            return response.data or []
        except Exception as e:
            print(f"Error listing menu items for shop {shop_id}: {e}")
            return []
    
    async def get_menu_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get public menu item details"""
        if not self.db:
            return None
        
        try:
            response = (
                self._client()
                .table("menu_items")
                .select(PUBLIC_MENU_ITEM_FIELDS)
                .eq("id", item_id)
                .eq("is_active", True)
                .single()
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"Error getting menu item {item_id}: {e}")
            return None
    
    async def create_menu_item(
        self, 
        shop_id: str, 
        item_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a menu item"""
        if not self.db:
            item_data["shop_id"] = shop_id
            item_data["created_at"] = datetime.now().isoformat()
            return item_data
        
        try:
            item_data["shop_id"] = shop_id
            response = (
                self._client()
                .table("menu_items")
                .insert(item_data)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating menu item: {e}")
            raise
    
    async def update_menu_item(
        self, 
        item_id: str, 
        item_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update menu item"""
        if not self.db:
            return item_data
        
        try:
            response = (
                self._client()
                .table("menu_items")
                .update(item_data)
                .eq("id", item_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating menu item {item_id}: {e}")
            raise
    
    async def delete_menu_item(self, item_id: str) -> bool:
        """Soft delete menu item"""
        if not self.db:
            return True
        
        try:
            (
                self._client()
                .table("menu_items")
                .update({"is_active": False, "is_available": False})
                .eq("id", item_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Error deleting menu item {item_id}: {e}")
            return False
    
    async def toggle_item_availability(
        self, 
        item_id: str, 
        is_available: bool
    ) -> Dict[str, Any]:
        """Toggle menu item availability"""
        if not self.db:
            return {"id": item_id, "is_available": is_available}
        
        try:
            response = (
                self._client()
                .table("menu_items")
                .update({"is_available": is_available})
                .eq("id", item_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error toggling availability for item {item_id}: {e}")
            raise
    
    async def upload_item_image(
        self, 
        item_id: str, 
        file_data: bytes,
        shop_id: str
    ) -> str:
        """Upload menu item image to Supabase Storage"""
        if not self.db:
            return f"https://storage.example.com/items/{item_id}.jpg"
        
        try:
            bucket = "shop-images"
            path = f"{shop_id}/menu/{item_id}.jpg"
            
            storage = self._client().storage
            
            try:
                storage.from_(bucket).upload(
                    path, 
                    file_data, 
                    {"content-type": "image/jpeg", "upsert": "true"}
                )
            except Exception:
                try:
                    storage.from_(bucket).remove([path])
                except Exception:
                    pass
                storage.from_(bucket).upload(
                    path, 
                    file_data, 
                    {"content-type": "image/jpeg"}
                )
            
            url = storage.from_(bucket).get_public_url(path)
            
            (
                self._client()
                .table("menu_items")
                .update({"image_url": url})
                .eq("id", item_id)
                .eq("shop_id", shop_id)
                .execute()
            )
            
            return url
        except Exception as e:
            print(f"Error uploading item image: {e}")
            raise
    
    # ============================================================================
    # CUSTOMIZATION TEMPLATE OPERATIONS
    # ============================================================================
    
    async def list_customization_templates(
        self, 
        shop_id: str
    ) -> List[Dict[str, Any]]:
        """Get all public customization templates for a shop"""
        if not self.db:
            return []
        
        try:
            response = (
                self._client()
                .table("customization_templates")
                .select(PUBLIC_CUSTOMIZATION_TEMPLATE_FIELDS)
                .eq("shop_id", shop_id)
                .execute()
            )
            return response.data or []
        except Exception as e:
            print(f"Error listing customization templates for shop {shop_id}: {e}")
            return []
    
    async def create_customization_template(
        self, 
        shop_id: str, 
        template_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a customization template"""
        if not self.db:
            template_data["shop_id"] = shop_id
            return template_data
        
        try:
            template_data["shop_id"] = shop_id
            response = (
                self._client()
                .table("customization_templates")
                .insert(template_data)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating customization template: {e}")
            raise
    
    async def update_customization_template(
        self, 
        template_id: str, 
        template_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update customization template"""
        if not self.db:
            return template_data
        
        try:
            response = (
                self._client()
                .table("customization_templates")
                .update(template_data)
                .eq("id", template_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating customization template {template_id}: {e}")
            raise
    
    async def delete_customization_template(self, template_id: str) -> bool:
        """Delete customization template"""
        if not self.db:
            return True
        
        try:
            (
                self._client()
                .table("customization_templates")
                .delete()
                .eq("id", template_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Error deleting customization template {template_id}: {e}")
            return False
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def _get_top_items(self, shop_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top selling items for a shop using the popular_menu_items view"""
        if not self.db:
            return []
        
        try:
            response = (
                self._client()
                .table("popular_menu_items")
                .select("*")
                .eq("shop_id", shop_id)
                .order("order_count", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as e:
            print(f"Error getting top items: {e}")
            return []
    
    async def verify_shop_ownership(self, shop_id: str, user_id: str) -> bool:
        """Verify that user owns the shop"""
        if not self.db:
            return True
        
        try:
            response = (
                self._client()
                .table("shops")
                .select("owner_id")
                .eq("id", shop_id)
                .single()
                .execute()
            )
            
            if response.data:
                return response.data["owner_id"] == user_id
            return False
        except Exception as e:
            print(f"Error verifying shop ownership: {e}")
            return False
    
    async def is_admin(self, user_id: str) -> bool:
        """Check if user is admin"""
        if not self.db:
            return False
        
        try:
            response = (
                self._client()
                .table("profiles")
                .select("role")
                .eq("id", user_id)
                .single()
                .execute()
            )
            
            if response.data:
                return response.data["role"] == "admin"
            return False
        except Exception as e:
            print(f"Error checking admin status: {e}")
            return False


# Global service instance
shop_service = ShopService()
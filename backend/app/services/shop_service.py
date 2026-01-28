"""
Shop Service - Business logic for shop and menu management
Handles CRUD operations, analytics, and geolocation queries
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
import os


class ShopService:
    """Service layer for shop operations"""
    
    def __init__(self, supabase_client=None):
        """Initialize shop service with optional Supabase client"""
        self.db = supabase_client
    
    # ============================================================================
    # SHOP OPERATIONS
    # ============================================================================
    
    async def list_shops(
        self, 
        city: Optional[str] = None,
        search: Optional[str] = None,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """List all shops with optional filters"""
        if not self.db:
            return []
        
        try:
            query = self.db.get_service_client().table('shops').select('*')
            
            if active_only:
                query = query.eq('status', 'active')
            
            if city:
                query = query.ilike('city', f'%{city}%')
            
            if search:
                query = query.or_(f'name.ilike.%{search}%,description.ilike.%{search}%')
            
            response = query.order('created_at', desc=True).execute()
            return response.data or []
        except Exception as e:
            print(f"Error listing shops: {e}")
            return []
    
    async def get_shop_by_id(self, shop_id: str) -> Optional[Dict[str, Any]]:
        """Get shop details by ID"""
        if not self.db:
            return None
        
        try:
            response = self.db.get_service_client()\
                .table('shops')\
                .select('*')\
                .eq('id', shop_id)\
                .single()\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error getting shop {shop_id}: {e}")
            return None
    
    async def create_shop(self, shop_data: Dict[str, Any], owner_id: str) -> Dict[str, Any]:
        """Create a new shop"""
        if not self.db:
            shop_data['owner_id'] = owner_id
            shop_data['created_at'] = datetime.now().isoformat()
            return shop_data
        
        try:
            shop_data['owner_id'] = owner_id
            response = self.db.get_service_client()\
                .table('shops')\
                .insert(shop_data)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating shop: {e}")
            raise
    
    async def update_shop(self, shop_id: str, shop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update shop details"""
        if not self.db:
            return shop_data
        
        try:
            response = self.db.get_service_client()\
                .table('shops')\
                .update(shop_data)\
                .eq('id', shop_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating shop {shop_id}: {e}")
            raise
    
    async def delete_shop(self, shop_id: str) -> bool:
        """Deactivate shop (soft delete)"""
        if not self.db:
            return True
        
        try:
            self.db.get_service_client()\
                .table('shops')\
                .update({'status': 'suspended'})\
                .eq('id', shop_id)\
                .execute()
            return True
        except Exception as e:
            print(f"Error deleting shop {shop_id}: {e}")
            return False
    
    async def find_nearby_shops(
        self, 
        lat: float, 
        lng: float, 
        radius_km: float = 10
    ) -> List[Dict[str, Any]]:
        """Find shops within radius of coordinates"""
        # TODO: Implement geolocation query with PostGIS
        # For now, return all active shops
        return await self.list_shops(active_only=True)
    
    async def upload_shop_image(
        self, 
        shop_id: str, 
        file_data: bytes, 
        image_type: str  # 'logo' or 'banner'
    ) -> str:
        """Upload shop logo or banner to Supabase Storage"""
        # TODO: Implement Supabase Storage upload
        return f"https://storage.example.com/{shop_id}/{image_type}.jpg"
    
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
            # Get total orders and revenue
            orders_response = self.db.get_service_client()\
                .table('orders')\
                .select('total')\
                .eq('shop_id', shop_id)\
                .eq('status', 'completed')\
                .execute()
            
            orders = orders_response.data or []
            total_orders = len(orders)
            total_revenue = sum(float(order.get('total', 0)) for order in orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
            
            # Get today's orders
            today = datetime.now().date().isoformat()
            today_response = self.db.get_service_client()\
                .table('orders')\
                .select('total')\
                .eq('shop_id', shop_id)\
                .gte('created_at', today)\
                .execute()
            
            today_orders = today_response.data or []
            orders_today = len(today_orders)
            revenue_today = sum(float(order.get('total', 0)) for order in today_orders)
            
            return {
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "orders_today": orders_today,
                "revenue_today": revenue_today,
                "avg_order_value": avg_order_value,
                "top_items": []  # TODO: Implement top items query
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
        """Get all menu categories for a shop"""
        if not self.db:
            return []
        
        try:
            response = self.db.get_service_client()\
                .table('menu_categories')\
                .select('*')\
                .eq('shop_id', shop_id)\
                .order('display_order')\
                .execute()
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
            response = self.db.get_service_client()\
                .table('menu_categories')\
                .insert({
                    "shop_id": shop_id,
                    "name": name,
                    "display_order": display_order
                })\
                .execute()
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
            response = self.db.get_service_client()\
                .table('menu_categories')\
                .update(data)\
                .eq('id', category_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating category {category_id}: {e}")
            raise
    
    async def delete_category(self, category_id: str) -> bool:
        """Delete menu category"""
        if not self.db:
            return True
        
        try:
            self.db.get_service_client()\
                .table('menu_categories')\
                .delete()\
                .eq('id', category_id)\
                .execute()
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
                self.db.get_service_client()\
                    .table('menu_categories')\
                    .update({'display_order': item['display_order']})\
                    .eq('id', item['category_id'])\
                    .execute()
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
        """Get menu items for a shop, optionally filtered by category"""
        if not self.db:
            return []
        
        try:
            query = self.db.get_service_client()\
                .table('menu_items')\
                .select('*')\
                .eq('shop_id', shop_id)
            
            if category_id:
                query = query.eq('category_id', category_id)
            
            response = query.order('display_order').execute()
            return response.data or []
        except Exception as e:
            print(f"Error listing menu items for shop {shop_id}: {e}")
            return []
    
    async def get_menu_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get menu item details"""
        if not self.db:
            return None
        
        try:
            response = self.db.get_service_client()\
                .table('menu_items')\
                .select('*')\
                .eq('id', item_id)\
                .single()\
                .execute()
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
            item_data['shop_id'] = shop_id
            item_data['created_at'] = datetime.now().isoformat()
            return item_data
        
        try:
            item_data['shop_id'] = shop_id
            response = self.db.get_service_client()\
                .table('menu_items')\
                .insert(item_data)\
                .execute()
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
            response = self.db.get_service_client()\
                .table('menu_items')\
                .update(item_data)\
                .eq('id', item_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating menu item {item_id}: {e}")
            raise
    
    async def delete_menu_item(self, item_id: str) -> bool:
        """Delete menu item"""
        if not self.db:
            return True
        
        try:
            self.db.get_service_client()\
                .table('menu_items')\
                .delete()\
                .eq('id', item_id)\
                .execute()
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
            response = self.db.get_service_client()\
                .table('menu_items')\
                .update({'is_available': is_available})\
                .eq('id', item_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error toggling availability for item {item_id}: {e}")
            raise
    
    async def upload_item_image(
        self, 
        item_id: str, 
        file_data: bytes
    ) -> str:
        """Upload menu item image to Supabase Storage"""
        # TODO: Implement Supabase Storage upload
        return f"https://storage.example.com/items/{item_id}.jpg"
    
    # ============================================================================
    # CUSTOMIZATION TEMPLATE OPERATIONS
    # ============================================================================
    
    async def list_customization_templates(
        self, 
        shop_id: str
    ) -> List[Dict[str, Any]]:
        """Get all customization templates for a shop"""
        if not self.db:
            return []
        
        try:
            response = self.db.get_service_client()\
                .table('customization_templates')\
                .select('*')\
                .eq('shop_id', shop_id)\
                .execute()
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
            template_data['shop_id'] = shop_id
            return template_data
        
        try:
            template_data['shop_id'] = shop_id
            response = self.db.get_service_client()\
                .table('customization_templates')\
                .insert(template_data)\
                .execute()
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
        # TODO: Implement with Supabase
        return template_data
    
    async def delete_customization_template(self, template_id: str) -> bool:
        """Delete customization template"""
        # TODO: Implement with Supabase
        return True
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    def verify_shop_ownership(self, shop_id: str, user_id: str) -> bool:
        """Verify that user owns the shop"""
        # TODO: Implement with Supabase
        return True
    
    def is_admin(self, user_id: str) -> bool:
        """Check if user is admin"""
        # TODO: Implement with Supabase
        return False


# Global service instance
shop_service = ShopService()

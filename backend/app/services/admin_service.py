"""
Admin service for platform management
Handles analytics, shop/user management, audit logging
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json


class AdminService:
    """Service for admin operations and platform management"""
    
    def __init__(self, db_controller):
        self.db = db_controller
    
    # Platform analytics
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get platform overview statistics"""
        stats = {
            "total_revenue": self._calculate_total_revenue(),
            "total_orders": self._get_total_orders(),
            "total_users": self._get_total_users(),
            "total_shops": self._get_total_shops(),
            "active_shops": self._get_shops_by_status("active"),
            "pending_shops": self._get_shops_by_status("pending"),
            "revenue_change": self._calculate_revenue_change(),
            "orders_change": self._calculate_orders_change(),
            "users_change": self._calculate_users_change()
        }
        return stats
    
    def get_analytics_overview(self, days: int = 30) -> Dict[str, Any]:
        """Get detailed platform metrics"""
        return {
            "revenue_trend": self._get_revenue_trend(days),
            "order_trend": self._get_order_trend(days),
            "user_growth": self._get_user_growth(days),
            "shop_growth": self._get_shop_growth(days),
            "top_shops": self._get_top_performing_shops(10),
            "avg_order_value": self._calculate_avg_order_value()
        }
    
    def get_revenue_analytics(self, period: str = "month") -> Dict[str, Any]:
        """Get revenue analytics by period"""
        return {
            "total": self._get_revenue_by_period(period),
            "by_shop": self._get_revenue_by_shop(period),
            "trend": self._get_revenue_trend_by_period(period)
        }
    
    def get_order_analytics(self, period: str = "month") -> Dict[str, Any]:
        """Get order analytics"""
        return {
            "total": self._get_orders_by_period(period),
            "by_status": self._get_orders_by_status(period),
            "by_shop": self._get_orders_by_shop(period)
        }
    
    def get_growth_analytics(self) -> Dict[str, Any]:
        """Get user and shop growth metrics"""
        return {
            "users": {
                "total": self._get_total_users(),
                "daily": self._get_daily_signups(30),
                "monthly": self._get_monthly_signups(12)
            },
            "shops": {
                "total": self._get_total_shops(),
                "daily": self._get_daily_shops(30),
                "monthly": self._get_monthly_shops(12)
            }
        }
    
    # Shop management
    
    def list_shops(self, status: Optional[str] = None, 
                   featured: Optional[bool] = None,
                   limit: int = 50, offset: int = 0) -> List[Dict]:
        """List all shops with filters"""
        query = "SELECT * FROM shops WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if featured is not None:
            query += " AND featured = ?"
            params.append(featured)
        
        query += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
        
        return self._execute_query(query, params)
    
    def get_shop_details(self, shop_id: str) -> Optional[Dict]:
        """Get detailed shop information"""
        shop = self._execute_query(
            "SELECT * FROM shops WHERE id = ?", 
            [shop_id]
        )
        if not shop:
            return None
        
        shop_data = shop[0]
        shop_data["owner"] = self._get_user_by_id(shop_data.get("owner_id"))
        shop_data["stats"] = {
            "total_orders": self._get_shop_order_count(shop_id),
            "total_revenue": self._get_shop_revenue(shop_id),
            "menu_items": self._get_shop_menu_count(shop_id)
        }
        
        return shop_data
    
    def update_shop_status(self, shop_id: str, status: str, 
                          admin_id: str) -> bool:
        """Change shop status (approve, suspend, activate)"""
        valid_statuses = ["pending", "active", "suspended"]
        if status not in valid_statuses:
            return False
        
        self._execute_update(
            "UPDATE shops SET status = ? WHERE id = ?",
            [status, shop_id]
        )
        
        self._log_admin_action(
            admin_id=admin_id,
            action=f"shop_status_changed_{status}",
            entity_type="shop",
            entity_id=shop_id,
            details={"new_status": status}
        )
        
        return True
    
    def toggle_shop_featured(self, shop_id: str, admin_id: str) -> bool:
        """Toggle shop featured status"""
        shop = self.get_shop_details(shop_id)
        if not shop:
            return False
        
        new_featured = not shop.get("featured", False)
        
        self._execute_update(
            "UPDATE shops SET featured = ? WHERE id = ?",
            [new_featured, shop_id]
        )
        
        self._log_admin_action(
            admin_id=admin_id,
            action="shop_featured_toggled",
            entity_type="shop",
            entity_id=shop_id,
            details={"featured": new_featured}
        )
        
        return True
    
    def delete_shop(self, shop_id: str, admin_id: str) -> bool:
        """Permanently delete a shop"""
        self._execute_update("DELETE FROM shops WHERE id = ?", [shop_id])
        
        self._log_admin_action(
            admin_id=admin_id,
            action="shop_deleted",
            entity_type="shop",
            entity_id=shop_id,
            details={}
        )
        
        return True
    
    # User management
    
    def list_users(self, role: Optional[str] = None,
                   status: Optional[str] = None,
                   limit: int = 50, offset: int = 0) -> List[Dict]:
        """List all users with filters"""
        query = "SELECT * FROM profiles WHERE 1=1"
        params = []
        
        if role:
            query += " AND role = ?"
            params.append(role)
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        query += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
        
        return self._execute_query(query, params)
    
    def get_user_details(self, user_id: str) -> Optional[Dict]:
        """Get detailed user information"""
        user = self._get_user_by_id(user_id)
        if not user:
            return None
        
        user["stats"] = {
            "total_orders": self._get_user_order_count(user_id),
            "total_spent": self._get_user_total_spent(user_id),
            "loyalty_points": self._get_user_loyalty_points(user_id)
        }
        
        return user
    
    def update_user_role(self, user_id: str, role: str, admin_id: str) -> bool:
        """Change user role"""
        valid_roles = ["customer", "shop_worker", "shop_owner", "admin"]
        if role not in valid_roles:
            return False
        
        self._execute_update(
            "UPDATE profiles SET role = ? WHERE id = ?",
            [role, user_id]
        )
        
        self._log_admin_action(
            admin_id=admin_id,
            action="user_role_changed",
            entity_type="user",
            entity_id=user_id,
            details={"new_role": role}
        )
        
        return True
    
    def update_user_status(self, user_id: str, status: str, admin_id: str) -> bool:
        """Suspend or activate user"""
        valid_statuses = ["active", "suspended"]
        if status not in valid_statuses:
            return False
        
        self._execute_update(
            "UPDATE profiles SET status = ? WHERE id = ?",
            [status, user_id]
        )
        
        self._log_admin_action(
            admin_id=admin_id,
            action=f"user_status_changed_{status}",
            entity_type="user",
            entity_id=user_id,
            details={"new_status": status}
        )
        
        return True
    
    def delete_user(self, user_id: str, admin_id: str) -> bool:
        """Delete user account"""
        self._execute_update("DELETE FROM profiles WHERE id = ?", [user_id])
        
        self._log_admin_action(
            admin_id=admin_id,
            action="user_deleted",
            entity_type="user",
            entity_id=user_id,
            details={}
        )
        
        return True
    
    # Platform settings
    
    def get_platform_settings(self) -> Dict[str, Any]:
        """Get platform configuration settings"""
        # For now return hardcoded settings, can be moved to DB later
        return {
            "platform_name": "LoyalCup",
            "global_loyalty_enabled": True,
            "default_points_per_dollar": 10,
            "max_shops_per_owner": 5,
            "shop_approval_required": True,
            "maintenance_mode": False
        }
    
    def update_platform_settings(self, settings: Dict[str, Any], 
                                 admin_id: str) -> bool:
        """Update platform settings"""
        # Store in settings table or cache
        # For now just log the action
        self._log_admin_action(
            admin_id=admin_id,
            action="settings_updated",
            entity_type="settings",
            entity_id=None,
            details=settings
        )
        
        return True
    
    # Audit log
    
    def get_audit_log(self, limit: int = 100, offset: int = 0,
                      admin_id: Optional[str] = None,
                      entity_type: Optional[str] = None) -> List[Dict]:
        """Retrieve audit log entries"""
        query = "SELECT * FROM audit_log WHERE 1=1"
        params = []
        
        if admin_id:
            query += " AND admin_id = ?"
            params.append(admin_id)
        
        if entity_type:
            query += " AND entity_type = ?"
            params.append(entity_type)
        
        query += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
        
        return self._execute_query(query, params)
    
    # Helper methods for database operations
    
    def _execute_query(self, query: str, params: List = None) -> List[Dict]:
        """Execute SELECT query and return results"""
        # Placeholder - will be implemented with actual DB
        return []
    
    def _execute_update(self, query: str, params: List = None) -> None:
        """Execute UPDATE/DELETE query"""
        # Placeholder - will be implemented with actual DB
        pass
    
    def _log_admin_action(self, admin_id: str, action: str,
                         entity_type: str, entity_id: Optional[str],
                         details: Dict) -> None:
        """Log admin action to audit_log table"""
        query = """
            INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details)
            VALUES (?, ?, ?, ?, ?)
        """
        self._execute_update(query, [
            admin_id, action, entity_type, entity_id, 
            json.dumps(details)
        ])
    
    # Analytics helper methods
    
    def _calculate_total_revenue(self) -> float:
        """Calculate total platform revenue"""
        return 0.0
    
    def _get_total_orders(self) -> int:
        """Get total order count"""
        return 0
    
    def _get_total_users(self) -> int:
        """Get total user count"""
        return 0
    
    def _get_total_shops(self) -> int:
        """Get total shop count"""
        return 0
    
    def _get_shops_by_status(self, status: str) -> int:
        """Count shops by status"""
        return 0
    
    def _calculate_revenue_change(self) -> float:
        """Calculate revenue change percentage"""
        return 0.0
    
    def _calculate_orders_change(self) -> float:
        """Calculate orders change percentage"""
        return 0.0
    
    def _calculate_users_change(self) -> float:
        """Calculate users change percentage"""
        return 0.0
    
    def _get_revenue_trend(self, days: int) -> List[Dict]:
        """Get revenue trend data"""
        return []
    
    def _get_order_trend(self, days: int) -> List[Dict]:
        """Get order trend data"""
        return []
    
    def _get_user_growth(self, days: int) -> List[Dict]:
        """Get user growth data"""
        return []
    
    def _get_shop_growth(self, days: int) -> List[Dict]:
        """Get shop growth data"""
        return []
    
    def _get_top_performing_shops(self, limit: int) -> List[Dict]:
        """Get top performing shops by revenue"""
        return []
    
    def _calculate_avg_order_value(self) -> float:
        """Calculate average order value"""
        return 0.0
    
    def _get_revenue_by_period(self, period: str) -> float:
        """Get revenue for a specific period"""
        return 0.0
    
    def _get_revenue_by_shop(self, period: str) -> List[Dict]:
        """Get revenue breakdown by shop"""
        return []
    
    def _get_revenue_trend_by_period(self, period: str) -> List[Dict]:
        """Get revenue trend for period"""
        return []
    
    def _get_orders_by_period(self, period: str) -> int:
        """Get order count for period"""
        return 0
    
    def _get_orders_by_status(self, period: str) -> Dict[str, int]:
        """Get orders grouped by status"""
        return {}
    
    def _get_orders_by_shop(self, period: str) -> List[Dict]:
        """Get orders breakdown by shop"""
        return []
    
    def _get_daily_signups(self, days: int) -> List[Dict]:
        """Get daily user signups"""
        return []
    
    def _get_monthly_signups(self, months: int) -> List[Dict]:
        """Get monthly user signups"""
        return []
    
    def _get_daily_shops(self, days: int) -> List[Dict]:
        """Get daily shop registrations"""
        return []
    
    def _get_monthly_shops(self, months: int) -> List[Dict]:
        """Get monthly shop registrations"""
        return []
    
    def _get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return None
    
    def _get_shop_order_count(self, shop_id: str) -> int:
        """Get total orders for shop"""
        return 0
    
    def _get_shop_revenue(self, shop_id: str) -> float:
        """Get total revenue for shop"""
        return 0.0
    
    def _get_shop_menu_count(self, shop_id: str) -> int:
        """Get menu item count for shop"""
        return 0
    
    def _get_user_order_count(self, user_id: str) -> int:
        """Get total orders for user"""
        return 0
    
    def _get_user_total_spent(self, user_id: str) -> float:
        """Get total amount spent by user"""
        return 0.0
    
    def _get_user_loyalty_points(self, user_id: str) -> int:
        """Get user's loyalty points"""
        return 0

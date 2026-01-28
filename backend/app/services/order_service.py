from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

class OrderService:
    """Service layer for order operations"""
    
    TAX_RATE = 0.08  # 8% tax rate
    
    # valid status transitions
    VALID_TRANSITIONS = {
        'pending': ['accepted', 'cancelled'],
        'accepted': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['picked_up'],
        'picked_up': ['completed'],
        'completed': [],
        'cancelled': []
    }
    
    def __init__(self, supabase_client=None):
        """Initialize order service with optional Supabase client"""
        self.db = supabase_client
    
    def calculate_item_price(self, base_price: float, customizations: List[Dict]) -> float:
        # calculate total price for item including customizations
        total = base_price
        
        for custom in customizations:
            if 'price' in custom:
                total += custom['price']
        
        return round(total, 2)
    
    def calculate_order_totals(self, items: List[Dict]) -> Dict:
        # calculate subtotal, tax, and total for order
        subtotal = 0.0
        
        for item in items:
            quantity = item.get('quantity', 1)
            base_price = item.get('base_price', 0.0)
            customizations = item.get('customizations', [])
            
            item_price = self.calculate_item_price(base_price, customizations)
            subtotal += item_price * quantity
        
        subtotal = round(subtotal, 2)
        tax = round(subtotal * self.TAX_RATE, 2)
        total = round(subtotal + tax, 2)
        
        return {
            'subtotal': subtotal,
            'tax': tax,
            'total': total
        }
    
    def validate_status_transition(self, current_status: str, new_status: str) -> bool:
        # check if status transition is valid
        if current_status not in self.VALID_TRANSITIONS:
            return False
        
        return new_status in self.VALID_TRANSITIONS[current_status]
    
    def calculate_loyalty_points(self, total: float, points_per_dollar: int) -> int:
        # calculate loyalty points earned from order
        if points_per_dollar <= 0:
            return 0
        
        return int(total * points_per_dollar)
    
    def can_cancel_order(self, status: str) -> bool:
        # only pending orders can be cancelled by customer
        return status == 'pending'
    
    def create_order_data(self, shop_id: str, customer_id: str, items: List[Dict], 
                         points_per_dollar: int = 0) -> Dict:
        """Prepare order data for creation"""
        totals = self.calculate_order_totals(items)
        loyalty_points = self.calculate_loyalty_points(totals['total'], points_per_dollar)
        
        return {
            'id': str(uuid.uuid4()),
            'shop_id': shop_id,
            'customer_id': customer_id,
            'status': 'pending',
            'subtotal': totals['subtotal'],
            'tax': totals['tax'],
            'total': totals['total'],
            'loyalty_points_earned': loyalty_points,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
    
    # ============================================================================
    # ORDER OPERATIONS
    # ============================================================================
    
    async def create_order(self, shop_id: str, customer_id: str, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a new order with items"""
        if not self.db:
            return self.create_order_data(shop_id, customer_id, items)
        
        try:
            # Calculate totals
            totals = self.calculate_order_totals(items)
            
            # Create order record
            order_data = {
                'shop_id': shop_id,
                'customer_id': customer_id,
                'status': 'pending',
                'subtotal': totals['subtotal'],
                'tax': totals['tax'],
                'total': totals['total']
            }
            
            response = self.db.get_service_client()\
                .table('orders')\
                .insert(order_data)\
                .execute()
            
            if not response.data:
                raise Exception("Failed to create order")
            
            order = response.data[0]
            order_id = order['id']
            
            # Insert order items
            order_items = []
            for item in items:
                item_price = self.calculate_item_price(
                    item.get('base_price', 0.0),
                    item.get('customizations', [])
                )
                
                order_items.append({
                    'order_id': order_id,
                    'menu_item_id': item.get('menu_item_id'),
                    'quantity': item.get('quantity', 1),
                    'price': item_price,
                    'customizations': item.get('customizations', [])
                })
            
            if order_items:
                self.db.get_service_client()\
                    .table('order_items')\
                    .insert(order_items)\
                    .execute()
            
            # Note: Loyalty points are awarded when order status changes to 'completed'
            # via update_order_status method
            
            return order
        except Exception as e:
            print(f"Error creating order: {e}")
            raise
    
    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get order details with items"""
        if not self.db:
            return None
        
        try:
            # Get order
            order_response = self.db.get_service_client()\
                .table('orders')\
                .select('*, shops(name, logo_url)')\
                .eq('id', order_id)\
                .single()\
                .execute()
            
            if not order_response.data:
                return None
            
            order = order_response.data
            
            # Get order items
            items_response = self.db.get_service_client()\
                .table('order_items')\
                .select('*, menu_items(name, description)')\
                .eq('order_id', order_id)\
                .execute()
            
            order['items'] = items_response.data or []
            
            return order
        except Exception as e:
            print(f"Error getting order {order_id}: {e}")
            return None
    
    async def list_orders(
        self, 
        customer_id: Optional[str] = None,
        shop_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get orders for customer or shop with optional status filter"""
        if not self.db:
            return []
        
        try:
            query = self.db.get_service_client()\
                .table('orders')\
                .select('*, shops(name, logo_url)')
            
            if customer_id:
                query = query.eq('customer_id', customer_id)
            
            if shop_id:
                query = query.eq('shop_id', shop_id)
            
            if status:
                query = query.eq('status', status)
            
            response = query.order('created_at', desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            print(f"Error listing orders: {e}")
            return []
    
    async def update_order_status(self, order_id: str, new_status: str) -> Dict[str, Any]:
        """Update order status with validation"""
        if not self.db:
            raise ValueError("Database not available")
        
        try:
            # Get current order
            order_response = self.db.get_service_client()\
                .table('orders')\
                .select('*')\
                .eq('id', order_id)\
                .single()\
                .execute()
            
            if not order_response.data:
                raise ValueError(f"Order {order_id} not found")
            
            order = order_response.data
            current_status = order.get('status')
            
            # Validate status transition
            if not self.validate_status_transition(current_status, new_status):
                raise ValueError(
                    f"Invalid status transition from {current_status} to {new_status}"
                )
            
            # Update status
            update_response = self.db.get_service_client()\
                .table('orders')\
                .update({'status': new_status})\
                .eq('id', order_id)\
                .execute()
            
            updated_order = update_response.data[0] if update_response.data else order
            
            # Award loyalty points when order is completed
            if new_status == 'completed':
                try:
                    from app.services.loyalty_service import loyalty_service
                    
                    # Set the db client for loyalty_service if not set
                    if not loyalty_service.db:
                        loyalty_service.db = self.db
                    
                    shop_points, global_points = await loyalty_service.calculate_points(
                        order['total'], 
                        order['shop_id']
                    )
                    
                    if shop_points > 0 or global_points > 0:
                        await loyalty_service.award_points(
                            order['customer_id'],
                            order['shop_id'],
                            order_id,
                            shop_points,
                            global_points
                        )
                except Exception as e:
                    print(f"Error awarding loyalty points: {e}")
                    # Don't fail the order completion if loyalty points fail
            
            return updated_order
        except Exception as e:
            print(f"Error updating order status: {e}")
            raise
    
    async def cancel_order(self, order_id: str, customer_id: str) -> Dict[str, Any]:
        """Cancel order if it's in pending status"""
        if not self.db:
            raise ValueError("Database not available")
        
        try:
            # Get current order
            order_response = self.db.get_service_client()\
                .table('orders')\
                .select('*')\
                .eq('id', order_id)\
                .eq('customer_id', customer_id)\
                .single()\
                .execute()
            
            if not order_response.data:
                raise ValueError(f"Order {order_id} not found or access denied")
            
            order = order_response.data
            current_status = order.get('status')
            
            # Check if order can be cancelled
            if not self.can_cancel_order(current_status):
                raise ValueError(
                    f"Cannot cancel order with status: {current_status}. Only pending orders can be cancelled."
                )
            
            # Update status to cancelled
            update_response = self.db.get_service_client()\
                .table('orders')\
                .update({'status': 'cancelled'})\
                .eq('id', order_id)\
                .execute()
            
            return update_response.data[0] if update_response.data else order
        except Exception as e:
            print(f"Error cancelling order: {e}")
            raise


# Global service instance
order_service = OrderService()

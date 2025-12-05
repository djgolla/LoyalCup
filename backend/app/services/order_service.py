from datetime import datetime
from typing import Dict, List, Optional
import uuid

class OrderService:
    # business logic for order management
    
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
        # prepare order data for creation
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

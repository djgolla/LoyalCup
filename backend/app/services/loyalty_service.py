# loyalty_service.py
# business logic for loyalty points, rewards, and transactions

from typing import Dict, Optional, Tuple, List, Any
from datetime import datetime

# global points rate (1 point per $1)
GLOBAL_POINTS_PER_DOLLAR = 1

class LoyaltyService:
    """Service for managing loyalty points and rewards"""
    
    def __init__(self, supabase_client=None):
        """Initialize loyalty service with Supabase client"""
        self.db = supabase_client
    
    async def calculate_points(self, order_total: float, shop_id: str) -> Tuple[int, int]:
        """
        Calculate points to award for an order
        Returns (shop_points, global_points)
        """
        if not self.db:
            return 0, 0
        
        try:
            response = self.db.get_service_client()\
                .table('shops')\
                .select('loyalty_points_per_dollar, participates_in_global_loyalty')\
                .eq('id', shop_id)\
                .single()\
                .execute()
            
            if not response.data:
                return 0, 0
            
            shop = response.data
            
            # shop-specific points (rounded to nearest integer)
            shop_points = round(order_total * shop.get('loyalty_points_per_dollar', 0))
            
            # global points (if shop participates)
            global_points = 0
            if shop.get('participates_in_global_loyalty', False):
                global_points = round(order_total * GLOBAL_POINTS_PER_DOLLAR)
            
            return shop_points, global_points
        except Exception as e:
            print(f"Error calculating points: {e}")
            return 0, 0
    
    async def award_points(self, user_id: str, shop_id: str, order_id: str, 
                     shop_points: int, global_points: int) -> Dict:
        """
        Award points to user for order completion
        Updates balances and creates transaction records
        """
        if not self.db:
            return {
                'shop_points': shop_points,
                'global_points': global_points,
                'transactions': []
            }
        
        transactions = []
        
        try:
            # award shop-specific points
            if shop_points > 0:
                await self._update_balance(user_id, shop_id, shop_points)
                trans = await self._create_transaction(
                    user_id=user_id,
                    shop_id=shop_id,
                    order_id=order_id,
                    points_change=shop_points,
                    trans_type='earned'
                )
                if trans:
                    transactions.append(trans)
            
            # award global points (shop_id = None for global)
            if global_points > 0:
                await self._update_balance(user_id, None, global_points)
                trans = await self._create_transaction(
                    user_id=user_id,
                    shop_id=None,
                    order_id=order_id,
                    points_change=global_points,
                    trans_type='earned'
                )
                if trans:
                    transactions.append(trans)
            
            return {
                'shop_points': shop_points,
                'global_points': global_points,
                'transactions': transactions
            }
        except Exception as e:
            print(f"Error awarding points: {e}")
            raise
    
    async def _update_balance(self, user_id: str, shop_id: Optional[str], points_change: int):
        """Internal method to update or create balance"""
        try:
            # Check if balance exists
            query = self.db.get_service_client()\
                .table('loyalty_balances')\
                .select('*')\
                .eq('user_id', user_id)
            
            if shop_id:
                query = query.eq('shop_id', shop_id)
            else:
                query = query.is_('shop_id', 'null')
            
            response = query.execute()
            
            if response.data:
                # Update existing balance
                balance = response.data[0]
                new_points = balance['points'] + points_change
                self.db.get_service_client()\
                    .table('loyalty_balances')\
                    .update({'points': new_points})\
                    .eq('id', balance['id'])\
                    .execute()
            else:
                # Create new balance
                self.db.get_service_client()\
                    .table('loyalty_balances')\
                    .insert({
                        'user_id': user_id,
                        'shop_id': shop_id,
                        'points': max(0, points_change)
                    })\
                    .execute()
        except Exception as e:
            print(f"Error updating balance: {e}")
            raise
    
    async def _create_transaction(self, user_id: str, shop_id: Optional[str], 
                                  order_id: Optional[str], points_change: int,
                                  trans_type: str) -> Optional[Dict]:
        """Internal method to create transaction record"""
        try:
            response = self.db.get_service_client()\
                .table('loyalty_transactions')\
                .insert({
                    'user_id': user_id,
                    'shop_id': shop_id,
                    'order_id': order_id,
                    'points_change': points_change,
                    'type': trans_type
                })\
                .execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return None
    
    async def get_user_balances(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all loyalty balances for a user"""
        if not self.db:
            return []
        
        try:
            response = self.db.get_service_client()\
                .table('loyalty_balances')\
                .select('*, shops(name, logo_url)')\
                .eq('user_id', user_id)\
                .execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting balances: {e}")
            return []
    
    async def get_balance(self, user_id: str, shop_id: Optional[str]) -> int:
        """Get balance for specific shop or global"""
        if not self.db:
            return 0
        
        try:
            query = self.db.get_service_client()\
                .table('loyalty_balances')\
                .select('points')\
                .eq('user_id', user_id)
            
            if shop_id:
                query = query.eq('shop_id', shop_id)
            else:
                query = query.is_('shop_id', 'null')
            
            response = query.single().execute()
            return response.data.get('points', 0) if response.data else 0
        except Exception as e:
            return 0
    
    async def get_available_rewards(self, user_id: str, shop_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all rewards user can redeem based on their balances"""
        if not self.db:
            return []
        
        try:
            # Get user's balances
            balances = await self.get_user_balances(user_id)
            available_rewards = []
            
            for balance in balances:
                balance_shop_id = balance.get('shop_id')
                points = balance.get('points', 0)
                
                # Get rewards for this shop
                query = self.db.get_service_client()\
                    .table('loyalty_rewards')\
                    .select('*')\
                    .eq('is_active', True)
                
                if balance_shop_id:
                    query = query.eq('shop_id', balance_shop_id)
                
                response = query.execute()
                rewards = response.data or []
                
                for reward in rewards:
                    available_rewards.append({
                        **reward,
                        'user_points': points,
                        'can_redeem': points >= reward.get('points_required', 0)
                    })
            
            # Filter by shop_id if provided
            if shop_id:
                available_rewards = [r for r in available_rewards if r.get('shop_id') == shop_id]
            
            return available_rewards
        except Exception as e:
            print(f"Error getting available rewards: {e}")
            return []
    
    async def redeem_reward(self, user_id: str, reward_id: str) -> Dict:
        """
        Redeem a reward for a user
        Validates balance and deducts points
        """
        if not self.db:
            raise ValueError("Database not available")
        
        try:
            # Get reward
            response = self.db.get_service_client()\
                .table('loyalty_rewards')\
                .select('*')\
                .eq('id', reward_id)\
                .single()\
                .execute()
            
            if not response.data:
                raise ValueError("Reward not found")
            
            reward = response.data
            
            if not reward.get('is_active', False):
                raise ValueError("Reward is not active")
            
            shop_id = reward.get('shop_id')
            points_required = reward.get('points_required', 0)
            
            # check balance
            current_balance = await self.get_balance(user_id, shop_id)
            if current_balance < points_required:
                raise ValueError("Insufficient points")
            
            # deduct points
            await self._update_balance(user_id, shop_id, -points_required)
            
            # create transaction
            transaction = await self._create_transaction(
                user_id=user_id,
                shop_id=shop_id,
                order_id=None,
                points_change=-points_required,
                trans_type='redeemed'
            )
            
            return {
                'reward': reward,
                'points_deducted': points_required,
                'new_balance': current_balance - points_required,
                'transaction': transaction
            }
        except Exception as e:
            print(f"Error redeeming reward: {e}")
            raise
    
    async def get_transaction_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get transaction history for a user"""
        if not self.db:
            return []
        
        try:
            response = self.db.get_service_client()\
                .table('loyalty_transactions')\
                .select('*, shops(name)')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting transaction history: {e}")
            return []
    
    async def create_reward(self, shop_id: str, name: str, description: str,
                     points_required: int, image_url: Optional[str] = None) -> Dict:
        """Create a new reward for a shop"""
        if not self.db:
            raise ValueError("Database not available")
        
        try:
            response = self.db.get_service_client()\
                .table('loyalty_rewards')\
                .insert({
                    'shop_id': shop_id,
                    'name': name,
                    'description': description,
                    'points_required': points_required,
                    'image_url': image_url,
                    'is_active': True
                })\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating reward: {e}")
            raise
    
    async def update_reward(self, reward_id: str, **kwargs) -> Dict:
        """Update an existing reward"""
        if not self.db:
            raise ValueError("Database not available")
        
        try:
            response = self.db.get_service_client()\
                .table('loyalty_rewards')\
                .update(kwargs)\
                .eq('id', reward_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating reward: {e}")
            raise
    
    async def delete_reward(self, reward_id: str) -> bool:
        """Delete a reward"""
        if not self.db:
            return False
        
        try:
            self.db.get_service_client()\
                .table('loyalty_rewards')\
                .delete()\
                .eq('id', reward_id)\
                .execute()
            return True
        except Exception as e:
            print(f"Error deleting reward: {e}")
            return False
    
    async def get_shop_rewards(self, shop_id: str, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get all rewards for a shop"""
        if not self.db:
            return []
        
        try:
            query = self.db.get_service_client()\
                .table('loyalty_rewards')\
                .select('*')\
                .eq('shop_id', shop_id)
            
            if active_only:
                query = query.eq('is_active', True)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting shop rewards: {e}")
            return []
    
    async def update_shop_loyalty_settings(self, shop_id: str, points_per_dollar: int, 
                                          participates_in_global: bool) -> Dict:
        """Update shop's loyalty settings"""
        if not self.db:
            raise ValueError("Database not available")
        
        try:
            response = self.db.get_service_client()\
                .table('shops')\
                .update({
                    'loyalty_points_per_dollar': points_per_dollar,
                    'participates_in_global_loyalty': participates_in_global
                })\
                .eq('id', shop_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating loyalty settings: {e}")
            raise


# Create global instance with no db (will be injected in routes)
loyalty_service = LoyaltyService()

# loyalty_service.py
# business logic for loyalty points, rewards, and transactions

from typing import Dict, Optional, Tuple
from datetime import datetime

# global points rate (1 point per $1)
GLOBAL_POINTS_PER_DOLLAR = 1

class LoyaltyService:
    """Service for managing loyalty points and rewards"""
    
    def __init__(self, db_controller):
        self.db = db_controller
    
    def calculate_points(self, order_total: float, shop_id: str) -> Tuple[int, int]:
        """
        Calculate points to award for an order
        Returns (shop_points, global_points)
        """
        shop = self.db.get_shop(shop_id)
        if not shop:
            return 0, 0
        
        # shop-specific points
        shop_points = int(order_total * shop.get('loyalty_points_per_dollar', 0))
        
        # global points (if shop participates)
        global_points = 0
        if shop.get('participates_in_global_loyalty', False):
            global_points = int(order_total * GLOBAL_POINTS_PER_DOLLAR)
        
        return shop_points, global_points
    
    def award_points(self, user_id: str, shop_id: str, order_id: str, 
                    shop_points: int, global_points: int) -> Dict:
        """
        Award points to user for order completion
        Updates balances and creates transaction records
        """
        transactions = []
        
        # award shop-specific points
        if shop_points > 0:
            self.db.update_balance(user_id, shop_id, shop_points)
            transactions.append(self.db.create_transaction(
                user_id=user_id,
                shop_id=shop_id,
                order_id=order_id,
                points_change=shop_points,
                type='earned'
            ))
        
        # award global points
        if global_points > 0:
            self.db.update_balance(user_id, None, global_points)
            transactions.append(self.db.create_transaction(
                user_id=user_id,
                shop_id=None,
                order_id=order_id,
                points_change=global_points,
                type='earned'
            ))
        
        return {
            'shop_points': shop_points,
            'global_points': global_points,
            'transactions': transactions
        }
    
    def get_user_balances(self, user_id: str) -> list:
        """Get all loyalty balances for a user"""
        return self.db.get_balances(user_id)
    
    def get_balance(self, user_id: str, shop_id: Optional[str]) -> int:
        """Get balance for specific shop or global"""
        balance = self.db.get_balance(user_id, shop_id)
        return balance.get('points', 0) if balance else 0
    
    def get_available_rewards(self, user_id: str) -> list:
        """Get all rewards user can redeem based on their balances"""
        balances = self.get_user_balances(user_id)
        available_rewards = []
        
        for balance in balances:
            shop_id = balance.get('shop_id')
            points = balance.get('points', 0)
            
            # get rewards for this shop that user can afford
            rewards = self.db.get_rewards(shop_id, active_only=True)
            for reward in rewards:
                if points >= reward.get('points_required', 0):
                    available_rewards.append({
                        **reward,
                        'user_points': points,
                        'can_redeem': True
                    })
        
        return available_rewards
    
    def redeem_reward(self, user_id: str, reward_id: str) -> Dict:
        """
        Redeem a reward for a user
        Validates balance and deducts points
        """
        reward = self.db.get_reward(reward_id)
        if not reward:
            raise ValueError("Reward not found")
        
        if not reward.get('is_active', False):
            raise ValueError("Reward is not active")
        
        shop_id = reward.get('shop_id')
        points_required = reward.get('points_required', 0)
        
        # check balance
        current_balance = self.get_balance(user_id, shop_id)
        if current_balance < points_required:
            raise ValueError("Insufficient points")
        
        # deduct points
        self.db.update_balance(user_id, shop_id, -points_required)
        
        # create transaction
        transaction = self.db.create_transaction(
            user_id=user_id,
            shop_id=shop_id,
            order_id=None,
            points_change=-points_required,
            type='redeemed'
        )
        
        return {
            'reward': reward,
            'points_deducted': points_required,
            'new_balance': current_balance - points_required,
            'transaction': transaction
        }
    
    def get_transaction_history(self, user_id: str, limit: int = 50) -> list:
        """Get transaction history for a user"""
        return self.db.get_transactions(user_id, limit=limit)
    
    def get_shop_loyalty_stats(self, shop_id: str) -> Dict:
        """Get loyalty program statistics for a shop"""
        return {
            'total_points_issued': self.db.get_total_points_issued(shop_id),
            'points_redeemed': self.db.get_points_redeemed(shop_id),
            'active_members': self.db.get_active_members_count(shop_id),
            'rewards_count': len(self.db.get_rewards(shop_id))
        }
    
    def update_shop_settings(self, shop_id: str, points_per_dollar: int, 
                            participates_in_global: bool) -> Dict:
        """Update shop's loyalty settings"""
        return self.db.update_shop_loyalty_settings(
            shop_id=shop_id,
            points_per_dollar=points_per_dollar,
            participates_in_global=participates_in_global
        )
    
    def create_reward(self, shop_id: str, name: str, description: str,
                     points_required: int) -> Dict:
        """Create a new reward for a shop"""
        return self.db.create_reward(
            shop_id=shop_id,
            name=name,
            description=description,
            points_required=points_required,
            is_active=True
        )
    
    def update_reward(self, reward_id: str, **kwargs) -> Dict:
        """Update an existing reward"""
        return self.db.update_reward(reward_id, **kwargs)
    
    def delete_reward(self, reward_id: str) -> bool:
        """Delete a reward"""
        return self.db.delete_reward(reward_id)
    
    def get_global_stats(self) -> Dict:
        """Get platform-wide loyalty statistics"""
        return {
            'total_points_issued': self.db.get_total_points_issued(None),
            'total_points_redeemed': self.db.get_points_redeemed(None),
            'participating_shops': self.db.get_participating_shops_count(),
            'total_members': self.db.get_total_members_count()
        }

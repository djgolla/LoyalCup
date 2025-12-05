# loyalty.py
# loyalty routes for customers, shop owners, and admins

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.loyalty_service import LoyaltyService

router = APIRouter(
    prefix="/api/v1",
    tags=["loyalty"]
)

# mock db controller for now
# in production this would be injected
class MockDBController:
    """Mock database controller - replace with actual implementation"""
    def __init__(self):
        self.balances = []
        self.rewards = []
        self.transactions = []
        self.shops = []
    
    def get_shop(self, shop_id):
        return {'loyalty_points_per_dollar': 10, 'participates_in_global_loyalty': True}
    
    def update_balance(self, user_id, shop_id, points_change):
        pass
    
    def create_transaction(self, **kwargs):
        return {'id': '1', **kwargs}
    
    def get_balances(self, user_id):
        return []
    
    def get_balance(self, user_id, shop_id):
        return {'points': 0}
    
    def get_rewards(self, shop_id, active_only=False):
        return []
    
    def get_reward(self, reward_id):
        return None
    
    def get_transactions(self, user_id, limit=50):
        return []
    
    def get_total_points_issued(self, shop_id):
        return 0
    
    def get_points_redeemed(self, shop_id):
        return 0
    
    def get_active_members_count(self, shop_id):
        return 0
    
    def update_shop_loyalty_settings(self, **kwargs):
        return kwargs
    
    def create_reward(self, **kwargs):
        return {'id': '1', **kwargs}
    
    def update_reward(self, reward_id, **kwargs):
        return {'id': reward_id, **kwargs}
    
    def delete_reward(self, reward_id):
        return True
    
    def get_participating_shops_count(self):
        return 0
    
    def get_total_members_count(self):
        return 0

# dependency to get loyalty service
def get_loyalty_service():
    db = MockDBController()
    return LoyaltyService(db)

# request/response models
class RedeemRequest(BaseModel):
    reward_id: str

class LoyaltySettingsUpdate(BaseModel):
    points_per_dollar: int
    participates_in_global_loyalty: bool

class RewardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    points_required: int

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points_required: Optional[int] = None
    is_active: Optional[bool] = None

# customer endpoints

@router.get("/loyalty/balances")
async def get_balances(user_id: str = "mock_user", 
                      service: LoyaltyService = Depends(get_loyalty_service)):
    """Get all user's loyalty balances (per shop + global)"""
    balances = service.get_user_balances(user_id)
    return {"balances": balances}

@router.get("/loyalty/balances/{shop_id}")
async def get_balance(shop_id: str, 
                     user_id: str = "mock_user",
                     service: LoyaltyService = Depends(get_loyalty_service)):
    """Get balance at specific shop"""
    balance = service.get_balance(user_id, shop_id)
    return {"shop_id": shop_id, "points": balance}

@router.get("/loyalty/transactions")
async def get_transactions(user_id: str = "mock_user",
                          limit: int = 50,
                          service: LoyaltyService = Depends(get_loyalty_service)):
    """Get transaction history"""
    transactions = service.get_transaction_history(user_id, limit)
    return {"transactions": transactions}

@router.get("/loyalty/rewards")
async def get_available_rewards(user_id: str = "mock_user",
                               service: LoyaltyService = Depends(get_loyalty_service)):
    """Get available rewards (all shops user has points at)"""
    rewards = service.get_available_rewards(user_id)
    return {"rewards": rewards}

@router.post("/loyalty/redeem")
async def redeem_reward(request: RedeemRequest,
                       user_id: str = "mock_user",
                       service: LoyaltyService = Depends(get_loyalty_service)):
    """Redeem points for reward"""
    try:
        result = service.redeem_reward(user_id, request.reward_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# shop owner endpoints

@router.get("/shops/{shop_id}/loyalty/settings")
async def get_loyalty_settings(shop_id: str):
    """Get loyalty settings for a shop"""
    # mock implementation - replace with actual db query
    return {
        "shop_id": shop_id,
        "points_per_dollar": 10,
        "participates_in_global_loyalty": True
    }

@router.put("/shops/{shop_id}/loyalty/settings")
async def update_loyalty_settings(shop_id: str,
                                 settings: LoyaltySettingsUpdate,
                                 service: LoyaltyService = Depends(get_loyalty_service)):
    """Update loyalty settings (points per $, global opt-in)"""
    result = service.update_shop_settings(
        shop_id=shop_id,
        points_per_dollar=settings.points_per_dollar,
        participates_in_global=settings.participates_in_global_loyalty
    )
    return result

@router.get("/shops/{shop_id}/loyalty/rewards")
async def get_shop_rewards(shop_id: str,
                          service: LoyaltyService = Depends(get_loyalty_service)):
    """Get shop's rewards"""
    # mock implementation
    return {"rewards": []}

@router.post("/shops/{shop_id}/loyalty/rewards")
async def create_shop_reward(shop_id: str,
                            reward: RewardCreate,
                            service: LoyaltyService = Depends(get_loyalty_service)):
    """Create reward"""
    result = service.create_reward(
        shop_id=shop_id,
        name=reward.name,
        description=reward.description or "",
        points_required=reward.points_required
    )
    return result

@router.put("/shops/{shop_id}/loyalty/rewards/{reward_id}")
async def update_shop_reward(shop_id: str,
                            reward_id: str,
                            reward: RewardUpdate,
                            service: LoyaltyService = Depends(get_loyalty_service)):
    """Update reward"""
    update_data = {k: v for k, v in reward.dict().items() if v is not None}
    result = service.update_reward(reward_id, **update_data)
    return result

@router.delete("/shops/{shop_id}/loyalty/rewards/{reward_id}")
async def delete_shop_reward(shop_id: str,
                            reward_id: str,
                            service: LoyaltyService = Depends(get_loyalty_service)):
    """Delete reward"""
    success = service.delete_reward(reward_id)
    if success:
        return {"message": "Reward deleted"}
    raise HTTPException(status_code=404, detail="Reward not found")

@router.get("/shops/{shop_id}/loyalty/stats")
async def get_shop_loyalty_stats(shop_id: str,
                                service: LoyaltyService = Depends(get_loyalty_service)):
    """Loyalty program stats for shop"""
    stats = service.get_shop_loyalty_stats(shop_id)
    return stats

# admin endpoints

@router.get("/admin/loyalty/global-stats")
async def get_global_stats(service: LoyaltyService = Depends(get_loyalty_service)):
    """Platform-wide loyalty stats"""
    stats = service.get_global_stats()
    return stats

@router.put("/admin/loyalty/global-settings")
async def update_global_settings():
    """Global loyalty settings (placeholder)"""
    # this would update platform-wide settings like global points rate
    return {"message": "Global settings updated"}

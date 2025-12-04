"""
Loyalty routes.
Handles loyalty points and rewards endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_supabase, SupabaseClient
from app.models.loyalty import (
    LoyaltyBalanceResponse,
    LoyaltyRewardCreate,
    LoyaltyRewardResponse,
    LoyaltyTransactionResponse
)
from app.services.loyalty_service import LoyaltyService
from app.utils.security import get_current_user, require_shop_owner


router = APIRouter(
    prefix="/loyalty",
    tags=["Loyalty"],
    responses={404: {"description": "Not found"}},
)


@router.get("/balance/{shop_id}", response_model=LoyaltyBalanceResponse)
async def get_loyalty_balance(
    shop_id: str,
    current_user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Get loyalty balance for a shop.
    
    Returns the current user's loyalty points balance at the specified shop.
    """
    loyalty_service = LoyaltyService(db)
    # TODO: Implement getting loyalty balance
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get loyalty balance to be implemented"
    )


@router.get("/rewards/{shop_id}", response_model=List[LoyaltyRewardResponse])
async def list_rewards(
    shop_id: str,
    active_only: bool = True,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    List available rewards for a shop.
    
    Returns all available loyalty rewards at the specified shop.
    """
    loyalty_service = LoyaltyService(db)
    # TODO: Implement listing rewards
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="List rewards to be implemented"
    )


@router.post("/rewards", response_model=LoyaltyRewardResponse, status_code=status.HTTP_201_CREATED)
async def create_reward(
    reward: LoyaltyRewardCreate,
    current_user: dict = Depends(require_shop_owner),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Create a new loyalty reward (shop owners only).
    
    Creates a new reward that customers can redeem with points.
    """
    # TODO: Implement reward creation
    # TODO: Verify user owns the shop
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Create reward to be implemented"
    )


@router.get("/transactions", response_model=List[LoyaltyTransactionResponse])
async def get_transaction_history(
    shop_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Get loyalty transaction history.
    
    Returns the current user's loyalty transaction history.
    """
    loyalty_service = LoyaltyService(db)
    # TODO: Implement transaction history retrieval
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get transaction history to be implemented"
    )


@router.post("/redeem/{reward_id}", response_model=LoyaltyBalanceResponse)
async def redeem_reward(
    reward_id: str,
    current_user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Redeem a loyalty reward.
    
    Redeems a reward using the current user's loyalty points.
    """
    loyalty_service = LoyaltyService(db)
    # TODO: Implement reward redemption
    # TODO: Check if user has enough points
    # TODO: Deduct points and create transaction
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Redeem reward to be implemented"
    )

"""
Authentication routes.
Handles user authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.database import get_supabase, SupabaseClient
from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserResponse
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)


class SignUpRequest(BaseModel):
    """Sign up request model."""
    email: EmailStr
    password: str
    full_name: str = None


class SignInRequest(BaseModel):
    """Sign in request model."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(
    request: SignUpRequest,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Sign up a new user.
    
    Creates a new user account with the provided credentials.
    """
    auth_service = AuthService(db)
    user_data = UserCreate(
        email=request.email,
        full_name=request.full_name
    )
    # TODO: Implement sign up with Supabase Auth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Sign up functionality to be implemented with Supabase Auth"
    )


@router.post("/signin", response_model=TokenResponse)
async def sign_in(
    request: SignInRequest,
    db: SupabaseClient = Depends(get_supabase)
):
    """
    Sign in an existing user.
    
    Authenticates a user with email and password.
    """
    auth_service = AuthService(db)
    # TODO: Implement sign in with Supabase Auth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Sign in functionality to be implemented with Supabase Auth"
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current user information.
    
    Returns the authenticated user's profile data.
    """
    # TODO: Fetch user profile from database
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get current user to be implemented"
    )


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh access token.
    
    Gets a new access token using a refresh token.
    """
    # TODO: Implement token refresh with Supabase Auth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh to be implemented with Supabase Auth"
    )

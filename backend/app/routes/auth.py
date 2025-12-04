"""
Authentication routes using Supabase Auth.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.auth_service import AuthService
from app.utils.security import require_auth, verify_token

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)

auth_service = AuthService()


# Request/Response Models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    access_token: str
    new_password: str


# Routes
@router.post("/register")
async def register(data: RegisterRequest):
    """
    Register a new user with email and password.
    Creates user in Supabase Auth and profile in profiles table with default role 'customer'.
    """
    try:
        result = await auth_service.register_user(
            email=data.email,
            password=data.password,
            full_name=data.full_name
        )
        return {
            "message": "User registered successfully",
            "user": {
                "id": result["user"].id,
                "email": result["user"].email
            },
            "session": {
                "access_token": result["session"].access_token,
                "refresh_token": result["session"].refresh_token
            } if result["session"] else None
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login")
async def login(data: LoginRequest):
    """
    Login with email and password.
    Returns JWT tokens and user profile.
    """
    try:
        result = await auth_service.login_user(
            email=data.email,
            password=data.password
        )
        return {
            "message": "Login successful",
            "user": {
                "id": result["user"].id,
                "email": result["user"].email
            },
            "profile": result["profile"],
            "session": {
                "access_token": result["session"].access_token,
                "refresh_token": result["session"].refresh_token
            } if result["session"] else None
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout")
async def logout(token_payload: dict = Depends(require_auth())):
    """
    Logout current user by invalidating the session.
    """
    try:
        await auth_service.logout_user(token_payload.get("sub"))
        return {"message": "Logout successful"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/refresh")
async def refresh(data: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    """
    try:
        result = await auth_service.refresh_token(data.refresh_token)
        return {
            "message": "Token refreshed successfully",
            "session": {
                "access_token": result["session"].access_token,
                "refresh_token": result["session"].refresh_token
            } if result["session"] else None
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me")
async def get_current_user(token_payload: dict = Depends(require_auth())):
    """
    Get current authenticated user's profile.
    """
    try:
        user_id = token_payload.get("sub")
        profile = await auth_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/google")
async def google_oauth():
    """
    Get Google OAuth URL.
    Note: Actual OAuth flow is typically handled client-side with Supabase.
    """
    try:
        oauth_url = await auth_service.get_google_oauth_url()
        return {"oauth_url": oauth_url}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Send password reset email via Supabase.
    """
    try:
        await auth_service.send_password_reset_email(data.email)
        return {"message": "Password reset email sent"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset password using reset token.
    """
    try:
        await auth_service.reset_password(data.access_token, data.new_password)
        return {"message": "Password reset successful"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

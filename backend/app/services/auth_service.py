"""
Authentication service using Supabase Auth.
Handles user registration, login, profile management, and OAuth.
"""
from typing import Optional, Dict
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Default role for new users
DEFAULT_USER_ROLE = "customer"


def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class AuthService:
    """Service for handling authentication operations."""

    def __init__(self):
        self._supabase = None

    @property
    def supabase(self) -> Client:
        """Lazy-load Supabase client."""
        if self._supabase is None:
            self._supabase = get_supabase_client()
        return self._supabase

    async def register_user(self, email: str, password: str, full_name: Optional[str] = None) -> Dict:
        """
        Register a new user with email and password.
        Creates user in Supabase Auth and profile in profiles table.
        """
        try:
            # Create user in Supabase Auth
            auth_response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name,
                        "role": DEFAULT_USER_ROLE
                    }
                }
            })

            if auth_response.user is None:
                raise ValueError("Failed to create user")

            user_id = auth_response.user.id

            # Create profile in profiles table
            profile_data = {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": DEFAULT_USER_ROLE
            }
            
            self.supabase.table("profiles").insert(profile_data).execute()

            return {
                "user": auth_response.user,
                "session": auth_response.session
            }
        except Exception as e:
            raise ValueError(f"Registration failed: {str(e)}")

    async def login_user(self, email: str, password: str) -> Dict:
        """
        Login user with email and password.
        Returns JWT tokens and user profile.
        """
        try:
            # Sign in with Supabase Auth
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if auth_response.user is None:
                raise ValueError("Invalid credentials")

            # Fetch user profile
            profile = self.supabase.table("profiles").select("*").eq("id", auth_response.user.id).execute()
            
            return {
                "user": auth_response.user,
                "session": auth_response.session,
                "profile": profile.data[0] if profile.data else None
            }
        except Exception as e:
            raise ValueError(f"Login failed: {str(e)}")

    async def logout_user(self, access_token: str) -> bool:
        """
        Logout user by invalidating the session.
        """
        try:
            self.supabase.auth.sign_out()
            return True
        except Exception as e:
            raise ValueError(f"Logout failed: {str(e)}")

    async def refresh_token(self, refresh_token: str) -> Dict:
        """
        Refresh access token using refresh token.
        """
        try:
            session = self.supabase.auth.refresh_session(refresh_token)
            return {
                "session": session
            }
        except Exception as e:
            raise ValueError(f"Token refresh failed: {str(e)}")

    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """
        Get user profile by user ID.
        """
        try:
            profile = self.supabase.table("profiles").select("*").eq("id", user_id).execute()
            return profile.data[0] if profile.data else None
        except Exception as e:
            raise ValueError(f"Failed to fetch profile: {str(e)}")

    async def update_user_profile(self, user_id: str, update_data: Dict) -> Dict:
        """
        Update user profile.
        """
        try:
            # Remove fields that shouldn't be updated directly
            allowed_fields = ["full_name", "avatar_url"]
            filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
            
            profile = self.supabase.table("profiles").update(filtered_data).eq("id", user_id).execute()
            return profile.data[0] if profile.data else None
        except Exception as e:
            raise ValueError(f"Failed to update profile: {str(e)}")

    async def change_user_role(self, user_id: str, new_role: str) -> Dict:
        """
        Change user role (admin only operation).
        Valid roles: customer, shop_worker, shop_owner, admin
        """
        valid_roles = ["customer", "shop_worker", "shop_owner", "admin"]
        if new_role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        try:
            profile = self.supabase.table("profiles").update({"role": new_role}).eq("id", user_id).execute()
            return profile.data[0] if profile.data else None
        except Exception as e:
            raise ValueError(f"Failed to change role: {str(e)}")

    async def send_password_reset_email(self, email: str) -> bool:
        """
        Send password reset email via Supabase.
        """
        try:
            self.supabase.auth.reset_password_email(email)
            return True
        except Exception as e:
            raise ValueError(f"Failed to send reset email: {str(e)}")

    async def reset_password(self, access_token: str, new_password: str) -> bool:
        """
        Reset password using reset token.
        """
        try:
            self.supabase.auth.update_user({"password": new_password})
            return True
        except Exception as e:
            raise ValueError(f"Failed to reset password: {str(e)}")

    async def list_users(self, page: int = 1, per_page: int = 10) -> Dict:
        """
        List all users with pagination.
        Returns users from the profiles table.
        """
        try:
            # Calculate offset for pagination
            offset = (page - 1) * per_page
            
            # Get total count
            count_response = self.supabase.table("profiles").select("*", count="exact").execute()
            total = count_response.count if hasattr(count_response, 'count') else 0
            
            # Get paginated users
            profiles = self.supabase.table("profiles") \
                .select("*") \
                .range(offset, offset + per_page - 1) \
                .execute()
            
            return {
                "users": profiles.data if profiles.data else [],
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page if total > 0 else 0
            }
        except Exception as e:
            raise ValueError(f"Failed to list users: {str(e)}")

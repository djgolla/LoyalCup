"""
Configuration management using Pydantic Settings.
Loads environment variables and provides type-safe configuration access.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Supabase configuration
    supabase_url: str = Field(default="https://placeholder.supabase.co")
    supabase_anon_key: str = Field(default="placeholder-anon-key")
    supabase_service_role_key: str = Field(default="placeholder-service-key")

    # JWT configuration
    jwt_secret: str = Field(default="placeholder-jwt-secret-change-in-production")
    jwt_algorithm: str = Field(default="HS256")

    # Application configuration
    environment: str = Field(default="development")

    # CORS configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:19006"],
    )

    # API metadata
    api_title: str = Field(default="LoyalCup API")
    api_version: str = Field(default="1.0.0")
    api_description: str = Field(
        default="Backend API for LoyalCup - A loyalty-focused coffee shop ordering platform"
    )

    # Square configuration
    square_env: str = Field(default="sandbox")  # sandbox or production
    square_application_id: str = Field(default="", description="Square application ID")
    square_callback_url: str = Field(default="", description="Square OAuth callback URL")
    square_application_secret: str = Field(default="", description="Square secret")

    # Rate limiting
    rate_limit_enabled: bool = Field(default=True)
    rate_limit_requests: int = Field(default=100)
    rate_limit_window: int = Field(default=60)

    # Sentry error tracking
    sentry_dsn: str = Field(default="")
    sentry_environment: str = Field(default="production")
    sentry_traces_sample_rate: float = Field(default=0.1)

    # Email configuration
    sendgrid_api_key: str = Field(default="")
    sendgrid_from_email: str = Field(default="noreply@loyalcup.com")

    # Redis configuration
    redis_url: str = Field(default="redis://localhost:6379")

    # Stripe configuration
    stripe_secret_key: str = Field(default="")
    stripe_webhook_secret: str = Field(default="")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
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
    
    Attributes:
        supabase_url: The Supabase project URL
        supabase_anon_key: The Supabase anonymous key for client-side operations
        supabase_service_role_key: The Supabase service role key for server-side operations
        jwt_secret: Secret key for JWT validation (from Supabase JWT secret)
        environment: Current environment (dev/staging/prod)
        cors_origins: List of allowed CORS origins
        api_title: API title for documentation
        api_version: API version
        api_description: API description
    """
    
    # Supabase configuration
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_anon_key: str = Field(..., description="Supabase anonymous key")
    supabase_service_role_key: str = Field(..., description="Supabase service role key")
    
    # JWT configuration
    jwt_secret: str = Field(..., description="JWT secret key from Supabase")
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    
    # Application configuration
    environment: str = Field(default="development", description="Environment: development, staging, or production")
    
    # CORS configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:19006"],
        description="Allowed CORS origins"
    )
    
    # API metadata
    api_title: str = Field(default="LoyalCup API", description="API title")
    api_version: str = Field(default="1.0.0", description="API version")
    api_description: str = Field(
        default="Backend API for LoyalCup - A loyalty-focused coffee shop ordering platform",
        description="API description"
    )
    
    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, description="Number of requests allowed per window")
    rate_limit_window: int = Field(default=60, description="Rate limit window in seconds")
    
    # Sentry error tracking
    sentry_dsn: str = Field(default="", description="Sentry DSN for error tracking")
    sentry_environment: str = Field(default="production", description="Sentry environment")
    sentry_traces_sample_rate: float = Field(default=0.1, description="Sentry traces sample rate")
    
    # Email configuration
    sendgrid_api_key: str = Field(default="", description="SendGrid API key")
    sendgrid_from_email: str = Field(default="noreply@loyalcup.com", description="From email address")
    
    # Redis configuration (for rate limiting and caching)
    redis_url: str = Field(default="redis://localhost:6379", description="Redis connection URL")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()

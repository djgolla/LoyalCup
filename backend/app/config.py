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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()

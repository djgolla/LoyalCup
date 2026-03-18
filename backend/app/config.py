from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, ValidationError


class Settings(BaseSettings):
    supabase_url: str = Field(default="https://placeholder.supabase.co")
    supabase_anon_key: str = Field(default="placeholder-anon-key")
    supabase_service_role_key: str = Field(default="placeholder-service-key")
    jwt_secret: str = Field(default="placeholder-jwt-secret-change-in-production")
    jwt_algorithm: str = Field(default="HS256")
    environment: str = Field(default="development")
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173"])
    api_title: str = Field(default="LoyalCup API")
    api_version: str = Field(default="1.0.0")
    api_description: str = Field(default="Backend API for LoyalCup")

    # Square
    square_env: str = Field(default="sandbox")
    square_application_id: str = Field(default="")
    square_application_secret: str = Field(default="")
    square_callback_url: str = Field(default="")

    # App
    frontend_url: str = Field(default="http://localhost:5173")

    # Rate limiting
    rate_limit_enabled: bool = Field(default=True)
    rate_limit_requests: int = Field(default=100)
    rate_limit_window: int = Field(default=60)

    # Monitoring
    sentry_dsn: str = Field(default="")
    sentry_environment: str = Field(default="production")
    sentry_traces_sample_rate: float = Field(default=0.1)

    # Email
    sendgrid_api_key: str = Field(default="")
    sendgrid_from_email: str = Field(default="noreply@loyalcup.com")

    # Cache
    redis_url: str = Field(default="redis://localhost:6379")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


try:
    settings = Settings()
except ValidationError as e:
    print("FATAL: .env CONFIGURATION INVALID")
    print(e)
    raise SystemExit(2)
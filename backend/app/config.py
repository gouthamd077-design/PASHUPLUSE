from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    APP_NAME: str = "PASHU PULSE API"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database: SQLite by default for simple zero-setup Windows dev, PostgreSQL for prod
    DATABASE_URL: str = "sqlite:///./pashupulse.db"

    # Security: JWT configuration
    SECRET_KEY: str = "pashupulse-dev-secret-key-change-in-production-only-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days for offline-first rural usage

    # Mock OTP for development
    DEV_MOCK_OTP: str = "1234"

    # Allowed CORS Origins for React + Vite PWA frontend
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

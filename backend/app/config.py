from typing import Any, List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    APP_NAME: str = "PASHU PULSE API"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database: SQLite by default for simple zero-setup Windows dev, PostgreSQL/Supabase for prod
    DATABASE_URL: str = ""
    POSTGRES_URL: str = ""
    POSTGRES_PRISMA_URL: str = ""
    POSTGRES_URL_NON_POOLING: str = ""

    # Security: JWT configuration
    SECRET_KEY: str = "pashupulse-dev-secret-key-change-in-production-only-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days for offline-first rural usage

    # Mock OTP for development
    DEV_MOCK_OTP: str = "1234"

    # Allowed CORS Origins for React + Vite PWA frontend (Any type prevents json.loads crash on escaped strings)
    CORS_ORIGINS: Any = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    # Supabase Configuration
    SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = ""
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    @property
    def effective_supabase_url(self) -> str:
        return self.SUPABASE_URL or self.NEXT_PUBLIC_SUPABASE_URL or ""

    @property
    def effective_supabase_anon_key(self) -> str:
        return (
            self.SUPABASE_ANON_KEY
            or self.NEXT_PUBLIC_SUPABASE_ANON_KEY
            or self.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            or ""
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

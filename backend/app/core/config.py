from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "beacon-workbench"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    debug: bool = True
    host: str = "127.0.0.1"
    port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///./beacon.db"
    database_echo: bool = False

    # Security
    secret_key: str = Field(default="", min_length=32)
    algorithm: str = "RS256"
    access_token_expire_minutes: int = 30

    # OIDC / Keycloak
    oidc_enabled: bool = True
    oidc_issuer_url: str = "http://127.0.0.1:8080/realms/beacon"
    oidc_client_id: str = "beacon-workbench"
    oidc_client_secret: str = ""
    oidc_audience: str = "beacon-workbench-api"
    oidc_jwks_url: Optional[str] = None

    # CORS
    cors_origins: List[str] = Field(default_factory=lambda: ["http://127.0.0.1:5173", "http://localhost:5173"])

    # LLM (optional)
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_base_url: Optional[str] = None
    llm_api_key: Optional[str] = None

    @field_validator("oidc_jwks_url", mode="before")
    @classmethod
    def build_jwks_url(cls, v: Optional[str], info) -> str:
        if v:
            return v
        issuer = info.data.get("oidc_issuer_url", "")
        if issuer:
            return f"{issuer.rstrip('/')}/protocol/openid-connect/certs"
        return ""

    @field_validator("secret_key", mode="before")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        if not v and info.data.get("environment") == "production":
            raise ValueError("SECRET_KEY must be set in production")
        return v or "development-secret-key-change-in-production-min-32-chars"


@lru_cache
def get_settings() -> Settings:
    return Settings()
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "Medical System API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./medical.db"

    SECRET_KEY: str = Field(default="your-secret-key-change-in-production-please-make-it-very-long-and-random")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: List[str] = ["http://localhost:4200", "http://localhost:3000"]

    OLLAMA_URL: str = Field(default_factory=lambda: os.getenv("OLLAMA_URL", "http://localhost:11434"))
    OLLAMA_MODEL: str = Field(default_factory=lambda: os.getenv("OLLAMA_MODEL", "llama3"))

    WEBSOCKET_URL: str = Field(default_factory=lambda: os.getenv("WEBSOCKET_URL", "ws://localhost:8000/ws"))

    # Добавлено ✨
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"      
    )


settings = Settings()

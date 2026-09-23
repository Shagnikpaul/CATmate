"""Environment variables, DB URL, Groq API key, and app settings."""
import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "CatMate API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "sqlite:///./catmate.db"
    SECRET_KEY: str = "catmate-secret-key-2026"
    SESSION_EXPIRE_HOURS: int = 24

    # Groq API Configuration (loaded securely from .env)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    GROQ_FALLBACK_MODEL: str = "openai/gpt-oss-20b"

    # Embedding & ML settings
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    FAISS_TOP_K: int = 3

    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    MANUALS_DIR: Path = BASE_DIR / "data" / "manuals"
    ML_DIR: Path = BASE_DIR / "app" / "ml"

    # CORS
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

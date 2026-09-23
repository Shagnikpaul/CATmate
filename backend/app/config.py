"""
Configuration settings for CatMate Backend.
Uses pydantic-settings to load environment variables from .env with sensible defaults.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "CatMate Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Security & Sessions
    SECRET_KEY: str = "catmate_development_secret_key_2026_caterpillar"
    ALGORITHM: str = "HS256"
    SESSION_EXPIRE_HOURS: int = 12

    # Database
    DATABASE_URL: str = "sqlite:///./catmate.db"

    # Groq LLM Configuration
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    GROQ_FALLBACK_MODEL: str = "openai/gpt-oss-20b"

    # Machine Learning & RAG
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    FAISS_TOP_K: int = 3

    # Paths (Auto-resolved)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent  # backend/
    DATA_DIR: Path = BASE_DIR / "data"
    MANUALS_DIR: Path = DATA_DIR / "manuals"
    ML_DIR: Path = BASE_DIR / "app" / "ml"

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

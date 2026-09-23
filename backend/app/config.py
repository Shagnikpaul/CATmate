"""Environment variables, DB URL, Groq API key, and app settings."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres.dpckgmoztmqwndshfbtr:eassybassworf.784r9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
    SECRET_KEY: str = "catmate-super-secret-key-2026-hackathon"
    SESSION_EXPIRE_HOURS: int = 24
    GROQ_API_KEY: str = ""
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()

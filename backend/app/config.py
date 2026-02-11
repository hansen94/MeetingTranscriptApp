from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    openai_api_key: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
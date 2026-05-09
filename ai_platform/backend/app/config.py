"""
Configuration Management for AI Image Generation Platform
Loads and validates environment variables using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    Uses Pydantic for validation and type checking
    """
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Cloudflare R2 Configuration
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str = "ai-images"
    R2_PUBLIC_URL: str
    
    # ComfyUI Configuration
    COMFYUI_URL: str = "http://localhost:8189"
    COMFYUI_TIMEOUT: int = 300  # seconds
    
    # Application Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    
    # Credits Configuration
    CREDITS_PER_IMAGE: int = 10
    GPU_TIME_MULTIPLIER: float = 1.0
    
    # Image Configuration
    MAX_PROMPT_LENGTH: int = 1000
    ALLOWED_MODELS: str = "dreamshaper_8.safetensors,realisticVision_v51.safetensors"
    DEFAULT_MODEL: str = "dreamshaper_8.safetensors"
    
    class Config:
        """Pydantic configuration"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def get_allowed_models_list(self) -> List[str]:
        """
        Parse ALLOWED_MODELS string into list
        Returns: List of allowed model names
        """
        return [model.strip() for model in self.ALLOWED_MODELS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def r2_endpoint_url(self) -> str:
        """Construct R2 endpoint URL"""
        return f"https://{self.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """
    Dependency function to get settings instance
    Used for FastAPI dependency injection
    """
    return settings

from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Force load .env file to override system environment variables (like outdated keys in conda env)
load_dotenv(override=True)

class Settings(BaseSettings):
    # MongoDB (Atlas)
    MONGO_URI: str
    DB_NAME: str

    # JWT
    JWT_SECRET: str

    # Admin credentials
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # CORS Configuration
    ALLOW_ORIGINS: str = "*"  # Comma-separated list of allowed origins

    # Google Gemini AI
    GEMINI_API_KEY: str  # Required from .env file
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Groq API Configuration
    GROQ_API_KEY: str | None = None  # Load from .env file

    # Hugging Face (Optional)
    HUGGINGFACE_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()

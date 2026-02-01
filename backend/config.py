from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import secrets

class Settings(BaseSettings):
    # MongoDB Configuration - Use MONGO_URI environment variable
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/zalo_bot_manager")  # Fallback for local development
    database_name: str = "zalo_bot_manager"
    # MongoDB client timeouts (milliseconds). Tune to make app fail-fast
    # when Atlas is under maintenance or network is slow.
    mongodb_server_selection_timeout_ms: int = 5000
    mongodb_connect_timeout_ms: int = 2000
    mongodb_socket_timeout_ms: int = 20000
    mongodb_max_pool_size: int | None = None

    # Generate secure default secret key
    default_secret_key: str = secrets.token_urlsafe(32)
    secret_key: str = os.getenv("SECRET_KEY", default_secret_key)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # Production CORS origins - will be overridden by environment variable
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,https://your-production-domain.com")

    bot_api_key: str = "default-bot-key"
    
    zalo_api_key: str = ""
    zalo_secret_key: str = ""
    zalo_imei: str = ""
    zalo_cookies: str = "{}"
    auto_start_bot: bool = False
    
    model_config = {
        "env_file": os.path.join(os.path.dirname(__file__), ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "allow"
    }  
    
    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

settings = Settings()
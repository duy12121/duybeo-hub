from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "zalo_bot_manager"
    # MongoDB client timeouts (milliseconds). Tune to make app fail-fast
    # when Atlas is under maintenance or network is slow.
    mongodb_server_selection_timeout_ms: int = 5000
    mongodb_connect_timeout_ms: int = 2000
    mongodb_socket_timeout_ms: int = 20000
    mongodb_max_pool_size: int | None = None

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    bot_api_key: str = "default-bot-key"

    zalo_api_key: str
    zalo_secret_key: str
    zalo_imei: str
    zalo_cookies: str
    auto_start_bot: str 
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"  
    
    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

settings = Settings()
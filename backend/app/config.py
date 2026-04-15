from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    UAZAPI_DEFAULT_URL: str = "https://farollbr.uazapi.com"
    UAZAPI_MAX_BATCH_SIZE: int = 3
    UAZAPI_INITIAL_INTERVAL: int = 30
    UAZAPI_MAX_INTERVAL: int = 60

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

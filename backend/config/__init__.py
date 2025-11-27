import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

# 환경 변수에서 ENV 읽기 (기본값: development)
ENV = os.getenv("ENV", "development")

# 환경에 따라 .env 파일 선택
if ENV == "production":
    ENV_FILE = ".env.production"
else:
    ENV_FILE = ".env"

print(f"Loading environment from: {ENV_FILE} (ENV={ENV})")


class CommonSettings(BaseSettings):
    model_config = ConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "U-KTA-web"
    DEBUG_MODE: bool = False


class ServerSettings(BaseSettings):
    model_config = ConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    HOST: str = "0.0.0.0"
    PORT: int = 8000


class DatabaseSettings(BaseSettings):
    model_config = ConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    DB_URL: str = "mongodb://kdd:kddnumber1@localhost:3633"
    DB_NAME: str = "ukta"


class Settings(CommonSettings, ServerSettings, DatabaseSettings):
    model_config = ConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")


settings = Settings()

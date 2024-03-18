from pydantic_settings import BaseSettings


class CommonSettings(BaseSettings):
    APP_NAME: str = "U-KTA-web"
    DEBUG_MODE: bool = False


class ServerSettings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000


class DatabaseSettings(BaseSettings):
    DB_URL: str = "mongodb://kdd:kddnumber1@localhost:3633"
    DB_NAME: str="ukta"


class Settings(CommonSettings, ServerSettings, DatabaseSettings):
    pass


settings = Settings()

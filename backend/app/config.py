from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./cleanops.db"

    @property
    def database_url(self) -> str:
        return self.DATABASE_URL.strip()
    UPLOAD_DIR: str = "./uploads"
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_UPLOAD_SIZE_MB: int = 200
    JWT_SECRET_KEY: str = "changeme-use-a-real-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 72
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

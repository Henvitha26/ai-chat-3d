from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str

    # --- JWT ---
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- App ---
    APP_NAME: str = "AI Chat 3D API"
    CORS_ORIGINS: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    # --- LLM ---
    LLM_PROVIDER: str = "ollama"
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    # --- Uploads ---
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def use_groq(self) -> bool:
        """Use Groq in production or when explicitly configured."""
        return self.ENVIRONMENT == "production" or self.LLM_PROVIDER == "groq"


settings = Settings()
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str

    class config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SYNAPSESYNC_",
        env_file=".env",
        extra="ignore",
    )

    database_url: str = "sqlite:///../data/synapsesync.db"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])

    github_username: str | None = None
    github_token: str | None = None

    def model_post_init(self, __context) -> None:
        if self.database_url.startswith("sqlite:///") and self.database_url != "sqlite:///:memory:":
            raw_path = self.database_url[len("sqlite:///") :]
            db_path = Path(raw_path)
            if db_path.parent:
                db_path.parent.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()

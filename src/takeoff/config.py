from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+psycopg2://takeoff:takeoff@localhost:5432/takeoff"
    anthropic_api_key: str = ""
    storage_path: str = "./storage"

    # Pipeline tuning
    leader_snap_tolerance_pct: float = 0.03  # 3% of nearest grid spacing
    proximity_dominant_ratio: float = 2.0    # callout is "dominant" if 2x closer than next candidate
    review_confidence_threshold: float = 0.65


settings = Settings()

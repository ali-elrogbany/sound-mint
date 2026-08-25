"""
SoundMint Backend — Configuration (loaded from .env)
"""
import os
from typing import List

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Pinata IPFS
    PINATA_API_KEY: str = os.getenv("PINATA_API_KEY", "")
    PINATA_SECRET_API_KEY: str = os.getenv("PINATA_SECRET_API_KEY", "")
    PINATA_JWT: str = os.getenv("PINATA_JWT", "")

    # CORS
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
        return [o.strip() for o in raw.split(",") if o.strip()]

    # Session / Storage
    SESSION_TTL_HOURS: int = int(os.getenv("SESSION_TTL_HOURS", "1"))
    SESSIONS_DIR: str = os.getenv("SESSIONS_DIR", "/tmp/soundmint-sessions")

    # Rate Limiting
    RATE_LIMIT_UPLOADS_PER_HOUR: int = int(
        os.getenv("RATE_LIMIT_UPLOADS_PER_HOUR", "10")
    )

    # GIF Generation
    GIF_WIDTH: int = int(os.getenv("GIF_WIDTH", "600"))
    GIF_HEIGHT: int = int(os.getenv("GIF_HEIGHT", "600"))
    GIF_FRAMES: int = int(os.getenv("GIF_FRAMES", "72"))
    GIF_FPS: int = int(os.getenv("GIF_FPS", "12"))

    # Max upload size in bytes (25 MB)
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024


settings = Settings()

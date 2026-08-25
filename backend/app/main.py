"""
SoundMint Backend — FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from fastapi.responses import FileResponse
from app.routers import upload, session
from app.session_store import get_session as _get_session


limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure sessions directory exists on startup
    os.makedirs(settings.SESSIONS_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="SoundMint API",
    description="Transform MP3 audio tracks into unique animated NFTs.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate Limiter ────────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (P5.js renderer) ───────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ── Routers ─────────────────────────────────────────────────────────────────────
app.include_router(upload.router, prefix="/v1")
app.include_router(session.router, prefix="/v1")


# ── GIF Serving (local preview before IPFS pinning) ─────────────────────────────
@app.get("/tmp-session/{session_id}/output.gif", include_in_schema=False)
async def serve_session_gif(session_id: str):
    """Serve the generated GIF for a session (local preview, not IPFS)."""
    import re
    # Sanitize session_id — must be a valid UUID
    if not re.match(r'^[0-9a-f-]{36}$', session_id):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = _get_session(session_id)
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found or expired")

    gif_path = os.path.join(session.session_dir, "output.gif")
    if not os.path.exists(gif_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="GIF not yet generated")

    return FileResponse(gif_path, media_type="image/gif", filename=f"soundmint-{session_id[:8]}.gif")


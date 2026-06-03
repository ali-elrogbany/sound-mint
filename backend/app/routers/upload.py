"""
SoundMint Backend — Upload Router (Epic 1)

POST /v1/upload  — Accepts MP3, validates MIME + size, starts pipeline
"""
import asyncio
import os

from fastapi import APIRouter, BackgroundTasks, File, Request, UploadFile
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.session_store import (
    PipelineStage,
    advance_stage,
    create_session,
    fail_session,
    schedule_cleanup,
)
from app.services.pipeline import run_pipeline

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_MIME_TYPES = {"audio/mpeg", "audio/mp3"}
# MP3 magic bytes: ID3 tag or MPEG sync
MP3_MAGIC = [b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2", b"\xff\xe3"]


def _is_mp3_magic(header: bytes) -> bool:
    return any(header.startswith(m) for m in MP3_MAGIC)


@router.post("/upload")
@limiter.limit(f"{settings.RATE_LIMIT_UPLOADS_PER_HOUR}/hour")
async def upload_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    # ── MIME type check ─────────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_MIME_TYPES:
        return JSONResponse(
            status_code=422,
            content={
                "error": "INVALID_FILE_TYPE",
                "message": "Only MP3 files are supported.",
                "detail": f"Received content-type: {file.content_type}",
            },
        )

    # ── Read file (check size during stream) ────────────────────────────────────
    chunks = []
    total_size = 0
    header_checked = False

    while True:
        chunk = await file.read(65536)  # 64 KB chunks
        if not chunk:
            break
        total_size += len(chunk)

        if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
            return JSONResponse(
                status_code=422,
                content={
                    "error": "FILE_TOO_LARGE",
                    "message": f"File exceeds the 25 MB limit.",
                    "detail": f"Received {total_size} bytes so far.",
                },
            )

        # Magic bytes check on first chunk
        if not header_checked and chunks == []:
            if not _is_mp3_magic(chunk[:4]):
                return JSONResponse(
                    status_code=422,
                    content={
                        "error": "INVALID_FILE_TYPE",
                        "message": "Only MP3 files are supported.",
                        "detail": "File magic bytes do not match MP3 format.",
                    },
                )
            header_checked = True

        chunks.append(chunk)

    file_data = b"".join(chunks)

    # ── Create session directory + save file ────────────────────────────────────
    # Temporarily build session before we know the ID — we'll write post-create
    session = create_session(
        file_name=file.filename or "upload.mp3",
        file_path="",  # filled below
    )
    session_dir = f"{settings.SESSIONS_DIR}/{session.session_id}"
    os.makedirs(session_dir, exist_ok=True)

    file_path = os.path.join(session_dir, "input.mp3")
    with open(file_path, "wb") as f:
        f.write(file_data)

    # Update the file path now that we know it
    session.file_path = file_path

    # ── Queue pipeline as background task ───────────────────────────────────────
    background_tasks.add_task(run_pipeline, session.session_id)
    background_tasks.add_task(schedule_cleanup, session.session_id)

    return {
        "session_id": session.session_id,
        "status": "processing",
        "message": "File received. Analysis started.",
    }

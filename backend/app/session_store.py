"""
SoundMint Backend — In-Memory Session Store

Tracks pipeline state for each active session UUID.
In MVP this is a simple dict; replace with Redis for multi-instance deployments.
"""
import asyncio
import shutil
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, Optional

from app.config import settings


class PipelineStage(str, Enum):
    UPLOADED = "UPLOADED"
    ANALYZED = "ANALYZED"
    GENERATING_NFT = "GENERATING_NFT"
    PINNING = "PINNING"
    READY = "READY"
    FAILED = "FAILED"


STAGE_ORDER = [
    PipelineStage.UPLOADED,
    PipelineStage.ANALYZED,
    PipelineStage.GENERATING_NFT,
    PipelineStage.PINNING,
    PipelineStage.READY,
]

STAGE_PROGRESS: Dict[PipelineStage, int] = {
    PipelineStage.UPLOADED: 10,
    PipelineStage.ANALYZED: 35,
    PipelineStage.GENERATING_NFT: 65,
    PipelineStage.PINNING: 85,
    PipelineStage.READY: 100,
    PipelineStage.FAILED: 0,
}


@dataclass
class SessionData:
    session_id: str
    file_name: str
    file_path: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    current_stage: PipelineStage = PipelineStage.UPLOADED
    error: Optional[str] = None
    audio_features: Optional[Dict[str, Any]] = None
    generation_result: Optional[Dict[str, Any]] = None
    ipfs_result: Optional[Dict[str, Any]] = None

    @property
    def status(self) -> str:
        stage_to_status = {
            PipelineStage.UPLOADED: "processing",
            PipelineStage.ANALYZED: "processing",
            PipelineStage.GENERATING_NFT: "generating",
            PipelineStage.PINNING: "pinning",
            PipelineStage.READY: "ready",
            PipelineStage.FAILED: "failed",
        }
        return stage_to_status[self.current_stage]

    @property
    def stages_completed(self):
        idx = STAGE_ORDER.index(self.current_stage) if self.current_stage in STAGE_ORDER else 0
        return [s.value for s in STAGE_ORDER[:idx]]

    @property
    def stages_remaining(self):
        if self.current_stage == PipelineStage.FAILED:
            return []
        idx = STAGE_ORDER.index(self.current_stage) if self.current_stage in STAGE_ORDER else 0
        return [s.value for s in STAGE_ORDER[idx + 1:]]

    @property
    def progress_percent(self) -> int:
        return STAGE_PROGRESS.get(self.current_stage, 0)

    @property
    def session_dir(self) -> str:
        return f"{settings.SESSIONS_DIR}/{self.session_id}"


# ── Global session registry ─────────────────────────────────────────────────────
_sessions: Dict[str, SessionData] = {}


def create_session(file_name: str, file_path: str) -> SessionData:
    session_id = str(uuid.uuid4())
    session = SessionData(
        session_id=session_id,
        file_name=file_name,
        file_path=file_path,
    )
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[SessionData]:
    return _sessions.get(session_id)


def advance_stage(session_id: str, stage: PipelineStage) -> None:
    if session_id in _sessions:
        _sessions[session_id].current_stage = stage


def fail_session(session_id: str, error: str) -> None:
    if session_id in _sessions:
        _sessions[session_id].current_stage = PipelineStage.FAILED
        _sessions[session_id].error = error


def cleanup_session(session_id: str) -> None:
    session = _sessions.pop(session_id, None)
    if session:
        try:
            shutil.rmtree(session.session_dir, ignore_errors=True)
        except Exception:
            pass


async def schedule_cleanup(session_id: str) -> None:
    """Deletes session files after SESSION_TTL_HOURS."""
    await asyncio.sleep(settings.SESSION_TTL_HOURS * 3600)
    cleanup_session(session_id)

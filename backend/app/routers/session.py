"""
SoundMint Backend — Session / Status / Result Router

GET /v1/health              — Health check
GET /v1/status/{session_id} — Pipeline progress polling
GET /v1/result/{session_id} — Completed result (ready state only)
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.session_store import PipelineStage, get_session

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@router.get("/status/{session_id}")
async def get_status(session_id: str):
    session = get_session(session_id)
    if not session:
        return JSONResponse(
            status_code=404,
            content={"error": "SESSION_NOT_FOUND", "message": "Session not found or expired."},
        )

    return {
        "session_id": session.session_id,
        "status": session.status,
        "stage": session.current_stage.value,
        "stages_completed": session.stages_completed,
        "stages_remaining": session.stages_remaining,
        "progress_percent": session.progress_percent,
        "error": session.error,
    }


@router.get("/result/{session_id}")
async def get_result(session_id: str):
    session = get_session(session_id)
    if not session:
        return JSONResponse(
            status_code=404,
            content={"error": "SESSION_NOT_FOUND", "message": "Session not found or expired."},
        )

    if session.current_stage == PipelineStage.FAILED:
        return JSONResponse(
            status_code=422,
            content={
                "error": "PIPELINE_FAILED",
                "message": session.error or "Pipeline failed.",
                "session_id": session_id,
            },
        )

    if session.current_stage != PipelineStage.READY:
        return JSONResponse(
            status_code=202,
            content={
                "session_id": session_id,
                "status": session.status,
                "message": "Processing not yet complete. Poll /status/{session_id}.",
                "progress_percent": session.progress_percent,
            },
        )

    gen = session.generation_result or {}
    audio = session.audio_features or {}
    ipfs = session.ipfs_result or {}

    return {
        "session_id": session_id,
        "status": "ready",
        "file_name": session.file_name,
        # IPFS fields (populated once Pinata integration is active)
        "animation_cid": ipfs.get("animation_cid"),
        "audio_cid":     ipfs.get("audio_cid"),
        "metadata_cid":  ipfs.get("metadata_cid"),
        "animation_url": ipfs.get("animation_url") or gen.get("gif_url"),
        "audio_url":     ipfs.get("audio_url"),
        "token_uri":     ipfs.get("token_uri"),
        # Audio analysis
        "audio_traits": audio,
        # Visual generation
        "visual_traits": gen.get("visual_traits", {}),
        # On-chain ready traits
        "on_chain_traits": {
            "bpm": audio.get("display", {}).get("bpm_rounded", 0),
            "dominantKey": audio.get("raw", {}).get("dominant_key_index", 0),
            "energyLevel": round(audio.get("normalized", {}).get("energy", 0) * 255),
            "brightness": round(audio.get("normalized", {}).get("brightness", 0) * 255),
            "durationSeconds": round(audio.get("duration_seconds", 0)),
        },
    }

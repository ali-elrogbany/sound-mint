"""
SoundMint Backend — Async Pipeline Orchestrator

Ties together: analyze → generate → (pin — Phase 3) → ready
Updates session stage at each step.
"""
import asyncio
import logging

from app.session_store import (
    PipelineStage,
    advance_stage,
    fail_session,
    get_session,
)

logger = logging.getLogger(__name__)


async def run_pipeline(session_id: str) -> None:
    """
    Main pipeline coroutine executed as a FastAPI BackgroundTask.

    Stages:
    1. ANALYZED  — Librosa feature extraction
    2. GENERATING_NFT — P5.js render → GIF
    3. PINNING   — Pinata IPFS (stub for MVP; skipped until Epic 4)
    4. READY     — All done
    """
    session = get_session(session_id)
    if not session:
        logger.error(f"Pipeline started for unknown session: {session_id}")
        return

    logger.info(f"[{session_id}] Pipeline started for '{session.file_name}'")

    # ── Stage 1: Audio Analysis ─────────────────────────────────────────────────
    try:
        from app.services import analyzer

        features = analyzer.analyze(
            file_path=session.file_path,
            session_id=session_id,
            file_name=session.file_name,
        )
        session.audio_features = features
        advance_stage(session_id, PipelineStage.ANALYZED)
        logger.info(
            f"[{session_id}] Analysis complete — BPM: {features['display']['bpm_rounded']}, "
            f"Key: {features['display']['key_name']}, Energy: {features['display']['energy_label']}"
        )
    except Exception as exc:
        logger.error(f"[{session_id}] Analysis failed: {exc}", exc_info=True)
        fail_session(session_id, f"Audio analysis failed: {str(exc)}")
        return

    # ── Stage 2: Visual Generation ──────────────────────────────────────────────
    try:
        advance_stage(session_id, PipelineStage.GENERATING_NFT)
        from app.services import generator

        gen_result = await generator.generate(
            session_id=session_id,
            session_dir=session.session_dir,
            audio_features=session.audio_features,
        )
        session.generation_result = gen_result
        logger.info(
            f"[{session_id}] Generation complete — "
            f"{gen_result['gif_size_bytes']} bytes, {gen_result['elapsed_ms']}ms"
        )
    except Exception as exc:
        logger.error(f"[{session_id}] Generation failed: {exc}", exc_info=True)
        fail_session(session_id, f"NFT generation failed: {str(exc)}")
        return

    # ── Stage 3: IPFS Pinning (stub — active in Epic 4) ────────────────────────
    advance_stage(session_id, PipelineStage.PINNING)
    await asyncio.sleep(0.1)  # simulate async step; replace with Pinata call in Epic 4
    # session.ipfs_result = await pinata.pin(...)

    # ── Done ────────────────────────────────────────────────────────────────────
    advance_stage(session_id, PipelineStage.READY)
    logger.info(f"[{session_id}] Pipeline complete and ready.")

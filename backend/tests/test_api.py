"""
Tests: Upload API (Epic 1)
"""
import asyncio
import io
import struct
import wave

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


# ── Minimal valid MP3 fixture (ID3 header + silence) ────────────────────────────
def _make_fake_mp3() -> bytes:
    """Create a minimal ID3-tagged file that passes magic byte check."""
    # ID3v2 header: "ID3" + version 2.3 + flags + size
    id3_header = b"ID3\x03\x00\x00\x00\x00\x00\x00"
    # Minimal MPEG frame sync
    mpeg_frame = b"\xff\xfb\x90\x00" + b"\x00" * 413  # 417-byte MP3 frame
    return id3_header + mpeg_frame * 10  # ~4 KB


def _make_fake_wav() -> bytes:
    """Return a WAV file (wrong type)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(22050)
        wf.writeframes(b"\x00\x00" * 100)
    return buf.getvalue()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
class TestUploadEndpoint:

    async def test_health(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/v1/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    async def test_upload_valid_mp3(self):
        mp3_bytes = _make_fake_mp3()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/v1/upload",
                files={"file": ("track.mp3", io.BytesIO(mp3_bytes), "audio/mpeg")},
            )
        assert r.status_code == 200
        body = r.json()
        assert "session_id" in body
        assert body["status"] == "processing"

    async def test_upload_wrong_mime_type(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/v1/upload",
                files={"file": ("audio.wav", io.BytesIO(_make_fake_wav()), "audio/wav")},
            )
        assert r.status_code == 422
        body = r.json()
        assert body["error"] == "INVALID_FILE_TYPE"

    async def test_upload_oversized_file(self):
        # 26 MB of zeros (wrong mime but will fail on size first? No — mime check first)
        # Use correct mime but huge data
        huge = b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\xff\xfb" + b"\x00" * (26 * 1024 * 1024)
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/v1/upload",
                files={"file": ("big.mp3", io.BytesIO(huge), "audio/mpeg")},
            )
        assert r.status_code == 422
        body = r.json()
        assert body["error"] == "FILE_TOO_LARGE"

    async def test_status_unknown_session(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/v1/status/nonexistent-session-id")
        assert r.status_code == 404

    async def test_result_unknown_session(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/v1/result/nonexistent-session-id")
        assert r.status_code == 404

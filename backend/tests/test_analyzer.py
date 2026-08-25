"""
Tests: Audio Analyzer (Epic 2)

Uses a synthetically generated 440 Hz sine tone (A4) to produce known features.
No real MP3 files needed — we write a WAV then let librosa load it.
"""
import math
import os
import struct
import tempfile
import wave

import numpy as np
import pytest


# ── Helpers ─────────────────────────────────────────────────────────────────────
def generate_sine_wav(path: str, freq: float = 440.0, duration: float = 5.0, sr: int = 22050):
    """Write a pure sine tone WAV file."""
    n_samples = int(sr * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    samples = (np.sin(2 * math.pi * freq * t) * 32767).astype(np.int16)

    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())


# ── Analyzer unit tests ─────────────────────────────────────────────────────────
class TestAnalyzer:
    @pytest.fixture(scope="class")
    def sine_wav(self, tmp_path_factory):
        """Create a 5s sine WAV file (Librosa can load WAV too)."""
        d = tmp_path_factory.mktemp("audio")
        path = str(d / "tone.wav")
        generate_sine_wav(path, freq=440.0, duration=5.0)
        return path

    def test_analyze_returns_expected_keys(self, sine_wav):
        from app.services.analyzer import analyze

        result = analyze(sine_wav, "test-session", "tone.wav")

        assert "session_id" in result
        assert "raw" in result
        assert "normalized" in result
        assert "display" in result
        assert "duration_seconds" in result

    def test_raw_features_present(self, sine_wav):
        from app.services.analyzer import analyze

        raw = analyze(sine_wav, "test-session", "tone.wav")["raw"]
        for key in ("bpm", "rms_energy", "spectral_centroid", "spectral_rolloff",
                    "zero_crossing_rate", "mfcc", "dominant_key_index", "dominant_key_name"):
            assert key in raw, f"Missing raw feature: {key}"

    def test_mfcc_length(self, sine_wav):
        from app.services.analyzer import analyze

        raw = analyze(sine_wav, "test-session", "tone.wav")["raw"]
        assert len(raw["mfcc"]) == 13

    def test_normalized_within_0_1(self, sine_wav):
        from app.services.analyzer import analyze

        norm = analyze(sine_wav, "test-session", "tone.wav")["normalized"]
        for key, value in norm.items():
            assert 0.0 <= value <= 1.0, f"Normalized {key}={value} is outside [0,1]"

    def test_bpm_floor(self, sine_wav):
        """BPM should never be below 40."""
        from app.services.analyzer import analyze

        result = analyze(sine_wav, "test-session", "tone.wav")
        assert result["raw"]["bpm"] >= 40.0

    def test_energy_label_bucketing(self):
        from app.services.analyzer import _energy_label

        assert _energy_label(0.0) == "low"
        assert _energy_label(0.32) == "low"
        assert _energy_label(0.33) == "medium"
        assert _energy_label(0.66) == "medium"
        assert _energy_label(0.67) == "high"
        assert _energy_label(1.0) == "high"

    def test_key_names_all_12(self):
        from app.services.analyzer import KEY_NAMES

        assert len(KEY_NAMES) == 12
        assert KEY_NAMES[0] == "C"
        assert KEY_NAMES[11] == "B"

    def test_normalize_clamp(self):
        from app.services.analyzer import _normalize

        assert _normalize(-999, 0, 100) == 0.0
        assert _normalize(9999, 0, 100) == 1.0
        assert _normalize(50, 0, 100) == pytest.approx(0.5)

    def test_duration_positive(self, sine_wav):
        from app.services.analyzer import analyze

        result = analyze(sine_wav, "test-session", "tone.wav")
        assert result["duration_seconds"] > 0

    def test_dominant_key_index_range(self, sine_wav):
        from app.services.analyzer import analyze

        idx = analyze(sine_wav, "test-session", "tone.wav")["raw"]["dominant_key_index"]
        assert 0 <= idx <= 11

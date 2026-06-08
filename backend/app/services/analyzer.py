"""
SoundMint Backend — Audio Analyzer Service (Epic 2)

Extracts audio features from an MP3 file using Librosa and returns
a structured dict matching the PRD Section 11.1 data model.
"""
from __future__ import annotations

import hashlib
import numpy as np

# ── Pre-defined normalization bounds (calibrated on diverse music dataset) ──────
# These bounds clamp real-world feature values into [0.0, 1.0].
NORM_BOUNDS = {
    "bpm":                 (40.0,   240.0),
    "rms_energy":          (0.0,    0.3),
    "spectral_centroid":   (200.0,  8000.0),
    "spectral_rolloff":    (500.0,  12000.0),
    "zero_crossing_rate":  (0.0,    0.4),
    "mfcc_0":              (-400.0, 100.0),
}

KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def _normalize(value: float, lo: float, hi: float) -> float:
    """Clamp-normalize a value to [0.0, 1.0]."""
    if hi == lo:
        return 0.0
    return float(np.clip((value - lo) / (hi - lo), 0.0, 1.0))


def _energy_label(normalized_energy: float) -> str:
    if normalized_energy < 0.33:
        return "low"
    if normalized_energy <= 0.66:
        return "medium"
    return "high"


def _bpm_label(bpm: float) -> str:
    if bpm < 80:
        return "Slow"
    if bpm <= 120:
        return "Moderate"
    if bpm <= 160:
        return "Fast"
    return "Hyperspeed"


def analyze(file_path: str, session_id: str, file_name: str) -> dict:
    """
    Extract audio features from the given MP3 path.

    Returns: dict matching PRD Section 11.1 AudioAnalysisResult schema.
    Raises:  RuntimeError on Librosa failure (caller maps to HTTP 422).
    """
    try:
        import librosa  # deferred import — heavy; only load when needed
    except ImportError as exc:
        raise RuntimeError("Librosa is not installed.") from exc

    try:
        y, sr = librosa.load(file_path, sr=None, mono=True)
    except Exception as exc:
        raise RuntimeError(f"Failed to load audio file: {exc}") from exc

    # ── AC5 (US-003): Compute SHA-256 of the raw MP3 bytes ─────────────────────
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        audio_hash = "0x" + hashlib.sha256(file_bytes).hexdigest()
    except Exception as exc:
        raise RuntimeError(f"Failed to compute audio hash: {exc}") from exc

    try:
        # ── Feature extraction ──────────────────────────────────────────────────
        duration = float(librosa.get_duration(y=y, sr=sr))

        # BPM — use plp() as fallback if beat_track returns 0
        tempo_arr, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(np.atleast_1d(tempo_arr)[0])
        if bpm < 40:
            # Fallback: predominant local pulse
            pulse = librosa.beat.plp(y=y, sr=sr)
            bpm_estimate = librosa.tempo_frequencies(len(pulse), sr=sr)
            bpm = float(bpm_estimate[np.argmax(pulse)])
        bpm = max(40.0, bpm)  # floor at 40 BPM

        # RMS energy (mean across frames)
        rms = float(np.mean(librosa.feature.rms(y=y)))

        # Spectral centroid (mean across frames)
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))

        # Spectral rolloff (mean across frames)
        rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))

        # Zero-crossing rate (mean across frames)
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=y)))

        # MFCC — 13 coefficients (mean across frames)
        mfcc_matrix = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc = [float(np.mean(c)) for c in mfcc_matrix]

        # Chroma → dominant key (index 0–11)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        dominant_key_index = int(np.argmax(np.mean(chroma, axis=1)))
        dominant_key_name = KEY_NAMES[dominant_key_index]

    except Exception as exc:
        raise RuntimeError(f"Feature extraction failed: {exc}") from exc

    # ── Normalization ───────────────────────────────────────────────────────────
    norm_bpm = _normalize(bpm, *NORM_BOUNDS["bpm"])
    norm_energy = _normalize(rms, *NORM_BOUNDS["rms_energy"])
    norm_brightness = _normalize(centroid, *NORM_BOUNDS["spectral_centroid"])
    norm_zcr = _normalize(zcr, *NORM_BOUNDS["zero_crossing_rate"])
    norm_complexity = _normalize(mfcc[0], *NORM_BOUNDS["mfcc_0"])

    return {
        "session_id": session_id,
        "file_name": file_name,
        "audio_hash": audio_hash,  # AC5: SHA-256 of raw MP3 file, as 0x-prefixed hex
        "duration_seconds": round(duration, 2),
        "raw": {
            "bpm": round(bpm, 2),
            "rms_energy": round(rms, 6),
            "spectral_centroid": round(centroid, 2),
            "spectral_rolloff": round(rolloff, 2),
            "zero_crossing_rate": round(zcr, 6),
            "mfcc": [round(v, 4) for v in mfcc],
            "dominant_key_index": dominant_key_index,
            "dominant_key_name": dominant_key_name,
        },
        "normalized": {
            "bpm": round(norm_bpm, 4),
            "energy": round(norm_energy, 4),
            "brightness": round(norm_brightness, 4),
            "zcr": round(norm_zcr, 4),
            "complexity": round(norm_complexity, 4),
        },
        "display": {
            "energy_label": _energy_label(norm_energy),
            "key_name": dominant_key_name,
            "bpm_rounded": round(bpm),
            "bpm_label": _bpm_label(bpm),
        },
    }

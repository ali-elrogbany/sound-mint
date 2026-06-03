"""
SoundMint Backend — IPFS / Pinata Service

Pins the generated GIF and ERC-721 metadata JSON to IPFS via the Pinata API.
Returns animation_cid, metadata_cid, animation_url, and token_uri.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

# ── Pinata endpoints ──────────────────────────────────────────────────────────
PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
PINATA_GATEWAY     = "https://gateway.pinata.cloud/ipfs"

# ── Key ⇒ palette name lookup (matches PRD §10.1) ────────────────────────────
KEY_PALETTE_NAMES = [
    "Energetic Red-Orange", "Vibrant Magenta", "Cool Teal", "Fresh Green-Mint",
    "Soft Pastel", "Warm Gold", "Deep Purple-Teal", "Electric Purple",
    "Hot Red-Pink", "Electric Blue", "Neon Green", "Deep Rose",
]

KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def _get_auth_headers() -> dict:
    """Return Pinata auth headers from environment variables."""
    jwt = os.getenv("PINATA_JWT")
    if jwt:
        return {"Authorization": f"Bearer {jwt}"}
    api_key    = os.getenv("PINATA_API_KEY", "")
    api_secret = os.getenv("PINATA_SECRET_API_KEY", "")
    return {
        "pinata_api_key":        api_key,
        "pinata_secret_api_key": api_secret,
    }


async def pin_gif(gif_path: str, file_name: str) -> str:
    """
    Upload the generated GIF file to IPFS via Pinata.

    Returns:
        animation_cid  (str) — the IPFS CID of the pinned GIF
    Raises:
        RuntimeError on Pinata API failure
    """
    headers = _get_auth_headers()

    gif_bytes = Path(gif_path).read_bytes()
    pin_name  = f"SoundMint-animation-{file_name.replace('.mp3', '')}"

    metadata = json.dumps({"name": pin_name})

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            PINATA_PIN_FILE_URL,
            headers=headers,
            files={
                "file": (f"{pin_name}.gif", gif_bytes, "image/gif"),
                "pinataMetadata": (None, metadata, "application/json"),
            },
        )

    if response.status_code != 200:
        raise RuntimeError(
            f"Pinata GIF pin failed ({response.status_code}): {response.text[:300]}"
        )

    cid = response.json()["IpfsHash"]
    logger.info(f"GIF pinned to IPFS: {cid}")
    return cid


async def pin_metadata(
    token_number: int,
    animation_cid: str,
    audio_traits: dict,
    visual_traits: dict,
    file_name: str,
) -> str:
    """
    Build an ERC-721 / OpenSea-compatible metadata JSON and pin it to IPFS.

    Returns:
        metadata_cid  (str) — the IPFS CID of the pinned metadata JSON
    Raises:
        RuntimeError on Pinata API failure
    """
    headers = _get_auth_headers()

    display  = audio_traits.get("display", {})
    raw      = audio_traits.get("raw", {})
    norm     = audio_traits.get("normalized", {})
    vt       = visual_traits or {}

    key_idx      = raw.get("dominant_key_index", 0)
    key_name     = display.get("key_name", KEY_NAMES[key_idx])
    energy_label = display.get("energy_label", "medium").capitalize()
    bpm_rounded  = display.get("bpm_rounded", 0)
    duration     = round(audio_traits.get("duration_seconds", 0))
    shape        = vt.get("shape", "Unknown")
    anim_speed   = vt.get("animation_speed", 1.0)
    palette      = vt.get("color_palette", ["#A044FF", "#12D8FA"])
    bg_color     = palette[0].lstrip("#") if palette else "1A1A2E"

    # Animation speed label
    if anim_speed < 1.5:
        speed_label = "Slow"
    elif anim_speed < 2.5:
        speed_label = "Moderate"
    else:
        speed_label = "Rapid"

    # Brightness label
    brightness_norm = norm.get("brightness", 0.5)
    brightness_label = "Dark" if brightness_norm < 0.33 else ("Bright" if brightness_norm > 0.66 else "Mid")

    metadata = {
        "name": f"SoundMint #{token_number}",
        "description": (
            f"A unique animated NFT generated from the acoustic DNA of a musical track. "
            f"BPM: {bpm_rounded} | Key: {key_name} | Energy: {energy_label}. "
            f"Created with SoundMint."
        ),
        "image":         f"ipfs://{animation_cid}",
        "animation_url": f"ipfs://{animation_cid}",
        "external_url":  f"https://soundmint.xyz/token/{token_number}",
        "background_color": bg_color,
        "attributes": [
            {"trait_type": "BPM",                                   "value": bpm_rounded},
            {"trait_type": "Musical Key",                           "value": key_name},
            {"trait_type": "Energy Level",                          "value": energy_label},
            {"trait_type": "Brightness",                            "value": brightness_label},
            {"trait_type": "Shape Style",                           "value": shape.capitalize()},
            {"trait_type": "Palette",                               "value": KEY_PALETTE_NAMES[key_idx % 12]},
            {"trait_type": "Animation Speed",                       "value": speed_label},
            {"display_type": "number", "trait_type": "Duration (seconds)", "value": duration},
            {"display_type": "number", "trait_type": "Token ID",    "value": token_number},
        ],
    }

    pin_name = f"SoundMint-metadata-{token_number}"

    payload = {
        "pinataContent":  metadata,
        "pinataMetadata": {"name": pin_name},
        "pinataOptions":  {"cidVersion": 1},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            PINATA_PIN_JSON_URL,
            headers={**headers, "Content-Type": "application/json"},
            content=json.dumps(payload),
        )

    if response.status_code != 200:
        raise RuntimeError(
            f"Pinata metadata pin failed ({response.status_code}): {response.text[:300]}"
        )

    cid = response.json()["IpfsHash"]
    logger.info(f"Metadata pinned to IPFS: {cid}")
    return cid


async def pin_all(
    gif_path: str,
    file_name: str,
    audio_traits: dict,
    visual_traits: dict,
    token_number: int = 1,
) -> dict:
    """
    Full Pinata pinning workflow:
      1. Pin the GIF → animation_cid
      2. Build metadata JSON → pin → metadata_cid

    Returns dict with animation_cid, metadata_cid, animation_url, token_uri.
    """
    logger.info(f"Pinning GIF: {gif_path}")
    animation_cid = await pin_gif(gif_path, file_name)

    logger.info(f"Pinning metadata for token #{token_number}")
    metadata_cid = await pin_metadata(
        token_number=token_number,
        animation_cid=animation_cid,
        audio_traits=audio_traits,
        visual_traits=visual_traits,
        file_name=file_name,
    )

    return {
        "animation_cid":  animation_cid,
        "metadata_cid":   metadata_cid,
        "animation_url":  f"{PINATA_GATEWAY}/{animation_cid}",
        "token_uri":      f"ipfs://{metadata_cid}",
    }

"""
SoundMint Backend — Visual Generator Service (Epic 3)

Renders the P5.js sketch via Pyppeteer (headless Chrome) and exports
the frames as a looping animated GIF using Pillow.
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict

from app.config import settings


# ── Shape label helper ──────────────────────────────────────────────────────────
def _shape_label(normalized_zcr: float) -> str:
    if normalized_zcr < 0.125:
        return "circles"
    if normalized_zcr < 0.375:
        return "polygons"
    return "triangles"


# ── Brightness label ────────────────────────────────────────────────────────────
def _brightness_label(normalized_centroid: float) -> str:
    if normalized_centroid < 0.33:
        return "Dark"
    if normalized_centroid <= 0.66:
        return "Mid"
    return "Bright"


# ── Key palette (mirrors sketch.js) ────────────────────────────────────────────
KEY_PALETTES = [
    ["#FF6B6B", "#FF8E53"],
    ["#FF4DA6", "#C62A88"],
    ["#4ECDC4", "#44A08D"],
    ["#A8FF78", "#78FFD6"],
    ["#FED6E3", "#A8EDEA"],
    ["#F7971E", "#FFD200"],
    ["#8360C3", "#2EBFAC"],
    ["#6A3093", "#A044FF"],
    ["#FF512F", "#DD2476"],
    ["#1FA2FF", "#12D8FA"],
    ["#43E97B", "#38F9D7"],
    ["#F953C6", "#B91D73"],
]


def _build_sound_params(audio_features: Dict[str, Any], seed: int) -> dict:
    norm = audio_features.get("normalized", {})
    raw = audio_features.get("raw", {})
    return {
        "keyIndex": raw.get("dominant_key_index", 0),
        "normalizedBpm": norm.get("bpm", 0.5),
        "bpm": raw.get("bpm", 120.0),
        "normalizedEnergy": norm.get("energy", 0.5),
        "normalizedZcr": norm.get("zcr", 0.1),
        "normalizedCentroid": norm.get("brightness", 0.5),
        "normalizedComplexity": norm.get("complexity", 0.5),
        "seed": seed,
    }


async def generate(
    session_id: str,
    session_dir: str,
    audio_features: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Render the P5.js animation with Pyppeteer and produce a GIF.
    Returns dict matching PRD Section 11.2 GenerationOutput schema.
    """
    from pyppeteer import launch

    W = settings.GIF_WIDTH
    H = settings.GIF_HEIGHT
    FPS = settings.GIF_FPS
    FRAMES = settings.GIF_FRAMES  # total frames to capture
    FRAME_DELAY_MS = round(1000 / FPS)  # ms between frames

    # Use session_id as deterministic seed
    seed = abs(hash(session_id)) % (2**31)

    sound_params = _build_sound_params(audio_features, seed)

    # ── Locate and prepare the HTML renderer ───────────────────────────────────
    static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
    renderer_html = os.path.join(static_dir, "renderer.html")
    sketch_js = os.path.join(static_dir, "sketch.js")

    with open(renderer_html, "r") as f:
        html_content = f.read()

    # Inject SOUND_PARAMS and dimensions
    html_content = html_content.replace(
        "__SOUND_PARAMS__", json.dumps(sound_params)
    ).replace(
        "__GIF_WIDTH__", str(W)
    ).replace(
        "__GIF_HEIGHT__", str(H)
    )
    # Write a session-specific renderer so serving is straightforward
    session_html_path = os.path.join(session_dir, "renderer.html")
    with open(session_html_path, "w") as f:
        f.write(html_content)

    # ── Launch Pyppeteer browser ────────────────────────────────────────────────
    start_time = time.time()

    launch_args = {
        "headless": True,
        "args": [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            f"--window-size={W},{H}",
        ]
    }
    
    # Workaround for macOS M1/M2/M3 Pyppeteer issues: use system Chrome if available
    mac_chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(mac_chrome_path):
        launch_args["executablePath"] = mac_chrome_path

    browser = await launch(**launch_args)

    page = await browser.newPage()
    await page.setViewport({"width": W, "height": H})

    # Serve the sketch.js via the FastAPI static route for P5 fetch
    # but for local file we just serve file:// + sketch inline
    # We inject sketch.js directly to avoid file:// CORS issues
    with open(sketch_js, "r") as f:
        sketch_code = f.read()

    # Replace the external sketch.js script tag with an inline script
    html_content = html_content.replace(
        '<script src="/static/sketch.js"></script>',
        f"<script>\n{sketch_code}\n</script>",
    )
    # Update file
    with open(session_html_path, "w") as f:
        f.write(html_content)

    file_url = f"file://{session_html_path}"
    await page.goto(file_url, waitUntil="networkidle0", timeout=30000)

    # Wait for P5.js to initialise (canvas appears)
    await asyncio.sleep(0.5)

    # ── Capture frames ──────────────────────────────────────────────────────────
    frame_paths = []
    for i in range(FRAMES):
        frame_path = os.path.join(session_dir, f"frame_{i:04d}.png")
        await page.screenshot(
            {"path": frame_path, "clip": {"x": 0, "y": 0, "width": W, "height": H}}
        )
        frame_paths.append(frame_path)
        # Wait for next frame
        if i < FRAMES - 1:
            await asyncio.sleep(FRAME_DELAY_MS / 1000.0)

    await browser.close()

    # ── Assemble GIF from frames ────────────────────────────────────────────────
    from PIL import Image

    output_gif_path = os.path.join(session_dir, "output.gif")

    frames_pil = []
    for fp in frame_paths:
        img = Image.open(fp).convert("RGBA")
        frames_pil.append(img)

    # Save as animated GIF
    frames_pil[0].save(
        output_gif_path,
        save_all=True,
        append_images=frames_pil[1:],
        optimize=False,
        loop=0,  # infinite loop
        duration=FRAME_DELAY_MS,
    )

    # Cleanup frame PNGs
    for fp in frame_paths:
        try:
            os.remove(fp)
        except OSError:
            pass

    elapsed_ms = round((time.time() - start_time) * 1000)
    gif_size = os.path.getsize(output_gif_path)

    # Build visual traits summary
    norm = audio_features.get("normalized", {})
    raw = audio_features.get("raw", {})
    key_index = raw.get("dominant_key_index", 0)
    anim_speed = round(raw.get("bpm", 120) / 60.0, 3)
    particle_count = round(norm.get("energy", 0.5) * 800) + 50

    visual_traits = {
        "color_palette": KEY_PALETTES[key_index % 12],
        "animation_speed": anim_speed,
        "particle_count": particle_count,
        "shape": _shape_label(norm.get("zcr", 0.1)),
        "glow_intensity": round(norm.get("brightness", 0.5) * 20, 2),
        "background_complexity": round(norm.get("complexity", 0.5) * 20),
        "brightness_label": _brightness_label(norm.get("brightness", 0.5)),
    }

    return {
        "session_id": session_id,
        "gif_path": output_gif_path,
        "gif_url": f"/tmp-session/{session_id}/output.gif",  # served by backend
        "gif_size_bytes": gif_size,
        "dimensions": {"width": W, "height": H},
        "duration_ms": FRAMES * FRAME_DELAY_MS,
        "visual_traits": visual_traits,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "elapsed_ms": elapsed_ms,
    }

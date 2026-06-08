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
        "handleSIGINT": False,
        "handleSIGTERM": False,
        "handleSIGHUP": False,
        "args": [
            "--no-sandbox",
            "--disable-setuid-sandbox",
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
    page.on('console', lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on('pageerror', lambda err: print(f"BROWSER ERROR: {err}"))
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

    # Build visual traits summary (mapped to the new Overdrive layers)
    norm = audio_features.get("normalized", {})
    raw = audio_features.get("raw", {})
    
    def get_camera(seed):
        cams = [
            "Cinematic Pan", "Orbital Focus", "Vortex Tunnel", "Jitter & Shake",
            "Z-Axis Rush", "Top-Down Spin", "Drone Fly-through", "Isometric Stare"
        ]
        return cams[(seed // 20) % 8]

    def get_geometry(seed):
        shapes = [
            "Sacred Sphere", "Quantum Torus", "Hexa-Star", "Chaos Attractor", 
            "Recursive Spiral", "Crystal Matrix", "Nested Rings", "DNA Helix",
            "Crown of Thorns", "Supernova Spikes", "Tesseract", "Mobius Strip",
            "Low-Poly Icosahedron", "Pyramid Cluster", "Lissajous Curve", 
            "Pulsar Waves", "Diamond Matrix", "Wireframe Terrain", 
            "Orbiting Moons", "Cylinder Fractal"
        ]
        return shapes[seed % 20]

    def get_physics(energy):
        if energy < 0.4: return "Floating Embers"
        if energy < 0.7: return "Fluid Whirlpool"
        return "Black Hole Gravity"

    def get_glitch(zcr):
        if zcr > 0.4: return "Pixel Sort + RGB Split"
        if zcr > 0.2: return "VHS Tear"
        return "Clean"
        
    def get_background(key):
        bgs = ["Deep Space", "Aurora Borealis", "Cyber Grid", "The Void", "Plasma Core", "Crystalline", 
               "Ion Storm", "Bioluminescence", "Dying Star", "Glacier", "Neon Forest", "Dusk Horizon"]
        return bgs[key % 12]

    key_index = raw.get("dominant_key_index", 0)
    bpm = raw.get("bpm", 120)
    zcr = norm.get("zcr", 0.1)
    energy = norm.get("energy", 0.5)
    complexity = norm.get("complexity", 0.5)
    brightness = norm.get("brightness", 0.5)
    seed_hash = audio_features.get("audio_hash", "0x00000000")
    seed = int(seed_hash[2:10] if seed_hash.startswith("0x") else seed_hash[:8], 16)

    visual_traits = {
        "layer_1_background": get_background(key_index),
        "layer_2_camera": get_camera(seed),
        "layer_3_geometry": get_geometry(seed),
        "layer_4_physics": get_physics(energy),
        "layer_5_glitch": get_glitch(zcr),
        "layer_6_palette_base": KEY_PALETTES[key_index % 12],
        "brightness_label": _brightness_label(brightness),
        "animation_speed": round(bpm / 60.0, 3),
        "particle_count": round(energy * 1200) + 200,
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

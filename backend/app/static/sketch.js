/**
 * SoundMint — P5.js Particle Animation Sketch
 *
 * Visual traits are driven by SOUND_PARAMS injected by the Python generator.
 * All mappings follow PRD Section 10.
 *
 * window.SOUND_PARAMS = {
 *   keyIndex: 0-11,
 *   normalizedBpm: 0.0-1.0,
 *   bpm: float,
 *   normalizedEnergy: 0.0-1.0,
 *   normalizedZcr: 0.0-1.0,
 *   normalizedCentroid: 0.0-1.0,
 *   normalizedComplexity: 0.0-1.0,
 *   seed: int
 * }
 */

// ── Color palette per key (PRD §10.1) ──────────────────────────────────────────
const KEY_PALETTES = [
  ["#FF6B6B", "#FF8E53"], // 0  C   – Energetic Red-Orange
  ["#FF4DA6", "#C62A88"], // 1  C#  – Vibrant Magenta
  ["#4ECDC4", "#44A08D"], // 2  D   – Cool Teal
  ["#A8FF78", "#78FFD6"], // 3  D#  – Fresh Green-Mint
  ["#FED6E3", "#A8EDEA"], // 4  E   – Soft Pastel
  ["#F7971E", "#FFD200"], // 5  F   – Warm Gold
  ["#8360C3", "#2EBFAC"], // 6  F#  – Deep Purple-Teal
  ["#6A3093", "#A044FF"], // 7  G   – Electric Purple
  ["#FF512F", "#DD2476"], // 8  G#  – Hot Red-Pink
  ["#1FA2FF", "#12D8FA"], // 9  A   – Electric Blue
  ["#43E97B", "#38F9D7"], // 10 A#  – Neon Green
  ["#F953C6", "#B91D73"], // 11 B   – Deep Rose
];

const params = window.SOUND_PARAMS || {
  keyIndex: 7,
  normalizedBpm: 0.5,
  bpm: 120,
  normalizedEnergy: 0.5,
  normalizedZcr: 0.1,
  normalizedCentroid: 0.5,
  normalizedComplexity: 0.5,
  seed: 42,
};

// ── Derived visual parameters ───────────────────────────────────────────────────
const palette = KEY_PALETTES[params.keyIndex % 12];
const animSpeed = params.bpm / 60.0; // cycles per second (§10.2)
const particleCount = Math.round(params.normalizedEnergy * 800) + 50; // 50–850 (§10.3)
const particleSize = 2 + params.normalizedEnergy * 8; // 2–10px radius (§10.3)
const glowIntensity = params.normalizedCentroid * 20; // 0–20px blur (§10.6)
const gridLines = Math.round(params.normalizedComplexity * 20); // 0–20 (§10.5)

// Shape type from ZCR (§10.4)
function shapeType() {
  if (params.normalizedZcr < 0.125) return "circles";
  if (params.normalizedZcr < 0.375) return "polygons";
  return "triangles";
}
const SHAPE = shapeType();

// ── P5.js sketch ────────────────────────────────────────────────────────────────
let particles = [];
let startTime;

new p5(function (p) {
  let primaryColor, secondaryColor;
  let frameId = 0;

  const W = window.GIF_WIDTH || 600;
  const H = window.GIF_HEIGHT || 600;

  p.setup = function () {
    p.createCanvas(W, H);
    p.randomSeed(params.seed);
    p.noiseSeed(params.seed);
    p.colorMode(p.RGB, 255, 255, 255, 255);
    p.frameRate(12);

    primaryColor = p.color(hexToRgb(palette[0]));
    secondaryColor = p.color(hexToRgb(palette[1]));

    startTime = p.millis();

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(p, W, H, primaryColor, secondaryColor, i));
    }
  };

  p.draw = function () {
    // ── Background ─────────────────────────────────────────────────────────────
    p.background(13, 13, 13, 230);

    // Grid lines (background complexity §10.5)
    drawGrid(p, W, H, gridLines, primaryColor);

    // ── Particles ──────────────────────────────────────────────────────────────
    const t = (p.millis() - startTime) / 1000.0;
    for (const part of particles) {
      part.update(t, animSpeed);
      part.draw(SHAPE, particleSize, glowIntensity);
    }

    frameId++;
    if (typeof window.onFrameReady === "function") {
      window.onFrameReady(frameId);
    }
  };
});

// ── Grid helper ─────────────────────────────────────────────────────────────────
function drawGrid(p, W, H, lines, col) {
  if (lines === 0) return;
  p.push();
  p.stroke(p.red(col), p.green(col), p.blue(col), 30);
  p.strokeWeight(0.5);
  const step = W / (lines + 1);
  for (let i = 1; i <= lines; i++) {
    const x = i * step;
    const y = i * step;
    p.line(x, 0, x, H);
    p.line(0, y, W, y);
  }
  p.pop();
}

// ── Particle class ──────────────────────────────────────────────────────────────
class Particle {
  constructor(p, W, H, col1, col2, idx) {
    this.p = p;
    this.W = W;
    this.H = H;
    this.col1 = col1;
    this.col2 = col2;
    this.idx = idx;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(this.W);
    this.y = p.random(this.H);
    this.baseX = this.x;
    this.baseY = this.y;
    this.phase = p.random(p.TWO_PI);
    this.speed = p.random(0.3, 1.0);
    this.orbit = p.random(10, 60);
    this.colorT = p.random(1);
  }

  update(t, animSpd) {
    const p = this.p;
    const angle = t * animSpd * p.TWO_PI * this.speed + this.phase;
    this.x = this.baseX + Math.cos(angle) * this.orbit;
    this.y = this.baseY + Math.sin(angle) * this.orbit * 0.6;
    // Noise drift for organic feel
    this.x += (p.noise(this.idx * 0.01, t * 0.1) - 0.5) * 4;
    this.y += (p.noise(this.idx * 0.01 + 100, t * 0.1) - 0.5) * 4;
  }

  draw(shape, size, glow) {
    const p = this.p;
    const lerpedCol = p.lerpColor(this.col1, this.col2, this.colorT);
    const r = p.red(lerpedCol);
    const g = p.green(lerpedCol);
    const b = p.blue(lerpedCol);

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();

    // Glow layers
    if (glow > 0) {
      for (let i = 3; i > 0; i--) {
        const alpha = 20 * (glow / 20) * i;
        p.fill(r, g, b, alpha);
        drawShape(p, shape, size * (1 + i * 0.5));
      }
    }

    p.fill(r, g, b, 220);
    drawShape(p, shape, size);
    p.pop();
  }
}

function drawShape(p, shape, size) {
  if (shape === "circles") {
    p.ellipse(0, 0, size * 2, size * 2);
  } else if (shape === "polygons") {
    // Regular hexagon
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * p.TWO_PI - p.PI / 6;
      p.vertex(Math.cos(a) * size, Math.sin(a) * size);
    }
    p.endShape(p.CLOSE);
  } else {
    // Triangle / shard
    p.triangle(0, -size, -size * 0.9, size * 0.7, size * 0.9, size * 0.7);
  }
}

// ── Utility ─────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

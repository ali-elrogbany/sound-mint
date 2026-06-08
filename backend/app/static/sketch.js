/**
 * SoundMint — P5.js Generative Art Engine
 * 6-Layer Audio-Reactive System (13,500+ unique combinations)
 */

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

// ── Layer 1: Backgrounds (Key 0-11) ─────────────────────────────────────────
function drawBackground(p, keyIndex) {
  p.background(10);
  p.noStroke();
  
  const w = p.width;
  const h = p.height;
  
  switch(keyIndex % 12) {
    case 0: // Nebula (C)
      for(let i=0; i<100; i++) {
        p.fill(255, 100, 100, 10);
        p.ellipse(p.random(w), p.random(h), p.random(100, 300));
      }
      break;
    case 1: // Aurora (C#)
      for(let i=0; i<h; i+=10) {
        p.fill(255, 77, 166, p.noise(i * 0.01) * 30);
        p.rect(0, i, w, 10);
      }
      break;
    case 2: // Grid (D)
      p.stroke(78, 205, 196, 40);
      for(let i=0; i<w; i+=40) p.line(i, 0, i, h);
      for(let j=0; j<h; j+=40) p.line(0, j, w, j);
      p.noStroke();
      break;
    case 3: // Void (D#)
      p.background(5); // pure dark
      p.fill(255, 255, 255, 5);
      p.ellipse(w/2, h/2, w*0.8);
      break;
    case 4: // Plasma (E)
      for(let i=0; i<50; i++) {
        p.fill(254, 214, 227, 15);
        let x = p.noise(i) * w;
        let y = p.noise(i+100) * h;
        p.ellipse(x, y, 200);
      }
      break;
    case 5: // Prism (F)
      p.fill(247, 151, 30, 20);
      p.triangle(w/2, 50, 50, h-50, w-50, h-50);
      break;
    case 6: // Storm (F#)
      p.fill(131, 96, 195, 30);
      for(let i=0; i<20; i++) p.ellipse(p.random(w), p.random(h/2), 150);
      break;
    case 7: // Coral (G)
      p.background(30, 10, 40);
      p.fill(106, 48, 147, 20);
      p.rect(50, 50, w-100, h-100, 20);
      break;
    case 8: // Ember (G#)
      p.background(40, 10, 10);
      for(let i=0; i<200; i++) {
        p.fill(255, 81, 47, 40);
        p.ellipse(p.random(w), p.random(h, h+100), p.random(10, 40));
      }
      break;
    case 9: // Frost (A)
      p.background(10, 20, 40);
      p.fill(31, 162, 255, 10);
      p.quad(0,0, w,0, w,h/2, 0,h);
      break;
    case 10: // Forest (A#)
      p.background(10, 30, 20);
      p.fill(67, 233, 123, 15);
      p.ellipse(w/2, h, w);
      break;
    case 11: // Dusk (B)
      for(let i=0; i<h; i+=5) {
        let inter = p.map(i, 0, h, 0, 1);
        p.fill(p.lerpColor(p.color(249, 83, 198, 50), p.color(20, 10, 30, 50), inter));
        p.rect(0, i, w, 5);
      }
      break;
  }
}

// ── Layer 2: Motifs (BPM Class) ─────────────────────────────────────────────
function drawMotif(p, bpm, c1, c2, t) {
  p.push();
  p.translate(p.width/2, p.height/2);
  p.noFill();
  p.strokeWeight(2);
  
  const size = p.width * 0.4;
  
  if (bpm < 80) { // Waveform
    p.stroke(c1);
    p.beginShape();
    for(let x=-size; x<=size; x+=10) {
      p.vertex(x, Math.sin((x+t*50)*0.05) * 50);
    }
    p.endShape();
  } else if (bpm < 110) { // Mandala
    p.stroke(c2);
    for(let i=0; i<8; i++) {
      p.rotate(p.PI/4);
      p.ellipse(0, 50, size, size/3);
    }
  } else if (bpm < 140) { // Geometric burst
    p.stroke(c1);
    for(let i=0; i<12; i++) {
      p.rotate(p.PI/6);
      p.line(20, 0, size, 0);
      p.triangle(size, 0, size-20, -10, size-20, 10);
    }
  } else if (bpm < 170) { // Spiral
    p.stroke(c2);
    p.beginShape();
    for(let i=0; i<100; i++) {
      let r = i * (size/100);
      let theta = i * 0.2 + t;
      p.vertex(r * Math.cos(theta), r * Math.sin(theta));
    }
    p.endShape();
  } else { // Radial web
    p.stroke(c1);
    for(let i=0; i<10; i++) {
      p.rotate(p.TWO_PI/10);
      for(let r=20; r<size; r+=40) {
        p.line(0, r, 0, r+20);
        p.arc(0, 0, r*2, r*2, 0, p.TWO_PI/10);
      }
    }
  }
  p.pop();
}

// ── Layer 3, 4, 5: Particles (ZCR/Energy, Colors, Complexity) ───────────────
class Particle {
  constructor(p, w, h, idx) {
    this.p = p;
    this.w = w;
    this.h = h;
    this.idx = idx;
    
    // Trait mappings
    this.energy = params.normalizedEnergy;
    this.zcr = params.normalizedZcr;
    this.complexity = params.normalizedComplexity;
    this.animSpeed = params.bpm / 60.0;
    
    // Determine particle type (Layer 3)
    if (this.energy > 0.7 && this.zcr > 0.4) this.type = "sparks";
    else if (this.zcr > 0.3) this.type = "shards";
    else if (this.energy < 0.4 && this.zcr < 0.2) this.type = "smoke";
    else if (this.zcr < 0.2) this.type = "orbs";
    else this.type = "ribbons";
    
    // Determine animation type (Layer 5)
    if (this.complexity < 0.2) this.anim = "drift";
    else if (this.complexity < 0.4) this.anim = "pulse";
    else if (this.complexity < 0.6) this.anim = "flow";
    else if (this.complexity < 0.8) this.anim = "orbit";
    else this.anim = "bounce";

    this.reset();
  }

  reset() {
    this.x = this.p.random(this.w);
    this.y = this.p.random(this.h);
    this.vx = this.p.random(-1, 1);
    this.vy = this.p.random(-1, 1);
    this.baseX = this.x;
    this.baseY = this.y;
    this.phase = this.p.random(this.p.TWO_PI);
    this.size = this.p.random(2, 10 + this.energy * 10);
    this.colorT = this.p.random(1);
    
    // Flow/Orbit params
    this.orbitR = this.p.random(20, 150);
    this.angle = this.p.random(this.p.TWO_PI);
  }

  update(t) {
    const spd = this.animSpeed * (0.5 + this.energy);
    
    switch(this.anim) {
      case "drift":
        this.x += this.vx * spd;
        this.y += this.vy * spd;
        if (this.x < 0) this.x = this.w;
        if (this.x > this.w) this.x = 0;
        if (this.y < 0) this.y = this.h;
        if (this.y > this.h) this.y = 0;
        break;
      case "pulse":
        let s = Math.sin(t * spd * 2 + this.phase);
        this.x = this.baseX + this.vx * s * 50;
        this.y = this.baseY + this.vy * s * 50;
        break;
      case "flow":
        let angle = this.p.noise(this.x * 0.01, this.y * 0.01, t * 0.1) * this.p.TWO_PI * 4;
        this.x += Math.cos(angle) * spd * 2;
        this.y += Math.sin(angle) * spd * 2;
        if (this.x < 0 || this.x > this.w || this.y < 0 || this.y > this.h) this.reset();
        break;
      case "orbit":
        this.angle += spd * 0.02;
        this.x = this.w/2 + Math.cos(this.angle + this.phase) * this.orbitR;
        this.y = this.h/2 + Math.sin(this.angle + this.phase) * this.orbitR;
        break;
      case "bounce":
        this.x += this.vx * spd * 5;
        this.y += this.vy * spd * 5;
        if (this.x < 0 || this.x > this.w) this.vx *= -1;
        if (this.y < 0 || this.y > this.h) this.vy *= -1;
        break;
    }
  }

  draw(c1, c2, t) {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    // Layer 4: Color interpolation
    let col = p.lerpColor(c1, c2, this.colorT);
    p.fill(col);
    p.noStroke();

    // Layer 3: Particle shape
    switch(this.type) {
      case "sparks":
        p.rotate(t * 5 + this.phase);
        p.rect(-1, -this.size, 2, this.size*2);
        break;
      case "shards":
        p.rotate(this.phase);
        p.triangle(0, -this.size, -this.size/2, this.size, this.size/2, this.size);
        break;
      case "smoke":
        p.fill(p.red(col), p.green(col), p.blue(col), 50);
        p.ellipse(0, 0, this.size * 4);
        break;
      case "orbs":
        p.ellipse(0, 0, this.size);
        p.fill(255, 150);
        p.ellipse(-this.size/4, -this.size/4, this.size/3); // highlight
        break;
      case "ribbons":
        p.stroke(col);
        p.strokeWeight(this.size/2);
        p.noFill();
        p.bezier(0, 0, 10, 10, 20, Math.sin(t*2+this.phase)*20, 30, 0);
        break;
    }
    p.pop();
  }
}

// ── Layer 6: FX Overlays (Brightness) ───────────────────────────────────────
function drawFX(p, brightness, t) {
  const w = p.width;
  const h = p.height;
  
  if (brightness > 0.7) { // Bloom glow
    p.fill(255, 255, 255, 20 + Math.sin(t)*10);
    p.blendMode(p.ADD);
    p.rect(0, 0, w, h);
    p.blendMode(p.BLEND);
  } else if (brightness < 0.3) { // Chromatic scanlines
    p.strokeWeight(1);
    for(let y=0; y<h; y+=4) {
      p.stroke(255, 0, 0, 20); // R
      p.line(0, y, w, y);
      p.stroke(0, 255, 255, 20); // GB
      p.line(0, y+1, w, y+1);
    }
  }
  // else None
}

// ── Main Sketch ─────────────────────────────────────────────────────────────
const KEY_PALETTES = [
  ["#FF6B6B", "#FF8E53"], ["#FF4DA6", "#C62A88"], ["#4ECDC4", "#44A08D"],
  ["#A8FF78", "#78FFD6"], ["#FED6E3", "#A8EDEA"], ["#F7971E", "#FFD200"],
  ["#8360C3", "#2EBFAC"], ["#6A3093", "#A044FF"], ["#FF512F", "#DD2476"],
  ["#1FA2FF", "#12D8FA"], ["#43E97B", "#38F9D7"], ["#F953C6", "#B91D73"]
];

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

new p5(function (p) {
  let c1, c2;
  let particles = [];
  let startTime;
  let frameId = 0;

  p.setup = function () {
    p.createCanvas(window.GIF_WIDTH || 600, window.GIF_HEIGHT || 600);
    p.randomSeed(params.seed);
    p.noiseSeed(params.seed);
    p.frameRate(12);

    // Layer 4: Color palette modification based on brightness
    let basePal = KEY_PALETTES[params.keyIndex % 12];
    let rgb1 = hexToRgb(basePal[0]);
    let rgb2 = hexToRgb(basePal[1]);
    
    // Brightness tier adjustment (3 tiers)
    if (params.normalizedCentroid < 0.33) {
      rgb1 = rgb1.map(v => v * 0.5); // Darken
      rgb2 = rgb2.map(v => v * 0.5);
    } else if (params.normalizedCentroid > 0.66) {
      rgb1 = rgb1.map(v => Math.min(255, v + 50)); // Lighten
      rgb2 = rgb2.map(v => Math.min(255, v + 50));
    }
    
    c1 = p.color(...rgb1);
    c2 = p.color(...rgb2);

    // Init particles
    const pCount = Math.round(params.normalizedEnergy * 800) + 50;
    for(let i=0; i<pCount; i++) {
      particles.push(new Particle(p, p.width, p.height, i));
    }
    
    startTime = p.millis();
  };

  p.draw = function () {
    const t = (p.millis() - startTime) / 1000.0;
    
    drawBackground(p, params.keyIndex);
    drawMotif(p, params.bpm, c1, c2, t);
    
    for (const part of particles) {
      part.update(t);
      part.draw(c1, c2, t);
    }
    
    drawFX(p, params.normalizedCentroid, t);

    frameId++;
    if (typeof window.onFrameReady === "function") {
      window.onFrameReady(frameId);
    }
  };
});

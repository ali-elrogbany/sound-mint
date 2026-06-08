/**
 * SoundMint — P5.js Overdrive Generative Art Engine (WEBGL)
 * Incorporating 3D Camera, Fractals, Glitch, and Physics Layers.
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

// ── Overdrive Constants ───────────────────────────────────────────────────────
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
  let W, H;
  
  // Traits
  let cameraType, geometryType, physicsType, glitchType;
  
  p.setup = function () {
    W = window.GIF_WIDTH || 600;
    H = window.GIF_HEIGHT || 600;
    p.createCanvas(W, H, p.WEBGL);
    p.randomSeed(params.seed);
    p.noiseSeed(params.seed);
    p.frameRate(15);
    p.setAttributes('antialias', true);

    // Color Setup
    let basePal = KEY_PALETTES[params.keyIndex % 12];
    c1 = p.color(...hexToRgb(basePal[0]));
    c2 = p.color(...hexToRgb(basePal[1]));

    // Determine Logic
    cameraType = Math.floor(params.seed / 20) % 8;

    // Use the perfectly uniform cryptographic seed to ensure absolute variety in shapes
    geometryType = params.seed % 10;

    if (params.normalizedEnergy < 0.4) physicsType = 0;
    else if (params.normalizedEnergy < 0.7) physicsType = 1;
    else physicsType = 2;

    if (params.normalizedZcr > 0.4) glitchType = 2;
    else if (params.normalizedZcr > 0.2) glitchType = 1;
    else glitchType = 0;

    // Particles - Significantly reduced count for WebGL performance in headless
    const pCount = Math.round(params.normalizedEnergy * 300) + 50;
    for(let i=0; i<pCount; i++) {
      particles.push({
        x: p.random(-W, W),
        y: p.random(-H, H),
        z: p.random(-W, W),
        vx: p.random(-2, 2),
        vy: p.random(-2, 2),
        vz: p.random(-2, 2),
        mass: p.random(1, 4),
        col: p.lerpColor(c1, c2, p.random(1))
      });
    }
    
    startTime = p.millis();
  };

  p.draw = function () {
    const t = (p.millis() - startTime) / 1000.0;
    
    // Clear background
    p.background(15, 10, 20);
    
    // Lighting
    p.ambientLight(80);
    p.pointLight(p.red(c1), p.green(c1), p.blue(c1), 300, -300, 300);
    p.pointLight(p.red(c2), p.green(c2), p.blue(c2), -300, 300, -300);

    // ── 1. Camera Logic ──
    p.camera(0, 0, 500, 0, 0, 0, 0, 1, 0); // Reset camera base
    if (cameraType === 0) { // Cinematic
      p.camera(Math.sin(t*0.5)*300, Math.cos(t*0.5)*300, 400 + Math.sin(t*0.2)*100, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 1) { // Orbital
      p.camera(Math.cos(t)*300, -200, Math.sin(t)*300, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 2) { // Vortex
      p.camera(0, 0, 600 - t*100, 0, 0, 0, 0, 1, 0);
      p.rotateZ(t);
    } else if (cameraType === 3) { // Jitter
      p.camera(p.random(-10, 10), p.random(-10, 10), 400, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 4) { // Z-Axis Rush
      p.camera(0, 0, 800 - ((t*200) % 600), 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 5) { // Top-Down Spin
      p.camera(Math.cos(t*0.8)*200, -500, Math.sin(t*0.8)*200, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 6) { // Drone Fly-through
      p.camera(Math.sin(t*1.2)*200, Math.cos(t*0.7)*150 - 150, 400, 0, 0, 0, 0, 1, 0);
    } else { // Isometric Stare
      p.camera(400, -400, 400, 0, 0, 0, 0, 1, 0);
    }

    // ── 2. Geometry Logic ──
    p.push();
    p.rotateX(t * 0.5);
    p.rotateY(t * 0.3);
    p.noFill();
    p.strokeWeight(1.5);
    
    if (glitchType === 2 && p.frameCount % 5 === 0) {
      p.stroke(255, 0, 0);
      p.translate(p.random(-10, 10), 0, 0);
    } else {
      p.stroke(c1);
    }

    if (geometryType === 0) {
      p.sphere(120, 8, 8); // Sacred Sphere
    } else if (geometryType === 1) {
      p.torus(100, 30, 16, 12); // Quantum Torus
    } else if (geometryType === 2) { 
      for(let i=0; i<8; i++) {
        p.push();
        p.rotateX(i * p.TWO_PI/8);
        p.translate(0, 80, 0);
        p.box(20, 80, 20); // Hexa-Star
        p.pop();
      }
    } else if (geometryType === 3) { 
      p.beginShape();
      for(let i=0; i<80; i++) {
        p.vertex(Math.sin(i*0.1 + t)*120, Math.cos(i*0.13)*120, Math.sin(i*0.17 + t)*120);
      }
      p.endShape(); // Chaos Attractor
    } else if (geometryType === 4) { 
      p.beginShape();
      for(let i=0; i<150; i++) {
        let r = i * 0.8;
        let th = i * 0.1 + t;
        p.vertex(r * Math.cos(th), r * Math.sin(th), i * 2 - 150);
      }
      p.endShape(); // Recursive Spiral
    } else if (geometryType === 5) {
      p.cylinder(60, 160, 6, 1);
      p.push();
      p.rotateX(p.HALF_PI);
      p.cylinder(60, 160, 6, 1);
      p.pop(); // Crystal Matrix
    } else if (geometryType === 6) {
      for(let i=0; i<5; i++) {
        p.push();
        p.rotateX(t + i);
        p.rotateY(t*1.5 + i);
        p.torus(40 + i*25, 2, 24, 4);
        p.pop();
      } // Nested Rings
    } else if (geometryType === 7) {
      p.beginShape(p.POINTS);
      p.strokeWeight(4);
      for(let i=-80; i<80; i+=3) {
        let th = i * 0.2 + t*2;
        p.vertex(Math.sin(th)*60, i*2.5, Math.cos(th)*60);
        p.vertex(Math.sin(th + Math.PI)*60, i*2.5, Math.cos(th + Math.PI)*60);
      }
      p.endShape(); // DNA Helix
    } else if (geometryType === 8) {
      for(let i=0; i<6; i++) {
        p.push();
        p.rotateY(i * p.TWO_PI/6 + t);
        p.rotateX(Math.PI/4);
        p.translate(0, 90, 0);
        p.cone(40, 120, 4, 1);
        p.pop();
      } // Crown of Thorns
    } else if (geometryType === 9) {
      for(let i=0; i<12; i++) {
        p.push();
        p.rotateX(i * 2.39996 + t*0.5); // Golden angle
        p.rotateY(i * 1.57079 + t*0.3);
        p.translate(0, 70, 0);
        p.box(10, 140, 10);
        p.pop();
      } // Supernova Spikes
    } else if (geometryType === 10) {
      for(let i=0; i<4; i++) {
        p.push();
        p.rotateX(t*(i%2==0?1:-1));
        p.rotateY(t*0.5);
        p.box(40 + i*25);
        p.pop();
      } // Tesseract
    } else if (geometryType === 11) {
      p.beginShape(p.TRIANGLE_STRIP);
      for(let i=0; i<=30; i++) {
        let u = i * p.TWO_PI / 30;
        let x1 = (100 + 40 * Math.cos(u/2 + t)) * Math.cos(u);
        let y1 = (100 + 40 * Math.cos(u/2 + t)) * Math.sin(u);
        let z1 = 40 * Math.sin(u/2 + t);
        p.vertex(x1, y1, z1);
        let x2 = (100 - 40 * Math.cos(u/2 + t)) * Math.cos(u);
        let y2 = (100 - 40 * Math.cos(u/2 + t)) * Math.sin(u);
        let z2 = -40 * Math.sin(u/2 + t);
        p.vertex(x2, y2, z2);
      }
      p.endShape(); // Mobius Strip
    } else if (geometryType === 12) {
      p.sphere(100, 4, 3); // Low-Poly Icosahedron
    } else if (geometryType === 13) {
      for(let i=0; i<6; i++) {
        p.push();
        p.rotateX(i * p.TWO_PI/6 + t);
        p.translate(0, 50, 0);
        p.cone(50, 80, 4, 1);
        p.pop();
      } // Pyramid Cluster
    } else if (geometryType === 14) {
      p.beginShape();
      for(let i=0; i<100; i++) {
        let th = i * 0.1;
        p.vertex(100 * Math.sin(3*th + t), 100 * Math.sin(4*th + t*1.2), 100 * Math.cos(5*th + t*0.8));
      }
      p.endShape(); // Lissajous Curve
    } else if (geometryType === 15) {
      for(let i=1; i<=4; i++) {
        p.push();
        p.rotateX(p.HALF_PI);
        let r = (t * 50 + i * 40) % 200;
        p.torus(r, 2, 24, 3);
        p.pop();
      } // Pulsar Waves
    } else if (geometryType === 16) {
      for(let x=-1; x<=1; x+=2) {
        for(let y=-1; y<=1; y+=2) {
          p.push();
          p.translate(x*50, y*50, 0);
          p.rotateX(t); p.rotateY(t);
          p.cone(30, 60, 4, 1);
          p.rotateX(Math.PI);
          p.cone(30, 60, 4, 1);
          p.pop();
        }
      } // Diamond Matrix
    } else if (geometryType === 17) {
      p.push();
      p.rotateX(p.HALF_PI);
      p.translate(-100, -100, -50);
      for(let x=0; x<5; x++) {
        p.beginShape(p.LINES);
        for(let y=0; y<5; y++) {
          p.vertex(x*50, y*50, Math.sin(x + y + t)*20);
        }
        p.endShape();
      }
      p.pop(); // Wireframe Terrain
    } else if (geometryType === 18) {
      p.sphere(40, 8, 8);
      for(let i=0; i<3; i++) {
        p.push();
        p.rotateY(t*(i+1) + i*2);
        p.translate(100 + i*20, 0, 0);
        p.sphere(15, 6, 6);
        p.pop();
      } // Orbiting Moons
    } else {
      for(let i=0; i<8; i++) {
        p.push();
        p.rotateZ(i * p.TWO_PI/8 + t);
        p.translate(0, 60, 0);
        p.cylinder(10, 80, 5, 1);
        p.translate(0, 40, 0);
        p.rotateX(t*2);
        p.cylinder(5, 40, 5, 1);
        p.pop();
      } // Cylinder Fractal
    }
    p.pop();

    // ── 3. Physics / Particles ──
    p.noStroke();
    
    // Use boxes instead of spheres for massive performance boost
    for (let i = 0; i < particles.length; i++) {
      let pt = particles[i];
      
      if (physicsType === 0) { // Floating embers
        pt.y -= pt.mass * 2;
        pt.x += Math.sin(t + pt.mass) * 2;
      } else if (physicsType === 1) { // Whirlpool
        let angle = Math.atan2(pt.y, pt.x);
        let dist = Math.sqrt(pt.x*pt.x + pt.y*pt.y);
        pt.x -= Math.sin(angle) * 10 - Math.cos(angle) * 2;
        pt.y += Math.cos(angle) * 10 - Math.sin(angle) * 2;
        pt.z += Math.sin(t + dist*0.01) * 5;
      } else { // Black Hole
        let dist = Math.sqrt(pt.x*pt.x + pt.y*pt.y + pt.z*pt.z);
        if (dist > 10) {
          pt.x -= (pt.x / dist) * 15;
          pt.y -= (pt.y / dist) * 15;
          pt.z -= (pt.z / dist) * 15;
        }
      }

      // Reset out of bounds
      if (Math.abs(pt.x) > W || Math.abs(pt.y) > H || Math.abs(pt.z) > W) {
        pt.x = p.random(-W, W);
        pt.y = p.random(-H, H);
        pt.z = p.random(-W, W);
      }

      p.push();
      p.translate(pt.x, pt.y, pt.z);
      if (glitchType === 2 && i % 5 === 0) {
         p.fill(0, 255, 255); 
      } else {
         p.fill(pt.col);
      }
      p.box(pt.mass * 2); // Fast geometry
      p.pop();
    }

    // ── 4. Glitch Overlay ──
    if (glitchType === 1 && p.frameCount % 4 === 0) {
      p.push();
      p.translate(0, 0, 450); // In front of camera
      p.fill(255, 255, 255, 50);
      p.plane(W*2, 10);
      p.pop();
    }

    frameId++;
    if (typeof window.onFrameReady === "function") {
      window.onFrameReady(frameId);
    }
  };
});

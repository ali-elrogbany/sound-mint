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
    cameraType = Math.floor(params.seed / 30) % 20;
    geometryType = params.seed % 50;

    let e = params.normalizedEnergy;
    let s = params.seed;
    if (e < 0.3) physicsType = s % 6;
    else if (e < 0.6) physicsType = 6 + (s % 7);
    else physicsType = 13 + (s % 7);

    let z = params.normalizedZcr;
    if (z < 0.15) glitchType = s % 7;
    else if (z < 0.3) glitchType = 7 + (s % 7);
    else glitchType = 14 + (s % 6);

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
    } else if (cameraType === 7) { // Isometric Stare
      p.camera(400, -400, 400, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 8) { // Corkscrew Zoom
      p.camera(Math.sin(t)*200, Math.cos(t)*200, 800 - ((t*150)%800), 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 9) { // Extreme Close-up
      p.camera(Math.sin(t*0.5)*50, Math.cos(t*0.5)*50, 150 + Math.sin(t)*50, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 10) { // Glitch Teleport
      let gt = Math.floor(t * 4);
      p.camera(Math.sin(gt)*300, Math.cos(gt*1.3)*300, 300 + Math.sin(gt*0.7)*200, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 11) { // Swaying Pendulum
      p.camera(Math.sin(t)*400, 0, 500, 0, 0, 0, 0, 1, 0);
    } else if (cameraType === 12) { p.camera(0, 0, 600, 0, 0, 0, 0, 1, 1); // Dutch Angle
    } else if (cameraType === 13) { p.camera(Math.sin(t)*300, 300, Math.cos(t)*300, 0, 0, 0, 0, 1, 0); // Floor Pan
    } else if (cameraType === 14) { p.camera(0, -600, 0, 0, 0, 0, Math.sin(t), 0, Math.cos(t)); // Ceiling Spin
    } else if (cameraType === 15) { p.camera(0, 0, 400 + Math.sin(t*2)*300, 0, 0, 0, 0, 1, 0); // Sine Zoom
    } else if (cameraType === 16) { p.camera(0, 0, 500, 0, 0, 0, Math.sin(t*3), Math.cos(t*3), 0); // Chaotic Flip
    } else if (cameraType === 17) { p.camera(Math.sin(-t*0.2)*800, -200, Math.cos(-t*0.2)*800, 0, 0, 0, 0, 1, 0); // Slow Reverse
    } else if (cameraType === 18) { p.camera(Math.sin(t*4)*400, 0, Math.cos(t*4)*400, 0, 0, 0, 0, 1, 0); // Fast Orbit
    } else { p.camera(500, -500, 500, 0, 0, 0, 0, 1, 0); p.ortho(-300, 300, -300, 300, -1000, 1000); } // Orthographic Shift

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
    } else if (geometryType === 19) {
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
    } else if (geometryType === 20) {
      p.beginShape(p.TRIANGLE_STRIP);
      for(let i=0; i<=50; i++) {
        let u = i * p.TWO_PI / 50;
        let r = 80 + 30 * Math.cos(3*u + t);
        p.vertex(r * Math.cos(2*u), r * Math.sin(2*u), 40 * Math.sin(3*u + t));
        p.vertex(r * Math.cos(2*u)*0.8, r * Math.sin(2*u)*0.8, 40 * Math.sin(3*u + t)*0.8);
      }
      p.endShape(); // Super Torus Knot
    } else if (geometryType === 21) {
      p.sphere(120, 3, 3);
      p.push(); p.rotateX(t); p.rotateY(t);
      p.sphere(150, 3, 3);
      p.pop(); // Icosahedral Cage
    } else if (geometryType === 22) {
      p.beginShape(p.TRIANGLES);
      for(let i=0; i<20; i++) {
        let th = i * p.TWO_PI/20 + t;
        let r = 50 + 50 * Math.sin(i*2 + t*2);
        p.vertex(r*Math.cos(th), r*Math.sin(th), -100);
        p.vertex(r*Math.cos(th+0.1), r*Math.sin(th+0.1), 100);
        p.vertex(0, 0, 0);
      }
      p.endShape(); // Warped Cylinder
    } else if (geometryType === 23) {
      for(let i=0; i<10; i++) {
        p.push();
        p.rotateX(i * p.TWO_PI/10 + t);
        p.rotateY(t);
        p.box(5, 180, 5);
        p.pop();
      } // Fractal Star
    } else if (geometryType === 24) {
      p.beginShape(p.POINTS);
      p.strokeWeight(5);
      for(let i=0; i<150; i++) {
        let u = i * 0.1;
        p.vertex(150 * Math.sin(u + t), 150 * Math.sin(u + t) * Math.cos(u + t), 100 * Math.cos(u + t));
      }
      p.endShape(); // Infinity Loop
    } else if (geometryType === 25) {
      for(let i=0; i<8; i++) {
        p.push();
        let r = 80 + 30 * Math.sin(t*3 + i);
        p.translate(r * Math.cos(i), r * Math.sin(i), r * Math.cos(i*2));
        p.rotateX(t*2);
        p.box(20);
        p.pop();
      } // Exploding Cubes
    } else if (geometryType === 26) {
      p.cylinder(80, 150, 3, 1, false, false);
      p.rotateX(Math.PI);
      p.cylinder(80, 150, 3, 1, false, false); // Hollow Prism
    } else if (geometryType === 27) {
      for(let i=0; i<10; i++) {
        p.beginShape(p.LINES);
        for(let j=0; j<10; j++) {
          p.vertex(Math.sin(i+j*0.5+t)*100, j*20 - 100, Math.cos(i*2+j*0.5+t)*100);
        }
        p.endShape();
      } // Quantum Strings
    } else if (geometryType === 28) {
      for(let i=0; i<4; i++) {
        p.push();
        p.rotateZ(t + i*1.5);
        p.rotateX(p.HALF_PI);
        p.torus(100 + i*10, 2, 30, 3);
        p.pop();
      } // Plasma Rings
    } else if (geometryType === 29) {
      let seedVal = params.seed % 100;
      p.randomSeed(seedVal);
      p.beginShape(p.LINES);
      for(let i=0; i<80; i++) {
        p.vertex(p.random(-150, 150), p.random(-150, 150), p.random(-150, 150));
      }
      p.endShape(); // Cosmic Web
    } else {
      let g = geometryType - 30;
      let shapes = [
        () => { p.torus(80, 40, 5, 5); p.rotateX(t); p.torus(120, 10, 3, 3); },
        () => { p.cylinder(50, 150, 4, 1); p.rotateZ(t); p.cylinder(100, 50, 4, 1); },
        () => { for(let i=0;i<5;i++){p.rotateX(i+t); p.box(20, 150, 20);} },
        () => { for(let i=0;i<8;i++){p.push();p.rotateY(i*0.8+t);p.translate(50,0,0);p.cylinder(5,200);p.pop();} },
        () => { p.sphere(50+30*Math.sin(t*5), 6, 6); },
        () => { p.sphere(80, 8, 8); for(let i=0;i<10;i++){p.rotateX(i); p.cone(20, 150);} },
        () => { p.torus(100, 20, 3, 4); },
        () => { p.cylinder(80, 120, 12, 12); },
        () => { for(let i=1;i<6;i++){p.rotateX(t*i*0.2); p.torus(i*30, 2, 24, 3);} },
        () => { p.plane(200, 200, 5, 5); },
        () => { p.beginShape(p.LINES); for(let i=0;i<50;i++) p.vertex(p.random(-100,100), p.random(-100,100), p.random(-100,100)); p.endShape(); },
        () => { p.sphere(100, 10, 10); p.scale(1 + 0.2*Math.sin(t*10)); },
        () => { p.cone(100, 200, 5, 5); p.rotateZ(Math.PI); p.cone(100, 200, 5, 5); },
        () => { for(let i=0;i<20;i++){p.push();p.translate(p.random(-100,100),p.random(-100,100),0);p.plane(20);p.pop();} },
        () => { for(let i=0;i<12;i++){p.rotateZ(p.TWO_PI/12);p.translate(50,0,0);p.sphere(20,4,4);} },
        () => { p.cone(80, 150); p.rotateX(Math.PI); p.cone(80, 150); },
        () => { p.box(100, 50, 100); p.translate(0, -50, 0); p.box(50, 50, 50); },
        () => { p.box(100); p.rotateX(t); p.box(150); p.rotateY(t); p.box(200); },
        () => { p.translate(0, 50*Math.sin(t*5), 0); p.box(80); },
        () => { p.sphere(120, 4, 4); p.rotateX(t); p.sphere(120, 4, 4); }
      ];
      shapes[g]();
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
      } else if (physicsType === 2) { // Black Hole
        let dist = Math.sqrt(pt.x*pt.x + pt.y*pt.y + pt.z*pt.z);
        if (dist > 10) {
          pt.x -= (pt.x / dist) * 15;
          pt.y -= (pt.y / dist) * 15;
          pt.z -= (pt.z / dist) * 15;
        }
      } else if (physicsType === 3) { // Gravity Well
        pt.x *= 0.98; pt.y *= 0.98; pt.z *= 0.98;
      } else if (physicsType === 4) { // Repulsion Field
        pt.x *= 1.02; pt.y *= 1.02; pt.z *= 1.02;
      } else if (physicsType === 5) { // Wind Tunnel
        pt.z += 20; pt.x += Math.sin(t)*2;
      } else if (physicsType === 6) { // Magnetic Waves
        pt.x += Math.sin(pt.z * 0.05 + t) * 5;
        pt.y += Math.cos(pt.x * 0.05 + t) * 5;
      } else if (physicsType === 7) { // Brownian Jitter
        pt.x += p.random(-10, 10); pt.y += p.random(-10, 10); pt.z += p.random(-10, 10);
      } else if (physicsType === 8) { pt.y += 10; if (pt.y > 200) pt.y = -200; // Bouncing Sparks
      } else if (physicsType === 9) { pt.x += Math.sin(pt.y*0.01+t)*10; pt.z += Math.cos(pt.y*0.01+t)*10; pt.y -= 5; // Tornado
      } else if (physicsType === 10) { let s = Math.sin(t*4)*1.05; pt.x *= s; pt.y *= s; pt.z *= s; // Pulsing Heartbeat
      } else if (physicsType === 11) { pt.x = Math.round(pt.x/20)*20; pt.y = Math.round(pt.y/20)*20; // Grid Align
      } else if (physicsType === 12) { let a = Math.atan2(pt.y, pt.x) + 0.1; let d = Math.sqrt(pt.x*pt.x+pt.y*pt.y); pt.x = Math.cos(a)*d; pt.y = Math.sin(a)*d; // Spiral Galaxy
      } else if (physicsType === 13) { pt.x *= 1.1; pt.y *= 1.1; pt.z *= 1.1; if(Math.random()<0.05){pt.x=0;pt.y=0;pt.z=0;} // Explosive Burst
      } else if (physicsType === 14) { pt.y += Math.sin(pt.x*0.05 + t)*5; pt.x += 2; // Wavy Ocean
      } else if (physicsType === 15) { pt.x += Math.sin(t)*5; pt.y += Math.cos(t)*5; // Magnetic Nodes
      } else if (physicsType === 16) { if(Math.random()<0.1){pt.x = p.random(-W,W); pt.y = p.random(-H,H);} // Static Shock
      } else if (physicsType === 17) { pt.x += Math.sin(t*pt.mass); pt.y += Math.cos(t*pt.mass); // Chaotic Flocking
      } else if (physicsType === 18) { pt.y += Math.sin(t*2)*20; // Gravity Flip
      } else { pt.x += pt.vx*0.1; pt.y += pt.vy*0.1; pt.z += pt.vz*0.1; } // Slow Motion Drift

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
    if (glitchType === 1 && p.frameCount % 4 === 0) { // VHS
      p.push();
      p.translate(0, 0, 450); // In front of camera
      p.fill(255, 255, 255, 50);
      p.plane(W*2, 10);
      p.pop();
    } else if (glitchType === 3 && p.frameCount % 3 === 0) { // Chromatic
      p.push(); p.translate(5, 0, 450); p.fill(255, 0, 0, 100); p.plane(W*2, H*2); p.pop();
      p.push(); p.translate(-5, 0, 450); p.fill(0, 255, 255, 100); p.plane(W*2, H*2); p.pop();
    } else if (glitchType === 4 && p.frameCount % 2 === 0) { // Scanlines
      p.push();
      p.translate(0, 0, 450);
      for(let i=-H; i<H; i+=20) {
        p.fill(0, 0, 0, 100);
        p.translate(0, 20, 0);
        p.plane(W*2, 5);
      }
      p.pop();
    } else if (glitchType === 5 && p.frameCount % 6 === 0) { // Wireframe Flicker
      p.background(c1);
    } else if (glitchType === 6 && p.frameCount % 10 < 2) { // Strobe Light
      p.background(255);
    } else if (glitchType === 7 && p.frameCount % 3 === 0) { // Data Moshing
      for(let i=0; i<10; i++) {
        p.push(); p.translate(p.random(-W, W), p.random(-H, H), 400); p.fill(p.random(255), p.random(255), p.random(255), 150); p.plane(p.random(50, 200), p.random(10, 50)); p.pop();
      }
    } else if (glitchType === 8 && p.frameCount % 5 === 0) { // CRT Distortion
      p.push(); p.translate(0, 0, 400); p.fill(0, 0, 0, 50); p.sphere(W*1.5); p.pop();
    } else if (glitchType === 9 && p.frameCount % 2 === 0) { // RGB Shift
      p.push(); p.translate(10, 10, 450); p.fill(255, 0, 0, 50); p.plane(W*2, H*2); p.pop();
    } else if (glitchType === 10 && p.frameCount % 10 === 0) { // Invert Colors
      p.background(255 - p.red(c1), 255 - p.green(c1), 255 - p.blue(c1));
    } else if (glitchType === 11) { // White Noise
      p.push(); p.translate(0, 0, 450); p.fill(255, 255, 255, p.random(10, 40)); p.plane(W*2, H*2); p.pop();
    } else if (glitchType === 12 && p.frameCount % 4 === 0) { // Edge Detect
      p.stroke(255); p.strokeWeight(3);
    } else if (glitchType === 13) { // Vertical Slices
      if (p.frameCount % 3 === 0) { p.push(); p.translate(p.random(-W, W), 0, 450); p.fill(0); p.plane(20, H*2); p.pop(); }
    } else if (glitchType === 14) { // Horizontal Tears
      if (p.frameCount % 3 === 0) { p.push(); p.translate(0, p.random(-H, H), 450); p.fill(c1); p.plane(W*2, 10); p.pop(); }
    } else if (glitchType === 15 && p.frameCount % 2 === 0) { // Bad Reception
      p.push(); p.translate(0, 0, 450); p.fill(0, 0, 0, p.random(100)); p.plane(W*2, H*2); p.pop();
    } else if (glitchType === 16 && p.frameCount % 6 === 0) { // Color Bleed
      p.push(); p.translate(0, 0, 450); p.fill(p.red(c2), p.green(c2), p.blue(c2), 100); p.plane(W*2, H*2); p.pop();
    } else if (glitchType === 17 && p.frameCount % 8 === 0) { // Ghosting
      p.push(); p.translate(20, 0, 450); p.fill(255, 255, 255, 30); p.plane(W*2, H*2); p.pop();
    } else if (glitchType === 18 && p.frameCount % 15 < 5) { // Frame Stutter
      p.background(c2);
    } else if (glitchType === 19 && p.frameCount % 5 === 0) { // Mirror Split
      p.push(); p.translate(0, 0, 450); p.fill(0, 0, 0, 200); p.plane(10, H*2); p.pop();
    }

    frameId++;
    if (typeof window.onFrameReady === "function") {
      window.onFrameReady(frameId);
    }
  };
});

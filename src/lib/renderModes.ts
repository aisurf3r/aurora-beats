import type { AudioData } from '@/hooks/useAudioAnalyzer';

// ─── Color System ───
export type PaletteName = 'cyber' | 'aurora' | 'fire' | 'ocean' | 'colors' | 'synth' | 'toxic' | 'sunset' | 'ice' | 'galaxy';
export const PALETTE_NAMES: PaletteName[] = ['cyber', 'aurora', 'fire', 'ocean', 'colors', 'synth', 'toxic', 'sunset', 'ice', 'galaxy'];

// HSL triplets [h, s, l]
type HSL = [number, number, number];
const PALS: Record<PaletteName, HSL[]> = {
  cyber:      [[330,100,50],[265,80,58],[216,100,62],[170,100,50]],
  aurora:     [[170,100,50],[195,100,49],[270,70,62],[330,90,54]],
  fire:       [[15,100,55],[35,100,55],[50,100,55],[0,100,50]],
  ocean:      [[195,100,45],[200,100,40],[190,80,70],[185,80,55]],
  calors:     [], // handled dynamically
  synth:      [[280,100,60],[320,100,55],[200,100,65],[260,90,50]],
  toxic:      [[120,100,45],[90,100,50],[150,80,55],[60,100,60]],
  sunset:     [[35,95,60],[310,80,55],[45,100,70],[280,60,65]],
  ice:        [[175,70,70],[260,60,75],[140,50,65],[300,40,72]],
  galaxy:     [[270,80,45],[300,70,55],[240,90,50],[330,60,60]],
};

function hsl(h: number, s: number, l: number): string { return `hsl(${h},${s}%,${l}%)`; }
function hsla(h: number, s: number, l: number, a: number): string { return `hsla(${h},${s}%,${l}%,${a})`; }

function getColor(pal: PaletteName, i: number, t: number): [number, number, number] {
  const p = PALS[pal];
  if (p.length === 0) return [(t * 50 + i * 25) % 360, 100, 60];
  return p[((i % p.length) + p.length) % p.length];
}

function col(pal: PaletteName, i: number, t: number): string {
  const [h, s, l] = getColor(pal, i, t);
  return hsl(h, s, l);
}

function colA(pal: PaletteName, i: number, t: number, a: number): string {
  const [h, s, l] = getColor(pal, i, t);
  return hsla(h, s, l, a);
}

// ─── Shared State ───
interface Particle {
  x: number; y: number; vx: number; vy: number;
  angle: number; dist: number; speed: number;
  size: number; hueOffset: number; life: number;
}
let particles: Particle[] = [];
let particlesW = 0, particlesH = 0;

interface Shockwave { radius: number; opacity: number; ci: number; }
let shockwaves: Shockwave[] = [];

// ─── MODE 1: Radial Frequency Bars ───
function renderBars(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const bars = 128;
  const maxR = Math.min(w, h) * 0.38;
  const innerR = maxR * 0.22;

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
    const fi = Math.floor(i * (d.frequencyData.length / 2) / bars);
    const val = (d.frequencyData[fi] / 255) * sens;
    const barH = val * maxR * 0.85 + 2;
    const lw = Math.max(1.5, (Math.PI * 2 * innerR) / bars * 0.55);

    const [ch, cs, cl] = getColor(pal, i, t);

    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
    ctx.lineTo(Math.cos(angle) * (innerR + barH), Math.sin(angle) * (innerR + barH));
    ctx.strokeStyle = hsl(ch, cs, cl);
    ctx.lineWidth = lw;
    ctx.shadowBlur = val * 25;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.stroke();

    // Reflection
    ctx.globalAlpha = 0.2 * val;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (innerR - 5), Math.sin(angle) * (innerR - 5));
    ctx.lineTo(Math.cos(angle) * (innerR - barH * 0.3), Math.sin(angle) * (innerR - barH * 0.3));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(0, 0, innerR * 0.6 + d.bass * 15 * sens, 0, Math.PI * 2);
  ctx.fillStyle = colA(pal, 0, t, 0.15 + d.bass * 0.3);
  ctx.shadowBlur = 30;
  ctx.shadowColor = col(pal, 0, t);
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── MODE 2: Kaleidoscope ───
function renderKaleidoscope(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const segments = 8;
  const segAngle = Math.PI * 2 / segments;

  ctx.save();
  ctx.translate(cx, cy);

  for (let s = 0; s < segments; s++) {
    ctx.save();
    ctx.rotate(s * segAngle + t * 0.08);
    if (s % 2 === 1) ctx.scale(1, -1);

    for (let i = 0; i < 24; i++) {
      const fi = i * 6;
      const val = (d.frequencyData[fi] || 0) / 255 * sens;
      const dist = 30 + val * Math.min(w, h) * 0.35;
      const angle = (i / 24) * segAngle;
      const x = Math.cos(angle + t * 0.3) * dist;
      const y = Math.sin(angle + t * 0.3) * dist;
      const size = 2 + val * 18;

      const [ch, cs, cl] = getColor(pal, i + s, t);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = hsla(ch, cs, cl, 0.4 + val * 0.6);
      ctx.shadowBlur = val * 30;
      ctx.shadowColor = hsl(ch, cs, cl);
      ctx.fill();

      // Connecting lines
      if (i > 0) {
        const pfi = (i - 1) * 6;
        const pval = (d.frequencyData[pfi] || 0) / 255 * sens;
        const pdist = 30 + pval * Math.min(w, h) * 0.35;
        const pangle = ((i - 1) / 24) * segAngle;
        const px = Math.cos(pangle + t * 0.3) * pdist;
        const py = Math.sin(pangle + t * 0.3) * pdist;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.strokeStyle = hsla(ch, cs, cl, 0.2 + val * 0.3);
        ctx.lineWidth = 1 + val * 2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── MODE 3: Particle Galaxy ───
function initParticles(w: number, h: number) {
  particles = [];
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * Math.min(w, h) * 0.35;
    particles.push({
      x: w / 2 + Math.cos(angle) * dist,
      y: h / 2 + Math.sin(angle) * dist,
      vx: 0, vy: 0,
      angle, dist,
      speed: 0.003 + Math.random() * 0.008,
      size: 1 + Math.random() * 3,
      hueOffset: Math.random() * 4,
      life: Math.random() * 200,
    });
  }
  particlesW = w;
  particlesH = h;
}

function renderParticles(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  if (particles.length === 0 || Math.abs(particlesW - w) > 50 || Math.abs(particlesH - h) > 50) {
    initParticles(w, h);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;

  for (const p of particles) {
    p.angle += p.speed * (1 + d.mids * 3 * sens);
    p.dist += (d.bass * sens - 0.15) * 2;
    if (p.dist < 20) p.dist = 20 + Math.random() * 50;
    if (p.dist > Math.min(w, h) * 0.5) p.dist = 30 + Math.random() * 50;

    if (d.isBeat) {
      p.dist += 20 + Math.random() * 40;
      p.speed *= 1.5;
    }
    p.speed = p.speed * 0.98 + 0.005;

    p.x = cx + Math.cos(p.angle) * p.dist;
    p.y = cy + Math.sin(p.angle) * p.dist;

    const sizeMultiplier = 1 + d.bass * 3 * sens;
    const size = p.size * sizeMultiplier;

    const [ch, cs, cl] = getColor(pal, Math.floor(p.hueOffset), t);
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = hsla(ch, cs, cl + d.highs * 20, 0.6 + d.energy * 0.4);
    ctx.shadowBlur = size * 4;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.fill();
  }

  // Draw connections for nearby particles
  ctx.shadowBlur = 0;
  for (let i = 0; i < particles.length; i += 3) {
    for (let j = i + 3; j < particles.length; j += 5) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 4000) {
        const alpha = (1 - distSq / 4000) * 0.2 * d.mids * sens;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = colA(pal, 1, t, alpha);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

// ─── MODE 4: Liquid Blob ───
function renderBlob(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const baseR = Math.min(w, h) * 0.2;
  const blobs = 4;

  for (let b = 0; b < blobs; b++) {
    const bAngle = (b / blobs) * Math.PI * 2 + t * 0.3;
    const bDist = d.bass * 50 * sens + 20;
    const bx = cx + Math.cos(bAngle) * bDist;
    const by = cy + Math.sin(bAngle) * bDist;
    const bR = baseR * (0.5 + d.frequencyData[b * 30] / 255 * 0.8 * sens);

    const vertices = 64;
    ctx.beginPath();
    for (let i = 0; i <= vertices; i++) {
      const a = (i / vertices) * Math.PI * 2;
      const freqIdx = (b * 16 + i * 2) % d.frequencyData.length;
      const fVal = d.frequencyData[freqIdx] / 255 * sens;
      const noise = Math.sin(a * 3 + t * 2) * 15 + Math.sin(a * 7 + t * 3) * 8;
      const r = bR + fVal * 40 + noise;
      const x = bx + Math.cos(a) * r;
      const y = by + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const [ch, cs, cl] = getColor(pal, b, t);
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, bR * 1.5);
    grad.addColorStop(0, hsla(ch, cs, cl + 15, 0.5));
    grad.addColorStop(0.7, hsla(ch, cs, cl, 0.2));
    grad.addColorStop(1, hsla(ch, cs, cl - 10, 0));
    ctx.fillStyle = grad;
    ctx.shadowBlur = 40;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.fill();

    ctx.strokeStyle = hsla(ch, cs, cl + 20, 0.4 + d.energy * 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ─── MODE 5: Tunnel ───
function renderTunnel(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const rings = 25;
  const maxR = Math.max(w, h) * 0.9;

  for (let i = 0; i < rings; i++) {
    const progress = ((t * 0.4 + i / rings) % 1);
    const scale = progress * progress;
    const radius = scale * maxR;
    const opacity = Math.max(0, 1 - progress);
    const sides = 6;
    const fi = (i * 5) % d.frequencyData.length;
    const val = (d.frequencyData[fi] || 0) / 255 * sens;

    ctx.beginPath();
    for (let s = 0; s <= sides; s++) {
      const a = (s / sides) * Math.PI * 2 + t * 0.15 + i * 0.1;
      const distortion = val * 25 * Math.sin(a * 2 + t * 2);
      const r = radius + distortion;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const [ch, cs, cl] = getColor(pal, i, t);
    ctx.strokeStyle = hsla(ch, cs, cl, opacity * (0.4 + val * 0.5));
    ctx.lineWidth = 1.5 + val * 3;
    ctx.shadowBlur = val * 20;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ─── MODE 6: Aurora Borealis ───
function renderAurora(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, w, h);

  const curtains = 5;
  for (let c = 0; c < curtains; c++) {
    const baseY = h * (0.2 + c * 0.12);
    const [ch, cs, cl] = getColor(pal, c, t);
    const points = 120;

    // Top edge of curtain
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * w;
      const fi = Math.floor((i / points) * d.frequencyData.length * 0.5);
      const fVal = (d.frequencyData[fi] || 0) / 255 * sens;
      const wave1 = Math.sin(i * 0.04 + t * 1.2 + c * 1.5) * 40;
      const wave2 = Math.sin(i * 0.02 + t * 0.7 + c * 2.3) * 25;
      const wave3 = Math.sin(i * 0.08 + t * 2.1 + c * 0.8) * 15;
      const y = baseY + wave1 + wave2 + wave3 - fVal * 80;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // Bottom edge (fade down)
    for (let i = points; i >= 0; i--) {
      const x = (i / points) * w;
      const fi = Math.floor((i / points) * d.frequencyData.length * 0.5);
      const fVal = (d.frequencyData[fi] || 0) / 255 * sens;
      const wave1 = Math.sin(i * 0.04 + t * 1.2 + c * 1.5) * 40;
      const y = baseY + wave1 + 100 + fVal * 40;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseY - 100, 0, baseY + 150);
    grad.addColorStop(0, hsla(ch, cs, cl + 15, 0));
    grad.addColorStop(0.3, hsla(ch, cs, cl + 10, 0.15 + d.energy * 0.2));
    grad.addColorStop(0.6, hsla(ch, cs, cl, 0.1 + d.bass * 0.15));
    grad.addColorStop(1, hsla(ch, cs, cl - 10, 0));
    ctx.fillStyle = grad;
    ctx.shadowBlur = 30 + d.bass * 40;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.fill();
  }

  // Shimmer particles on beats
  if (d.isBeat || d.highs > 0.5) {
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * w;
      const y = h * 0.15 + Math.random() * h * 0.5;
      const size = 1 + Math.random() * 2;
      const [sh, ss, sl] = getColor(pal, Math.floor(Math.random() * 4), t);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = hsla(sh, ss, sl + 20, 0.6 + Math.random() * 0.4);
      ctx.shadowBlur = 15;
      ctx.shadowColor = hsl(sh, ss, sl);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

// ─── MODE 7: Geometric Mandala ───
function renderMandala(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const layers = 7;
  const maxR = Math.min(w, h) * 0.42;

  ctx.save();
  ctx.translate(cx, cy);

  for (let layer = 0; layer < layers; layer++) {
    // Petal count morphs over time
    const basePetals = 5 + layer * 2;
    const petalMorph = Math.sin(t * 0.4 + layer * 1.1) * 2;
    const petals = Math.max(3, Math.round(basePetals + petalMorph));
    const layerR = maxR * (0.15 + layer * 0.13);
    const rotSpeed = (layer % 2 === 0 ? 1 : -1) * (0.2 + layer * 0.08);
    const fi = layer * 18;
    const fVal = (d.frequencyData[fi] || 0) / 255 * sens;

    // Shape type cycles: 0=petal, 1=star, 2=polygon
    const shapePhase = Math.floor(t * 0.15 + layer * 0.7) % 3;

    ctx.save();
    ctx.rotate(t * rotSpeed);

    const [ch, cs, cl] = getColor(pal, layer, t);

    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2;
      const breathe = 1 + Math.sin(t * 1.5 + layer * 0.9 + p * 0.3) * 0.25;
      const petalLen = layerR * (0.5 + fVal * 0.9) * breathe;
      const petalW = (Math.PI / petals) * (0.3 + fVal * 0.6 + Math.sin(t * 0.8 + layer) * 0.15);

      ctx.beginPath();

      if (shapePhase === 0) {
        // Curved petals
        ctx.moveTo(0, 0);
        const cp1x = Math.cos(angle - petalW) * petalLen * 0.8;
        const cp1y = Math.sin(angle - petalW) * petalLen * 0.8;
        const tipX = Math.cos(angle) * petalLen;
        const tipY = Math.sin(angle) * petalLen;
        const cp2x = Math.cos(angle + petalW) * petalLen * 0.8;
        const cp2y = Math.sin(angle + petalW) * petalLen * 0.8;
        ctx.bezierCurveTo(cp1x, cp1y, cp1x * 1.1, cp1y * 1.1, tipX, tipY);
        ctx.bezierCurveTo(cp2x * 1.1, cp2y * 1.1, cp2x, cp2y, 0, 0);
      } else if (shapePhase === 1) {
        // Star points
        const innerR = petalLen * 0.35;
        ctx.moveTo(Math.cos(angle) * petalLen, Math.sin(angle) * petalLen);
        const midAngle = angle + Math.PI / petals;
        ctx.lineTo(Math.cos(midAngle) * innerR, Math.sin(midAngle) * innerR);
        const nextAngle = angle + (2 * Math.PI / petals);
        ctx.lineTo(Math.cos(nextAngle) * petalLen, Math.sin(nextAngle) * petalLen);
        ctx.lineTo(0, 0);
      } else {
        // Polygon segments
        const sides = 3 + Math.floor(fVal * 3);
        for (let s = 0; s <= sides; s++) {
          const sa = angle + (s / sides) * (Math.PI * 2 / petals);
          const sr = petalLen * (0.6 + Math.sin(sa * 3 + t * 2) * 0.3);
          const sx = Math.cos(sa) * sr;
          const sy = Math.sin(sa) * sr;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.lineTo(0, 0);
      }

      ctx.closePath();
      ctx.fillStyle = hsla(ch, cs, cl, 0.06 + fVal * 0.18);
      ctx.strokeStyle = hsla(ch, cs, cl, 0.5 + fVal * 0.5);
      ctx.lineWidth = 1 + fVal * 2.5;
      ctx.shadowBlur = 12 + fVal * 25;
      ctx.shadowColor = hsl(ch, cs, cl);
      ctx.fill();
      ctx.stroke();
    }

    // Orbiting dots at petal tips
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2;
      const breathe = 1 + Math.sin(t * 1.5 + layer * 0.9 + p * 0.3) * 0.25;
      const dist = layerR * (0.5 + fVal * 0.9) * breathe;
      const orbitOffset = Math.sin(t * 2 + p) * 8;
      const dotX = Math.cos(angle) * (dist + orbitOffset);
      const dotY = Math.sin(angle) * (dist + orbitOffset);
      const dotSize = 2 + fVal * 6 + Math.sin(t * 3 + p * 1.5) * 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, Math.max(1, dotSize), 0, Math.PI * 2);
      ctx.fillStyle = hsla(ch, cs, cl + 20, 0.5 + fVal * 0.5);
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    ctx.restore();
  }

  // Rotating connector rings
  for (let r = 0; r < 3; r++) {
    const ringR = maxR * (0.3 + r * 0.2);
    const ringFi = r * 30;
    const ringFVal = (d.frequencyData[ringFi] || 0) / 255 * sens;
    const [rh, rs, rl] = getColor(pal, r + 2, t);
    ctx.beginPath();
    const segs = 60;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const wobble = Math.sin(a * 6 + t * 2.5 + r) * (5 + ringFVal * 15);
      const rr = ringR + wobble;
      const x = Math.cos(a + t * (0.15 + r * 0.1)) * rr;
      const y = Math.sin(a + t * (0.15 + r * 0.1)) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = hsla(rh, rs, rl, 0.15 + ringFVal * 0.3);
    ctx.lineWidth = 0.8 + ringFVal * 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = hsl(rh, rs, rl);
    ctx.stroke();
  }

  // Center glow
  const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.18);
  cGrad.addColorStop(0, colA(pal, 0, t, 0.4 + d.bass * 0.5));
  cGrad.addColorStop(0.5, colA(pal, 2, t, 0.1));
  cGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── MODE 8: Fire Storm ───
interface Ember { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; ci: number; }
let embers: Ember[] = [];
let embersInit = false;

function renderFireStorm(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, w, h);

  if (!embersInit) { embers = []; embersInit = true; }

  const cx = w / 2, cy = h * 0.7;
  const spawnRate = Math.floor(5 + d.bass * 30 * sens);

  // Spawn new embers
  for (let i = 0; i < spawnRate; i++) {
    const spread = w * 0.4;
    embers.push({
      x: cx + (Math.random() - 0.5) * spread,
      y: cy + Math.random() * 40,
      vx: (Math.random() - 0.5) * 3,
      vy: -(2 + Math.random() * 4 + d.bass * 6 * sens),
      life: 0,
      maxLife: 40 + Math.random() * 60,
      size: 2 + Math.random() * 6 + d.energy * 4,
      ci: Math.floor(Math.random() * 4),
    });
  }

  // Update and draw embers
  embers = embers.filter(e => e.life < e.maxLife);
  if (embers.length > 600) embers.splice(0, embers.length - 600);

  for (const e of embers) {
    e.life++;
    const lifeRatio = e.life / e.maxLife;
    e.x += e.vx + Math.sin(t * 3 + e.y * 0.01) * 1.5;
    e.vy *= 0.98;
    e.y += e.vy;
    e.size *= 0.99;

    const alpha = Math.max(0, 1 - lifeRatio);
    const [ch, cs, cl] = getColor(pal, e.ci, t);
    const adjustedL = cl + (1 - lifeRatio) * 20;

    // Glow
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 3);
    grad.addColorStop(0, hsla(ch, cs, adjustedL, alpha * 0.6));
    grad.addColorStop(0.5, hsla(ch, cs, cl, alpha * 0.2));
    grad.addColorStop(1, hsla(ch, cs, cl - 20, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = hsla(ch, cs, adjustedL + 20, alpha);
    ctx.fill();
  }

  // Base fire glow
  const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.35);
  baseGrad.addColorStop(0, colA(pal, 0, t, 0.12 + d.bass * 0.2));
  baseGrad.addColorStop(0.5, colA(pal, 1, t, 0.05));
  baseGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

// ─── MODE 9: Spiral Vortex ───
function renderSpiralVortex(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const arms = 5;
  const pointsPerArm = 200;
  const maxR = Math.min(w, h) * 0.45;

  ctx.save();
  ctx.translate(cx, cy);

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2;
    const [ch, cs, cl] = getColor(pal, arm, t);

    ctx.beginPath();
    let prevX = 0, prevY = 0;
    for (let i = 0; i < pointsPerArm; i++) {
      const progress = i / pointsPerArm;
      const angle = progress * Math.PI * 6 + armOffset + t * 0.8;
      const fi = Math.floor(progress * d.frequencyData.length * 0.5);
      const fVal = (d.frequencyData[fi] || 0) / 255 * sens;
      const radius = progress * maxR * (0.8 + fVal * 0.5);
      const wobble = Math.sin(progress * 20 + t * 3) * (5 + fVal * 15);
      const x = Math.cos(angle) * (radius + wobble);
      const y = Math.sin(angle) * (radius + wobble);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      prevX = x;
      prevY = y;
    }

    ctx.strokeStyle = hsla(ch, cs, cl, 0.5 + d.energy * 0.4);
    ctx.lineWidth = 1.5 + d.bass * 3;
    ctx.shadowBlur = 15 + d.bass * 30;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.stroke();

    // Dots along the spiral
    for (let i = 0; i < pointsPerArm; i += 8) {
      const progress = i / pointsPerArm;
      const angle = progress * Math.PI * 6 + armOffset + t * 0.8;
      const fi = Math.floor(progress * d.frequencyData.length * 0.5);
      const fVal = (d.frequencyData[fi] || 0) / 255 * sens;
      const radius = progress * maxR * (0.8 + fVal * 0.5);
      const wobble = Math.sin(progress * 20 + t * 3) * (5 + fVal * 15);
      const x = Math.cos(angle) * (radius + wobble);
      const y = Math.sin(angle) * (radius + wobble);
      const dotSize = 1 + fVal * 4;

      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = hsla(ch, cs, cl + 15, 0.3 + fVal * 0.7);
      ctx.fill();
    }
  }

  // Center vortex
  const vGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 + d.bass * 40);
  vGrad.addColorStop(0, colA(pal, 0, t, 0.4 + d.bass * 0.3));
  vGrad.addColorStop(0.5, colA(pal, 2, t, 0.1));
  vGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = vGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 50 + d.bass * 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── MODE 10: Lightning Web ───
interface LightningBolt { points: [number, number][]; opacity: number; ci: number; width: number; }
let bolts: LightningBolt[] = [];

function generateBolt(x1: number, y1: number, x2: number, y2: number, depth: number): [number, number][] {
  if (depth === 0) return [[x1, y1], [x2, y2]];
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * Math.abs(x2 - x1) * 0.4;
  const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * Math.abs(y2 - y1) * 0.4;
  const left = generateBolt(x1, y1, midX, midY, depth - 1);
  const right = generateBolt(midX, midY, x2, y2, depth - 1);
  return [...left, ...right.slice(1)];
}

function renderLightning(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;

  // Spawn bolts on beat or high energy
  if (d.isBeat || (d.energy > 0.6 && Math.random() < 0.3)) {
    const count = 1 + Math.floor(d.bass * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * Math.min(w, h) * 0.3;
      const endX = cx + Math.cos(angle) * dist;
      const endY = cy + Math.sin(angle) * dist;
      bolts.push({
        points: generateBolt(cx, cy, endX, endY, 5),
        opacity: 1,
        ci: Math.floor(Math.random() * 4),
        width: 1.5 + d.bass * 3,
      });
    }
  }

  // Draw and fade bolts
  bolts = bolts.filter(b => b.opacity > 0.02);
  if (bolts.length > 30) bolts.splice(0, bolts.length - 30);

  for (const bolt of bolts) {
    const [ch, cs, cl] = getColor(pal, bolt.ci, t);

    // Outer glow
    ctx.beginPath();
    bolt.points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = hsla(ch, cs, cl, bolt.opacity * 0.3);
    ctx.lineWidth = bolt.width * 4;
    ctx.shadowBlur = 40;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.stroke();

    // Core
    ctx.beginPath();
    bolt.points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = hsla(ch, cs, cl + 25, bolt.opacity);
    ctx.lineWidth = bolt.width;
    ctx.stroke();

    bolt.opacity -= 0.03;
  }

  // Ambient web connections from center
  const nodes = 12;
  for (let i = 0; i < nodes; i++) {
    const angle = (i / nodes) * Math.PI * 2 + t * 0.2;
    const fi = (i * 10) % d.frequencyData.length;
    const fVal = (d.frequencyData[fi] || 0) / 255 * sens;
    const dist = 80 + fVal * Math.min(w, h) * 0.25;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;

    const [ch, cs, cl] = getColor(pal, i, t);

    // Node
    ctx.beginPath();
    ctx.arc(x, y, 3 + fVal * 6, 0, Math.PI * 2);
    ctx.fillStyle = hsla(ch, cs, cl, 0.4 + fVal * 0.6);
    ctx.shadowBlur = 15;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.fill();

    // Line to center
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = hsla(ch, cs, cl, 0.1 + fVal * 0.2);
    ctx.lineWidth = 0.5 + fVal * 1.5;
    ctx.stroke();

    // Connect to neighbors
    const j = (i + 1) % nodes;
    const jAngle = (j / nodes) * Math.PI * 2 + t * 0.2;
    const jfi = (j * 10) % d.frequencyData.length;
    const jfVal = (d.frequencyData[jfi] || 0) / 255 * sens;
    const jDist = 80 + jfVal * Math.min(w, h) * 0.25;
    const jx = cx + Math.cos(jAngle) * jDist;
    const jy = cy + Math.sin(jAngle) * jDist;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(jx, jy);
    ctx.strokeStyle = hsla(ch, cs, cl, 0.08 + fVal * 0.15);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Center glow
  const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 + d.energy * 30);
  cGrad.addColorStop(0, colA(pal, 0, t, 0.2 + d.bass * 0.3));
  cGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 40 + d.energy * 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

// ─── MODE 11: Neon Wireframe Sphere ───
function renderSphere(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const baseR = Math.min(w, h) * 0.25;

  for (let ring = 0; ring < 2; ring++) {
    const vertices = 72;
    const points: [number, number][] = [];
    const rotOffset = ring * 0.4 + t * (ring === 0 ? 0.3 : -0.2);

    for (let i = 0; i < vertices; i++) {
      const a = (i / vertices) * Math.PI * 2;
      const fi = ((ring * 32 + i * 2) % d.frequencyData.length);
      const fVal = (d.frequencyData[fi] || 0) / 255 * sens;
      const disp = fVal * baseR * 0.45;
      const wobble = Math.sin(a * 4 + t * 3) * 8 + Math.sin(a * 7 + t * 1.5) * 5;
      const r = baseR * (0.7 + ring * 0.35) + disp + wobble;
      points.push([cx + Math.cos(a + rotOffset) * r, cy + Math.sin(a + rotOffset) * r]);
    }

    ctx.beginPath();
    points.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.closePath();
    const [ch, cs, cl] = getColor(pal, ring, t);
    ctx.strokeStyle = hsl(ch, cs, cl);
    ctx.lineWidth = 1.5 + d.energy * 2;
    ctx.shadowBlur = 25;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.stroke();

    for (let i = 0; i < vertices; i += 6) {
      const j = (i + Math.floor(vertices / 3)) % vertices;
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[j][0], points[j][1]);
      ctx.strokeStyle = hsla(ch, cs, cl, 0.15 + d.highs * 0.3);
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.4);
  grad.addColorStop(0, colA(pal, 2, t, 0.15 + d.bass * 0.2));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── MODE 12: Shockwave ───
function renderShockwave(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;

  ctx.beginPath();
  const sliceW = w / d.timeDomainData.length * 2;
  for (let i = 0; i < d.timeDomainData.length / 2; i++) {
    const v = d.timeDomainData[i] / 128.0;
    const y = cy + (v - 1) * h * 0.25 * sens;
    if (i === 0) ctx.moveTo(0, y);
    else ctx.lineTo(i * sliceW, y);
  }
  const [wh, ws, wl] = getColor(pal, 0, t);
  ctx.strokeStyle = hsla(wh, ws, wl, 0.5);
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = hsl(wh, ws, wl);
  ctx.stroke();

  if (d.isBeat) {
    shockwaves.push({ radius: 5, opacity: 1, ci: Math.floor(t * 10) % 4 });
  }

  shockwaves = shockwaves.filter(s => s.opacity > 0.01);
  for (const s of shockwaves) {
    const [sh, ss, sl] = getColor(pal, s.ci, t);
    ctx.beginPath();
    ctx.arc(cx, cy, s.radius, 0, Math.PI * 2);
    ctx.strokeStyle = hsla(sh, ss, sl, s.opacity);
    ctx.lineWidth = 2 + s.opacity * 6;
    ctx.shadowBlur = s.opacity * 35;
    ctx.shadowColor = hsl(sh, ss, sl);
    ctx.stroke();

    if (s.radius > 30) {
      ctx.beginPath();
      ctx.arc(cx, cy, s.radius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = hsla(sh, ss, sl, s.opacity * 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    s.radius += 7 + d.energy * 12 * sens;
    s.opacity -= 0.018;
  }

  const eR = 20 + d.energy * 60 * sens;
  const eGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, eR);
  eGrad.addColorStop(0, colA(pal, 1, t, 0.3 + d.bass * 0.4));
  eGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = eGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, eR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── Mode Registry ───
export interface VisualizationMode {
  name: string;
  icon: string;
  render: (ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) => void;
}

export const MODES: VisualizationMode[] = [
  { name: 'Frequency Bars', icon: '📊', render: renderBars },
  { name: 'Kaleidoscope', icon: '🔮', render: renderKaleidoscope },
  { name: 'Particle Galaxy', icon: '✨', render: renderParticles },
  { name: 'Liquid Blob', icon: '💧', render: renderBlob },
  { name: 'Tunnel', icon: '🌀', render: renderTunnel },
  { name: 'Aurora Borealis', icon: '🌌', render: renderAurora },
  { name: 'Mandala', icon: '💎', render: renderMandala },
  { name: 'Spiral Vortex', icon: '🌀', render: renderSpiralVortex },
  { name: 'Neon Sphere', icon: '🔵', render: renderSphere },
  { name: 'Shockwave', icon: '💥', render: renderShockwave },
];

import type { AudioData } from '@/hooks/useAudioAnalyzer';

// ─── Color System ───
export type PaletteName = 'cyber' | 'aurora' | 'fire' | 'ocean' | 'rainbow';
export const PALETTE_NAMES: PaletteName[] = ['cyber', 'aurora', 'fire', 'ocean', 'rainbow'];

// HSL triplets [h, s, l]
type HSL = [number, number, number];
const PALS: Record<PaletteName, HSL[]> = {
  cyber:  [[330,100,50],[265,80,58],[216,100,62],[170,100,50]],
  aurora: [[170,100,50],[195,100,49],[270,70,62],[330,90,54]],
  fire:   [[15,100,55],[35,100,55],[50,100,55],[0,100,50]],
  ocean:  [[195,100,45],[200,100,40],[190,80,70],[185,80,55]],
  rainbow:[], // handled dynamically
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

// ─── MODE 6: Fractal Tree ───
function drawBranch(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, depth: number, maxDepth: number, d: AudioData, t: number, pal: PaletteName, sens: number) {
  if (depth > maxDepth || len < 3) return;

  const fi = (depth * 20) % d.frequencyData.length;
  const val = (d.frequencyData[fi] || 0) / 255 * sens;
  const endX = x + Math.cos(angle) * len;
  const endY = y + Math.sin(angle) * len;

  const [ch, cs, cl] = getColor(pal, depth, t);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = hsla(ch, cs, cl, 0.5 + val * 0.5);
  ctx.lineWidth = Math.max(0.5, (maxDepth - depth) * 1.5);
  ctx.shadowBlur = val * 15;
  ctx.shadowColor = hsl(ch, cs, cl);
  ctx.stroke();

  const spread = 0.3 + val * 0.8;
  const shrink = 0.65 + val * 0.15;
  drawBranch(ctx, endX, endY, angle - spread, len * shrink, depth + 1, maxDepth, d, t, pal, sens);
  drawBranch(ctx, endX, endY, angle + spread, len * shrink, depth + 1, maxDepth, d, t, pal, sens);
}

function renderFractal(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h;
  const baseLen = Math.min(w, h) * 0.18 * (0.7 + d.energy * 0.5 * sens);
  const maxDepth = 8 + Math.floor(d.energy * 3);

  ctx.save();
  ctx.translate(0, 0);
  drawBranch(ctx, cx, cy, -Math.PI / 2 + Math.sin(t * 0.5) * 0.1, baseLen, 0, Math.min(maxDepth, 11), d, t, pal, sens);
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── MODE 7: Neon Wireframe Sphere ───
function renderSphere(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const baseR = Math.min(w, h) * 0.25;

  // Draw two wireframe circles with displacement
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

    // Main outline
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    const [ch, cs, cl] = getColor(pal, ring, t);
    ctx.strokeStyle = hsl(ch, cs, cl);
    ctx.lineWidth = 1.5 + d.energy * 2;
    ctx.shadowBlur = 25;
    ctx.shadowColor = hsl(ch, cs, cl);
    ctx.stroke();

    // Cross-connections
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

  // Center glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.4);
  grad.addColorStop(0, colA(pal, 2, t, 0.15 + d.bass * 0.2));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

// ─── MODE 8: Shockwave + Waveform ───
function renderShockwave(ctx: CanvasRenderingContext2D, d: AudioData, w: number, h: number, t: number, pal: PaletteName, sens: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;

  // Waveform
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

  // Add shockwave on beat
  if (d.isBeat) {
    shockwaves.push({ radius: 5, opacity: 1, ci: Math.floor(t * 10) % 4 });
  }

  // Update and draw shockwaves
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

    // Double ring
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

  // Center energy indicator
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
  { name: 'Fractal Tree', icon: '🌿', render: renderFractal },
  { name: 'Neon Sphere', icon: '🔵', render: renderSphere },
  { name: 'Shockwave', icon: '💥', render: renderShockwave },
];

/**
 * Canvas renderer: starfield backdrop, orbital trails, glowing bodies.
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./camera.js').Camera} camera
   */
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = camera;
    this.showTrails = true;
    this.showLabels = true;
    this.showGrid = false;
    this._stars = this._makeStars(140);
    this._dpr = 1;
  }

  _makeStars(n) {
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.2,
      });
    }
    return stars;
  }

  /**
   * Match canvas buffer to CSS size × devicePixelRatio.
   */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._dpr = dpr;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * @param {import('../physics/simulation.js').Simulation} sim
   */
  draw(sim) {
    this.resize();
    const ctx = this.ctx;
    const w = this.camera.width;
    const h = this.camera.height;

    // Deep space background
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    g.addColorStop(0, '#12182a');
    g.addColorStop(0.55, '#0a0e18');
    g.addColorStop(1, '#05070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Starfield (screen-fixed)
    for (const s of this._stars) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(220, 230, 255, ${s.a})`;
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.showGrid) this._drawGrid(w, h);

    const bodies = sim.bodies;

    if (this.showTrails) {
      for (const b of bodies) this._drawTrail(b);
    }

    for (const b of bodies) this._drawBody(b);

    if (this.showLabels) {
      for (const b of bodies) this._drawLabel(b);
    }
  }

  _drawGrid(w, h) {
    const ctx = this.ctx;
    const cam = this.camera;
    const step = niceGridStep(cam.viewScale / cam.userZoom);
    const tl = cam.screenToWorld(0, 0);
    const br = cam.screenToWorld(w, h);
    const x0 = Math.floor(Math.min(tl.x, br.x) / step) * step;
    const x1 = Math.max(tl.x, br.x);
    const y0 = Math.floor(Math.min(tl.y, br.y) / step) * step;
    const y1 = Math.max(tl.y, br.y);

    ctx.strokeStyle = 'rgba(120, 140, 180, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) {
      const a = cam.worldToScreen(x, y0);
      const b = cam.worldToScreen(x, y1);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    for (let y = y0; y <= y1; y += step) {
      const a = cam.worldToScreen(x0, y);
      const b = cam.worldToScreen(x1, y);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }

  _drawTrail(body) {
    const trail = body.trail;
    if (trail.length < 2) return;
    const ctx = this.ctx;
    const cam = this.camera;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fade trail with segment alpha
    for (let i = 1; i < trail.length; i++) {
      const t = i / trail.length;
      const p0 = cam.worldToScreen(trail[i - 1].x, trail[i - 1].y);
      const p1 = cam.worldToScreen(trail[i].x, trail[i].y);
      ctx.beginPath();
      ctx.strokeStyle = hexToRgba(body.color, 0.05 + t * 0.55);
      ctx.lineWidth = 1 + t * 1.8;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }

  _drawBody(body) {
    const ctx = this.ctx;
    const { x, y } = this.camera.worldToScreen(body.x, body.y);
    const r = Math.max(2.5, body.radius * this.camera.scale);

    // Soft glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
    glow.addColorStop(0, hexToRgba(body.color, 0.45));
    glow.addColorStop(0.35, hexToRgba(body.color, 0.12));
    glow.addColorStop(1, hexToRgba(body.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Core
    const core = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.35, body.color);
    core.addColorStop(1, shade(body.color, -0.35));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawLabel(body) {
    if (!body.name) return;
    const ctx = this.ctx;
    const { x, y } = this.camera.worldToScreen(body.x, body.y);
    const r = Math.max(2.5, body.radius * this.camera.scale);
    ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(230, 236, 255, 0.75)';
    ctx.textAlign = 'center';
    ctx.fillText(body.name, x, y - r - 6);
  }
}

function niceGridStep(viewHalf) {
  const raw = viewHalf / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  let m = 1;
  if (n > 5) m = 10;
  else if (n > 2) m = 5;
  else if (n > 1) m = 2;
  return m * pow;
}

function hexToRgba(hex, a) {
  const c = parseHex(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

function shade(hex, amount) {
  const c = parseHex(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgb(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;
}

function parseHex(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

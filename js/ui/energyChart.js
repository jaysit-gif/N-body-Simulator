/**
 * Tiny sparkline of K, U, and E over recent history.
 */
export class EnergyChart {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * @param {import('../physics/energy.js').EnergyMonitor} monitor
   */
  draw(monitor) {
    const canvas = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 280;
    const cssH = canvas.clientHeight || 100;
    const w = Math.floor(cssW * dpr);
    const h = Math.floor(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = 'rgba(8, 12, 22, 0.6)';
    ctx.fillRect(0, 0, cssW, cssH);

    const hist = monitor.history;
    if (hist.length < 2) {
      ctx.fillStyle = 'rgba(180, 190, 220, 0.5)';
      ctx.font = '12px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillText('Energy history will appear here…', 10, cssH / 2 + 4);
      return;
    }

    let min = Infinity;
    let max = -Infinity;
    for (const p of hist) {
      min = Math.min(min, p.k, p.u, p.e);
      max = Math.max(max, p.k, p.u, p.e);
    }
    // Pad range
    const pad = (max - min) * 0.08 || 1;
    min -= pad;
    max += pad;

    const mapY = (v) => {
      const t = (v - min) / (max - min);
      return cssH - 8 - t * (cssH - 16);
    };
    const mapX = (i) => 8 + (i / (hist.length - 1)) * (cssW - 16);

    // Zero line if in range
    if (min < 0 && max > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      const y0 = mapY(0);
      ctx.moveTo(8, y0);
      ctx.lineTo(cssW - 8, y0);
      ctx.stroke();
    }

    this._series(ctx, hist, 'k', mapX, mapY, '#5eead4', cssW);
    this._series(ctx, hist, 'u', mapX, mapY, '#c084fc', cssW);
    this._series(ctx, hist, 'e', mapX, mapY, '#fbbf24', cssW, 2);
  }

  _series(ctx, hist, key, mapX, mapY, color, _cssW, width = 1.5) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    for (let i = 0; i < hist.length; i++) {
      const x = mapX(i);
      const y = mapY(hist[i][key]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

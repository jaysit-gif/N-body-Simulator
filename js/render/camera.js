/**
 * World ↔ screen transforms. Y is flipped so +y is up in world space.
 */
export class Camera {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    /** World units visible along the shorter canvas axis (half-extent). */
    this.viewScale = 20;
    this.offsetX = 0;
    this.offsetY = 0;
    this.userZoom = 1;
  }

  get width() {
    return this.canvas.clientWidth || this.canvas.width;
  }

  get height() {
    return this.canvas.clientHeight || this.canvas.height;
  }

  /** Pixels per world unit */
  get scale() {
    const minSide = Math.min(this.width, this.height);
    return (minSide * 0.5 * this.userZoom) / this.viewScale;
  }

  worldToScreen(x, y) {
    const s = this.scale;
    return {
      x: this.width * 0.5 + (x - this.offsetX) * s,
      y: this.height * 0.5 - (y - this.offsetY) * s,
    };
  }

  screenToWorld(sx, sy) {
    const s = this.scale;
    return {
      x: this.offsetX + (sx - this.width * 0.5) / s,
      y: this.offsetY - (sy - this.height * 0.5) / s,
    };
  }

  /**
   * Soft follow of the barycenter so long integrations stay framed.
   * @param {import('../physics/body.js').Body[]} bodies
   * @param {number} [alpha=0.04]
   */
  followBarycenter(bodies, alpha = 0.04) {
    if (!bodies.length) return;
    let m = 0;
    let cx = 0;
    let cy = 0;
    for (const b of bodies) {
      m += b.mass;
      cx += b.mass * b.x;
      cy += b.mass * b.y;
    }
    if (m <= 0) return;
    cx /= m;
    cy /= m;
    this.offsetX += (cx - this.offsetX) * alpha;
    this.offsetY += (cy - this.offsetY) * alpha;
  }

  setViewScale(scale) {
    this.viewScale = Math.max(1, scale);
  }

  reset(viewScale) {
    this.offsetX = 0;
    this.offsetY = 0;
    this.userZoom = 1;
    if (viewScale != null) this.setViewScale(viewScale);
  }
}

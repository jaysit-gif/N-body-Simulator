/**
 * A single gravitating body in 2D.
 * Positions and velocities are in simulation units (not pixels).
 */
export class Body {
  /**
   * @param {object} opts
   * @param {number} opts.mass
   * @param {number} opts.x
   * @param {number} opts.y
   * @param {number} [opts.vx=0]
   * @param {number} [opts.vy=0]
   * @param {string} [opts.color='#88ccff']
   * @param {string} [opts.name='']
   * @param {number} [opts.radius] visual radius hint (world units); auto if omitted
   */
  constructor({ mass, x, y, vx = 0, vy = 0, color = '#88ccff', name = '', radius = null }) {
    if (!(mass > 0) || !Number.isFinite(mass)) {
      throw new Error(`Body mass must be a positive finite number (got ${mass})`);
    }
    this.mass = mass;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ax = 0;
    this.ay = 0;
    this.color = color;
    this.name = name;
    /** Visual radius in world units (not physics radius). */
    this.radius = radius ?? Math.max(0.4, Math.min(8, 0.9 * Math.cbrt(mass)));
    /** Trail of past positions: Array<{x,y}> (newest last). */
    this.trail = [];
  }

  clone() {
    const b = new Body({
      mass: this.mass,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      color: this.color,
      name: this.name,
      radius: this.radius,
    });
    b.ax = this.ax;
    b.ay = this.ay;
    b.trail = this.trail.map((p) => ({ x: p.x, y: p.y }));
    return b;
  }

  /** Kinetic energy ½ m v² */
  kineticEnergy() {
    return 0.5 * this.mass * (this.vx * this.vx + this.vy * this.vy);
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }
}

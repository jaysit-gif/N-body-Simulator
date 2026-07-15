import { Body } from './body.js';
import { computeAccelerations } from './force.js';
import { computeEnergy, EnergyMonitor } from './energy.js';
import { integrateStep } from './integrator.js';

/**
 * Owns bodies, constants, time, and integration settings.
 * Pure physics — no DOM / rendering.
 */
export class Simulation {
  /**
   * @param {object} [opts]
   * @param {number} [opts.G=1]
   * @param {number} [opts.softening=0.05]
   * @param {number} [opts.dt=0.01]
   * @param {'verlet'|'euler'} [opts.integrator='verlet']
   * @param {number} [opts.trailLength=180]
   */
  constructor(opts = {}) {
    this.G = opts.G ?? 1;
    this.softening = opts.softening ?? 0.05;
    this.dt = opts.dt ?? 0.01;
    this.integrator = opts.integrator ?? 'verlet';
    this.trailLength = opts.trailLength ?? 180;

    /** @type {Body[]} */
    this.bodies = [];
    this.time = 0;
    this.steps = 0;
    this.running = true;

    this.energyMonitor = new EnergyMonitor();
    /** Last computed energy snapshot */
    this.energy = { kinetic: 0, potential: 0, total: 0 };
  }

  /**
   * Replace the body set (e.g. load a preset).
   * @param {Body[]} bodies
   * @param {object} [meta]
   * @param {number} [meta.G]
   * @param {number} [meta.softening]
   * @param {number} [meta.dt]
   * @param {number} [meta.trailLength]
   */
  load(bodies, meta = {}) {
    this.bodies = bodies.map((b) => (b instanceof Body ? b.clone() : new Body(b)));
    if (meta.G != null) this.G = meta.G;
    if (meta.softening != null) this.softening = meta.softening;
    if (meta.dt != null) this.dt = meta.dt;
    if (meta.trailLength != null) this.trailLength = meta.trailLength;

    this.time = 0;
    this.steps = 0;
    this.energyMonitor.reset();
    for (const b of this.bodies) b.trail = [];

    // Verlet needs a(t) at t0
    computeAccelerations(this.bodies, this.G, this.softening);
    this._refreshEnergy();
  }

  /**
   * Advance simulation by `substeps` integrator steps.
   * @param {number} [substeps=1]
   */
  step(substeps = 1) {
    const n = Math.max(1, substeps | 0);
    for (let s = 0; s < n; s++) {
      integrateStep(this.integrator, this.bodies, this.dt, this.G, this.softening);
      this.time += this.dt;
      this.steps += 1;
      this._recordTrails();
    }
    this._refreshEnergy();
  }

  _recordTrails() {
    // Record every step; trails are short enough for canvas performance
    const max = this.trailLength;
    for (const b of this.bodies) {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > max) b.trail.shift();
    }
  }

  _refreshEnergy() {
    this.energy = computeEnergy(this.bodies, this.G, this.softening);
    this.energyMonitor.record(this.time, this.energy);
  }

  /** Recompute energy and reset the drift baseline (after parameter changes). */
  rebaselineEnergy() {
    this.energy = computeEnergy(this.bodies, this.G, this.softening);
    this.energyMonitor.reset();
    this.energyMonitor.record(this.time, this.energy);
  }

  get relativeEnergyError() {
    return this.energyMonitor.relativeError(this.energy.total);
  }

  /** Remove linear momentum so the barycenter stays put (optional hygiene). */
  removeLinearMomentum() {
    let m = 0;
    let px = 0;
    let py = 0;
    for (const b of this.bodies) {
      m += b.mass;
      px += b.mass * b.vx;
      py += b.mass * b.vy;
    }
    if (m <= 0) return;
    const vx = px / m;
    const vy = py / m;
    for (const b of this.bodies) {
      b.vx -= vx;
      b.vy -= vy;
    }
    computeAccelerations(this.bodies, this.G, this.softening);
  }

  /** Shift so barycenter is at origin. */
  centerOnBarycenter() {
    let m = 0;
    let cx = 0;
    let cy = 0;
    for (const b of this.bodies) {
      m += b.mass;
      cx += b.mass * b.x;
      cy += b.mass * b.y;
    }
    if (m <= 0) return;
    cx /= m;
    cy /= m;
    for (const b of this.bodies) {
      b.x -= cx;
      b.y -= cy;
      for (const p of b.trail) {
        p.x -= cx;
        p.y -= cy;
      }
    }
  }
}

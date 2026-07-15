import { potentialEnergy } from './force.js';

/**
 * Mechanical energy diagnostics for the system.
 * Total E = K + U should stay nearly constant under a symplectic integrator
 * (bounded oscillations, no secular drift for fixed dt).
 */

/**
 * @param {import('./body.js').Body[]} bodies
 * @param {number} G
 * @param {number} softening
 * @returns {{ kinetic: number, potential: number, total: number }}
 */
export function computeEnergy(bodies, G, softening) {
  let kinetic = 0;
  for (const b of bodies) {
    kinetic += b.kineticEnergy();
  }
  const potential = potentialEnergy(bodies, G, softening);
  return {
    kinetic,
    potential,
    total: kinetic + potential,
  };
}

/**
 * Tracks energy over time for drift plots / relative error.
 */
export class EnergyMonitor {
  constructor() {
    this.reset();
  }

  reset() {
    /** @type {number|null} */
    this.initialTotal = null;
    /** @type {Array<{t:number,k:number,u:number,e:number}>} */
    this.history = [];
    this.maxHistory = 600;
  }

  /**
   * @param {number} t simulation time
   * @param {{ kinetic: number, potential: number, total: number }} energy
   */
  record(t, energy) {
    if (this.initialTotal === null) {
      this.initialTotal = energy.total;
    }
    this.history.push({
      t,
      k: energy.kinetic,
      u: energy.potential,
      e: energy.total,
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Relative energy error |E − E0| / |E0|.
   * Returns 0 if E0 is essentially zero (rare free-fall edge case).
   */
  relativeError(currentTotal) {
    if (this.initialTotal === null) return 0;
    const denom = Math.abs(this.initialTotal);
    if (denom < 1e-30) return Math.abs(currentTotal);
    return Math.abs(currentTotal - this.initialTotal) / denom;
  }
}

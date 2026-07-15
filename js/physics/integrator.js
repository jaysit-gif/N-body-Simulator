import { computeAccelerations } from './force.js';

/**
 * Velocity-Verlet (leapfrog) integrator — symplectic, time-reversible.
 *
 * Steps:
 *   v(t+dt/2) = v(t) + a(t)·dt/2
 *   x(t+dt)   = x(t) + v(t+dt/2)·dt
 *   a(t+dt)   = a(x(t+dt))
 *   v(t+dt)   = v(t+dt/2) + a(t+dt)·dt/2
 *
 * For fixed dt, total energy oscillates with bounded amplitude rather than
 * drifting (unlike forward Euler / RK4 over long times at large dt).
 */

/**
 * Advance the system by one velocity-Verlet step.
 * Requires accelerations already valid for the current positions
 * (call computeAccelerations once after loading bodies).
 *
 * @param {import('./body.js').Body[]} bodies
 * @param {number} dt
 * @param {number} G
 * @param {number} softening
 */
export function velocityVerletStep(bodies, dt, G, softening) {
  const half = 0.5 * dt;

  // Kick (half) + drift (full)
  for (const b of bodies) {
    b.vx += b.ax * half;
    b.vy += b.ay * half;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // New accelerations at updated positions
  computeAccelerations(bodies, G, softening);

  // Kick (half)
  for (const b of bodies) {
    b.vx += b.ax * half;
    b.vy += b.ay * half;
  }
}

/**
 * Forward Euler — intentionally available for educational comparison.
 * Not symplectic: energy will secularly drift / explode at large dt.
 *
 * @param {import('./body.js').Body[]} bodies
 * @param {number} dt
 * @param {number} G
 * @param {number} softening
 */
export function eulerStep(bodies, dt, G, softening) {
  computeAccelerations(bodies, G, softening);
  for (const b of bodies) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx += b.ax * dt;
    b.vy += b.ay * dt;
  }
}

/**
 * @typedef {'verlet'|'euler'} IntegratorKind
 */

/**
 * @param {IntegratorKind} kind
 * @param {import('./body.js').Body[]} bodies
 * @param {number} dt
 * @param {number} G
 * @param {number} softening
 */
export function integrateStep(kind, bodies, dt, G, softening) {
  if (kind === 'euler') {
    eulerStep(bodies, dt, G, softening);
  } else {
    velocityVerletStep(bodies, dt, G, softening);
  }
}

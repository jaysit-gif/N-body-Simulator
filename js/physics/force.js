/**
 * Newtonian gravity with Plummer softening.
 *
 * Softened force on i due to j:
 *   F_ij = G m_i m_j * r_ij / (r² + ε²)^{3/2}
 *
 * Softening ε avoids 1/r² blow-ups on close encounters while leaving
 * large-scale orbits essentially Newtonian (ε ≪ typical separation).
 */

/**
 * Compute pairwise accelerations into each body's ax, ay.
 * O(N²) all-pairs — correct and transparent for educational use.
 *
 * @param {import('./body.js').Body[]} bodies
 * @param {number} G gravitational constant in sim units
 * @param {number} softening ε ≥ 0
 */
export function computeAccelerations(bodies, G, softening) {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    bodies[i].ax = 0;
    bodies[i].ay = 0;
  }

  const eps2 = softening * softening;

  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r2 = dx * dx + dy * dy + eps2;
      // 1 / r³ with softening: (r²+ε²)^{-3/2}
      const invR3 = 1 / (r2 * Math.sqrt(r2));
      const factor = G * invR3;
      const ax = factor * dx;
      const ay = factor * dy;
      // a_i += G m_j r / r³ ; a_j -= G m_i r / r³
      bi.ax += ax * bj.mass;
      bi.ay += ay * bj.mass;
      bj.ax -= ax * bi.mass;
      bj.ay -= ay * bi.mass;
    }
  }
}

/**
 * Softened gravitational potential energy (pairwise).
 * U = −Σ_{i<j} G m_i m_j / sqrt(r² + ε²)
 *
 * @param {import('./body.js').Body[]} bodies
 * @param {number} G
 * @param {number} softening
 */
export function potentialEnergy(bodies, G, softening) {
  let U = 0;
  const n = bodies.length;
  const eps2 = softening * softening;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const rSoft = Math.sqrt(dx * dx + dy * dy + eps2);
      U -= (G * bodies[i].mass * bodies[j].mass) / rSoft;
    }
  }
  return U;
}

/**
 * Headless energy-conservation checks (no browser).
 * Run: node tests/energy.test.mjs
 */
import { Body } from '../js/physics/body.js';
import { Simulation } from '../js/physics/simulation.js';
import { buildPreset } from '../js/presets.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${msg}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

function relativeError(sim) {
  return sim.relativeEnergyError;
}

console.log('Binary circular orbit — Velocity Verlet');
{
  const p = buildPreset('binary');
  const sim = new Simulation({ integrator: 'verlet' });
  sim.load(p.bodies, { G: p.G, softening: p.softening, dt: 0.005 });
  sim.removeLinearMomentum();
  sim.centerOnBarycenter();
  sim.rebaselineEnergy();

  for (let i = 0; i < 5000; i++) sim.step(1);
  const err = relativeError(sim);
  console.log(`    |ΔE|/|E0| after 5000 steps = ${err.toExponential(3)}`);
  assert(err < 1e-4, `Verlet binary relative energy error < 1e-4 (got ${err.toExponential(3)})`);
}

console.log('Binary circular orbit — Forward Euler (expect larger drift)');
{
  const p = buildPreset('binary');
  const sim = new Simulation({ integrator: 'euler' });
  sim.load(p.bodies, { G: p.G, softening: p.softening, dt: 0.01 });
  sim.removeLinearMomentum();
  sim.centerOnBarycenter();
  sim.rebaselineEnergy();

  for (let i = 0; i < 3000; i++) sim.step(1);
  const err = relativeError(sim);
  console.log(`    |ΔE|/|E0| after 3000 steps = ${err.toExponential(3)}`);
  assert(err > 1e-4, `Euler binary energy drifts more than 1e-4 (got ${err.toExponential(3)})`);
}

console.log('Figure-eight choreography — Verlet structure intact');
{
  const p = buildPreset('figure8');
  const sim = new Simulation({ integrator: 'verlet' });
  sim.load(p.bodies, { G: p.G, softening: p.softening, dt: p.dt });
  sim.removeLinearMomentum();
  sim.centerOnBarycenter();
  sim.rebaselineEnergy();

  for (let i = 0; i < 8000; i++) sim.step(1);
  const err = relativeError(sim);
  // Softening + finite dt: allow modest error but not blow-up
  console.log(`    |ΔE|/|E0| after 8000 steps = ${err.toExponential(3)}`);
  assert(err < 5e-2, `Figure-8 stays bounded under Verlet (got ${err.toExponential(3)})`);
  assert(Number.isFinite(sim.energy.total), 'Figure-8 energy remains finite');
}

console.log('Two-body force antisymmetry / free-fall energy exchange');
{
  const sim = new Simulation({ integrator: 'verlet', G: 1, softening: 0.05, dt: 0.002 });
  sim.load(
    [
      new Body({ mass: 10, x: -2, y: 0, vx: 0, vy: 0 }),
      new Body({ mass: 10, x: 2, y: 0, vx: 0, vy: 0 }),
    ],
    { G: 1, softening: 0.05, dt: 0.002 }
  );
  sim.rebaselineEnergy();
  const e0 = sim.energy.total;
  for (let i = 0; i < 400; i++) sim.step(1);
  // Falling toward each other: K rises, U drops, E ~ constant
  assert(sim.energy.kinetic > 0.1, 'Free-fall converts potential into kinetic');
  const err = Math.abs(sim.energy.total - e0) / Math.abs(e0);
  console.log(`    free-fall |ΔE|/|E0| = ${err.toExponential(3)}`);
  assert(err < 1e-5, `Free-fall energy conserved under Verlet (got ${err.toExponential(3)})`);
}

console.log('Softened potential matches force derivative (finite difference)');
{
  // For 1D two-body along x, a1 = G m2 * dx / (r2+eps2)^{3/2}
  // U = -G m1 m2 / sqrt(r2+eps2); -dU/dx1 should equal F1
  const G = 1;
  const m1 = 3;
  const m2 = 7;
  const eps = 0.2;
  const x1 = 0;
  const x2 = 1.5;
  const dx = x2 - x1;
  const r2 = dx * dx + eps * eps;
  const invR3 = 1 / (r2 * Math.sqrt(r2));
  const a1 = G * m2 * dx * invR3; // acceleration of body 1 toward body 2
  const F1 = m1 * a1;

  const h = 1e-6;
  const U = (x) => - (G * m1 * m2) / Math.sqrt((x2 - x) ** 2 + eps * eps);
  const Fnum = -(U(x1 + h) - U(x1 - h)) / (2 * h);
  const rel = Math.abs(F1 - Fnum) / Math.abs(F1);
  console.log(`    force vs −∇U relative error = ${rel.toExponential(3)}`);
  assert(rel < 1e-5, `Softened force matches −∇U (rel ${rel.toExponential(3)})`);
}

console.log('\n────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

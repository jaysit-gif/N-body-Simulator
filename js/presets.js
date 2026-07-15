import { Body } from './physics/body.js';

/**
 * Curated initial conditions. Masses / G chosen so orbits are readable
 * on screen with dt ~ 0.002–0.02.
 *
 * Each preset returns { id, name, description, bodies, G, softening, dt, viewScale }.
 */

function binaryStars() {
  // Equal-mass circular binary about common center
  const m = 20;
  const sep = 12;
  const G = 1;
  // Relative circular: v_rel = sqrt(G (2m) / sep); each star gets half
  const v = Math.sqrt((G * (m + m)) / sep) / 2;
  return {
    id: 'binary',
    name: 'Binary stars',
    description:
      'Two equal masses in a circular orbit about their barycenter. A clean test of energy conservation.',
    G,
    softening: 0.08,
    dt: 0.008,
    viewScale: 18,
    bodies: [
      new Body({ mass: m, x: -sep / 2, y: 0, vx: 0, vy: v, color: '#ffb454', name: 'A', radius: 2.2 }),
      new Body({ mass: m, x: sep / 2, y: 0, vx: 0, vy: -v, color: '#6ecbff', name: 'B', radius: 2.2 }),
    ],
  };
}

function figureEight() {
  // Chenciner & Montgomery figure-8 three-body choreography.
  // Unit-mass, G=1 classic ICs scaled so the loop fills the view.
  // Length scale L: positions × L, velocities × L^{-1/2} (fixed G, m).
  const L = 10;
  const p1x = 0.97000436 * L;
  const p1y = -0.24308753 * L;
  const velScale = 1 / Math.sqrt(L);
  const v3x = -0.93240737 * velScale;
  const v3y = -0.86473146 * velScale;

  return {
    id: 'figure8',
    name: 'Figure-eight',
    description:
      'The famous three-body choreography: all three masses chase each other on one figure-8 path. Sensitive to numerical error — watch energy drift.',
    G: 1,
    softening: 0.02,
    dt: 0.002,
    viewScale: 14,
    bodies: [
      new Body({
        mass: 1,
        x: p1x,
        y: p1y,
        vx: -0.5 * v3x,
        vy: -0.5 * v3y,
        color: '#ff6b6b',
        name: '1',
        radius: 1.4,
      }),
      new Body({
        mass: 1,
        x: -p1x,
        y: -p1y,
        vx: -0.5 * v3x,
        vy: -0.5 * v3y,
        color: '#4ecdc4',
        name: '2',
        radius: 1.4,
      }),
      new Body({
        mass: 1,
        x: 0,
        y: 0,
        vx: v3x,
        vy: v3y,
        color: '#ffe66d',
        name: '3',
        radius: 1.4,
      }),
    ],
  };
}

function sunPlanetMoon() {
  const G = 1;
  const M = 500;
  const mP = 8;
  const mM = 0.6;
  const rP = 28;
  const rM = 4.2;
  const vP = Math.sqrt((G * M) / rP);
  const vMrel = Math.sqrt((G * mP) / rM);

  return {
    id: 'system',
    name: 'Star · planet · moon',
    description:
      'Hierarchical three-body system: a planet orbits a star while a moon orbits the planet. Nested orbital timescales.',
    G,
    softening: 0.15,
    dt: 0.004,
    viewScale: 40,
    bodies: [
      new Body({ mass: M, x: 0, y: 0, vx: 0, vy: 0, color: '#ffd166', name: 'Star', radius: 4.5 }),
      new Body({
        mass: mP,
        x: rP,
        y: 0,
        vx: 0,
        vy: vP,
        color: '#4cc9f0',
        name: 'Planet',
        radius: 2,
      }),
      new Body({
        mass: mM,
        x: rP + rM,
        y: 0,
        vx: 0,
        vy: vP + vMrel,
        color: '#c0c0d0',
        name: 'Moon',
        radius: 0.9,
      }),
    ],
  };
}

function randomCluster() {
  const G = 1;
  const n = 12;
  const bodies = [];
  const palette = [
    '#ff6b6b',
    '#feca57',
    '#48dbfb',
    '#ff9ff3',
    '#54a0ff',
    '#5f27cd',
    '#01a3a4',
    '#f368e0',
    '#ff9f43',
    '#10ac84',
    '#ee5a24',
    '#0abde3',
  ];
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 14;
    const mass = 0.8 + Math.random() * 3.5;
    const swirl = 0.12 + Math.random() * 0.2;
    bodies.push(
      new Body({
        mass,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        vx: -Math.sin(angle) * swirl * r * 0.35,
        vy: Math.cos(angle) * swirl * r * 0.35,
        color: palette[i % palette.length],
        name: `b${i + 1}`,
        radius: Math.max(0.6, 0.7 * Math.cbrt(mass)),
      })
    );
  }
  return {
    id: 'cluster',
    name: 'Star cluster',
    description:
      'A small N-body cluster with mild rotation. Close encounters, ejections, and the chaotic side of gravity.',
    G,
    softening: 0.25,
    dt: 0.006,
    viewScale: 28,
    bodies,
  };
}

function ellipticalOrbit() {
  const G = 1;
  const M = 200;
  const m = 1;
  const r = 12;
  const semi = 22;
  // vis-viva: v = sqrt(GM (2/r − 1/a))
  const v = Math.sqrt(G * M * (2 / r - 1 / semi));
  return {
    id: 'ellipse',
    name: 'Elliptical orbit',
    description:
      'A light body on a high-eccentricity orbit around a heavy central mass. Trail spacing shows Kepler’s second law.',
    G,
    softening: 0.1,
    dt: 0.005,
    viewScale: 32,
    bodies: [
      new Body({ mass: M, x: 0, y: 0, vx: 0, vy: 0, color: '#ffcc66', name: 'Central', radius: 3.5 }),
      new Body({
        mass: m,
        x: r,
        y: 0,
        vx: 0,
        vy: v,
        color: '#7bed9f',
        name: 'Orbiter',
        radius: 1.2,
      }),
    ],
  };
}

function lagrangeTrojans() {
  // Approximate co-rotating equilateral (L4) configuration
  const G = 1;
  const M = 100;
  const m = 5;
  const mT = 0.05;
  const r = 22;
  const omega = Math.sqrt((G * (M + m)) / (r * r * r));
  const xM = -r * (m / (M + m));
  const xP = r * (M / (M + m));
  const midX = (xM + xP) / 2;
  const L4x = midX;
  const L4y = (Math.sqrt(3) / 2) * r;

  return {
    id: 'lagrange',
    name: 'Trojan (L4)',
    description:
      'A test mass near the L4 Lagrange point of a star–planet pair. Stable libration appears as a slow dance around the equilateral point.',
    G,
    softening: 0.12,
    dt: 0.008,
    viewScale: 30,
    bodies: [
      new Body({
        mass: M,
        x: xM,
        y: 0,
        vx: 0,
        vy: -omega * xM,
        color: '#ffd166',
        name: 'Star',
        radius: 3.2,
      }),
      new Body({
        mass: m,
        x: xP,
        y: 0,
        vx: 0,
        vy: -omega * xP,
        color: '#4cc9f0',
        name: 'Planet',
        radius: 1.8,
      }),
      new Body({
        mass: mT,
        x: L4x,
        y: L4y,
        vx: -omega * L4y,
        vy: omega * L4x,
        color: '#ff6b6b',
        name: 'Trojan',
        radius: 1.0,
      }),
    ],
  };
}

/** @type {Record<string, () => object>} */
export const PRESET_BUILDERS = {
  binary: binaryStars,
  figure8: figureEight,
  system: sunPlanetMoon,
  ellipse: ellipticalOrbit,
  lagrange: lagrangeTrojans,
  cluster: randomCluster,
};

export const PRESET_ORDER = ['binary', 'figure8', 'system', 'ellipse', 'lagrange', 'cluster'];

export function buildPreset(id) {
  const fn = PRESET_BUILDERS[id] ?? binaryStars;
  return fn();
}

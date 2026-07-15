import { Simulation } from './physics/simulation.js';
import { Camera } from './render/camera.js';
import { Renderer } from './render/canvas.js';
import { EnergyChart } from './ui/energyChart.js';
import { bindControls } from './ui/controls.js';
import { buildPreset } from './presets.js';

const canvas = document.getElementById('sim-canvas');
const energyCanvas = document.getElementById('energy-chart');

const sim = new Simulation();
const camera = new Camera(canvas);
const renderer = new Renderer(canvas, camera);
const energyChart = new EnergyChart(energyCanvas);

function loadPreset(id) {
  const preset = buildPreset(id);
  sim.load(preset.bodies, {
    G: preset.G,
    softening: preset.softening,
    dt: preset.dt,
    trailLength: 220,
  });
  // Keep hierarchical systems from drifting off-frame slowly
  sim.removeLinearMomentum();
  sim.centerOnBarycenter();
  sim.rebaselineEnergy();

  camera.reset(preset.viewScale);
  ui.setDescription(preset.description);
  updateHud(true);
}

const ui = bindControls({
  sim,
  camera,
  renderer,
  loadPreset,
  elements: {
    canvas,
    presetSelect: document.getElementById('preset'),
    playBtn: document.getElementById('btn-play'),
    resetBtn: document.getElementById('btn-reset'),
    dtSlider: document.getElementById('dt'),
    dtValue: document.getElementById('dt-value'),
    speedSlider: document.getElementById('speed'),
    speedValue: document.getElementById('speed-value'),
    softeningSlider: document.getElementById('softening'),
    softeningValue: document.getElementById('softening-value'),
    integratorSelect: document.getElementById('integrator'),
    trailsToggle: document.getElementById('trails'),
    labelsToggle: document.getElementById('labels'),
    gridToggle: document.getElementById('grid'),
    followToggle: document.getElementById('follow'),
    zoomInBtn: document.getElementById('btn-zoom-in'),
    zoomOutBtn: document.getElementById('btn-zoom-out'),
    descEl: document.getElementById('preset-desc'),
  },
});

// Stats DOM
const elTime = document.getElementById('stat-time');
const elSteps = document.getElementById('stat-steps');
const elBodies = document.getElementById('stat-bodies');
const elK = document.getElementById('stat-k');
const elU = document.getElementById('stat-u');
const elE = document.getElementById('stat-e');
const elDrift = document.getElementById('stat-drift');
const elIntegrator = document.getElementById('stat-integrator');

function fmt(x, digits = 4) {
  if (!Number.isFinite(x)) return '—';
  const ax = Math.abs(x);
  if (ax !== 0 && (ax < 1e-3 || ax >= 1e5)) return x.toExponential(3);
  return x.toFixed(digits);
}

function updateHud(forceChart = false) {
  elTime.textContent = fmt(sim.time, 3);
  elSteps.textContent = String(sim.steps);
  elBodies.textContent = String(sim.bodies.length);
  elK.textContent = fmt(sim.energy.kinetic);
  elU.textContent = fmt(sim.energy.potential);
  elE.textContent = fmt(sim.energy.total);
  const err = sim.relativeEnergyError;
  elDrift.textContent = (err * 100).toExponential(2) + '%';
  elDrift.classList.toggle('warn', err > 1e-3);
  elDrift.classList.toggle('bad', err > 1e-2);
  elIntegrator.textContent = sim.integrator === 'verlet' ? 'Velocity Verlet' : 'Forward Euler';

  if (forceChart || sim.steps % 2 === 0) {
    energyChart.draw(sim.energyMonitor);
  }
}

// Multiple physics substeps per animation frame (speed control)
function frame() {
  if (sim.running) {
    const steps = ui.getStepsPerFrame();
    sim.step(steps);
    if (ui.getFollow()) {
      camera.followBarycenter(sim.bodies, 0.06);
    }
  }

  renderer.draw(sim);
  updateHud();
  requestAnimationFrame(frame);
}

// Boot
loadPreset('binary');
ui.syncSlidersFromSim();
document.getElementById('preset').value = 'binary';
requestAnimationFrame(frame);

// Expose for console experimentation / tests
window.__nbody = { sim, camera, renderer, loadPreset };

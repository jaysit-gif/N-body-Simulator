import { PRESET_ORDER, PRESET_BUILDERS } from '../presets.js';
import { computeAccelerations } from '../physics/force.js';

/**
 * Bind DOM controls to simulation / renderer / camera.
 */
export function bindControls({
  sim,
  camera,
  renderer,
  loadPreset,
  elements,
}) {
  const {
    presetSelect,
    playBtn,
    resetBtn,
    dtSlider,
    dtValue,
    speedSlider,
    speedValue,
    softeningSlider,
    softeningValue,
    integratorSelect,
    trailsToggle,
    labelsToggle,
    gridToggle,
    followToggle,
    zoomInBtn,
    zoomOutBtn,
    descEl,
  } = elements;

  // Populate presets
  presetSelect.innerHTML = '';
  for (const id of PRESET_ORDER) {
    const meta = PRESET_BUILDERS[id]();
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = meta.name;
    presetSelect.appendChild(opt);
  }

  function syncSlidersFromSim() {
    dtSlider.value = String(sim.dt);
    dtValue.textContent = formatNum(sim.dt);
    softeningSlider.value = String(sim.softening);
    softeningValue.textContent = formatNum(sim.softening);
    integratorSelect.value = sim.integrator;
  }

  presetSelect.addEventListener('change', () => {
    loadPreset(presetSelect.value);
    syncSlidersFromSim();
  });

  playBtn.addEventListener('click', () => {
    sim.running = !sim.running;
    playBtn.textContent = sim.running ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', String(sim.running));
  });

  resetBtn.addEventListener('click', () => {
    loadPreset(presetSelect.value);
    syncSlidersFromSim();
    sim.running = true;
    playBtn.textContent = 'Pause';
  });

  dtSlider.addEventListener('input', () => {
    sim.dt = Number(dtSlider.value);
    dtValue.textContent = formatNum(sim.dt);
  });

  speedSlider.addEventListener('input', () => {
    speedValue.textContent = `${speedSlider.value}×`;
  });

  softeningSlider.addEventListener('input', () => {
    sim.softening = Number(softeningSlider.value);
    softeningValue.textContent = formatNum(sim.softening);
    // Recompute a with new ε; re-baseline energy so drift stays meaningful
    computeAccelerations(sim.bodies, sim.G, sim.softening);
    sim.rebaselineEnergy();
  });

  integratorSelect.addEventListener('change', () => {
    sim.integrator = integratorSelect.value;
    // Verlet needs valid a(t); recompute after any switch
    computeAccelerations(sim.bodies, sim.G, sim.softening);
    sim.rebaselineEnergy();
  });

  trailsToggle.addEventListener('change', () => {
    renderer.showTrails = trailsToggle.checked;
  });
  labelsToggle.addEventListener('change', () => {
    renderer.showLabels = labelsToggle.checked;
  });
  gridToggle.addEventListener('change', () => {
    renderer.showGrid = gridToggle.checked;
  });

  zoomInBtn.addEventListener('click', () => {
    camera.userZoom = Math.min(8, camera.userZoom * 1.25);
  });
  zoomOutBtn.addEventListener('click', () => {
    camera.userZoom = Math.max(0.2, camera.userZoom / 1.25);
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea, button')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      playBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      resetBtn.click();
    } else if (e.key === '+' || e.key === '=') {
      zoomInBtn.click();
    } else if (e.key === '-' || e.key === '_') {
      zoomOutBtn.click();
    }
  });

  // Scroll zoom over canvas
  elements.canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      camera.userZoom = Math.min(8, Math.max(0.2, camera.userZoom * factor));
    },
    { passive: false }
  );

  return {
    getStepsPerFrame() {
      return Number(speedSlider.value) || 1;
    },
    getFollow() {
      return followToggle.checked;
    },
    setDescription(text) {
      descEl.textContent = text;
    },
    syncSlidersFromSim,
    getPresetId() {
      return presetSelect.value;
    },
  };
}

function formatNum(x) {
  if (x === 0) return '0';
  if (Math.abs(x) < 0.001 || Math.abs(x) >= 1000) return x.toExponential(2);
  return String(Number(x.toPrecision(3)));
}

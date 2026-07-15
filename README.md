# N-Body Lab

**Educational 2D Newtonian gravity simulator** with a symplectic integrator, live energy diagnostics, and carefully chosen presets (binary stars, figure-eight choreography, hierarchical systems, Lagrange L4, and more).

Built to be correct first: O(N²) pairwise forces, Plummer softening, Velocity Verlet time stepping, and an explicit energy-drift meter so you can *see* when numerics are honest.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![No dependencies](https://img.shields.io/badge/deps-0-brightgreen.svg)
![ES modules](https://img.shields.io/badge/JS-ES%20modules-yellow.svg)

## Features

- **Newtonian gravity** with optional **Plummer softening** \(r^2 \to r^2 + \varepsilon^2\)
- **Velocity Verlet** (symplectic, time-reversible) and **Forward Euler** for comparison
- **Live energy panel**: kinetic \(K\), potential \(U\), total \(E = K + U\), relative drift \(|\Delta E|/|E_0|\)
- **Sparkline history** of \(K\), \(U\), and \(E\)
- **Presets**: binary stars, figure-eight 3-body, star–planet–moon, elliptical Kepler orbit, Trojan (L4), random cluster
- **Zero build step** — plain HTML/CSS/JS ES modules, ready for GitHub Pages

## Quick start

Because browsers block ES modules from `file://`, serve the folder with any static server:

```bash
# Python
python -m http.server 8000

# Node (if you have npx)
npx serve .

# VS Code / Cursor: "Live Server" extension also works
```

Then open [http://localhost:8000](http://localhost:8000).

## Controls

| Input | Action |
|--------|--------|
| **Space** | Play / pause |
| **R** | Reset preset |
| **+ / −** or scroll | Zoom |
| Sidebar | Preset, Δt, speed, softening, integrator, trails |

**Try this:** load *Binary stars*, leave Verlet on, watch \(|\Delta E|/|E_0|\) stay tiny. Switch integrator to **Forward Euler** and raise Δt — energy drifts and the orbit slowly spirals.

## Physics

### Force law

For bodies \(i \neq j\):

\[
\mathbf{a}_i = \sum_{j \neq i} G m_j \frac{\mathbf{r}_j - \mathbf{r}_i}{\bigl(|\mathbf{r}_j - \mathbf{r}_i|^2 + \varepsilon^2\bigr)^{3/2}}
\]

Softening \(\varepsilon\) regularizes close encounters without changing distant orbits much when \(\varepsilon\) is small compared to typical separations.

### Energy

\[
K = \sum_i \tfrac12 m_i |\mathbf{v}_i|^2, \qquad
U = -\sum_{i<j} \frac{G m_i m_j}{\sqrt{|\mathbf{r}_{ij}|^2 + \varepsilon^2}}, \qquad
E = K + U
\]

Continuous Newtonian dynamics conserve \(E\). Discrete integrators only approximate this.

### Why Velocity Verlet?

**Velocity Verlet / leapfrog** is a *symplectic* method: for a fixed step size it nearly conserves a nearby “shadow” Hamiltonian, so total energy typically **oscillates with bounded amplitude** instead of marching away.

**Forward Euler** is not symplectic. Energy often grows and bound orbits can artificially expand — useful as a teaching counterexample.

## Project layout

```
nbody-simulator/
├── index.html              # UI shell
├── css/styles.css
├── js/
│   ├── main.js             # animation loop + wiring
│   ├── presets.js          # initial conditions
│   ├── physics/
│   │   ├── body.js
│   │   ├── force.js        # gravity + potential
│   │   ├── integrator.js   # Verlet & Euler
│   │   ├── energy.js
│   │   └── simulation.js   # owns state & stepping
│   ├── render/
│   │   ├── camera.js
│   │   └── canvas.js
│   └── ui/
│       ├── controls.js
│       └── energyChart.js
└── tests/
    └── energy.test.mjs     # headless conservation checks
```

## Tests

Headless checks for energy conservation and force/potential consistency:

```bash
# Python reference (same algorithms as the browser code)
python3 tests/energy_test.py

# Or Node, if installed
node tests/energy.test.mjs
```

On a circular binary with Velocity Verlet, relative energy error after thousands of steps is typically **≪ 10⁻⁴** (often ~10⁻¹¹). Forward Euler drifts orders of magnitude more at the same Δt.

## Design choices (honest trade-offs)

| Choice | Why |
|--------|-----|
| 2D | Clear visualization; same equations as 3D with \(z=0\) |
| O(N²) all-pairs | Exact for the model, transparent code; fine for N ≲ 100 |
| Softening | Avoids 1/r² singularities in a particle model (real stars have size / collisions) |
| No Barnes–Hut / GPU | Correctness and readability over large-N performance |
| Simulation units with \(G=1\) | Removes clutter; easy to rescale |

## GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Deploy from branch `main` / root (or `/docs` if you move files).
3. Site will be at `https://<user>.github.io/<repo>/`.

If the repo is not at the domain root, relative paths in this project already work.

## License

MIT — see [LICENSE](LICENSE).

## References

- Verlet, L. (1967). Computer experiments on classical fluids. *Physical Review*.
- Hairer, Lubich & Wanner — *Geometric Numerical Integration* (symplectic methods).
- Chenciner & Montgomery (2000) — figure-eight three-body choreography.
- Binney & Tremaine — *Galactic Dynamics* (softened gravity, N-body ideas).

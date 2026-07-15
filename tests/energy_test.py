#!/usr/bin/env python3
"""
Reference energy-conservation checks (mirrors js/physics).

Run: python3 tests/energy_test.py
"""
from __future__ import annotations

import math
import sys


class Body:
    __slots__ = ("mass", "x", "y", "vx", "vy", "ax", "ay")

    def __init__(self, mass, x, y, vx=0.0, vy=0.0):
        self.mass = mass
        self.x, self.y = x, y
        self.vx, self.vy = vx, vy
        self.ax = self.ay = 0.0


def compute_accelerations(bodies, G, softening):
    n = len(bodies)
    for b in bodies:
        b.ax = b.ay = 0.0
    eps2 = softening * softening
    for i in range(n):
        bi = bodies[i]
        for j in range(i + 1, n):
            bj = bodies[j]
            dx = bj.x - bi.x
            dy = bj.y - bi.y
            r2 = dx * dx + dy * dy + eps2
            inv_r3 = 1.0 / (r2 * math.sqrt(r2))
            factor = G * inv_r3
            ax = factor * dx
            ay = factor * dy
            bi.ax += ax * bj.mass
            bi.ay += ay * bj.mass
            bj.ax -= ax * bi.mass
            bj.ay -= ay * bi.mass


def potential_energy(bodies, G, softening):
    U = 0.0
    eps2 = softening * softening
    n = len(bodies)
    for i in range(n):
        for j in range(i + 1, n):
            dx = bodies[j].x - bodies[i].x
            dy = bodies[j].y - bodies[i].y
            r_soft = math.sqrt(dx * dx + dy * dy + eps2)
            U -= G * bodies[i].mass * bodies[j].mass / r_soft
    return U


def total_energy(bodies, G, softening):
    K = sum(0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy) for b in bodies)
    U = potential_energy(bodies, G, softening)
    return K, U, K + U


def verlet_step(bodies, dt, G, softening):
    half = 0.5 * dt
    for b in bodies:
        b.vx += b.ax * half
        b.vy += b.ay * half
        b.x += b.vx * dt
        b.y += b.vy * dt
    compute_accelerations(bodies, G, softening)
    for b in bodies:
        b.vx += b.ax * half
        b.vy += b.ay * half


def euler_step(bodies, dt, G, softening):
    compute_accelerations(bodies, G, softening)
    for b in bodies:
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.vx += b.ax * dt
        b.vy += b.ay * dt


def relative_error(e, e0):
    denom = abs(e0)
    if denom < 1e-30:
        return abs(e)
    return abs(e - e0) / denom


passed = 0
failed = 0


def assert_true(cond, msg):
    global passed, failed
    if cond:
        passed += 1
        print(f"  ✓ {msg}")
    else:
        failed += 1
        print(f"  ✗ {msg}", file=sys.stderr)


def binary_bodies():
    m, sep, G = 20.0, 12.0, 1.0
    v = math.sqrt((G * (m + m)) / sep) / 2.0
    return [
        Body(m, -sep / 2, 0.0, 0.0, v),
        Body(m, sep / 2, 0.0, 0.0, -v),
    ]


print("Binary circular orbit — Velocity Verlet")
bodies = binary_bodies()
G, soft, dt = 1.0, 0.08, 0.005
compute_accelerations(bodies, G, soft)
_, _, e0 = total_energy(bodies, G, soft)
for _ in range(5000):
    verlet_step(bodies, dt, G, soft)
_, _, e = total_energy(bodies, G, soft)
err = relative_error(e, e0)
print(f"    |ΔE|/|E0| after 5000 steps = {err:.3e}")
assert_true(err < 1e-4, f"Verlet binary relative energy error < 1e-4 (got {err:.3e})")

print("Binary circular orbit — Forward Euler (expect larger drift)")
bodies = binary_bodies()
G, soft, dt = 1.0, 0.08, 0.01
compute_accelerations(bodies, G, soft)
_, _, e0 = total_energy(bodies, G, soft)
for _ in range(3000):
    euler_step(bodies, dt, G, soft)
_, _, e = total_energy(bodies, G, soft)
err = relative_error(e, e0)
print(f"    |ΔE|/|E0| after 3000 steps = {err:.3e}")
assert_true(err > 1e-4, f"Euler binary energy drifts more than 1e-4 (got {err:.3e})")

print("Figure-eight choreography — Verlet structure intact")
L = 10.0
p1x = 0.97000436 * L
p1y = -0.24308753 * L
vel_scale = 1.0 / math.sqrt(L)
v3x = -0.93240737 * vel_scale
v3y = -0.86473146 * vel_scale
bodies = [
    Body(1.0, p1x, p1y, -0.5 * v3x, -0.5 * v3y),
    Body(1.0, -p1x, -p1y, -0.5 * v3x, -0.5 * v3y),
    Body(1.0, 0.0, 0.0, v3x, v3y),
]
G, soft, dt = 1.0, 0.02, 0.002
compute_accelerations(bodies, G, soft)
_, _, e0 = total_energy(bodies, G, soft)
for _ in range(8000):
    verlet_step(bodies, dt, G, soft)
_, _, e = total_energy(bodies, G, soft)
err = relative_error(e, e0)
print(f"    |ΔE|/|E0| after 8000 steps = {err:.3e}")
assert_true(err < 5e-2, f"Figure-8 stays bounded under Verlet (got {err:.3e})")
assert_true(math.isfinite(e), "Figure-8 energy remains finite")

print("Two-body free-fall energy exchange")
bodies = [Body(10.0, -2.0, 0.0), Body(10.0, 2.0, 0.0)]
G, soft, dt = 1.0, 0.05, 0.002
compute_accelerations(bodies, G, soft)
K0, U0, e0 = total_energy(bodies, G, soft)
for _ in range(400):
    verlet_step(bodies, dt, G, soft)
K, U, e = total_energy(bodies, G, soft)
err = relative_error(e, e0)
print(f"    free-fall |ΔE|/|E0| = {err:.3e}")
assert_true(K > 0.1, "Free-fall converts potential into kinetic")
assert_true(err < 1e-5, f"Free-fall energy conserved under Verlet (got {err:.3e})")

print("Softened potential matches force derivative (finite difference)")
G, m1, m2, eps = 1.0, 3.0, 7.0, 0.2
x1, x2 = 0.0, 1.5
dx = x2 - x1
r2 = dx * dx + eps * eps
inv_r3 = 1.0 / (r2 * math.sqrt(r2))
F1 = m1 * (G * m2 * dx * inv_r3)
h = 1e-6


def U(x):
    return -(G * m1 * m2) / math.sqrt((x2 - x) ** 2 + eps * eps)


Fnum = -(U(x1 + h) - U(x1 - h)) / (2 * h)
rel = abs(F1 - Fnum) / abs(F1)
print(f"    force vs −∇U relative error = {rel:.3e}")
assert_true(rel < 1e-5, f"Softened force matches −∇U (rel {rel:.3e})")

print("\n────────────────────────────────")
print(f"Results: {passed} passed, {failed} failed")
sys.exit(1 if failed else 0)

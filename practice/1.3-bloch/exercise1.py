"""
title: Angles in, state out
task: Write `state(theta, phi)`, which returns cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩. For three random pairs of angles, check that the Bloch vector of `state(theta, phi)` is (sin θ cos φ, sin θ sin φ, cos θ).
hint: Reuse the `bloch` function from the example above, and compare with `np.allclose`.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def bloch(psi):
    return np.array([np.vdot(psi, P @ psi).real for P in (X, Y, Z)])


def state(theta, phi):
    return np.array([np.cos(theta / 2), np.exp(1j * phi) * np.sin(theta / 2)])


rng = np.random.default_rng(seed=4)
for _ in range(3):
    theta, phi = rng.uniform(0, np.pi), rng.uniform(0, 2 * np.pi)
    r = bloch(state(theta, phi))
    expected = [np.sin(theta) * np.cos(phi), np.sin(theta) * np.sin(phi), np.cos(theta)]
    print(f"theta = {theta:.2f}, phi = {phi:.2f}:  r = {r.round(3)}  matches: {np.allclose(r, expected)}")

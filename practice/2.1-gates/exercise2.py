"""
title: Eight T gates make a full turn
task: Start from |+⟩ and apply T eight times. After each gate, print the Bloch vector and its angle around the z axis. Each step should turn the arrow 45° about z.
hint: The angle around z is `np.degrees(np.arctan2(y, x))`.
note: `arctan2` reports angles between −180° and 180°, so 225° appears as −135°. After eight steps the arrow is back at +x: 8 × 45° = 360°.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])
T = np.diag([1, np.exp(1j * np.pi / 4)])


def bloch(psi):
    return np.array([np.vdot(psi, P @ psi).real for P in (X, Y, Z)])


psi = np.array([1, 1]) / np.sqrt(2)
for k in range(1, 9):
    psi = T @ psi
    x, y, z = bloch(psi).round(9) + 0      # round away tiny errors such as -1e-17
    print(f"after {k} T: r = ({x:+.3f}, {y:+.3f}, {z:+.3f})   angle = {np.degrees(np.arctan2(y, x)):6.1f} deg")

"""
title: The parameter-shift rule, checked
text: The circuit from the chapter's panel: |0⟩ → Ry(0.9) → Rz(0.7) → Rx(θ), then measure Z. The parameter-shift rule [f(θ + π/2) − f(θ − π/2)]/2 is compared with the slope measured by a tiny finite difference on the exact simulation.
note: The two columns agree to every printed digit: the shift π/2 is large, and the rule is still exact.
"""
import numpy as np

I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def rot(P, t):
    return np.cos(t / 2) * I - 1j * np.sin(t / 2) * P


def f(theta):
    psi = rot(X, theta) @ rot(Z, 0.7) @ rot(Y, 0.9) @ np.array([1, 0])
    return np.vdot(psi, Z @ psi).real


for theta in [-1.4, 0.0, 0.8, 2.0]:
    shift = (f(theta + np.pi / 2) - f(theta - np.pi / 2)) / 2
    exact = (f(theta + 1e-6) - f(theta - 1e-6)) / 2e-6
    print(f"theta = {theta:+.1f}:  parameter shift {shift:+.6f}   true slope {exact:+.6f}")

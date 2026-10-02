"""
title: A one-qubit model and its decision boundary
text: The model from the worked example: encode x with Ry(x), apply the trainable Ry(θ), and measure Z. The code simulates it, compares it with the formula f = cos(x + θ), and turns f into predictions with p(red) = (1 − f)/2.
note: With θ = π/2 − 0.3 the boundary f = 0 sits at x = 0.3: inputs below it are predicted blue and inputs above it red.
"""
import numpy as np


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def model(x, theta):
    psi = ry(theta) @ ry(x) @ np.array([1, 0])
    return psi[0] ** 2 - psi[1] ** 2                 # <Z>


theta = np.pi / 2 - 0.3
for x in [-1.0, 0.0, 0.25, 0.35, 1.0]:
    f = model(x, theta)
    p_red = (1 - f) / 2
    label = "blue" if f > 0 else "red"
    print(f"x = {x:+.2f}:  f = {f:+.3f}  cos(x + theta) = {np.cos(x + theta):+.3f}  p(red) = {p_red:.3f}  -> {label}")

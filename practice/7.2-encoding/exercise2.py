"""
title: When the angles wrap around
task: Encode x₁ = −1 and x₁ = +1 (with x₂ = 0) using the scaled angle θ = s·π(x₁ + 1)/2, for s = 1 and s = 2. How far apart are the two encoded states, measured by their overlap |⟨ψ|χ⟩|²?
hint: Only Ry matters here, because x₂ = 0 makes φ = 0.
note: With s = 1 the two ends of the input range go to opposite poles, overlap 0. With s = 2 the angle runs a full turn and both ends land on the same point, overlap 1: no model could tell them apart. Choosing the scale is choosing how far apart inputs look.
"""
import numpy as np


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


for s in [1, 2]:
    a = ry(s * np.pi * (-1 + 1) / 2) @ [1, 0]
    b = ry(s * np.pi * (1 + 1) / 2) @ [1, 0]
    print(f"scale {s}: overlap of the encodings of x1 = -1 and x1 = +1: {abs(np.vdot(a, b)) ** 2:.3f}")

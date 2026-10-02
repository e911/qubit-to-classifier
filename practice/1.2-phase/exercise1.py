"""
title: The relative phase sets P(+)
task: For the state (|0⟩ + e^{iφ}|1⟩)/√2, compute P(+) for φ = 0, π/4, π/2, 3π/4 and π, and compare with the formula (1 + cos φ)/2.
hint: P(+) is the first entry of `abs(H @ psi) ** 2`. `np.linspace(0, np.pi, 5)` gives the five angles.
"""
import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
for phi in np.linspace(0, np.pi, 5):
    psi = np.array([1, np.exp(1j * phi)]) / np.sqrt(2)
    p_plus = abs((H @ psi)[0]) ** 2
    formula = (1 + np.cos(phi)) / 2
    print(f"phi = {phi:.4f}   P(+) = {p_plus:.4f}   (1 + cos phi)/2 = {formula + 0:.4f}")

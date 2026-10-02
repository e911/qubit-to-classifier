"""
title: Measuring along any axis
text: Most hardware measures only Z, so to measure along X it applies H first, and along Y it applies S† and then H. Reading 0 afterwards means the + outcome along that axis: |0⟩ for Z, |+⟩ for X and |+i⟩ for Y. The code compares those probabilities with the formula (1 + r·n)/2 for the state with θ = π/3 and φ = 0.
note: The numbers match the worked example "one tilted state, measured three ways": 0.75, 0.933 and 0.5.
"""
import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
Sdg = np.diag([1, -1j])                       # S dagger
theta = np.pi / 3
psi = np.array([np.cos(theta / 2), np.sin(theta / 2)])
r = np.array([np.sin(theta), 0, np.cos(theta)])   # its Bloch vector

rotate_first = {"Z": np.eye(2), "X": H, "Y": H @ Sdg}   # Y: S dagger first, then H
axis = {"Z": [0, 0, 1], "X": [1, 0, 0], "Y": [0, 1, 0]}
plus = {"Z": "0", "X": "+", "Y": "+i"}                  # the + outcome along each axis
for basis, U in rotate_first.items():
    p_plus = abs((U @ psi)[0]) ** 2               # probability of reading 0
    formula = (1 + r @ axis[basis]) / 2
    label = f"P({plus[basis]})"
    print(f"{basis} basis:  {label:5s} = {p_plus:.3f}   (1 + r.n)/2 = {formula:.3f}")

"""
title: Phase kickback
task: Apply CNOT to |+⟩|−⟩ and show that the result is |−⟩|−⟩: the target did not change, but the control did.
hint: Build |+⟩|−⟩ and |−⟩|−⟩ with `np.kron` and compare with `np.allclose`.
"""
import numpy as np

s = 1 / np.sqrt(2)
plus, minus = np.array([s, s]), np.array([s, -s])
CNOT = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]])

out = CNOT @ np.kron(plus, minus)
print("CNOT |+>|-> =", out.round(4))
print("equal to |->|->:", np.allclose(out, np.kron(minus, minus)))

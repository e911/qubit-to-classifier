"""
title: The order of matrices matters
task: Compute XZ and ZX and check that ZX = −XZ. Then apply the circuit "H, then Z" to |0⟩. Do you need `Z @ H` or `H @ Z`?
hint: The matrix next to the state acts first, so a circuit read from left to right becomes a product read from right to left.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Z = np.array([[1, 0], [0, -1]])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
ket0 = np.array([1, 0])

print("XZ =\n", X @ Z)
print("ZX =\n", Z @ X)
print("ZX equals -XZ:", np.array_equal(Z @ X, -(X @ Z)))
print("H, then Z, on |0>:", (Z @ H @ ket0).round(4), " (this is |->)")

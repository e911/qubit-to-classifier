"""
title: Two-qubit gates as 4 × 4 matrices
text: On two qubits a state has four amplitudes (00, 01, 10, 11) and a gate is a 4 × 4 matrix. A one-qubit gate on q0 is `np.kron(gate, I)`. Here H and CNOT make the Bell state, and CZ entangles |+⟩|+⟩.
"""
import numpy as np

I = np.eye(2)
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
CNOT = np.array([[1, 0, 0, 0],      # control q0, target q1
                 [0, 1, 0, 0],
                 [0, 0, 0, 1],
                 [0, 0, 1, 0]])
CZ = np.diag([1, 1, 1, -1])
ket00 = np.array([1, 0, 0, 0])

bell = CNOT @ np.kron(H, I) @ ket00          # H on q0, then CNOT
print("H then CNOT on |00>:", bell.round(4))
plus_plus = np.kron(H, H) @ ket00
print("CZ on |+>|+>:       ", (CZ @ plus_plus).round(4))

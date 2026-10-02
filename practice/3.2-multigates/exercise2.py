"""
title: Build any controlled gate
task: Write `controlled(U)`, which returns |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U with q0 as the control. Check that `controlled(X)` is CNOT and `controlled(Z)` is CZ. Then compare controlled-Rz(π/2) with controlled-S: are they equal now?
hint: |0⟩⟨0| is `np.diag([1, 0])` and |1⟩⟨1| is `np.diag([0, 1])`.
note: S and Rz(π/2) differ only by a global phase, but once they are controlled that phase becomes a relative phase on the control, and the two gates differ.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Z = np.diag([1, -1])
S = np.diag([1, 1j])
Rz = np.diag([np.exp(-1j * np.pi / 4), np.exp(1j * np.pi / 4)])   # Rz(pi/2)


def controlled(U):
    return np.kron(np.diag([1, 0]), np.eye(2)) + np.kron(np.diag([0, 1]), U)


CNOT = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]])
print("controlled(X) is CNOT:", np.allclose(controlled(X), CNOT))
print("controlled(Z) is CZ:  ", np.allclose(controlled(Z), np.diag([1, 1, 1, -1])))
print("controlled(Rz(pi/2)) equals controlled(S):", np.allclose(controlled(Rz), controlled(S)))
print("diagonal of controlled(Rz(pi/2)):", np.diag(controlled(Rz)).round(4))

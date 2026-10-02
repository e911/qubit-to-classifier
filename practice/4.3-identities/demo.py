"""
title: Checking identities, up to a global phase
text: Two circuits are equivalent when their matrices agree up to a global phase. `equivalent(A, B)` divides out the phase and compares; the checks below are identities from this chapter.
"""
import numpy as np

I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
Z = np.diag([1, -1])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
S = np.diag([1, 1j])
P0, P1 = np.diag([1, 0]), np.diag([0, 1])
CNOT_01 = np.kron(P0, I) + np.kron(P1, X)      # control q0, target q1
CNOT_10 = np.kron(I, P0) + np.kron(X, P1)      # control q1, target q0
SWAP = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]])
CZ = np.diag([1, 1, 1, -1])


def rz(t):
    return np.diag([np.exp(-1j * t / 2), np.exp(1j * t / 2)])


def equivalent(A, B):
    k = np.argmax(np.abs(B))                     # a nonzero entry of B
    phase = A.flat[k] / B.flat[k]
    return bool(np.isclose(abs(phase), 1) and np.allclose(A, phase * B))


HH = np.kron(H, H)
checks = {
    "HXH = Z": (H @ X @ H, Z),
    "three CNOTs = SWAP": (CNOT_01 @ CNOT_10 @ CNOT_01, SWAP),
    "H on both flips a CNOT": (HH @ CNOT_01 @ HH, CNOT_10),
    "H CNOT H on the target = CZ": (np.kron(I, H) @ CNOT_01 @ np.kron(I, H), CZ),
    "Rz(pi/2) = S, up to phase": (rz(np.pi / 2), S),
    "S = Z (wrong on purpose)": (S, Z),
}
for name, (A, B) in checks.items():
    print(f"{name:30s} {equivalent(A, B)}")

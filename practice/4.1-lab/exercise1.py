"""
title: Build the W state
task: Use the same tools to build the W state (|001⟩ + |010⟩ + |100⟩)/√3, the "W state" exercise of the Circuit Lab. Recipe: Ry(θ) on q0 with cos(θ/2) = √(2/3); then H on q1, but only where q0 is 0; then X on q2, but only where q0 and q1 are both 0.
hint: "Only where a qubit is 0" is a control on 1 sandwiched between two X gates on that qubit. Write a helper that wraps `controlled` in those X gates.
"""
import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
X = np.array([[0, 1], [1, 0]])


def on_qubit(gate, q, n):
    m = np.array([[1.0]])
    for k in range(n):
        m = np.kron(m, gate if k == q else np.eye(2))
    return m


def controlled(gate, controls, target, n):
    dim = 2 ** n
    full = on_qubit(gate, target, n)
    m = np.zeros((dim, dim), dtype=complex)
    for j in range(dim):
        bits = [(j >> (n - 1 - q)) & 1 for q in range(n)]
        m[:, j] = full[:, j] if all(bits[c] for c in controls) else np.eye(dim)[:, j]
    return m


def controlled_on_zero(gate, controls, target, n):
    flips = np.eye(2 ** n)
    for c in controls:
        flips = on_qubit(X, c, n) @ flips
    return flips @ controlled(gate, controls, target, n) @ flips


def ry(theta):
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.array([[c, -s], [s, c]])


n = 3
psi = np.zeros(8, dtype=complex)
psi[0] = 1
psi = on_qubit(ry(2 * np.arccos(np.sqrt(2 / 3))), 0, n) @ psi
psi = controlled_on_zero(H, [0], 1, n) @ psi
psi = controlled_on_zero(X, [0, 1], 2, n) @ psi
for k, a in enumerate(psi):
    if abs(a) > 1e-12:
        print(f"|{k:03b}>  {a.real:+.4f}")
print("each amplitude should be 1/sqrt(3) =", round(1 / np.sqrt(3), 4))

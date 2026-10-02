"""
title: Teleportation, with real measurements
text: The full protocol on three qubits: q0 holds a random message, q1 and q2 share a Bell pair. Alice's measurement is simulated with the Born rule, the state collapses, and Bob applies X if m₁ = 1 and then Z if m₀ = 1. The overlap of Bob's qubit with the message is printed for five random messages.
note: Alice's results change from run to run, yet Bob always ends with the message: overlap 1.000 every time.
"""
import numpy as np

rng = np.random.default_rng(seed=9)
I, X, Z = np.eye(2), np.array([[0, 1], [1, 0]]), np.diag([1, -1])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)


def one(gate, q, n=3):
    m = np.array([[1.0]])
    for k in range(n):
        m = np.kron(m, gate if k == q else I)
    return m


def cnot(c, t, n=3):
    return one(np.diag([1, 0]), c, n) + one(np.diag([0, 1]), c, n) @ one(X, t, n)


def measure(psi, q, n=3):
    """Measure qubit q: return the outcome and the collapsed state."""
    bit = (np.arange(2 ** n) >> (n - 1 - q)) & 1          # value of qubit q in each label
    p1 = np.sum(np.abs(psi[bit == 1]) ** 2)
    m = int(rng.random() < p1)
    psi = np.where(bit == m, psi, 0)
    return m, psi / np.linalg.norm(psi)


for _ in range(5):
    v = rng.normal(size=2) + 1j * rng.normal(size=2)
    message = v / np.linalg.norm(v)
    psi = np.kron(message, [1, 0, 0, 0])                    # |message>|0>|0>
    psi = cnot(1, 2) @ one(H, 1) @ psi                      # Bell pair on q1, q2
    psi = one(H, 0) @ cnot(0, 1) @ psi                      # Alice: CNOT, then H
    m0, psi = measure(psi, 0)
    m1, psi = measure(psi, 1)
    if m1 == 1:
        psi = one(X, 2) @ psi                               # Bob's corrections
    if m0 == 1:
        psi = one(Z, 2) @ psi
    bob = psi.reshape(2, 2, 2)[m0, m1, :]                   # q2, given Alice's results
    print(f"Alice read {m0}{m1}:  overlap |<message|Bob>|^2 = {abs(np.vdot(message, bob)) ** 2:.3f}")

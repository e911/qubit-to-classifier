"""
title: A circuit simulator in twenty lines
text: A circuit is a list of steps, and running it means multiplying the state by one matrix per step. `on_qubit` places a one-qubit gate in the full space (as in chapter 3.1), and `controlled` builds a gate that acts on the target only where every control is 1. The GHZ circuit from this chapter comes out as expected.
note: Only |000⟩ and |111⟩ survive, each with probability 1/2, exactly as in the Circuit Lab.
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
    """Apply gate to target in the part of the state where every control qubit is 1."""
    dim = 2 ** n
    full = on_qubit(gate, target, n)
    m = np.zeros((dim, dim), dtype=complex)
    for j in range(dim):                                   # column j: where |j> goes
        bits = [(j >> (n - 1 - q)) & 1 for q in range(n)]  # q0 is the leftmost bit
        m[:, j] = full[:, j] if all(bits[c] for c in controls) else np.eye(dim)[:, j]
    return m


def run(circuit, n):
    psi = np.zeros(2 ** n, dtype=complex)
    psi[0] = 1
    for step in circuit:
        psi = step(n) @ psi
    return psi


ghz = [lambda n: on_qubit(H, 0, n),
       lambda n: controlled(X, [0], 1, n),
       lambda n: controlled(X, [1], 2, n)]
psi = run(ghz, 3)
for k, a in enumerate(psi):
    if abs(a) > 1e-12:
        print(f"|{k:03b}>  amplitude {a.real:+.4f}   probability {abs(a) ** 2:.2f}")

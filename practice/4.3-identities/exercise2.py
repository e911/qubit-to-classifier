"""
title: The Toffoli gate from CNOTs and T gates
task: Build the standard decomposition of the Toffoli gate (2 H, 6 CNOT and 7 T or T† gates, the "Toffoli from CNOT + T" example in the Circuit Lab) as an 8 × 8 matrix, and check that it equals the Toffoli matrix exactly.
hint: Write a helper that turns a one-qubit gate on qubit q, or a CNOT from c to t, into an 8 × 8 matrix, then multiply the matrices in circuit order: each new gate goes on the left.
"""
import numpy as np

I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
T = np.diag([1, np.exp(1j * np.pi / 4)])
Tdg = T.conj().T


def one(gate, q, n=3):
    m = np.array([[1.0]])
    for k in range(n):
        m = np.kron(m, gate if k == q else I)
    return m


def cnot(c, t, n=3):
    return one(np.diag([1, 0]), c, n) + one(np.diag([0, 1]), c, n) @ one(X, t, n)


circuit = [one(H, 2), cnot(1, 2), one(Tdg, 2), cnot(0, 2), one(T, 2), cnot(1, 2), one(Tdg, 2), cnot(0, 2),
           one(T, 1), one(T, 2), one(H, 2), cnot(0, 1), one(T, 0), one(Tdg, 1), cnot(0, 1)]
U = np.eye(8)
for gate in circuit:
    U = gate @ U                                   # later gates multiply from the left

toffoli = np.eye(8)
toffoli[[6, 7]] = toffoli[[7, 6]]                  # swap |110> and |111>
print("equals the Toffoli matrix:", np.allclose(U, toffoli))
print("gates used:", len(circuit))

"""
title: Bernstein–Vazirani in one query
task: Hide the string s = 1011 (four bits). Start from the uniform superposition (H on all four qubits of |0000⟩), multiply the amplitude of every input x by the sign (−1)^{s·x}, apply H on all four qubits again, and read the most likely output. It should be s itself, with probability 1.
hint: s·x mod 2 is the parity of the number of positions where both s and x have a 1: `bin(s & x).count("1") % 2`.
"""
import numpy as np

n, s = 4, 0b1011
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
Hn = H
for _ in range(n - 1):
    Hn = np.kron(Hn, H)

signs = np.array([(-1) ** (bin(s & x).count("1") % 2) for x in range(2 ** n)])
psi = Hn @ (signs * (Hn @ np.eye(2 ** n)[0]))    # Hadamards, one query, Hadamards
best = np.argmax(np.abs(psi) ** 2)
print(f"hidden s = {s:04b}, measured {best:04b} with probability {abs(psi[best]) ** 2:.3f}")

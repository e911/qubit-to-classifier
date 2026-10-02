"""
title: Deutsch–Jozsa from a truth table
text: A function from n bits to one bit is just a list of 2^{n} values. With the ancilla in |−⟩ the oracle multiplies each input |x⟩ by (−1)^{f(x)}, so the whole algorithm is: start uniform, apply the signs, apply Hadamards, and read the probability of all zeros.
note: Constant functions give all zeros with probability 1 and balanced functions with probability 0, after a single query. The last function is neither, so the promise does not hold and the answer is in between.
"""
import numpy as np

n = 3
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
Hn = H
for _ in range(n - 1):
    Hn = np.kron(Hn, H)                      # H on every qubit


def prob_all_zeros(f):
    psi = Hn @ np.eye(2 ** n)[0]             # uniform superposition
    psi = (-1) ** np.array(f) * psi          # the phase oracle
    psi = Hn @ psi
    return abs(psi[0]) ** 2


functions = {
    "constant 0":           [0, 0, 0, 0, 0, 0, 0, 0],
    "constant 1":           [1, 1, 1, 1, 1, 1, 1, 1],
    "balanced, f = x0":     [0, 0, 0, 0, 1, 1, 1, 1],
    "balanced, x0x1 xor x2": [((x >> 2) & (x >> 1) & 1) ^ (x & 1) for x in range(8)],
    "neither (one 1)":      [0, 0, 0, 0, 0, 0, 0, 1],
}
for name, f in functions.items():
    print(f"{name:22s} f = {f}   P(000) = {prob_all_zeros(f):.4f}")

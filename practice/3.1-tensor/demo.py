"""
title: Combining qubits with `np.kron`
text: `np.kron` computes the tensor product: `np.kron(a, b)` puts a in q0 and b in q1. The amplitudes come out in the order 00, 01, 10, 11, with q0 as the first (leftmost) bit, the same order as this course. The helper `show` prints the nonzero amplitudes of a state, each with its label.
"""
import numpy as np

s = 1 / np.sqrt(2)
ket0, ket1 = np.array([1, 0]), np.array([0, 1])
plus, minus = np.array([s, s]), np.array([s, -s])


def show(psi):
    n = int(np.log2(len(psi)))
    for k, a in enumerate(psi):
        if abs(a) > 1e-12:
            print(f"   |{k:0{n}b}>  {a:+.4f}")


print("|+> (x) |0>:")
show(np.kron(plus, ket0))
print("|+> (x) |->:")
show(np.kron(plus, minus))
print("|+>|+>|+> has", len(np.kron(np.kron(plus, plus), plus)), "amplitudes, each", round(s ** 3, 4))

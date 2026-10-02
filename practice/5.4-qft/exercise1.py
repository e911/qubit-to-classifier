"""
title: QFT|x⟩ is a product state
task: For every x from 0 to 7, check that QFT|x⟩ equals a product of three one-qubit states (|0⟩ + e^{iα}|1⟩)/√2, where qubit q (with q0 the leftmost) has the angle α = 2πx/2^{q+1}.
hint: Build the product with `np.kron`, one factor per qubit, and compare with column x of the QFT matrix.
note: Each qubit of the output sits on the equator of its Bloch sphere; as x counts up, q0 turns by half a turn per step, q1 by a quarter and q2 by an eighth.
"""
import numpy as np

n, N = 3, 8
j, k = np.meshgrid(np.arange(N), np.arange(N))
QFT = np.exp(2j * np.pi * j * k / N) / np.sqrt(N)

all_match = True
for x in range(N):
    product = np.array([1.0])
    for q in range(n):
        qubit = np.array([1, np.exp(2j * np.pi * x / 2 ** (q + 1))]) / np.sqrt(2)
        product = np.kron(product, qubit)
    all_match = all_match and np.allclose(product, QFT[:, x])
print("QFT|x> is a product state for every x:", all_match)

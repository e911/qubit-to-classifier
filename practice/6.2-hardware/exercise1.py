"""
title: The error budget
task: Each two-qubit gate fails with probability ε. For ε = 0.5% and ε = 0.1%, print the chance that a circuit of N gates runs without any error, (1 − ε)^{N}, next to the approximation e^{−Nε}, for N = 100, 1,000 and 10,000. Then find the largest N with at least a 50% chance.
hint: The 50% point is where Nε ≈ ln 2, so N ≈ ln 2 / ε.
"""
import numpy as np

for eps in [0.005, 0.001]:
    print(f"error rate {eps:.1%}:")
    for N in [100, 1000, 10_000]:
        print(f"   N = {N:6d}: (1 - eps)^N = {(1 - eps) ** N:.4f}   e^(-N eps) = {np.exp(-N * eps):.4f}")
    N_half = int(np.log(0.5) / np.log(1 - eps))
    print(f"   largest circuit with at least a 50% chance: {N_half} gates (ln 2 / eps = {np.log(2) / eps:.0f})")

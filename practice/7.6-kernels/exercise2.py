"""
title: Kernel values shrink exponentially with qubits
task: Encode n random features, one per qubit, with Ry(πx) on each qubit, so k(x, x′) = Π cos²(π(x_{i} − x′_{i})/2). For n = 1, 2, 4, 8, 16 and 32, print the average kernel value between 200 random pairs of inputs drawn from [−1, 1]^{n}, and compare it with the exact average, 1/2^{n}: each qubit's factor averages exactly 1/2.
hint: The product formula lets you compute k without building any 2^{n}-dimensional state.
note: The exact average halves with every added qubit, which is exponential decay. For many qubits the average of 200 pairs comes out too low: the true average is carried by rare pairs that happen to be close, while most pairs have far smaller kernel values, as the median shows. With 32 qubits two different inputs look almost completely unlike each other, and estimating such tiny kernel values from shots would take an enormous number of measurements. This is exponential concentration.
"""
import numpy as np

rng = np.random.default_rng(seed=20)
for n in [1, 2, 4, 8, 16, 32]:
    x = rng.uniform(-1, 1, size=(200, n))
    y = rng.uniform(-1, 1, size=(200, n))
    k = np.prod(np.cos(np.pi * (x - y) / 2) ** 2, axis=1)
    print(f"n = {n:2d} qubits: average of 200 pairs {k.mean():.2e}   exact average {0.5 ** n:.2e}   median {np.median(k):.2e}")

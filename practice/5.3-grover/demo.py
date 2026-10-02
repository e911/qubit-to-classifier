"""
title: Grover's algorithm on a list of amplitudes
text: Grover's algorithm needs only two operations on the vector of N amplitudes: the oracle flips the sign of the marked item, and the diffusion replaces every amplitude a by 2 × mean − a. The code runs it for N = 8 and compares the success probability after k rounds with sin²((2k + 1)θ), where sin θ = 1/√N.
note: Two rounds give 94.5%, the best choice here: (2k + 1)θ is closest to 90° at k = 2, the first peak. A third round overshoots and the success probability falls to 33%.
"""
import numpy as np

N, marked = 8, 5
amps = np.full(N, 1 / np.sqrt(N))            # uniform superposition
theta = np.arcsin(1 / np.sqrt(N))

for k in range(1, 5):
    amps[marked] *= -1                       # oracle
    amps = 2 * amps.mean() - amps            # diffusion: inversion about the mean
    p = amps[marked] ** 2
    print(f"after {k} round{'s' if k > 1 else ' '}: P(marked) = {p:.4f}   sin^2((2k+1) theta) = {np.sin((2 * k + 1) * theta) ** 2:.4f}")

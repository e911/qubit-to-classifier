"""
title: How many rounds for 64 items?
task: For N = 64, compute the best number of rounds from k ≈ π/(4θ) − 1/2, then run Grover for 0 to 12 rounds and print the success probability each time. Where is the peak, and how low does it fall afterwards?
hint: Reuse the two lines of the example: the oracle and the diffusion.
note: The peak is at k = 6, with 99.7%. By k = 12 the probability has fallen to almost 0: the state has rotated past the answer to the far side.
"""
import numpy as np

N, marked = 64, 17
theta = np.arcsin(1 / np.sqrt(N))
print(f"theta = {theta:.4f} rad, best k is about {np.pi / (4 * theta) - 0.5:.2f}")
amps = np.full(N, 1 / np.sqrt(N))
for k in range(0, 13):
    if k > 0:
        amps[marked] *= -1
        amps = 2 * amps.mean() - amps
    print(f"k = {k:2d}: P(marked) = {amps[marked] ** 2:.3f}")

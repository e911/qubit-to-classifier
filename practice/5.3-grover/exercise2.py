"""
title: Several marked items
task: Mark M = 4 of N = 64 items. The oracle now flips all four signs. Run 0 to 6 rounds and print the probability of measuring any marked item. Compare the best round with (π/4)√(N/M).
hint: With several marked items, sin θ = √(M/N), and the success probability is the sum of the squares of the marked amplitudes.
"""
import numpy as np

N = 64
marked = [3, 20, 41, 60]
M = len(marked)
amps = np.full(N, 1 / np.sqrt(N))
print(f"(pi/4) sqrt(N/M) = {np.pi / 4 * np.sqrt(N / M):.2f}")
for k in range(0, 7):
    if k > 0:
        amps[marked] *= -1
        amps = 2 * amps.mean() - amps
    print(f"k = {k}: P(any marked) = {np.sum(amps[marked] ** 2):.3f}")

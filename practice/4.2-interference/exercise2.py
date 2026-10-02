"""
title: Looking at the path destroys the interference
task: Simulate H, then a measurement, then H, on |0⟩, for 2,000 runs. How often does the final result read 0? Compare with the same circuit without the middle measurement.
hint: A measurement collapses the state to |0⟩ or |1⟩ with the Born-rule odds. Do that with `rng.choice`, then apply the second H to the collapsed state.
"""
import numpy as np

rng = np.random.default_rng(seed=8)
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
basis = [np.array([1, 0]), np.array([0, 1])]


def measure(psi):
    p = np.abs(psi) ** 2
    return rng.choice([0, 1], p=p / p.sum())


zeros_measured = 0
for _ in range(2000):
    middle = measure(H @ basis[0])               # the measurement picks a path
    zeros_measured += measure(H @ basis[middle]) == 0
p0_unmeasured = abs((H @ H @ basis[0])[0]) ** 2
print(f"with the middle measurement:    P(0) is about {zeros_measured / 2000:.3f}")
print(f"without the middle measurement: P(0) = {p0_unmeasured:.3f}")

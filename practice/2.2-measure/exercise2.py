"""
title: Tomography of a hidden state
task: Hide a random state. For N shots per axis, estimate x, y and z by measuring along X, Y and Z, and print how far the estimated Bloch vector is from the true one for N = 100, 1,000 and 10,000.
hint: Along an axis, P(+) = (1 + coordinate)/2. Draw the number of + results with `rng.binomial(N, p_plus)` and turn it back into an estimate with 2 × (count / N) − 1.
note: The typical error is about √(2/N): 0.14 for N = 100 and 0.014 for N = 10,000. A single run can land closer or farther; this one happens to land closer than typical at every N.
"""
import numpy as np

rng = np.random.default_rng(seed=7)
theta, phi = rng.uniform(0, np.pi), rng.uniform(0, 2 * np.pi)
r_true = np.array([np.sin(theta) * np.cos(phi), np.sin(theta) * np.sin(phi), np.cos(theta)])
print("hidden Bloch vector:", r_true.round(3))

for N in [100, 1000, 10_000]:
    plus_counts = rng.binomial(N, (1 + r_true) / 2)     # one count per axis
    r_est = 2 * plus_counts / N - 1
    print(f"N = {N:6d}: estimate {r_est.round(3)}   error {np.linalg.norm(r_est - r_true):.3f}")

"""
title: Measuring a qubit, shot by shot
text: A random-number generator that uses the Born-rule probabilities gives outcomes with exactly the same statistics as measuring the qubit. `rng.choice([0, 1], size=N, p=probs)` returns N outcomes, one per shot.
note: The estimates scatter around the true value P(1) = 0.25, and the error bar shrinks about tenfold when the number of shots grows a hundredfold. Change `seed` to get a different run.
"""
import numpy as np

rng = np.random.default_rng(seed=1)
alpha, beta = np.sqrt(3) / 2, 1 / 2          # the state (√3/2)|0> + (1/2)|1>
probs = [abs(alpha) ** 2, abs(beta) ** 2]    # Born rule
print("P(0), P(1) =", np.round(probs, 4))

for N in [100, 10_000]:
    outcomes = rng.choice([0, 1], size=N, p=probs)   # N shots
    p1 = outcomes.mean()                              # fraction of 1s
    error = np.sqrt(p1 * (1 - p1) / N)                # standard error
    print(f"N = {N:6d}:  P(1) is about {p1:.3f} ± {error:.4f}")

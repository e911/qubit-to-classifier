"""
title: Watch the error shrink like 1/√N
task: For N = 100, 400 and 1,600 shots, repeat the whole experiment 2,000 times and measure how much the estimates of P(1) spread out, as their standard deviation. Compare with √(p(1 − p)/N) for p = 0.25.
hint: `rng.binomial(N, p, size=2000)` counts the 1s in 2,000 experiments at once. Divide by N to get the estimates, and use `.std()` for the spread.
note: Each fourfold increase in N halves the formula's value, and the measured spread follows it closely, roughly halving too.
"""
import numpy as np

rng = np.random.default_rng(seed=2)
p = 0.25
for N in [100, 400, 1600]:
    estimates = rng.binomial(N, p, size=2000) / N
    formula = np.sqrt(p * (1 - p) / N)
    print(f"N = {N:5d}:  spread {estimates.std():.4f}   formula {formula:.4f}")

"""
title: An expectation value with an error bar
task: A state has P(0) = 0.62. Simulate 1,000 shots, score each outcome as +1 for 0 and −1 for 1, and print the estimate of ⟨Z⟩ with its standard error √((1 − ⟨Z⟩²)/N). Is the true value 0.24 inside two standard errors?
hint: `1 - 2 * outcomes` turns outcomes 0 and 1 into the scores +1 and −1.
"""
import numpy as np

rng = np.random.default_rng(seed=6)
N, p0 = 1000, 0.62
outcomes = rng.choice([0, 1], size=N, p=[p0, 1 - p0])
scores = 1 - 2 * outcomes                    # 0 -> +1, 1 -> -1
estimate = scores.mean()
error = np.sqrt((1 - estimate ** 2) / N)
print(f"<Z> is about {estimate:.3f} ± {error:.3f}")
print("true value 0.24 within two standard errors:", abs(estimate - 0.24) < 2 * error)

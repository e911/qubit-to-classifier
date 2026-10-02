"""
title: The repetition code, simulated
task: Encode a 0 as d copies, flip each copy with probability p, and decode by majority vote. For d = 3 and p = 1%, 10% and 40%, simulate 200,000 bits and compare the failure rate with 3p² − 2p³. Then try d = 5 and d = 7 at p = 10%.
hint: `rng.random((M, d)) < p` gives M rows of d copies, True where a copy flipped. A row fails when more than half of its copies flipped.
note: Below the threshold of 50% for this code, more copies make the logical error rarer. At p = 10%, three copies cut the error to 2.8%, five to 0.86% and seven to 0.27%. Those are the exact values. The simulated rates differ a little from them, and from run to run, because 200,000 trials still leave some sampling noise.
"""
import numpy as np

rng = np.random.default_rng(seed=10)
M = 200_000


def failure_rate(d, p):
    flips = rng.random((M, d)) < p
    return np.mean(flips.sum(axis=1) > d // 2)


for p in [0.01, 0.10, 0.40]:
    print(f"d = 3, p = {p:.2f}: simulated {failure_rate(3, p):.4f}   3p^2 - 2p^3 = {3 * p**2 - 2 * p**3:.4f}")
for d in [5, 7]:
    print(f"d = {d}, p = 0.10: simulated {failure_rate(d, 0.10):.4f}")

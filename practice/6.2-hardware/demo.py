"""
title: T1 and T2 decay
text: An idle qubit loses energy on the T1 clock and phase on the T2 clock. The code prints what is left of |+⟩ (its x coordinate) and of |1⟩ (its P(1)) over time, for T1 = 100 μs and T2 = 60 μs.
note: At 30 μs, x = e^{−0.5} ≈ 0.61 and P(1) = e^{−0.3} ≈ 0.74, the numbers of the chapter's worked example.
"""
import numpy as np

T1, T2 = 100.0, 60.0                       # microseconds
print(" time (us)   x of |+>   P(1) of |1>")
for t in [0, 10, 30, 60, 100, 200]:
    print(f"{t:9.0f}   {np.exp(-t / T2):9.3f}   {np.exp(-t / T1):10.3f}")

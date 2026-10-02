"""
title: Two arrows that interfere
task: Add the amplitudes 1/2 and e^{iφ}/2 and print the squared length of the sum for φ = 0, π/2 and π. Compare with the formula 1/2 + (1/2) cos φ from the chapter.
hint: `abs(s) ** 2` is the squared length of a complex number s.
note: The same two lengths give 1, 1/2 or 0 depending only on the angle between the arrows. That is interference.
"""
import cmath
import math

for phi in [0, math.pi / 2, math.pi]:
    s = 0.5 + 0.5 * cmath.exp(1j * phi)
    formula = 0.5 + 0.5 * math.cos(phi)
    print(f"phi = {phi:.4f}   |sum|^2 = {abs(s) ** 2:.4f}   formula = {formula:.4f}")

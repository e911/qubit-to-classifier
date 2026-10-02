"""
title: Euler's formula, and rounding
task: Check that e^{iθ} = cos θ + i sin θ for θ = π/3. Then print e^{iπ}. Is it exactly −1?
hint: `cmath.exp(1j * theta)` computes e^{iθ}. Computers store numbers with about 16 significant digits, so expect a tiny leftover.
note: The imaginary part 1.2 × 10⁻¹⁶ of e^{iπ} is rounding error, not physics. That is why numerical code compares numbers with a tolerance, as `abs(left - right) < 1e-12` does, instead of testing for exact equality.
"""
import cmath
import math

theta = math.pi / 3
left = cmath.exp(1j * theta)
right = complex(math.cos(theta), math.sin(theta))
print("e^(i pi/3)          =", left)
print("cos(pi/3) + i sin   =", right)
print("equal (to rounding):", abs(left - right) < 1e-12)
print("e^(i pi)            =", cmath.exp(1j * math.pi))

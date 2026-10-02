"""
title: Lengths multiply, angles add
task: Multiply z = 2 + 3i by w = 1 − i. Check the two rules of this chapter: the length of zw is |z| times |w|, and the angle of zw is arg z plus arg w.
hint: `abs(z)` is the length and `cmath.phase(z)` is the angle in radians. `math.degrees` turns radians into degrees.
starter:
    import cmath
    import math

    z, w = 2 + 3j, 1 - 1j
    p = z * w
    # compare abs(p) with abs(z) * abs(w)
    # compare cmath.phase(p) with cmath.phase(z) + cmath.phase(w)
note: Angles that differ by 360° are the same angle. Python reports angles between −180° and 180°, so with other numbers the two can come out 360° apart: for z = w = −1 + i, arg z + arg w = 270° while `cmath.phase` gives −90° for zw = −2i.
"""
import cmath
import math

z, w = 2 + 3j, 1 - 1j
p = z * w
print("zw =", p)
print(f"|z| |w| = {abs(z) * abs(w):.4f}    |zw| = {abs(p):.4f}")
angle_sum = math.degrees(cmath.phase(z) + cmath.phase(w))
angle_p = math.degrees(cmath.phase(p))
print(f"arg z + arg w = {angle_sum:.2f} deg    arg zw = {angle_p:.2f} deg")

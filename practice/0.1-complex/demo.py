"""
intro: Every example and every solution in these sections is a complete program, and each one prints exactly the output shown under it. To run one, install Python 3 and NumPy (`pip install numpy`), save the code as a file such as `demo.py` and run `python demo.py`. Or paste it into a notebook such as Google Colab (which has NumPy already) or Jupyter. Then change the numbers and run it again: that is the fastest way to learn.
title: Complex numbers are built into Python
text: Python writes the imaginary unit as `j`, so 3 + 2i is `3 + 2j`. The `cmath` module has the complex versions of the maths functions, such as `cmath.phase` for the angle.
note: Every line is a rule from this chapter. z z* comes out as 13 + 0i: a real number, the squared length |z|² = 3² + 2². The angle is in radians; 0.588 radians is about 33.7°.
"""
import cmath

z = 3 + 2j          # Python writes i as j
w = 1 - 4j

print("z + w   =", z + w)
print("z - w   =", z - w)
print("z * w   =", z * w)
print(f"z / w   = {z / w:.4f}")
print("conj(z) =", z.conjugate())
print("z * z*  =", z * z.conjugate())      # |z|^2, a real number
print(f"|z|     = {abs(z):.4f}")            # length: sqrt(3^2 + 2^2)
print(f"arg z   = {cmath.phase(z):.4f}")    # angle in radians

"""
title: Kets, gates and overlaps with NumPy
text: A ket is a NumPy array, a gate is a two-dimensional array, and `@` multiplies a matrix by a vector. `np.vdot(a, b)` is the inner product ⟨a|b⟩: it conjugates its first argument, just as a bra does.
note: H|0⟩ is |+⟩, X leaves |+⟩ unchanged, and the overlaps match the worked examples: ⟨0|+⟩ = 1/√2 ≈ 0.7071 and ⟨+|−⟩ = 0.
"""
import numpy as np

ket0 = np.array([1, 0])
ket1 = np.array([0, 1])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
X = np.array([[0, 1], [1, 0]])

plus = H @ ket0               # matrix times column
minus = H @ ket1
print("H|0>  =", plus.round(4))
print("X|+>  =", (X @ plus).round(4))
print("<0|+> =", np.vdot(ket0, plus).round(4))
print("<+|-> =", np.vdot(plus, minus).round(4) + 0)   # + 0 turns -0.0 into 0.0
print("length of |+> =", np.linalg.norm(plus).round(4))

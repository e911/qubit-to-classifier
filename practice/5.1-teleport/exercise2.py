"""
title: Why CNOT cannot clone a superposition
task: CNOT copies basis states: |0⟩|0⟩ → |0⟩|0⟩ and |1⟩|0⟩ → |1⟩|1⟩. Apply it to |+⟩|0⟩ and compare the result with the copy |+⟩|+⟩ that a cloning machine would have to produce. How large is their overlap?
note: The output is the Bell state, not |+⟩|+⟩: their overlap is only 1/2. Linearity forces this, and the same argument rules out every possible copying machine.
"""
import numpy as np

s = 1 / np.sqrt(2)
plus, zero = np.array([s, s]), np.array([1, 0])
CNOT = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]])

out = CNOT @ np.kron(plus, zero)
copy = np.kron(plus, plus)
print("CNOT |+>|0> =", out.round(4))
print("|+>|+>      =", copy.round(4))
print("overlap |<copy|out>|^2 =", round(abs(np.vdot(copy, out)) ** 2, 4))

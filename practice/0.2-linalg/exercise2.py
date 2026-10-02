"""
title: The bra needs a conjugate
task: Compute ⟨+i|+i⟩ twice: with `np.vdot`, which conjugates the bra, and with `np.dot`, which does not. Only one of them gives the right answer, 1.
hint: |+i⟩ is the column (1, i)/√2.
note: Without the conjugate, i × i = −1 cancels the 1 and the state seems to have no overlap with itself. Whenever a bra appears, conjugate its entries.
"""
import numpy as np

plus_i = np.array([1, 1j]) / np.sqrt(2)
print("with the conjugate:   ", np.vdot(plus_i, plus_i).round(6))
print("without the conjugate:", np.dot(plus_i, plus_i).round(6))

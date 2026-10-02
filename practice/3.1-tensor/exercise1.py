"""
title: Probabilities for one qubit at a time
task: For |ψ⟩ = (1/2)|00⟩ + (1/2)|01⟩ + (1/√2)|11⟩, find P(q0 = 0) and P(q1 = 1) by reshaping the four probabilities into a 2 × 2 grid: rows for q0, columns for q1.
hint: `probs.reshape(2, 2)` puts |00⟩, |01⟩ in the first row and |10⟩, |11⟩ in the second. Then add up a row or a column.
note: The same reshaping trick works for any number of qubits: reshape to (2, 2, …, 2) and add up over the qubits you are not asking about.
"""
import numpy as np

psi = np.array([1 / 2, 1 / 2, 0, 1 / np.sqrt(2)])     # order: 00, 01, 10, 11
grid = (np.abs(psi) ** 2).reshape(2, 2)              # grid[q0, q1]
print("grid of probabilities:\n", grid.round(3))
print("P(q0 = 0) =", grid[0, :].sum().round(3))      # first row
print("P(q1 = 1) =", grid[:, 1].sum().round(3))      # second column

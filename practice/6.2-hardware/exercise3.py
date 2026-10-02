"""
title: Correcting readout errors
task: Calibration shows that |0⟩ reads as 1 in 2% of shots and |1⟩ reads as 0 in 5% of shots. An experiment reads 1 in 40% of its shots. Write the calibration as a 2 × 2 matrix A, with observed probabilities = A × true probabilities, and invert it to find the true probability of 1.
hint: Column 0 of A is what a true 0 looks like after readout, (0.98, 0.02), and column 1 is what a true 1 looks like, (0.05, 0.95). Solve with `np.linalg.solve(A, observed)`.
note: This reproduces the chapter's worked example, q ≈ 0.409. It corrects the statistics, never an individual shot.
"""
import numpy as np

A = np.array([[0.98, 0.05],      # rows: read 0, read 1
              [0.02, 0.95]])     # columns: true 0, true 1
observed = np.array([0.60, 0.40])
true = np.linalg.solve(A, observed)
print("observed:", observed, "  corrected:", true.round(3))

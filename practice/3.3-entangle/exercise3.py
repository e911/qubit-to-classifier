"""
title: Measure one qubit of a pair
task: For (|00⟩ + |01⟩ + |11⟩)/√3, compute P(q0 = 0). Then write down the state after q0 reads 0: keep only the labels that start with 0, and renormalize. Which state is q1 left in?
hint: Set the amplitudes with q0 = 1 to zero, then divide by the length of what is left.
"""
import numpy as np

psi = np.array([1, 1, 0, 1]) / np.sqrt(3)           # order: 00, 01, 10, 11
p_q0_is_0 = np.sum(np.abs(psi[:2]) ** 2)             # labels 00 and 01
after = psi.copy()
after[2:] = 0                                        # cross out 10 and 11
after = after / np.linalg.norm(after)                # renormalize
print(f"P(q0 = 0) = {p_q0_is_0:.4f}")
print("state after reading 0:", after.round(4))
print("q1 alone is", after[:2].round(4), "which is |+>")

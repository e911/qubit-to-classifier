"""
title: Normalize a state
task: The column (3, 4i) is not a state, because its length is 5. Divide it by its length, then print the state and the two probabilities |α|² and |β|².
hint: `np.linalg.norm(v)` is the length of v, and `np.abs(v) ** 2` squares the length of every entry.
starter:
    import numpy as np

    v = np.array([3, 4j])
    psi = ...                  # divide v by its length
    print(psi, np.abs(psi) ** 2)
"""
import numpy as np

v = np.array([3, 4j])
psi = v / np.linalg.norm(v)
probs = np.abs(psi) ** 2
print("state:        ", psi)
print("probabilities:", probs.round(4))
print("total:        ", probs.sum().round(4))

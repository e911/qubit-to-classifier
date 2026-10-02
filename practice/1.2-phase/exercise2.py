"""
title: Remove the global phase
task: Write `remove_global_phase(psi)`, which multiplies a state by a phase factor so that its first amplitude becomes real and non-negative. Use it to show that (i|0⟩ + |1⟩)/√2 is the state |−i⟩, and print the relative phase.
hint: The angle of α is `np.angle(psi[0])`, and multiplying by `np.exp(-1j * angle)` turns it back to zero. The relative phase is `np.angle(beta) - np.angle(alpha)`.
"""
import numpy as np


def remove_global_phase(psi):
    return psi * np.exp(-1j * np.angle(psi[0]))


psi = np.array([1j, 1]) / np.sqrt(2)
clean = remove_global_phase(psi)
minus_i = np.array([1, -1j]) / np.sqrt(2)
print("without the global phase:", clean.round(4))
print("relative phase:", np.angle(clean[1]) / np.pi, "x pi")
print("equal to |-i>:", np.allclose(clean, minus_i))

"""
title: Global phase changes nothing, relative phase does
text: A measurement in the X basis is H followed by an ordinary measurement, so its probabilities are `abs(H @ psi) ** 2`. The four states below have identical 0/1 probabilities.
note: Multiplying |+⟩ by e^{0.7i} changes no probability in either basis. Changing the relative phase moves the X-basis odds from a certain + (|+⟩), through 50/50 (|+i⟩), to a certain − (|−⟩).
"""
import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
s = 1 / np.sqrt(2)
states = {
    "|+>":          np.array([s, s]),
    "e^(0.7i)|+>":  np.exp(0.7j) * np.array([s, s]),
    "|+i>":         np.array([s, 1j * s]),
    "|->":          np.array([s, -s]),
}
for name, psi in states.items():
    pz = np.abs(psi) ** 2          # Z basis: P(0), P(1)
    px = np.abs(H @ psi) ** 2      # X basis: P(+), P(-)
    print(f"{name:12s}  Z basis {pz.round(3)}   X basis {px.round(3) + 0}")

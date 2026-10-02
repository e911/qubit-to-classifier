"""
title: The overlap rule
task: Draw two random states, compute |⟨ψ|χ⟩|² directly and from their Bloch vectors r and s with the rule (1 + r·s)/2. Then try |0⟩ and |1⟩, which sit at opposite poles.
hint: A random state is any random complex column divided by its length. `r @ s` is the dot product of two Bloch vectors.
note: Opposite points on the sphere have r·s = −1, so their overlap is 0: they are orthogonal states.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def bloch(psi):
    return np.array([np.vdot(psi, P @ psi).real for P in (X, Y, Z)])


def random_state(rng):
    v = rng.normal(size=2) + 1j * rng.normal(size=2)
    return v / np.linalg.norm(v)


rng = np.random.default_rng(seed=5)
for psi, chi in [(random_state(rng), random_state(rng)), (np.array([1, 0]), np.array([0, 1]))]:
    direct = abs(np.vdot(psi, chi)) ** 2
    rule = (1 + bloch(psi) @ bloch(chi)) / 2
    print(f"|<psi|chi>|^2 = {direct:.4f}    (1 + r.s)/2 = {rule:.4f}")

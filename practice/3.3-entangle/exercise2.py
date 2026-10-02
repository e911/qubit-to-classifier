"""
title: Beat the classical limit in the CHSH game
task: For the Bell state |Φ⁺⟩, compute the correlation E(α, β) = ⟨Φ⁺|A ⊗ B|Φ⁺⟩, where A = sin α X + cos α Z measures along the angle α in the x–z plane (and B likewise for β). Then compute S = E(a, b) − E(a, b′) + E(a′, b) + E(a′, b′) for a = 0, a′ = π/2, b = π/4 and b′ = 3π/4.
hint: `np.kron(A, B)` is the two-qubit observable, and the correlation is `phi @ np.kron(A, B) @ phi` for the real state phi.
note: S = 2√2 ≈ 2.828 is above 2, the largest value that answers fixed in advance can reach.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Z = np.array([[1, 0], [0, -1]])
phi_plus = np.array([1, 0, 0, 1]) / np.sqrt(2)


def axis(angle):
    return np.sin(angle) * X + np.cos(angle) * Z


def E(alpha, beta):
    return phi_plus @ np.kron(axis(alpha), axis(beta)) @ phi_plus


a, a2, b, b2 = 0, np.pi / 2, np.pi / 4, 3 * np.pi / 4
S = E(a, b) - E(a, b2) + E(a2, b) + E(a2, b2)
print(f"E(a,b) = {E(a, b):.3f}, E(a,b') = {E(a, b2):.3f}, E(a',b) = {E(a2, b):.3f}, E(a',b') = {E(a2, b2):.3f}")
print(f"S = {S:.4f}    2*sqrt(2) = {2 * np.sqrt(2):.4f}")

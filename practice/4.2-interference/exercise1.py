"""
title: A marker that learns the path
task: Add a second qubit, the marker, that starts in |0⟩. Between H and P(φ), rotate the marker by Ry(χ), but only when the path qubit is |1⟩. For χ = 0, π/2 and π, find the largest and smallest P(0) as φ varies. Their difference is the fringe visibility V; compare it with cos(χ/2).
hint: The controlled rotation is |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ Ry(χ). P(0) for the path qubit adds the probabilities of |00⟩ and |01⟩.
note: The more the marker learns (larger χ), the smaller the fringes. At χ = π the marker records the path perfectly and the interference is gone: P(0) = 1/2 for every φ.
"""
import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
I = np.eye(2)


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def P(phi):
    return np.diag([1, np.exp(1j * phi)])


def p0(phi, chi):
    marker = np.kron(np.diag([1, 0]), I) + np.kron(np.diag([0, 1]), ry(chi))
    psi = np.kron(H @ [1, 0], [1, 0])                    # path in |+>, marker in |0>
    psi = np.kron(H, I) @ np.kron(P(phi), I) @ marker @ psi
    return abs(psi[0]) ** 2 + abs(psi[1]) ** 2           # path reads 0, any marker


for chi in [0, np.pi / 2, np.pi]:
    values = [p0(phi, chi) for phi in np.linspace(0, 2 * np.pi, 361)]
    visibility = (max(values) - min(values))
    print(f"chi = {chi:.4f}:  P(0) from {min(values):.3f} to {max(values):.3f}, "
          f"visibility {visibility:.3f}, cos(chi/2) = {np.cos(chi / 2) + 0:.3f}")

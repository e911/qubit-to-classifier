"""
title: The entangler, Ry(θ) then CNOT
task: Prepare Ry(θ)|0⟩ on q0, then apply CNOT. For θ = 0, π/6, π/3 and π/2, print the length of q0's Bloch vector and the entanglement entropy. Check that the length is |cos θ|, and that θ = π/3 gives about 0.81 bits.
hint: The state is cos(θ/2)|00⟩ + sin(θ/2)|11⟩, so you can also write it down directly instead of multiplying matrices.
"""
import numpy as np

CNOT = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]])


def ry(theta):
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.array([[c, -s], [s, c]])


def q0_length_and_entropy(psi):
    a = psi.reshape(2, 2)
    rho = a @ a.conj().T
    lam = np.linalg.eigvalsh(rho)                  # the two eigenvalues of q0's state
    entropy = -sum(x * np.log2(x) for x in lam if x > 1e-12)
    length = abs(lam[1] - lam[0])                  # Bloch length = difference of eigenvalues
    return length, entropy


for theta in [0, np.pi / 6, np.pi / 3, np.pi / 2]:
    psi = CNOT @ np.kron(ry(theta) @ [1, 0], [1, 0])
    length, S = q0_length_and_entropy(psi)
    print(f"theta = {theta:.4f}:  |r| = {length:.3f}  |cos theta| = {abs(np.cos(theta)):.3f}  S = {S + 0:.3f} bits")

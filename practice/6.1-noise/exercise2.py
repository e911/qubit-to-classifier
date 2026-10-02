"""
title: One qubit of an entangled pair is a mixture
task: For the state cos(θ/2)|00⟩ + sin(θ/2)|11⟩, compute the density matrix of q0 alone with the partial trace. Check that its Bloch vector is (0, 0, cos θ) for θ = π/3, and that the density matrix is I/2 for θ = π/2.
hint: Reshape the four amplitudes into a 2 × 2 array a[q0, q1]. Then the state of q0 is `a @ a.conj().T`: summing over q1 is the partial trace.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])

for theta in [np.pi / 3, np.pi / 2]:
    psi = np.array([np.cos(theta / 2), 0, 0, np.sin(theta / 2)])
    a = psi.reshape(2, 2)
    rho_q0 = a @ a.conj().T                         # partial trace over q1
    r = [np.trace(rho_q0 @ P).real for P in (X, Y, Z)]
    print(f"theta = {theta:.4f}: rho(q0) = {rho_q0.real.round(3).tolist()}  Bloch = {np.round(r, 3) + 0}  cos(theta) = {np.cos(theta) + 0:.3f}")

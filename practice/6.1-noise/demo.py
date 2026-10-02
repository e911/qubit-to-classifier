"""
title: Density matrices in NumPy
text: A density matrix is ρ = Σ p_{i} |ψ_{i}⟩⟨ψ_{i}|, where |ψ⟩⟨ψ| is `np.outer(psi, psi.conj())`. The code builds the two mixtures from the chapter, checks that they are the same matrix, and reads off the Bloch vector and the purity.
note: The two recipes give the identical matrix I/2, with Bloch vector 0 and purity 1/2. The pure state |+⟩ has the same diagonal but off-diagonal coherences of 1/2, Bloch vector (1, 0, 0) and purity 1.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])
s = 1 / np.sqrt(2)
ket0, ket1 = np.array([1, 0]), np.array([0, 1])
plus, minus = np.array([s, s]), np.array([s, -s])


def proj(psi):
    return np.outer(psi, psi.conj())             # |psi><psi|


def bloch(rho):
    return np.array([np.trace(rho @ P).real for P in (X, Y, Z)])


mix_z = 0.5 * proj(ket0) + 0.5 * proj(ket1)      # |0> or |1>, 50:50
mix_x = 0.5 * proj(plus) + 0.5 * proj(minus)     # |+> or |->, 50:50
print("same density matrix:", np.allclose(mix_z, mix_x))
for name, rho in [("mixture", mix_z), ("pure |+>", proj(plus))]:
    print(f"{name:9s} rho = {rho.real.round(3).tolist()}  Bloch = {bloch(rho).round(3) + 0}  purity = {np.trace(rho @ rho).real:.3f}")

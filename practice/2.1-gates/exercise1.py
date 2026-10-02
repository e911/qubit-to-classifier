"""
title: Rz and P differ by a global phase
task: Check that Rz(λ) = e^{−iλ/2} P(λ) for λ = 0.7, where P(λ) = diag(1, e^{iλ}). Then find the phase factor between S and Rz(π/2).
hint: If A = cB for a number c, then c = A[0, 0] / B[0, 0]. `np.angle(c)` gives its angle.
note: The ratio is e^{iπ/4}, a global phase. On one qubit S and Rz(π/2) are the same gate; controlled, they are not (chapter 3.2).
"""
import numpy as np


def rz(lam):
    return np.diag([np.exp(-1j * lam / 2), np.exp(1j * lam / 2)])


def p(lam):
    return np.diag([1, np.exp(1j * lam)])


lam = 0.7
print("Rz = e^(-i lam/2) P:", np.allclose(rz(lam), np.exp(-1j * lam / 2) * p(lam)))
S = p(np.pi / 2)
c = S[0, 0] / rz(np.pi / 2)[0, 0]
print("S = c Rz(pi/2) with c =", np.round(c, 4), " angle of c / pi =", np.angle(c) / np.pi)
print("check:", np.allclose(S, c * rz(np.pi / 2)))

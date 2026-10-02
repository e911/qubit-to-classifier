"""
title: Rotating, then measuring Z, is measuring along a tilted axis
task: For a random one-qubit gate U and a random state |ψ⟩, check that ⟨ψ|U†ZU|ψ⟩ = n·r, where r is the Bloch vector of |ψ⟩ and n is the Bloch vector of U†|0⟩. This is the fact behind f(x) = n·r(x).
hint: Build a random unitary as Rz(a) Ry(b) Rz(c), and reuse the `bloch` function from chapter 1.3.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])
rng = np.random.default_rng(seed=14)


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def rz(t):
    return np.diag([np.exp(-1j * t / 2), np.exp(1j * t / 2)])


def bloch(psi):
    return np.array([np.vdot(psi, P @ psi).real for P in (X, Y, Z)])


for _ in range(3):
    a, b, c = rng.uniform(0, 2 * np.pi, 3)
    U = rz(a) @ ry(b) @ rz(c)
    v = rng.normal(size=2) + 1j * rng.normal(size=2)
    psi = v / np.linalg.norm(v)
    f = np.vdot(psi, U.conj().T @ Z @ U @ psi).real
    n = bloch(U.conj().T @ np.array([1, 0]))
    print(f"<psi|U^dagger Z U|psi> = {f:+.4f}    n . r = {n @ bloch(psi):+.4f}")

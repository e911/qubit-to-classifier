"""
title: The standard gates, and identities you can check
text: Each gate is a small NumPy array, and the rotation gates are functions of an angle built from the formula R_{n}(θ) = cos(θ/2) I − i sin(θ/2) (n_{x} X + n_{y} Y + n_{z} Z), where n is the unit rotation axis. Several identities from the chapter are then checked numerically.
"""
import numpy as np

I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
S = np.diag([1, 1j])
T = np.diag([1, np.exp(1j * np.pi / 4)])


def rx(theta):
    return np.cos(theta / 2) * I - 1j * np.sin(theta / 2) * X


def ry(theta):
    return np.cos(theta / 2) * I - 1j * np.sin(theta / 2) * Y


def rz(theta):
    return np.cos(theta / 2) * I - 1j * np.sin(theta / 2) * Z


print("HZH = X:        ", np.allclose(H @ Z @ H, X))
print("T T = S:        ", np.allclose(T @ T, S))
print("S X S^dagger = Y:", np.allclose(S @ X @ S.conj().T, Y))
print("Rx(2 pi) = -I:  ", np.allclose(rx(2 * np.pi), -I))
print("Ry(pi/2)|0> =", (ry(np.pi / 2) @ [1, 0]).real.round(4), "which is |+>")

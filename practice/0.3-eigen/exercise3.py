"""
title: Pauli products
task: Check the products XY = iZ, YZ = iX and ZX = iY, and that swapping the order flips the sign (YX = −iZ). Then check that each Pauli matrix squares to the identity.
"""
import numpy as np

I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])

print("XY = iZ: ", np.allclose(X @ Y, 1j * Z))
print("YZ = iX: ", np.allclose(Y @ Z, 1j * X))
print("ZX = iY: ", np.allclose(Z @ X, 1j * Y))
print("YX = -iZ:", np.allclose(Y @ X, -1j * Z))
print("X^2 = Y^2 = Z^2 = I:", all(np.allclose(P @ P, I) for P in (X, Y, Z)))

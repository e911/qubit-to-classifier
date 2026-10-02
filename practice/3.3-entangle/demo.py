"""
title: Is it entangled, and how much?
text: Three tools from the chapter in code: the product test α₀₀α₁₁ − α₀₁α₁₀, the Bloch vector of q0 on its own, and the entanglement entropy. The Bloch vector of q0 comes from the density matrix of q0 alone, found by a partial trace (chapter 6.1), which NumPy computes in one line.
note: The product state gives 0 in the product test, and its q0 arrow has length 1. The Bell state's q0 arrow has length 0, and its entropy is a full bit. The third state is partly entangled: the test gives 1/3, the arrow is shorter than 1 but not 0, and the entropy is about half a bit.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def product_test(psi):
    a = psi.reshape(2, 2)                    # a[q0, q1]
    return a[0, 0] * a[1, 1] - a[0, 1] * a[1, 0]


def bloch_q0(psi):
    a = psi.reshape(2, 2)
    rho = a @ a.conj().T                     # the state of q0 alone
    return np.array([np.trace(rho @ P).real for P in (X, Y, Z)])


def entropy(psi):
    length = np.linalg.norm(bloch_q0(psi))
    lam = np.clip((1 + length) / 2, 1e-12, 1 - 1e-12)
    return -lam * np.log2(lam) - (1 - lam) * np.log2(1 - lam)


states = {
    "|+>|+>":              np.array([1, 1, 1, 1]) / 2,
    "Bell (|00>+|11>)/√2": np.array([1, 0, 0, 1]) / np.sqrt(2),
    "(|00>+|01>+|11>)/√3": np.array([1, 1, 0, 1]) / np.sqrt(3),
}
for name, psi in states.items():
    print(f"{name:20s} test = {product_test(psi):.3f}   |r_q0| = {np.linalg.norm(bloch_q0(psi)):.3f}   S = {entropy(psi) + 0:.3f} bits")

"""
title: Watch a barren plateau appear
text: The same experiment as the chapter's panel, in NumPy, with 10 layers. Random circuits (in every layer, Ry and Rz on every qubit, then a ladder of CZ gates) are drawn 200 times for each number of qubits. For each one, the parameter-shift rule gives the gradient of the global cost, P(all qubits read 0), with respect to the first angle, and the code prints the variance of those gradients.
note: Each added qubit divides the variance by roughly the same factor, which is exponential decay: the landscape flattens fast. The simulator stores the state as an array with one axis of length 2 per qubit, so a one-qubit gate is a single `np.tensordot`; chapter 7.8 explains this trick.
"""
import numpy as np

rng = np.random.default_rng(seed=21)


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def rz(t):
    return np.diag([np.exp(-1j * t / 2), np.exp(1j * t / 2)])


def apply(psi, U, q):
    return np.moveaxis(np.tensordot(U, psi, axes=([1], [q])), 0, q)


def cz_ladder(n):
    bits = np.indices([2] * n)                          # bits[q] = value of qubit q
    pairs = sum(bits[q] * bits[q + 1] for q in range(n - 1))
    return (-1.0) ** pairs                              # sign of every amplitude


def global_cost(angles, n, layers, ladder):
    psi = np.zeros([2] * n, dtype=complex)
    psi[(0,) * n] = 1
    k = 0
    for _ in range(layers):
        for q in range(n):
            psi = apply(psi, ry(angles[k]), q)
            psi = apply(psi, rz(angles[k + 1]), q)
            k += 2
        psi = psi * ladder
    return abs(psi[(0,) * n]) ** 2                      # P(00...0)


layers, samples = 10, 200
for n in range(2, 9):
    ladder = cz_ladder(n)
    grads = []
    for _ in range(samples):
        angles = rng.uniform(0, 2 * np.pi, 2 * n * layers)
        plus, minus = angles.copy(), angles.copy()
        plus[0] += np.pi / 2
        minus[0] -= np.pi / 2
        grads.append((global_cost(plus, n, layers, ladder) - global_cost(minus, n, layers, ladder)) / 2)
    print(f"n = {n}: variance of the gradient {np.var(grads):.2e}")

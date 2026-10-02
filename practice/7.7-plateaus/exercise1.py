"""
title: Global versus local cost in shallow circuits
task: Repeat the experiment with only 2 layers, and measure two costs: the global cost P(all qubits read 0) and the local cost, the average over the qubits of P(that qubit reads 0). For n = 2 to 8, print the variance of the gradient of each.
hint: From the probabilities p = |ψ|², P(qubit q reads 0) is `p.take(0, axis=q).sum()`.
note: In this shallow circuit the global cost's variance still shrinks by a large factor with every qubit, while the local cost's variance shrinks only slowly. Choosing local costs is one of the remedies in the chapter's table.
"""
import numpy as np

rng = np.random.default_rng(seed=23)


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def rz(t):
    return np.diag([np.exp(-1j * t / 2), np.exp(1j * t / 2)])


def apply(psi, U, q):
    return np.moveaxis(np.tensordot(U, psi, axes=([1], [q])), 0, q)


def costs(angles, n, layers, ladder):
    psi = np.zeros([2] * n, dtype=complex)
    psi[(0,) * n] = 1
    k = 0
    for _ in range(layers):
        for q in range(n):
            psi = apply(psi, ry(angles[k]), q)
            psi = apply(psi, rz(angles[k + 1]), q)
            k += 2
        psi = psi * ladder
    p = np.abs(psi) ** 2
    global_cost = p[(0,) * n]
    local_cost = np.mean([p.take(0, axis=q).sum() for q in range(n)])
    return np.array([global_cost, local_cost])


layers, samples = 2, 200
for n in range(2, 9):
    bits = np.indices([2] * n)
    ladder = (-1.0) ** sum(bits[q] * bits[q + 1] for q in range(n - 1))
    grads = []
    for _ in range(samples):
        angles = rng.uniform(0, 2 * np.pi, 2 * n * layers)
        plus, minus = angles.copy(), angles.copy()
        plus[0] += np.pi / 2
        minus[0] -= np.pi / 2
        grads.append((costs(plus, n, layers, ladder) - costs(minus, n, layers, ladder)) / 2)
    var_global, var_local = np.var(grads, axis=0)
    print(f"n = {n}: variance of the gradient, global cost {var_global:.2e}   local cost {var_local:.2e}")

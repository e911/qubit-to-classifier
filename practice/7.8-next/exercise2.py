"""
title: Measurement with collapse
task: Write `measure(psi, q, n, rng)`, which measures qubit q: it picks 0 or 1 with the Born-rule probability, sets every amplitude that disagrees to zero, renormalizes, and returns the outcome and the new state. Make a Bell pair, measure q0 and then q1, and repeat 1,000 times. How often do the two results agree?
hint: Reshape the state to n axes; `psi.take(1, axis=q)` is the part where qubit q is 1, so P(1) is the sum of its squared magnitudes.
note: The two bits agree every time, and each value appears about half the time: the perfect correlation of the Bell state, now produced by your own simulator.
"""
import numpy as np


def zero_state(n):
    psi = np.zeros(2 ** n, dtype=complex)
    psi[0] = 1.0
    return psi


def apply_1q(psi, U, q, n):
    psi = psi.reshape([2] * n)
    psi = np.tensordot(U, psi, axes=([1], [q]))
    psi = np.moveaxis(psi, 0, q)
    return psi.reshape(-1)


def apply_cx(psi, c, t, n):
    psi = psi.reshape([2] * n).copy()
    idx = [slice(None)] * n
    idx[c] = 1
    t_axis = t if t < c else t - 1
    psi[tuple(idx)] = np.flip(psi[tuple(idx)], axis=t_axis)
    return psi.reshape(-1)


def measure(psi, q, n, rng):
    psi = psi.reshape([2] * n).copy()
    p1 = np.sum(np.abs(psi.take(1, axis=q)) ** 2)
    outcome = int(rng.random() < p1)
    idx = [slice(None)] * n
    idx[q] = 1 - outcome
    psi[tuple(idx)] = 0                              # remove the branch that did not happen
    psi = psi.reshape(-1)
    return outcome, psi / np.linalg.norm(psi)


H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
rng = np.random.default_rng(seed=25)
agree, ones = 0, 0
for _ in range(1000):
    psi = apply_cx(apply_1q(zero_state(2), H, 0, 2), 0, 1, 2)     # Bell pair
    m0, psi = measure(psi, 0, 2, rng)
    m1, psi = measure(psi, 1, 2, rng)
    agree += m0 == m1
    ones += m0
print(f"results agreed in {agree} of 1000 runs; q0 read 1 in {ones} runs")

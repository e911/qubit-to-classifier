"""
heading: Extend the simulator
intro: Each exercise adds a feature to the NumPy simulator above. The solutions repeat the functions they need, so every one runs on its own.
title: Any controlled gate
task: Write `apply_controlled(psi, U, c, t, n)`, which applies the one-qubit gate U to qubit t only in the part of the state where qubit c is 1. Check that it agrees with `apply_cx` when U = X, then use it to apply a controlled-H to |+⟩|0⟩.
hint: Copy the idea of `apply_cx`: select the slice where the control is 1 with `idx[c] = 1`, and apply U along the target's axis inside that slice with `np.tensordot`. Remember that the target's axis number drops by one when t > c.
note: Controlled-H on |+⟩|0⟩ leaves the |0⟩ branch alone and turns the |1⟩ branch into |1⟩|+⟩, so the amplitudes are 1/√2, 0, 1/2 and 1/2.
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


def apply_controlled(psi, U, c, t, n):
    psi = psi.reshape([2] * n).copy()
    idx = [slice(None)] * n
    idx[c] = 1                                       # the part where the control is 1
    t_axis = t if t < c else t - 1                   # axis c is gone from that slice
    block = np.tensordot(U, psi[tuple(idx)], axes=([1], [t_axis]))
    psi[tuple(idx)] = np.moveaxis(block, 0, t_axis)
    return psi.reshape(-1)


X = np.array([[0, 1], [1, 0]])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
rng = np.random.default_rng(seed=24)
v = rng.normal(size=8) + 1j * rng.normal(size=8)
v /= np.linalg.norm(v)
same = all(np.allclose(apply_controlled(v, X, c, t, 3), apply_cx(v, c, t, 3))
           for c in range(3) for t in range(3) if c != t)
print("agrees with apply_cx for every control and target:", same)

psi = apply_1q(zero_state(2), H, 0, 2)               # |+>|0>
print("controlled-H on |+>|0>:", apply_controlled(psi, H, 0, 1, 2).real.round(4))

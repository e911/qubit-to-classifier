"""
title: What H and S can reach, and what H and T can reach
task: Starting from |0⟩, apply every sequence of up to 12 gates chosen from {H, S}, and count the different states you reach (ignoring global phase). Then do the same with {H, T}. Why does the first count stop growing?
hint: Represent a state by its Bloch vector rounded to 6 decimals, which ignores the global phase, and collect them in a Python set. Grow the set one gate at a time instead of listing every sequence.
note: H and S reach only the six landmark states, because every product of H and S belongs to a finite group, the single-qubit Clifford group (24 rotations of the sphere, ignoring global phase). With T the count keeps growing, and the states spread over the whole sphere: that is why T makes {H, T, CNOT} universal.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
S = np.diag([1, 1j])
T = np.diag([1, np.exp(1j * np.pi / 4)])


def key(psi):
    r = [np.vdot(psi, P @ psi).real for P in (X, Y, Z)]
    return tuple(np.round(r, 6) + 0)


for name, gates in [("H and S", [H, S]), ("H and T", [H, T])]:
    frontier = {key(np.array([1, 0])): np.array([1, 0], dtype=complex)}
    seen = dict(frontier)
    counts = []
    for length in range(1, 13):
        new = {}
        for psi in frontier.values():
            for g in gates:
                out = g @ psi
                k = key(out)
                if k not in seen:
                    new[k] = out
        seen.update(new)
        frontier = new
        counts.append(len(seen))
    print(f"{name}: states reached with up to 1, 2, ..., 12 gates: {counts}")

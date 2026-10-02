"""
title: From amplitudes to a point on the sphere
text: The Bloch vector is (⟨X⟩, ⟨Y⟩, ⟨Z⟩), so one short function finds it for any state. Here it places the six landmark states.
note: Each state lands on the axis given in the chapter's table: |0⟩ and |1⟩ at the poles, |±⟩ on the x axis and |±i⟩ on the y axis.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def bloch(psi):
    """The Bloch vector (<X>, <Y>, <Z>) of a one-qubit state."""
    return np.array([np.vdot(psi, P @ psi).real for P in (X, Y, Z)])


s = 1 / np.sqrt(2)
landmarks = {"|0>": [1, 0], "|1>": [0, 1], "|+>": [s, s], "|->": [s, -s], "|+i>": [s, 1j * s], "|-i>": [s, -1j * s]}
for name, amps in landmarks.items():
    print(f"{name:5s} ->", bloch(np.array(amps)).round(3) + 0)

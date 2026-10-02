"""
title: Expectation values
task: For |ψ⟩ = √0.8|0⟩ + √0.2|1⟩, compute ⟨ψ|X|ψ⟩, ⟨ψ|Y|ψ⟩ and ⟨ψ|Z|ψ⟩. Check that ⟨Z⟩ equals P(0) − P(1).
hint: ⟨ψ|A|ψ⟩ is `np.vdot(psi, A @ psi)`. For a Hermitian A the result is real, so keep `.real`.
note: These three numbers are the coordinates of the state's point on the Bloch sphere, the subject of chapter 1.3.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])
psi = np.array([np.sqrt(0.8), np.sqrt(0.2)])

for name, A in [("X", X), ("Y", Y), ("Z", Z)]:
    value = np.vdot(psi, A @ psi).real
    print(f"<{name}> = {value + 0:.3f}")
p0, p1 = np.abs(psi) ** 2
print(f"P(0) - P(1) = {p0 - p1:.3f}")

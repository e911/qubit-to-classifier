"""
title: Noise channels with Kraus operators
task: Write `apply_channel(rho, kraus)`, which returns Σ K ρ K†. Apply a phase flip with p = 0.1 to |+⟩ ten times, and amplitude damping with γ = 0.3 to |+⟩ ten times, printing the Bloch vector every few steps. Where does each channel push the state?
hint: Phase flip: K₀ = √(1 − p) I, K₁ = √p Z. Amplitude damping: K₀ = diag(1, √(1 − γ)), K₁ = [[0, √γ], [0, 0]].
note: The phase flip shrinks x toward 0 by a factor (1 − 2p) = 0.8 each time and leaves z alone: |+⟩ fades into the maximally mixed state. Amplitude damping pulls every state toward |0⟩, the north pole.
"""
import numpy as np

I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def apply_channel(rho, kraus):
    return sum(K @ rho @ K.conj().T for K in kraus)


def bloch(rho):
    return np.array([np.trace(rho @ P).real for P in (X, Y, Z)])


p, g = 0.1, 0.3
phase_flip = [np.sqrt(1 - p) * I, np.sqrt(p) * Z]
damping = [np.diag([1, np.sqrt(1 - g)]), np.array([[0, np.sqrt(g)], [0, 0]])]
plus = np.array([1, 1]) / np.sqrt(2)

for name, kraus in [("phase flip", phase_flip), ("amplitude damping", damping)]:
    rho = np.outer(plus, plus)
    print(name)
    for step in range(1, 11):
        rho = apply_channel(rho, kraus)
        if step in (1, 2, 5, 10):
            print(f"   after step {step:2d}: Bloch vector {bloch(rho).round(3) + 0}")

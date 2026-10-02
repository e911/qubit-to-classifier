"""
title: Angle encoding and amplitude encoding
text: Angle encoding turns the point (x₁, x₂) into the angles θ = π(x₁ + 1)/2 and φ = πx₂ and prepares Ry(θ), then Rz(φ), on |0⟩. Amplitude encoding divides a list of four numbers by its length and uses them as the amplitudes of two qubits.
note: The point (0.5, −0.5) lands at (0, −0.707, −0.707) with P(0) ≈ 0.15, as in the worked example. Amplitude encoding keeps the direction of the list but loses its length, 0.995.
"""
import numpy as np

X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def rz(t):
    return np.diag([np.exp(-1j * t / 2), np.exp(1j * t / 2)])


def angle_encode(x1, x2):
    theta, phi = np.pi * (x1 + 1) / 2, np.pi * x2
    return rz(phi) @ ry(theta) @ np.array([1, 0])


for point in [(-1, 0), (0.5, -0.5), (1, 0.25)]:
    psi = angle_encode(*point)
    r = np.array([np.vdot(psi, P @ psi).real for P in (X, Y, Z)])
    print(f"x = {point}:  Bloch vector {r.round(3) + 0}   P(0) = {abs(psi[0]) ** 2:.3f}")

x = np.array([0.8, -0.3, 0.5, 0.1])
print("amplitude encoding of", x, "->", (x / np.linalg.norm(x)).round(3), " original length (discarded):", np.linalg.norm(x).round(3))

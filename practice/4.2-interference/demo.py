"""
title: Adding up paths, and why it equals matrix multiplication
text: For the circuit H, P(φ), H on |0⟩, the code adds up the amplitude of every path that ends at each result (Feynman's rule) and compares the answer with plain matrix multiplication.
note: The two methods agree, and P(0) = cos²(φ/2): certain at φ = 0, a coin flip at φ = π/2, and impossible at φ = π.
"""
import itertools

import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)


def P(phi):
    return np.diag([1, np.exp(1j * phi)])


for phi in [0, np.pi / 2, np.pi]:
    gates = [H, P(phi), H]                     # in the order they are applied
    by_paths = np.zeros(2, dtype=complex)
    for path in itertools.product([0, 1], repeat=3):     # the state after each gate
        amp, prev = 1, 0                                  # every path starts in |0>
        for gate, now in zip(gates, path):
            amp *= gate[now, prev]                        # amplitude to go from prev to now
            prev = now
        by_paths[path[-1]] += amp
    by_matrices = H @ P(phi) @ H @ np.array([1, 0])
    print(f"phi = {phi:.4f}:  P(0) by paths = {abs(by_paths[0]) ** 2:.4f}, "
          f"by matrices = {abs(by_matrices[0]) ** 2:.4f}, cos^2(phi/2) = {np.cos(phi / 2) ** 2:.4f}")

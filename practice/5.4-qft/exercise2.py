"""
title: Phase estimation, outcome by outcome
task: After the kickback steps, the t counting qubits of phase estimation hold (1/√M) Σ_{k} e^{2πiφk}|k⟩, with M = 2^{t}. Apply the inverse QFT and find the probability of every t-bit outcome, for φ = 0.375 with t = 3 and for φ = 0.3 with t = 3, 5 and 7. Print the most likely outcome as a fraction and its probability.
hint: The inverse QFT is the conjugate transpose of the QFT matrix. Apply it and square the amplitudes.
note: φ = 0.375 = 0.011 in binary is exact with three bits, so it comes out with certainty. For φ = 0.3 the nearest t-bit fraction wins with probability above 4/π² ≈ 0.405, and more counting qubits give a sharper estimate.
"""
import numpy as np


def qft(M):
    j, k = np.meshgrid(np.arange(M), np.arange(M))
    return np.exp(2j * np.pi * j * k / M) / np.sqrt(M)


for phi, t in [(0.375, 3), (0.3, 3), (0.3, 5), (0.3, 7)]:
    M = 2 ** t
    register = np.exp(2j * np.pi * phi * np.arange(M)) / np.sqrt(M)   # after the kickbacks
    probs = np.abs(qft(M).conj().T @ register) ** 2                    # inverse QFT, then measure
    best = np.argmax(probs)
    print(f"phi = {phi}, t = {t}: most likely {best:0{t}b} = {best}/{M} = {best / M:.4f} with probability {probs[best]:.3f}")

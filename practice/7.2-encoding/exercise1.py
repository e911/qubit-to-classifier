"""
title: Re-uploading adds frequencies
task: Build the one-qubit model f(x) = ⟨Z⟩ for W_{L} Rx(x) ⋯ W_{1} Rx(x) W_{0}|0⟩, where the W are fixed random one-qubit gates and x is encoded L times. Sample f at 64 equally spaced values of x from 0 up to, but not including, 2π (`endpoint=False` in `np.linspace`), take the Fourier transform with `np.fft.rfft`, and print the size of the first six coefficients for L = 1, 2 and 3.
hint: A random one-qubit gate can be Rz(a) Ry(b) Rz(c) with random angles. Divide the FFT by the number of samples to get the coefficients.
note: With L encoding gates, every coefficient above frequency L is zero (up to rounding). Each extra upload adds one more frequency, exactly as the chapter says.
"""
import numpy as np

rng = np.random.default_rng(seed=13)
X = np.array([[0, 1], [1, 0]])


def rx(t):
    return np.cos(t / 2) * np.eye(2) - 1j * np.sin(t / 2) * X


def ry(t):
    return np.array([[np.cos(t / 2), -np.sin(t / 2)], [np.sin(t / 2), np.cos(t / 2)]])


def rz(t):
    return np.diag([np.exp(-1j * t / 2), np.exp(1j * t / 2)])


def random_gate():
    a, b, c = rng.uniform(0, 2 * np.pi, 3)
    return rz(a) @ ry(b) @ rz(c)


xs = np.linspace(0, 2 * np.pi, 64, endpoint=False)
for L in [1, 2, 3]:
    W = [random_gate() for _ in range(L + 1)]
    f = []
    for x in xs:
        psi = W[0] @ np.array([1, 0])
        for k in range(1, L + 1):
            psi = W[k] @ rx(x) @ psi
        f.append(abs(psi[0]) ** 2 - abs(psi[1]) ** 2)          # <Z>
    coeffs = np.abs(np.fft.rfft(f)) / len(xs)
    print(f"L = {L}: |c_k| for k = 0..5:", coeffs[:6].round(3))

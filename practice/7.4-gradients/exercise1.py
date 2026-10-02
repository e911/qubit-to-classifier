"""
title: Parameter shift versus finite differences, with shot noise
task: On hardware every f is estimated from N shots. At θ = −1.4, estimate the gradient 300 times over, with N = 1,000 shots per evaluation, once with the parameter-shift rule and once with a finite difference of step h = 0.01. Compare the spread (standard deviation) of the two estimators.
hint: With P(0) = (1 + f)/2, the number of 0 outcomes in N shots is `rng.binomial(N, (1 + f) / 2)`, and the estimate of f is 2 × count/N − 1.
note: The finite difference divides the shot noise by 2h = 0.02 instead of by 2, so its spread is more than a hundred times larger, far bigger than the gradient itself.
"""
import numpy as np

rng = np.random.default_rng(seed=16)
I = np.eye(2)
X = np.array([[0, 1], [1, 0]])
Y = np.array([[0, -1j], [1j, 0]])
Z = np.array([[1, 0], [0, -1]])


def rot(P, t):
    return np.cos(t / 2) * I - 1j * np.sin(t / 2) * P


def f(theta):
    psi = rot(X, theta) @ rot(Z, 0.7) @ rot(Y, 0.9) @ np.array([1, 0])
    return np.vdot(psi, Z @ psi).real


def f_shots(theta, N):
    zeros = rng.binomial(N, (1 + f(theta)) / 2)
    return 2 * zeros / N - 1


theta, N, h = -1.4, 1000, 0.01
true = (f(theta + np.pi / 2) - f(theta - np.pi / 2)) / 2
shift = [(f_shots(theta + np.pi / 2, N) - f_shots(theta - np.pi / 2, N)) / 2 for _ in range(300)]
finite = [(f_shots(theta + h, N) - f_shots(theta - h, N)) / (2 * h) for _ in range(300)]
print(f"true gradient {true:+.3f}")
print(f"parameter shift:   mean {np.mean(shift):+.3f}   spread {np.std(shift):.3f}")
print(f"finite difference: mean {np.mean(finite):+.3f}   spread {np.std(finite):.3f}")

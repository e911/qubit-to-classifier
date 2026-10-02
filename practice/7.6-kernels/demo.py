"""
title: A quantum kernel and a kernel model
text: The kernel of the chapter's one-dimensional panel: x is encoded as Ry(cπx)|0⟩ on each of two qubits, and k(x, x′) = |⟨φ(x)|φ(x′)⟩|². The code checks the closed form cos²(cπ(x − x′)/2) per qubit, then fits a kernel model f(x) = Σ αᵢ k(x, xᵢ) by kernel ridge regression, solving (K + λI)α = y.
note: Every training point is classified correctly, and the model is right on almost all of the interval; the only errors sit right next to the class boundaries at |x| = 0.45. Only the weights α were trained; the circuit just measures similarity.
"""
import numpy as np

rng = np.random.default_rng(seed=18)
c, copies, lam = 0.6, 2, 0.01


def encode(x):
    one = np.array([np.cos(c * np.pi * x / 2), np.sin(c * np.pi * x / 2)])   # Ry(c pi x)|0>
    psi = np.array([1.0])
    for _ in range(copies):
        psi = np.kron(psi, one)
    return psi


def kernel(a, b):
    return abs(np.vdot(encode(a), encode(b))) ** 2


print("k(0.2, -0.5) from the states:", round(kernel(0.2, -0.5), 6),
      "  closed form:", round(np.cos(c * np.pi * 0.7 / 2) ** (2 * copies), 6))

x_train = np.linspace(-0.95, 0.95, 14) + rng.uniform(-0.04, 0.04, 14)
y_train = np.where(np.abs(x_train) < 0.45, 1.0, -1.0)            # +1 blue, -1 red
K = np.array([[kernel(a, b) for b in x_train] for a in x_train])
alpha = np.linalg.solve(K + lam * np.eye(len(K)), y_train)


def model(x):
    return sum(a * kernel(x, xi) for a, xi in zip(alpha, x_train))


train_ok = np.mean(np.sign([model(x) for x in x_train]) == y_train)
grid = np.linspace(-1, 1, 201)
grid_ok = np.mean(np.sign([model(x) for x in grid]) == np.where(np.abs(grid) < 0.45, 1, -1))
print(f"training points correct: {train_ok:.0%}    accuracy on the whole interval: {grid_ok:.0%}")

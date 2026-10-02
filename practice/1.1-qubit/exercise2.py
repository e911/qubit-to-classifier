"""
title: A superposition is not a hidden coin
task: Simulate 1,000 runs of "apply H, then measure" for two preparations: the state |+⟩, and a hidden coin that is |0⟩ or |1⟩ with probability 1/2 each. Count how often each one gives 0.
hint: For the hidden coin, choose |0⟩ or |1⟩ at random in every run, apply H, then measure with the Born rule.
starter:
    import numpy as np

    rng = np.random.default_rng(seed=3)
    H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
    ket0, ket1 = np.array([1, 0]), np.array([0, 1])

    def measure(psi):
        p = np.abs(psi) ** 2
        return rng.choice([0, 1], p=p / p.sum())

    # your code: 1,000 runs for |+>, then 1,000 runs for the hidden coin
"""
import numpy as np

rng = np.random.default_rng(seed=3)
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
ket0, ket1 = np.array([1, 0]), np.array([0, 1])
plus = H @ ket0


def measure(psi):
    p = np.abs(psi) ** 2
    return rng.choice([0, 1], p=p / p.sum())


zeros_plus = sum(measure(H @ plus) == 0 for _ in range(1000))
zeros_coin = 0
for _ in range(1000):
    hidden = ket0 if rng.random() < 0.5 else ket1
    zeros_coin += measure(H @ hidden) == 0

print("|+>, then H:         ", zeros_plus, "zeros out of 1000")
print("hidden coin, then H: ", zeros_coin, "zeros out of 1000")

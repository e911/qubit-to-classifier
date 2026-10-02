"""
title: Kernel width: underfitting and memorizing
task: Take 30 training points between −1 and 1, blue for |x| < 0.45 and red otherwise, and flip each label with probability 0.15 to imitate noisy data. Train the kernel model with c = 0.6 and λ = 0.1 while encoding x on 1, 4, 16, 64 and 256 qubits (copies), which makes the kernel narrower and narrower. Print the accuracy on the noisy training labels and on the true labels of 401 fresh points.
hint: With m copies the kernel is cos^{2m}(cπ(x − x′)/2), so you never need to build the 2^{m}-dimensional states.
note: One copy gives a wide, smooth kernel that underfits. Around 16 copies the model ignores the flipped labels and gets 399 of the 401 fresh points right; the two it misses sit exactly on the class boundary, x = ±0.45. With 256 copies the kernel is so narrow that the model memorizes the training points, including the wrong labels, and does worse on new data: the training accuracy goes up while the test accuracy goes down.
"""
import numpy as np

rng = np.random.default_rng(seed=22)
x_train = rng.uniform(-1, 1, 30)
y_clean = np.where(np.abs(x_train) < 0.45, 1.0, -1.0)
flipped = rng.random(30) < 0.15
y_train = np.where(flipped, -y_clean, y_clean)               # noisy labels
grid = np.linspace(-1, 1, 401)
y_grid = np.where(np.abs(grid) < 0.45, 1.0, -1.0)
print("labels flipped:", flipped.sum(), "of 30")

c, lam = 0.6, 0.1
for copies in [1, 4, 16, 64, 256]:
    def k(a, b):
        return np.cos(c * np.pi * (a - b) / 2) ** (2 * copies)
    K = k(x_train[:, None], x_train[None, :])
    alpha = np.linalg.solve(K + lam * np.eye(30), y_train)

    def f(x):
        return k(np.asarray(x)[:, None], x_train[None, :]) @ alpha
    train = np.mean(np.sign(f(x_train)) == y_train)
    test = np.mean(np.sign(f(grid)) == y_grid)
    print(f"{copies:3d} cop{'y  ' if copies == 1 else 'ies'}: training accuracy {train:.0%}   accuracy on fresh points {test:.1%}")

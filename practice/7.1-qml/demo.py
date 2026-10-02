"""
title: Logistic regression, trained by gradient descent
text: The classical classifier from this chapter, written out in NumPy: p(red) = σ(w·x + b), the cross-entropy loss, its gradient, and the update θ ← θ − η∇L. The data are two clusters, with separate training and test points.
note: The loss falls step by step and the accuracy on the held-back test points follows the training accuracy, so the model is not overfitting. The gradient formulas are the standard ones for this model: ∂L/∂w = average of (p − y)x, and ∂L/∂b = average of (p − y).
"""
import numpy as np

rng = np.random.default_rng(seed=11)


def make_clusters(n):
    y = np.arange(n) % 2                                   # alternate blue (0) and red (1)
    centres = np.where(y[:, None] == 1, [0.45, -0.35], [-0.40, 0.40])
    return centres + 0.28 * rng.normal(size=(n, 2)), y


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


X_train, y_train = make_clusters(60)
X_test, y_test = make_clusters(60)
w, b, lr = np.zeros(2), 0.0, 0.5

for step in range(201):
    p = sigmoid(X_train @ w + b)                           # p(red) for every training point
    loss = -np.mean(y_train * np.log(p) + (1 - y_train) * np.log(1 - p))
    if step % 40 == 0:
        train_acc = np.mean((p > 0.5) == y_train)
        test_acc = np.mean((sigmoid(X_test @ w + b) > 0.5) == y_test)
        print(f"step {step:3d}: loss {loss:.3f}   train accuracy {train_acc:.0%}   test accuracy {test_acc:.0%}")
    grad_w = X_train.T @ (p - y_train) / len(y_train)
    grad_b = np.mean(p - y_train)
    w, b = w - lr * grad_w, b - lr * grad_b

print("weights", w.round(2), " bias", round(b, 2))

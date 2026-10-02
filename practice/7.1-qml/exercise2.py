"""
title: Features decide what a model can learn
task: Make the circle dataset: points spread over the square [−1, 1]², red inside the circle x₁² + x₂² < 0.56 and blue outside. Train logistic regression twice, once on the features (x₁, x₂) and once on (x₁, x₂, x₁², x₂²), and compare the test accuracies.
hint: Reuse the training loop from the example with a feature matrix built by `np.column_stack`. Train for a few thousand steps with η = 1.
note: With x₁ and x₂ alone the boundary is a straight line, and the model can do little better than guessing the most common class. With the squared features the boundary can be a circle. In a quantum model, the encoding plays the role of these features.
"""
import numpy as np

rng = np.random.default_rng(seed=12)


def make_circle(n):
    X = rng.uniform(-1, 1, size=(n, 2))
    return X, (np.sum(X ** 2, axis=1) < 0.56).astype(float)


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


def train_and_test(features, steps=3000, lr=1.0):
    F_train, F_test = features(X_train), features(X_test)
    w, b = np.zeros(F_train.shape[1]), 0.0
    for _ in range(steps):
        p = sigmoid(F_train @ w + b)
        w -= lr * F_train.T @ (p - y_train) / len(y_train)
        b -= lr * np.mean(p - y_train)
    return np.mean((sigmoid(F_test @ w + b) > 0.5) == y_test)


X_train, y_train = make_circle(200)
X_test, y_test = make_circle(200)
print(f"share of red points in the test set: {y_test.mean():.0%}")
print(f"features x1, x2:             test accuracy {train_and_test(lambda X: X):.0%}")
print(f"features x1, x2, x1^2, x2^2: test accuracy {train_and_test(lambda X: np.column_stack([X, X ** 2])):.0%}")

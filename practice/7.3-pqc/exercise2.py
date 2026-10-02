"""
title: Why XOR is out of reach
task: Encode the four XOR corners (±0.5, ±0.5) with the angle encoding of chapter 7.2: red where x₁ and x₂ have the same sign, blue otherwise. Try 10,000 random measurement axes n with the prediction "blue if n·r > 0". What is the best accuracy any axis reaches?
hint: The two red corners land at opposite points of the sphere, and so do the two blue ones.
note: Every axis gets exactly two of the four corners right. Because n·(−r) = −n·r, a plane through the centre always puts opposite points on opposite sides, so it can never put both red corners on the red side.
"""
import numpy as np

rng = np.random.default_rng(seed=15)


def encode(x1, x2):
    theta, phi = np.pi * (x1 + 1) / 2, np.pi * x2
    return np.array([np.sin(theta) * np.cos(phi), np.sin(theta) * np.sin(phi), np.cos(theta)])


corners = [(-0.5, -0.5), (0.5, 0.5), (-0.5, 0.5), (0.5, -0.5)]
labels = np.array([1, 1, 0, 0])                    # red (1) when the signs agree
R = np.array([encode(*c) for c in corners])
print("encoded corners:\n", R.round(3) + 0)

best = 0
for _ in range(10_000):
    n = rng.normal(size=3)
    predictions = (R @ n < 0).astype(int)          # f = n.r < 0 means red
    best = max(best, np.mean(predictions == labels))
print(f"best accuracy over 10,000 axes: {best:.0%}")

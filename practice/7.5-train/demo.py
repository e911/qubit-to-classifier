"""
title: The training loop of chapter 7.5, in code
text: The seven points and the model f(x; θ) = cos(x + θ) from the "One step, every number" panel. Each step does a forward pass, computes the cross-entropy, gets ∂f/∂θ with the parameter-shift rule, multiplies by ∂L/∂f, and updates θ with η = 0.6.
note: The first step takes θ from 0 to 0.662, as in the panel, and θ settles near 1.279, which puts the boundary at x = π/2 − θ ≈ 0.29, between the last blue point and the first red one.
"""
import numpy as np

xs = np.array([-1.4, -0.9, -0.4, 0.1, 0.6, 1.0, 1.4])
ys = np.array([0, 0, 0, 0, 1, 1, 1])           # 0 = blue, 1 = red


def f(x, theta):
    return np.cos(x + theta)                    # <Z> after Ry(x), then Ry(theta)


def loss_and_grad(theta):
    fx = f(xs, theta)
    p = (1 - fx) / 2                            # p(red)
    loss = -np.mean(ys * np.log(p) + (1 - ys) * np.log(1 - p))
    df = (f(xs, theta + np.pi / 2) - f(xs, theta - np.pi / 2)) / 2     # parameter shift
    dL_df = (ys / p - (1 - ys) / (1 - p)) / 2                           # from the loss formula
    return loss, np.mean(dL_df * df)


theta, eta = 0.0, 0.6
for step in range(41):
    loss, grad = loss_and_grad(theta)
    if step in (0, 1, 2, 5, 10, 20, 40):
        accuracy = np.mean((f(xs, theta) < 0) == ys)
        print(f"step {step:2d}: theta = {theta:.3f}  loss = {loss:.4f}  gradient = {round(grad, 4) + 0:+.4f}  accuracy {accuracy:.0%}")
    theta -= eta * grad
print(f"boundary at x = pi/2 - theta = {np.pi / 2 - theta:.3f}")

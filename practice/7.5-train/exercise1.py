"""
title: Train a classifier with a trainable weight
task: Points x between −1 and 1 are blue when |x| < 0.5 and red otherwise. Train the model f = ⟨Z⟩ after Ry(w·x + b)|0⟩, which is cos(wx + b), starting from w = 1 and b = 0. Use the parameter-shift rule with the chain rule for both w and b, the cross-entropy loss, and plain gradient descent. Print the loss and accuracy as training goes, and the final w and b.
hint: ∂f/∂(angle) comes from the shift rule; then ∂f/∂b = ∂f/∂(angle) and ∂f/∂w = x · ∂f/∂(angle). Average ∂L/∂f × ∂f/∂w over the points to get the gradient for w.
note: Training moves w from 1 to about 3.4 and b to about −0.1, close to the ideal w = π, b = 0, for which cos(πx) changes sign exactly at |x| = 0.5. The trainable weight rescales the encoding, the same trick as the trainable data scaling in the chapter's classifier. The few remaining errors are points very close to the boundary.
"""
import numpy as np

rng = np.random.default_rng(seed=17)
xs = rng.uniform(-1, 1, 60)
ys = (np.abs(xs) >= 0.5).astype(float)          # 1 = red, 0 = blue


def f(angle):
    return np.cos(angle)                         # <Z> after Ry(angle)|0>


w, b, eta = 1.0, 0.0, 0.5
for step in range(301):
    angle = w * xs + b
    fx = f(angle)
    p = np.clip((1 - fx) / 2, 1e-9, 1 - 1e-9)    # p(red)
    loss = -np.mean(ys * np.log(p) + (1 - ys) * np.log(1 - p))
    d_angle = (f(angle + np.pi / 2) - f(angle - np.pi / 2)) / 2     # parameter shift
    dL_df = (ys / p - (1 - ys) / (1 - p)) / 2
    grad_w = np.mean(dL_df * d_angle * xs)
    grad_b = np.mean(dL_df * d_angle)
    if step % 60 == 0:
        print(f"step {step:3d}: loss {loss:.3f}  accuracy {np.mean((fx < 0) == ys):.0%}  w = {w:.3f}  b = {b:+.3f}")
    w, b = w - eta * grad_w, b - eta * grad_b
print(f"final model: f = cos({w:.3f} x {'+' if b >= 0 else '-'} {abs(b):.3f}),  compare with pi = {np.pi:.3f}")

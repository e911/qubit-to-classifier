"""
title: The chain rule for data-dependent angles
task: In a classifier the angle is often w·x + b. For the model f = ⟨Z⟩ after Ry(w·x + b)|0⟩, with x = 0.8, w = 1.3 and b = 0.3, compute ∂f/∂w and ∂f/∂b with the parameter-shift rule and the chain rule, and check them against finite differences.
hint: Shift the whole angle by ±π/2 to get ∂f/∂(angle). Then ∂f/∂b is that number, and ∂f/∂w is x times it.
"""
import numpy as np


def f_of_angle(a):
    return np.cos(a)                          # <Z> after Ry(a)|0>


x, w, b = 0.8, 1.3, 0.3
angle = w * x + b
d_angle = (f_of_angle(angle + np.pi / 2) - f_of_angle(angle - np.pi / 2)) / 2
df_dw, df_db = x * d_angle, d_angle

eps = 1e-6
num_dw = (f_of_angle((w + eps) * x + b) - f_of_angle((w - eps) * x + b)) / (2 * eps)
num_db = (f_of_angle(w * x + b + eps) - f_of_angle(w * x + b - eps)) / (2 * eps)
print(f"df/dw: chain rule {df_dw:+.6f}   finite difference {num_dw:+.6f}")
print(f"df/db: chain rule {df_db:+.6f}   finite difference {num_db:+.6f}")

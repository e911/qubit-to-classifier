"""
title: Gradient descent by hand, then by computer
task: Minimize L(θ) = (θ − 3)² by gradient descent, starting at θ = 0 with η = 0.1. Print θ after each of the first eight steps and check the chapter's numbers 0.6, 1.08 and 1.464. What fraction of the remaining distance to 3 does each step remove?
hint: The gradient is dL/dθ = 2(θ − 3), and one step is `theta = theta - eta * grad`.
note: Each step multiplies the distance to the minimum by 1 − 2η = 0.8, so it removes 20% of it. With η = 1 the factor would be −1 and θ would jump back and forth forever; with η above 1 it would run away.
"""
theta, eta = 0.0, 0.1
for step in range(1, 9):
    grad = 2 * (theta - 3)
    theta = theta - eta * grad
    print(f"step {step}: theta = {theta:.4f}   distance to 3 = {3 - theta:.4f}")

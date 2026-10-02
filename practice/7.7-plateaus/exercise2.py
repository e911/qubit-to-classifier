"""
title: How many shots would a gradient need?
task: The example measured these gradient variances for 10-layer circuits of 2 to 8 qubits. Fit a straight line to log(variance) against n, extrapolate to 20, 30 and 50 qubits, and estimate the shots needed per evaluation as roughly 1/variance, since a gradient of typical size g = √variance needs about 1/g² shots to stand out from the noise.
hint: `np.polyfit(n, np.log(variance), 1)` fits the line. Its slope is minus the logarithm of the factor by which the variance shrinks per qubit, so that factor is e^{−slope}.
note: The fitted factor is close to 4 per qubit. At 50 qubits a single gradient component would need more shots than any machine could ever run: that is the barren plateau as a practical wall.
"""
import numpy as np

n = np.arange(2, 9)
variance = np.array([2.48e-02, 6.71e-03, 1.93e-03, 5.03e-04, 1.36e-04, 5.21e-05, 7.64e-06])   # from the example
slope, intercept = np.polyfit(n, np.log(variance), 1)
print(f"variance shrinks by a factor of about {np.exp(-slope):.1f} per added qubit")
for qubits in [20, 30, 50]:
    v = np.exp(intercept + slope * qubits)
    print(f"{qubits} qubits: variance about {v:.1e}, so about {1 / v:.1e} shots per gradient evaluation")

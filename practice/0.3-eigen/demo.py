"""
title: Eigenvalues and eigenvectors with NumPy
text: `np.linalg.eigh` finds the eigenvalues and eigenvectors of a Hermitian matrix. It returns the eigenvalues in increasing order and the eigenvectors as the columns of a matrix.
note: The eigenvalues 1 and 3 match the worked example, and the eigenvectors lie along the two diagonals, (1, −1)/√2 and (1, 1)/√2. NumPy may return an eigenvector multiplied by −1, as it does here for the first one. It lies on the same line through 0, so it is just as good an eigenvector. The last two lines are the trace and determinant shortcuts.
"""
import numpy as np

A = np.array([[2, 1], [1, 2]])
values, vectors = np.linalg.eigh(A)
print("eigenvalues:", values.round(4))
print("eigenvectors (one per column):")
print(vectors.round(4))

v = vectors[:, 1]                       # the eigenvector for eigenvalue 3
print("A v equals 3 v:", np.allclose(A @ v, 3 * v))
print("sum of eigenvalues:", values.sum().round(4), "  trace:", np.trace(A))
print("product:           ", values.prod().round(4), "  determinant:", np.linalg.det(A).round(4))

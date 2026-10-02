"""
title: Unitary or Hermitian?
task: Write two functions, `is_unitary(M)` and `is_hermitian(M)`, and use them to rebuild the table in this chapter for X, Y, Z, H, S, T and the matrices [[2, 1], [1, 2]] and [[1, 1], [0, 1]].
hint: The dagger M† is `M.conj().T`. Compare matrices with `np.allclose`, because floating-point numbers are rarely exactly equal.
starter:
    import numpy as np

    def is_unitary(M):
        ...   # is M† M the identity?

    def is_hermitian(M):
        ...   # is M† equal to M?
note: The two properties are independent: [[2, 1], [1, 2]] is Hermitian but not unitary, S and T are unitary but not Hermitian, and X, Y, Z and H are both.
"""
import numpy as np


def dagger(M):
    return M.conj().T


def is_unitary(M):
    return np.allclose(dagger(M) @ M, np.eye(len(M)))


def is_hermitian(M):
    return np.allclose(dagger(M), M)


matrices = {
    "X": np.array([[0, 1], [1, 0]]),
    "Y": np.array([[0, -1j], [1j, 0]]),
    "Z": np.array([[1, 0], [0, -1]]),
    "H": np.array([[1, 1], [1, -1]]) / np.sqrt(2),
    "S": np.array([[1, 0], [0, 1j]]),
    "T": np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]]),
    "[[2,1],[1,2]]": np.array([[2, 1], [1, 2]]),
    "[[1,1],[0,1]]": np.array([[1, 1], [0, 1]]),
}
for name, M in matrices.items():
    print(f"{name:14s} unitary: {str(is_unitary(M)):5s}   Hermitian: {is_hermitian(M)}")

"""
title: The Hadamard sign rule
task: Build H⊗H⊗H as an 8 × 8 matrix and check every entry against the rule ⟨y|H^{⊗n}|x⟩ = (−1)^{x·y}/√(2^{n}), here with n = 3. Then print the signs in column x = 101: the signs of the amplitudes of H⊗H⊗H|101⟩.
hint: The entry in row y and column x is `Hn[y, x]`. The parity x·y is `bin(x & y).count("1") % 2`.
"""
import numpy as np

n = 3
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
Hn = np.kron(np.kron(H, H), H)
rule = np.array([[(-1) ** (bin(x & y).count("1") % 2) for x in range(8)] for y in range(8)]) / np.sqrt(8)
print("H(x)H(x)H follows the sign rule:", np.allclose(Hn, rule))
x = 0b101
print("signs of H(x)H(x)H|101> on |000>, |001>, ..., |111>:", np.sign(Hn[:, x]).astype(int))

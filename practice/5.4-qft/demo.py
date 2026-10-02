"""
title: The QFT as a matrix
text: The QFT on n qubits is the N × N matrix with entries e^{2πi·jk/N}/√N, where N = 2^{n}. The code builds it, checks that it is unitary, and applies it to |101⟩, the number 5. NumPy's inverse FFT computes the same transform, up to a factor √N.
note: Every amplitude has size 1/√8 ≈ 0.354, and the phase of |k⟩ is 5k/8 of a full turn (printed as a fraction of 2π), as in the chapter's "QFT of |101⟩" example.
"""
import numpy as np

n = 3
N = 2 ** n
j, k = np.meshgrid(np.arange(N), np.arange(N))
QFT = np.exp(2j * np.pi * j * k / N) / np.sqrt(N)          # QFT[k, x] = e^{2 pi i x k / N} / sqrt(N)
print("unitary:", np.allclose(QFT.conj().T @ QFT, np.eye(N)))

x = 5
out = QFT[:, x]                                            # QFT|5> is column 5
for kk, a in enumerate(out):
    turns = (np.angle(a) / (2 * np.pi)) % 1
    print(f"|{kk:03b}>  size {abs(a):.3f}   phase {turns:.3f} of a turn   (5k/8 mod 1 = {5 * kk / 8 % 1:.3f})")
print("same as sqrt(N) * numpy.fft.ifft:", np.allclose(out, np.sqrt(N) * np.fft.ifft(np.eye(N)[x])))

"""
title: Superdense coding
task: Send each of the four two-bit messages 00, 01, 10 and 11. Start from the Bell pair (|00⟩ + |11⟩)/√2. Alice applies X to q0 if the second bit is 1, then Z to q0 if the first bit is 1. Bob applies CNOT from q0 to q1, then H to q0, and measures both. Print the label Bob reads with certainty.
hint: After Bob's two gates the state is a single basis state, so the label with probability 1 is `np.argmax(np.abs(psi) ** 2)`, printed in binary.
"""
import numpy as np

I, X, Z = np.eye(2), np.array([[0, 1], [1, 0]]), np.diag([1, -1])
H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
CNOT = np.kron(np.diag([1, 0]), I) + np.kron(np.diag([0, 1]), X)
bell = np.array([1, 0, 0, 1]) / np.sqrt(2)

for message in ["00", "01", "10", "11"]:
    psi = bell.copy()
    if message[1] == "1":
        psi = np.kron(X, I) @ psi        # Alice acts on her qubit q0 only
    if message[0] == "1":
        psi = np.kron(Z, I) @ psi
    psi = np.kron(H, I) @ CNOT @ psi     # Bob decodes
    read = np.argmax(np.abs(psi) ** 2)
    print(f"sent {message} -> Bob reads {read:02b} with probability {np.abs(psi[read]) ** 2:.3f}")

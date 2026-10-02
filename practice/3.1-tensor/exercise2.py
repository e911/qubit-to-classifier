"""
title: A gate on one qubit of many
task: Write `on_qubit(gate, q, n)`, which builds the 2^{n} × 2^{n} matrix that applies a one-qubit gate to qubit q of n qubits and leaves the rest alone. Check the qubit order first: X on qubit 0 should turn |000⟩ into |100⟩. Then use it to apply H to each of three qubits, starting from |000⟩.
hint: The matrix is a tensor product with `gate` in position q, counting from the left (q0 is the leftmost factor), and the 2 × 2 identity everywhere else: I ⊗ … ⊗ gate ⊗ … ⊗ I.
note: X on q0 gives |100⟩, index 4, because q0 is the leftmost bit; a matrix built in the reverse order would give |001⟩. Every amplitude ends up 1/(2√2) ≈ 0.3536: H on every qubit makes the uniform superposition of all eight basis states.
"""
import numpy as np

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
X = np.array([[0, 1], [1, 0]])


def on_qubit(gate, q, n):
    m = np.array([[1.0]])
    for k in range(n):
        m = np.kron(m, gate if k == q else np.eye(2))
    return m


start = np.zeros(8)
start[0] = 1                                 # |000>
flipped = on_qubit(X, 0, 3) @ start
print(f"X on q0: |000> -> |{np.argmax(flipped):03b}>")

psi = start
for q in range(3):
    psi = on_qubit(H, q, 3) @ psi
print("amplitudes:", psi.round(4))

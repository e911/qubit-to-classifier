"""
title: What a gradient costs on hardware
task: Write `evaluations(gate_angles, examples, epochs)`, the number of circuit runs for training with the parameter-shift rule: one forward run plus two shifted runs per gate angle, for every example in every epoch. Reproduce the chapter's count for one qubit with three layers (9 gate angles), 80 examples and 300 epochs, and turn it into shots at 1,000 shots per run.
"""


def evaluations(gate_angles, examples, epochs):
    return (1 + 2 * gate_angles) * examples * epochs


runs = evaluations(gate_angles=9, examples=80, epochs=300)
print(f"circuit evaluations: {runs:,}")
print(f"shots at 1,000 per evaluation: {runs * 1000:,}")
for qubits, layers in [(2, 3), (4, 6), (10, 10)]:
    angles = 3 * qubits * layers                 # three rotations per qubit per layer
    print(f"{qubits} qubits, {layers} layers: {evaluations(angles, 80, 300):,} evaluations")

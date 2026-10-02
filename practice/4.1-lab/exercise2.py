"""
title: The same circuits in Qiskit (optional)
task: If you have Qiskit installed (`pip install qiskit`), build the GHZ circuit there and print its probabilities. Then build a circuit with a single X on qubit 0 and look at the label Qiskit prints. Which end of the label is qubit 0?
hint: `Statevector(qc).probabilities_dict()` returns a dictionary from labels to probabilities. The Circuit Lab's "Qiskit code" tab writes this kind of code for you.
note: Qiskit writes qubit 0 as the rightmost character, so X on qubit 0 gives the label '001', which this course writes as |100⟩. Keep that in mind when you compare results.
"""
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector



def probabilities(qc):
    """Qiskit's probabilities as a plain dictionary {label: probability}."""
    return {str(k): round(float(v), 4) for k, v in Statevector(qc).probabilities_dict().items()}


ghz = QuantumCircuit(3)
ghz.h(0)
ghz.cx(0, 1)
ghz.cx(1, 2)
print("GHZ:         ", probabilities(ghz))

flip = QuantumCircuit(3)
flip.x(0)
print("X on qubit 0:", probabilities(flip))

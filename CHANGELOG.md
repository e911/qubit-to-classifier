# Changelog

## Version 3: content check and Python practice

### Corrections

The whole course was checked for content: worked examples, formulas, quiz answers, the formula sheet, the Circuit Lab examples and every piece of code. Eight places were wrong or unclear. Each entry says where it is, what it said, and what it says now.

1. **4.1 Circuit Lab, example "Teleportation", step 8 note.**
   Was: Bob's qubit is "XᵐZᵐ|ψ⟩", with the same exponent twice and m never defined.
   Now: Alice's two results are named m₀ (from q0) and m₁ (from q1), and Bob's qubit is X<sup>m₁</sup>Z<sup>m₀</sup>|ψ⟩. This matches the fixes in steps 9 and 10: X if q1 read 1, then Z if q0 read 1.

2. **4.1 Circuit Lab, example "Grover search, 2 qubits", step 6 note.**
   Was: "CZ (reflects about |11⟩ in this basis)", which is vague.
   Now: CZ flips the sign of |11⟩, and between the two layers of X that flips the sign of |00⟩, which is the reflection the diffusion step needs.

3. **4.1 Circuit Lab, Qiskit code tab.**
   Was: with NumPy 2 the exported code printed type names, for example `{np.str_('00'): np.float64(0.4999999999999999), np.str_('11'): np.float64(0.4999999999999999)}`.
   Now: it prints a plain dictionary, `{'00': 0.5, '11': 0.5}`.

4. **4.3 Identities and universality, "Math behind it: Why single-qubit gates and CNOTs can build any unitary".**
   Was: the construction "can need about 4ⁿ gates", which understates the point.
   Now: for a general unitary the number of gates grows exponentially, roughly like 4ⁿ, and a counting argument shows that most unitaries cannot be built with far fewer.

5. **4.3 Identities and universality, the paragraph under "What H and T can reach".**
   Was: H and S "form a finite group", but two gates are not a group; they generate one.
   Now: every product of H and S belongs to a finite group, the single-qubit Clifford group, which has just 24 elements once global phase is ignored.

6. **5.4 The quantum Fourier transform and phase estimation, "Phase estimation", step 1 and the worked example "φ = 0.375 with three counting qubits".**
   Was: "Counting qubit j controls U applied 2ʲ times", with the phases listed as 2π · φ, 2π · 2φ, 2π · 4φ from q0 down. With q0 as the top wire and leftmost bit, that puts the bits in reverse order: the register is then not QFT|3⟩, and the inverse QFT gives 011 only with probability 0.73, not with certainty as the example says.
   Now: the top counting qubit q0 controls U applied 2<sup>t−1</sup> times and the bottom one controls U once. In the example, q0, q1 and q2 control U applied 4, 2 and 1 times and pick up 2π · 1.5, 2π · 0.75 and 2π · 0.375, which is exactly the pattern of QFT|3⟩ (qubit q turns by 2π · x/2<sup>q+1</sup>), so the result 011 is certain.

7. **7.8 Where to go next, "A state-vector simulator in NumPy".**
   Was: the printout showed "-0.000" for an amplitude that is exactly zero, and the last line printed 0.5000000000000002.
   Now: the print adds 0 to turn −0.0 into 0.0, the last value is rounded to 0.5, and the output is shown under the code.

8. **7.8 Where to go next, "The classifier from chapter 7.5, in PennyLane".**
   Was: no hint of how long it runs or what it prints.
   Now: the text says the 120 epochs take several minutes on a laptop, and the output under the code shows the loss falling from 0.63 to about 0.25.

### Checked and correct

- The other 85 worked examples: every step of the arithmetic.
- Every display formula in Parts 0–VII, and the formula sheet (37 identities and results checked numerically).
- All 167 quiz answers and their explanations.
- All 13 Circuit Lab examples: final states checked against known results, and the exported Qiskit code, run in Qiskit 2.5, gives the same probabilities as the page.
- The PennyLane classifier (PennyLane 0.45) and the NumPy simulator run as printed.
- The reading list: titles, venues, years and arXiv numbers.
- The new Python practice: every script was run, and every statement in its tasks, hints and notes was checked by a separate review and corrected where needed before release.

### Added: Python practice

- A **Practice in Python** section in 28 chapters: 27 worked examples and 63 exercises, each with a full solution (60 with a hint) and the output it prints.
- Code blocks styled like a code editor: syntax colours in the light and dark themes, line numbers, a file tab, a Copy button (the line numbers are not copied) and an output panel. The Circuit Lab's Qiskit tab, the NumPy simulator and the PennyLane code use the same blocks.
- `practice/`: every example and exercise as a runnable script, and one Jupyter notebook per part in `practice/notebooks/`.
- `tools/build_practice.py` runs every script and rebuilds `src/text/practice.js` and the notebooks; `--check` fails if any printed output no longer matches the page.
- `test/interact.py` now also checks the practice sections, hints, solutions and the Copy button.

## Version 2: expanded chapters

- Part 0, the math toolkit: complex numbers, vectors and matrices, eigenvectors.
- Every chapter expanded with goals, worked examples, "Math behind it", "Common confusion", key ideas, "Try this", a recap and a quiz.
- Appendix: a searchable glossary with notation and conventions, and a formula sheet.

## Version 1

- Parts I–VII with an exact state-vector simulator, the Circuit Lab, and a quantum classifier trained in the browser.

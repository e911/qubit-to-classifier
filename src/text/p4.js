/* Words for Part IV, circuits. Interactive panels live in src/ch4.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref, mat = C.mat;

  /* ===================================================================== 4.1 */
  C.text('lab', {
    lede: `Build any circuit on up to five qubits and step through it gate by gate, watching the full state vector and every qubit’s Bloch sphere. This chapter explains how to drive the lab and read its displays, then gives you exercises to solve in it.`,
    html: `
${C.objectives([
  'Place, edit and remove gates, including controlled gates and measurements',
  'Step through a circuit and read the circle notation, the Bloch spheres and the probabilities',
  'Run shots and compare them with the exact probabilities',
  'See the whole circuit as one unitary matrix, and export it to Qiskit',
  'Design circuits for target states and check your answers'
], ['tensor', 'multigates', 'entangle'])}

<h2>Building circuits</h2>
<ul>
  <li><b>Place gates:</b> drag a gate from the palette onto a wire, or tap a gate and then tap a spot on the circuit.</li>
  <li><b>Control any gate:</b> put ● (or ○ to control on 0) in the same column. CNOT, CZ, SWAP and CCX drop in as ready-made groups.</li>
  <li><b>Edit:</b> select a placed gate to change its angle or delete it, or drag it off the circuit to remove it. With the keyboard, focus the circuit, move with the arrow keys, press Enter to place or select and Delete to remove.</li>
  <li><b>Qubits:</b> "+ qubit" and "− qubit" add or remove the bottom wire, up to five qubits.</li>
  <li><b>Step:</b> press Play or use the arrow buttons. Click a column number to jump there. The shaded column is the one just applied.</li>
  <li><b>Examples:</b> each circuit in the Examples menu comes with step-by-step notes.</li>
</ul>

<h2>Reading the displays</h2>
<p><b>Circle notation.</b> The state vector is drawn as one circle per basis state. The filled area of each circle is the probability of that outcome, and the colour and needle show the phase, using the wheel from chapter ${ref('phase')}. An empty circle is an amplitude of 0. Hover over a circle for its exact value.</p>
<p><b>Each qubit on its own.</b> The small spheres show each qubit’s Bloch vector, worked out from the full state. When a qubit is entangled with the others, its arrow is shorter than 1 (chapter ${ref('entangle')}).</p>
<p><b>Tabs.</b> "Probabilities" gives the chance of each outcome if every qubit were measured at the current step. "Run shots" samples the finished circuit many times, as real hardware does. "Unitary" shows the whole circuit as one matrix, in which column j is the output for the input |j⟩. "Qiskit code" gives a Python version that runs with IBM’s open-source Qiskit library.</p>
${C.pitfall('A measurement in the middle makes the output random', `<p>With a measurement partway through, each run of the circuit can take a different branch, so the lab shows one sampled run at a time and "New outcomes" re-rolls it. Such a circuit has no single unitary matrix, which is why the Unitary tab is then empty.</p>`)}
${C.bench('lab', 'Circuit Lab', 'Load a worked example from the Examples menu')}

<h2>Designing circuits</h2>
<p>Most target states can be built with one strategy: first create the right branches with H or rotation gates, then use controlled gates to change each branch separately.</p>
${C.worked('Plan the GHZ state (|000⟩ + |111⟩)/√2', [
  'The target has two branches: all zeros and all ones.',
  'H on q0 makes two branches: (|000⟩ + |100⟩)/√2.',
  'CNOT from q0 to q1 copies q0’s bit into q1 in each branch: (|000⟩ + |110⟩)/√2.',
  'CNOT from q1 to q2 copies it again: (|000⟩ + |111⟩)/√2.'
], 'Make the branches first, then fix each branch with controlled gates.')}
${C.circ(B => B(3).g('H', 0).cx(0, 1).cx(1, 2), { caption: 'The GHZ circuit.' })}

<h2>Exercises</h2>
<p>Build each target in the lab above, then press "Check my circuit". The checker runs your circuit from |00…0⟩ and compares the final state with the target, ignoring any global phase. Hints and solutions are there if you get stuck, but try each one first: building circuits yourself is the fastest way to make Part III stick.</p>
${C.bench('lab-ex', 'Circuit exercises', 'Pick an exercise, build it in the lab, then check')}

${C.tryThis([
  'Build a GHZ state on four qubits: (|0000⟩ + |1111⟩)/√2.',
  'Load "Phase kickback" and delete the H on q1, so the target is |1⟩ instead of |−⟩. Does the control still flip?',
  'Load "Teleportation", step to the end and press "New outcomes" several times. Does q2 always match the grey ghost arrow?',
  'Load "Grover search, 2 qubits" and step through it slowly. At which step does the marked item get its minus sign?',
  'Build any circuit without measurements, open the Unitary tab, and check that column 0 is the state you get from |00…0⟩.'
])}
${C.recap([
  'Gates go on wires; a control (● or ○) in the same column makes any gate controlled.',
  'Circle area is probability and colour is phase; the small spheres show each qubit on its own.',
  'Shots sample the circuit like real hardware; the Unitary tab shows the whole circuit as one matrix.',
  'To design a circuit, create the branches first, then act on each branch with controlled gates.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'In circle notation, what does the filled area of a circle show?', options: ['The probability of that outcome', 'The phase of the amplitude', 'How many gates have been applied', 'The real part of the amplitude'], answer: 0,
        why: 'The area is proportional to the probability |amplitude|². The colour and the needle show the phase.' },
      { q: 'A qubit’s small Bloch arrow in the lab is shorter than 1. What does that tell you?', options: ['It is entangled with other qubits, or measured into a mixture', 'The simulation has lost precision', 'It is in the state |0⟩', 'Its phase is zero'], answer: 0,
        why: 'Chapter 3.3: a qubit that is entangled with others has no pure state of its own, so its arrow shrinks inside the sphere.' },
      { q: 'Why is the Unitary tab empty for a circuit with a measurement in the middle?', options: ['A measurement cannot be undone, so the circuit has no single unitary matrix', 'The matrix would be too large', 'Measurements are drawn in another tab', 'Unitary matrices cannot have complex entries'], answer: 0,
        why: 'Every unitary is reversible, and a measurement is not. Each run of such a circuit can follow a different branch.' },
      { q: 'Column j of the matrix in the Unitary tab is…', options: ['the output state when the input is |j⟩', 'the probability of outcome j', 'the j-th gate of the circuit', 'the state after j steps'], answer: 0,
        why: 'As in chapter 0.2, a matrix sends the basis state |j⟩ to its column j.' },
      { q: 'The lab’s "Run shots" result differs slightly from the exact probabilities. Why?', options: ['Each run gives one random outcome, and a finite number of shots only estimates the probabilities', 'The simulator is approximate', 'The lab adds random gate errors', 'The probabilities change from run to run'], answer: 0,
        why: 'The simulator is exact, but sampling is random. The gap shrinks like 1/√N, as in chapter 2.2.' }
    ]
  });

  /* ===================================================================== 4.2 */
  C.text('interference', {
    lede: `Quantum algorithms arrange for the paths to wrong answers to cancel and the paths to right answers to add up. This chapter follows every path through the smallest interferometer, and shows why learning which path was taken destroys the effect.`,
    html: `
${C.objectives([
  'Trace every path through a circuit and multiply the amplitudes along each one',
  'Add the amplitudes of paths that end at the same result, and see them cancel or reinforce',
  'Work out H, P(φ), H by paths and by matrices, and get P(0) = cos²(φ/2)',
  'Explain why measuring, or merely recording, which path was taken destroys interference',
  'See interference as the resource every quantum algorithm uses'
], ['phase', 'gates', 'multigates'])}

<h2>Two coins versus two Hadamards</h2>
<p>Flip a fair coin, then flip it again: the result is still random. The quantum version behaves differently. H applied to |0⟩ makes |+⟩, which measures like a fair coin. Apply H again and you get |0⟩ back with certainty, because HH = I. Something more than probability is at work.</p>

<h2>Following the paths</h2>
<p>Think of each gate as a junction where the state can branch. H sends |0⟩ to |0⟩ with amplitude 1/√2 and to |1⟩ with amplitude 1/√2. It sends |1⟩ to |0⟩ with amplitude 1/√2 and to |1⟩ with amplitude −1/√2. Those four numbers are simply the entries of the matrix H.</p>
<p>A <b>path</b> is a sequence of basis states, one after each gate. Richard Feynman’s rule for combining paths is:</p>
<ol>
  <li>The amplitude of a path is the product of the amplitudes along it.</li>
  <li>The amplitude of a final result is the sum of the amplitudes of all paths that end there.</li>
  <li>The probability is the squared length of that sum.</li>
</ol>
${C.worked('H then H on |0⟩, by paths', [
  'Paths into |0⟩: 0 → 0 → 0 with amplitude (1/√2)(1/√2) = 1/2, and 0 → 1 → 0 with amplitude (1/√2)(1/√2) = 1/2.',
  'Their sum is 1/2 + 1/2 = 1, so P(0) = 1.',
  'Paths into |1⟩: 0 → 0 → 1 with amplitude (1/√2)(1/√2) = 1/2, and 0 → 1 → 1 with amplitude (1/√2)(−1/√2) = −1/2.',
  'Their sum is 1/2 − 1/2 = 0, so P(1) = 0.'
], 'The two routes to |1⟩ cancel exactly. Probabilities can never cancel, but amplitudes can.')}
${C.pitfall('Adding probabilities gives the wrong answer', `<p>If you add the probabilities of the paths instead of their amplitudes, each of the four paths has probability 1/4, and you would predict P(0) = P(1) = 1/2: the two-coin answer. That wrong answer becomes the right one as soon as something records which path was taken, as the end of this chapter shows.</p>`)}

<h2>A phase between the Hadamards</h2>
<p>Put a phase gate P(φ) between the two H gates. Only the paths that pass through |1⟩ pick up the factor e<sup>iφ</sup>:</p>
${C.align([
  ['amplitude of |0⟩', '(1/2)(1 + e<sup>iφ</sup>)', ''],
  ['amplitude of |1⟩', '(1/2)(1 − e<sup>iφ</sup>)', ''],
  ['P(0)', '|1 + e<sup>iφ</sup>|² / 4 = (2 + 2 cos φ)/4 = cos²(φ/2)', 'as in chapter 1.2']
])}
<p>As φ goes from 0 to π, the probability slides smoothly from P(0) = 1 to P(1) = 1, without anything being measured in between. This circuit is the qubit version of a <b>Mach–Zehnder interferometer</b>, in which a photon is split onto two paths, one path is delayed to add a phase, and the paths are recombined.</p>
${C.circ(B => B(1).g('H', 0).g('P', 0, Math.PI / 3).g('H', 0), { caption: 'H, P(φ), H: the smallest interferometer, here with φ = π/3.' })}
${C.bench('i-paths', 'Every path, and how they add', 'Colour and arrow direction = phase of each path')}
${C.worked('Check with matrices', [
  'H|0⟩ = (1/√2)(1, 1).',
  'P(φ) multiplies the second entry by e<sup>iφ</sup>: (1/√2)(1, e<sup>iφ</sup>).',
  'H again: (1/2)(1 + e<sup>iφ</sup>, 1 − e<sup>iφ</sup>).'
], 'The same answer as the sum over paths. Matrix multiplication is the path sum, organized.')}
${C.deeper('Why matrix multiplication is a sum over paths', `<p>The entry (AB)<sub>ij</sub> = Σ<sub>k</sub> A<sub>ik</sub> B<sub>kj</sub> adds up, over every intermediate state k, the amplitude for B to take j to k times the amplitude for A to take k to i. With three gates, (ABC)<sub>ij</sub> = Σ<sub>k</sub> Σ<sub>l</sub> A<sub>ik</sub> B<sub>kl</sub> C<sub>lj</sub> is a sum over all two-step paths. So multiplying matrices is exactly Feynman’s rule. For n qubits and m gates there can be (2ⁿ)<sup>m</sup> paths, which is why nobody adds them up one by one, and why multiplying state vectors step by step is such a useful shortcut.</p>`)}

<h2>Knowing the path destroys the interference</h2>
<p>What if the circuit measures the qubit between the two H gates? The measurement picks one path, |0⟩ or |1⟩, at random. Each of those then goes through the second H on its own and gives a fair coin, so P(0) = 1/2 for every φ. The interference is gone.</p>
<p>A gentler disturbance does the same. Suppose a second qubit, a <b>marker</b>, records which path was taken, without anyone ever reading it. A controlled rotation can leave the marker in |m₀⟩ on one path and |m₁⟩ on the other. Then</p>
${F('P(0) = (1 + V cos φ)/2, &nbsp; with V = |⟨m₀|m₁⟩|')}
<p>If the two marker states are identical (V = 1), nothing was recorded and the interference is complete. If they are orthogonal (V = 0), the path could in principle be read from the marker, and the interference vanishes entirely. In between, the fringes shrink. This trade-off between path information and interference is called <b>complementarity</b>.</p>
${C.bench('which-path', 'Which-path information', 'Turn χ to let the marker learn more')}
${C.deeper('Deriving (1 + V cos φ)/2', `<p>After H and P(φ), the pair is (|0⟩|0⟩ + e<sup>iφ</sup>|1⟩|0⟩)/√2. The controlled rotation turns the marker in the |1⟩ branch into |m₁⟩ = cos(χ/2)|0⟩ + sin(χ/2)|1⟩, while the marker in the |0⟩ branch stays |m₀⟩ = |0⟩. The final H on the path qubit gives the amplitude (|m₀⟩ + e<sup>iφ</sup>|m₁⟩)/2 for reading 0, which is now a vector in the marker’s space. Its squared length is (1/4)(2 + 2 Re(e<sup>iφ</sup>⟨m₀|m₁⟩)) = (1 + cos(χ/2) cos φ)/2, so V = cos(χ/2).</p>`)}
<p>This is why quantum computers have to be so well isolated. Any stray interaction that leaves a trace of the path in the environment acts as a marker and washes out the interference. Chapter ${ref('noise')} calls this <b>decoherence</b>.</p>

<h2>Interference is what algorithms use</h2>
<p>Every quantum algorithm in Part V is a larger version of this circuit. It spreads the state over many paths, uses phases to mark some of them, and recombines them so that the paths to wrong answers cancel and the paths to right answers reinforce. A quantum computer that never interfered its paths could do no better than flipping coins.</p>

${C.keyIdea('Amplitudes of paths that end at the same result add, and they can cancel. Interference is the only way a quantum computer beats guessing, and it disappears as soon as the path is recorded anywhere.')}
${C.tryThis([
  'In the path diagram, set φ = π. Which output is now certain?',
  'Find the values of φ that give a 50/50 split.',
  'In the which-path panel, set χ = π. Why does φ no longer matter?',
  'Set χ = π/2. How tall are the fringes now? Compare with cos(π/4).',
  'In the Circuit Lab, load "Interference: H then H", put a measurement between the two H gates, and run 1,000 shots.',
  'On paper: use paths to find the output of H, Z, H on |0⟩.'
])}
${C.recap([
  'Feynman’s rule: multiply amplitudes along each path, add the paths that end at the same result, then square.',
  'For H, P(φ), H on |0⟩, P(0) = cos²(φ/2): the phase steers the output with no measurement in between.',
  'Matrix multiplication is the same sum over paths, organized efficiently.',
  'Recording the path, even in a marker that nobody reads, shrinks the fringes to V = |⟨m₀|m₁⟩|.',
  'Every quantum algorithm uses interference to cancel wrong answers and reinforce right ones.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'For H, P(φ), H acting on |0⟩, what is P(0)?', options: ['cos²(φ/2)', 'sin²(φ/2)', 'Always 1/2', 'cos φ'], answer: 0,
        why: 'The amplitude of |0⟩ is (1 + e<sup>iφ</sup>)/2, whose squared length is (2 + 2 cos φ)/4 = cos²(φ/2).' },
      { q: 'Two paths end at the same result with amplitudes 1/2 and −1/2. What is the probability of that result?', options: ['0', '1/2', '1/4', '1'], answer: 0,
        why: 'Add the amplitudes first: 1/2 − 1/2 = 0. Adding the path probabilities instead would wrongly give 1/2.' },
      { q: 'You measure the qubit between the two H gates. What happens to P(0)?', options: ['It becomes 1/2 for every φ', 'It stays cos²(φ/2)', 'It becomes 1', 'It becomes 0'], answer: 0,
        why: 'The measurement picks one path, and each path on its own gives a fair coin after the second H. The interference is lost.' },
      { q: 'A marker qubit ends in orthogonal states on the two paths, and nobody reads it. What is the fringe visibility V?', options: ['0', '1', '1/2', 'It depends on φ'], answer: 0,
        why: 'V = |⟨m₀|m₁⟩| = 0. The path is recorded in principle, and that alone destroys the interference.' },
      { q: 'How is a matrix product like a sum over paths?', options: ['Each entry of AB adds, over every intermediate state, the product of the amplitudes into and out of it', 'It is not: paths and matrices give different answers', 'Each entry of AB is the largest single path amplitude', 'Matrix entries are the probabilities of paths'], answer: 0,
        why: '(AB)<sub>ij</sub> = Σ<sub>k</sub> A<sub>ik</sub>B<sub>kj</sub>: each term is one path j → k → i, and the sum adds all of them.' }
    ]
  });

  /* ===================================================================== 4.3 */
  C.text('identities', {
    lede: `Different circuits can do exactly the same thing. A handful of identities lets you read, simplify and compile circuits, and a small set of gates turns out to be enough to build every circuit at all.`,
    html: `
${C.objectives([
  'Decide when two circuits are equivalent, including up to a global phase',
  'Use standard identities to simplify circuits and to swap control and target',
  'Write any single-qubit gate as three rotations',
  'Explain what a universal gate set is, and why H, T and CNOT are enough',
  'Know why Clifford circuits are easy to simulate and why T gates are expensive'
], ['gates', 'multigates', 'interference'])}

<h2>When are two circuits the same?</h2>
<p>Two circuits are <b>equivalent</b> if their unitary matrices are equal up to a global phase. Then no experiment can tell them apart, whatever the input. The checker below builds both matrices and compares them entry by entry. For two or more qubits it shows the matrices as heat maps, where colour is phase and opacity is magnitude.</p>
${C.bench('ids', 'Identity checker', 'Colour = phase, opacity = magnitude')}
${C.worked('Check that three CNOTs swap |10⟩', [
  'CNOT from q0 to q1: |10⟩ becomes |11⟩.',
  'CNOT from q1 to q0: q1 is 1, so q0 flips, and |11⟩ becomes |01⟩.',
  'CNOT from q0 to q1: q0 is 0, so nothing happens, and the state stays |01⟩.',
  'The input |10⟩ came out as |01⟩, swapped. The other three inputs work the same way, and by linearity so does every superposition.'
], 'Compilers use this when two qubits that must interact are not neighbours on the chip (chapter 6.2).')}
${C.worked('Hadamards swap the control and target of a CNOT', [
  'Write the CNOT with q0 as control as |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ X.',
  'Put H on both qubits before and after. Since H|0⟩⟨0|H = |+⟩⟨+|, H|1⟩⟨1|H = |−⟩⟨−|, HIH = I and HXH = Z, the result is |+⟩⟨+| ⊗ I + |−⟩⟨−| ⊗ Z.',
  'Use |±⟩⟨±| = (I ± X)/2 and collect terms: I ⊗ (I + Z)/2 + X ⊗ (I − Z)/2 = I ⊗ |0⟩⟨0| + X ⊗ |1⟩⟨1|.',
  'That is a CNOT with q1 as control and q0 as target.'
], 'The checker confirms it: choose "H on both flips a CNOT".')}
${C.circ(B => B(2).layer('H', [0, 1]).cx(0, 1).layer('H', [0, 1]), { caption: 'Equivalent to a single CNOT pointing the other way, from q1 to q0.' })}

<h2>Every single-qubit gate is three rotations</h2>
<p>Any single-qubit unitary can be written as</p>
${F('U = e<sup>iα</sup> Rz(β) Ry(γ) Rz(δ)')}
<p>for some angles α, β, γ and δ. This is the quantum version of the Euler angles that describe how a rigid body is oriented: turn about z, then about y, then about z again. The global phase e<sup>iα</sup> does not matter, so three numbers describe any single-qubit gate. The checker’s "U(θ,φ,λ) = Rz·Ry·Rz" example tests this with random angles.</p>
${C.worked('H as two rotations', [
  'Try Rz(π) first, then Ry(π/2). As a formula that is Ry(π/2) Rz(π).',
  'Rz(π) has diagonal entries e<sup>−iπ/2</sup> = −i and e<sup>iπ/2</sup> = i, so Rz(π) = −iZ.',
  `Ry(π/2) Z = (1/√2) ${mat([['1', '−1'], ['1', '1']], 'small')} ${mat([['1', '0'], ['0', '−1']], 'small')} = (1/√2) ${mat([['1', '1'], ['1', '−1']], 'small')} = H.`,
  'So Ry(π/2) Rz(π) = −i Ry(π/2) Z = −iH: H up to the global phase −i.'
], 'On the sphere, a half turn about z followed by a quarter turn about y lands every state exactly where H’s half turn about the x + z diagonal does.')}

<h2>Universal gate sets</h2>
<p>A set of gates is <b>universal</b> if circuits made from it can approximate any unitary, on any number of qubits, as closely as you like. Two facts make a small universal set possible:</p>
<ul>
  <li>Any multi-qubit unitary can be built exactly from single-qubit gates and CNOTs.</li>
  <li>H and T together approximate any single-qubit gate. One combination of them, THTH, is a rotation by an angle that is an irrational fraction of a full turn. Repeating it never returns exactly to the start, so its powers come arbitrarily close to every angle about its axis. Conjugating by H gives turns about a second axis, and turns about two different axes combine into any rotation.</li>
</ul>
<p>So {H, T, CNOT} is universal. The <b>Solovay–Kitaev theorem</b> adds that the approximation is efficient: reaching accuracy ε takes a number of gates that grows only like a power of log(1/ε). Modern compilers do better still, using about 3 log₂(1/ε) T gates for a single rotation.</p>
${C.bench('ht-orbit', 'What H and T can reach', 'Change the gate set and the sequence length')}
<p>With H and S only, the reachable states never go beyond the six landmark states, however long the sequence: every product of H and S belongs to a finite group, the single-qubit Clifford group, which has just 24 elements once global phase is ignored. With H and T, the number of reachable states grows without limit and they spread over the whole sphere.</p>
${C.pitfall('Universal does not mean exact', `<p>H, T and CNOT cannot build most rotations exactly, for example Ry(0.123). They approximate them, and the approximation costs gates. When a hardware platform offers continuous rotations natively, as most do today, a rotation is a single gate; on future error-corrected machines, it will be a sequence of H and T gates.</p>`)}

<h2>Clifford circuits and the cost of T</h2>
<p>Circuits built only from H, S and CNOT are called <b>Clifford circuits</b>. They can create a great deal of entanglement, yet an ordinary computer can simulate them efficiently, by tracking how they move Pauli operators around instead of storing 2ⁿ amplitudes. This is the <b>Gottesman–Knill theorem</b>. Adding the T gate is what takes circuits beyond easy classical simulation.</p>
<p>On error-corrected hardware, Clifford gates are cheap and T gates are expensive, because each T needs a special resource state prepared by a costly process called magic-state distillation. So the <b>T count</b>, the number of T gates in a circuit, is a standard measure of its cost. The Toffoli construction in the checker uses seven T and T† gates.</p>
${C.deeper('Why single-qubit gates and CNOTs can build any unitary', `<p>Any unitary on n qubits can be broken into a product of two-level unitaries, each of which acts on just two basis states and leaves all the others alone. Each two-level unitary can in turn be built from CNOTs and single-qubit gates, using a sequence of CNOTs (a Gray code) to bring the two basis states next to each other. The construction always works, but for a general unitary the number of gates grows exponentially, roughly like 4ⁿ, and a counting argument shows that most unitaries cannot be built with far fewer. The circuits people actually run have structure, and compilers exploit it to do much better.</p>`)}

${C.keyIdea('Circuits are programs with many equivalent forms. Identities let you move between them, and universality guarantees that H, T and CNOT are enough for everything, approximately and efficiently.')}
${C.tryThis([
  'In the checker, choose "SWAP = 3 CNOTs" and open it in the Circuit Lab. Add an X on q0 at the start and step through it.',
  'Choose "Rz(π/2) vs S". What is the global phase between them, and why does it not matter here?',
  'In the reachability panel, choose H and S and raise the sequence length. Why does the count stop at 6?',
  'Choose H and T, set the length to 26, and press "New target" a few times. How close does the best dot get?',
  'On paper: check HXH = Z by tracing paths, as in chapter 4.2.'
])}
${C.recap([
  'Two circuits are equivalent when their unitaries agree up to a global phase.',
  'Useful identities: HXH = Z, three CNOTs make a SWAP, and Hadamards on both qubits swap the control and target of a CNOT.',
  'Any single-qubit gate is e<sup>iα</sup> Rz(β) Ry(γ) Rz(δ): three angles and an invisible phase.',
  'H, T and CNOT form a universal set, and the Solovay–Kitaev theorem makes the approximation efficient.',
  'Clifford circuits (H, S, CNOT) are easy to simulate classically; T gates are the expensive extra ingredient.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'The circuit ─H─S─ (H first) corresponds to which matrix?', options: ['S·H', 'H·S', 'H + S', 'It depends on the input'], answer: 0,
        why: 'Later gates multiply from the left, so the first gate sits on the right.' },
      { q: 'Which gate set is universal?', options: ['{H, T, CNOT}', '{H, S, CNOT}', '{X, Z}', '{CNOT}'], answer: 0,
        why: '{H, S, CNOT} generates only Clifford circuits, which an ordinary computer can simulate efficiently. Adding T makes the set universal.' },
      { q: 'Two circuits have unitaries U and −U. Are they equivalent?', options: ['Yes: they differ by the global phase −1', 'No: every entry has the opposite sign', 'Only for one qubit', 'Only if U is real'], answer: 0,
        why: '−1 = e<sup>iπ</sup> multiplies every output state by the same phase, which no measurement can detect.' },
      { q: 'How many CNOTs does a SWAP need?', options: ['3', '1', '2', '4'], answer: 0,
        why: 'Three CNOTs with alternating direction swap any two qubits.' },
      { q: 'Why do engineers count T gates?', options: ['On error-corrected hardware each T gate costs far more than H, S or CNOT', 'T gates cannot be simulated at all', 'T gates are the only gates that create entanglement', 'Every circuit needs exactly seven T gates'], answer: 0,
        why: 'Clifford gates are cheap in error-corrected codes, while each T needs a distilled magic state. Note that CNOT, not T, is what creates entanglement here.' },
      { q: 'Ignoring global phase, how many real numbers describe an arbitrary single-qubit gate?', options: ['3', '1', '2', '4'], answer: 0,
        why: 'U = e<sup>iα</sup> Rz(β) Ry(γ) Rz(δ), and the global phase α does not matter, which leaves three angles.' }
    ]
  });
})(window);

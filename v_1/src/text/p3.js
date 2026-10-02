/* Words for Part III, many qubits. Interactive panels live in src/ch3.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref, mat = C.mat, vec = C.vec;
  const D = s => `<div class="eqn center">${s}</div>`;

  /* ===================================================================== 3.1 */
  C.text('tensor', {
    lede: `Two qubits need four amplitudes, three need eight, and n qubits need 2ⁿ. This chapter shows how to combine qubits with the tensor product, how to read the labels, how a gate on one qubit acts inside a bigger system, and why the bookkeeping explodes.`,
    html: `
${C.objectives([
  'List the basis states of two and three qubits and read their labels',
  'Combine single-qubit states with the tensor product, by hand',
  'Compute the probability of a result on one qubit from the joint amplitudes',
  'Apply a single-qubit gate inside a multi-qubit state',
  'Explain why simulating n qubits needs 2ⁿ numbers'
], ['qubit', 'linalg', 'gates'])}

<h2>Four basis states</h2>
<p>One qubit has two basis states. Two qubits have four, one for each combination of results: ${K('00')}, ${K('01')}, ${K('10')} and ${K('11')}. A general two-qubit state gives each of them an amplitude:</p>
${F('|ψ⟩ = α₀₀|00⟩ + α₀₁|01⟩ + α₁₀|10⟩ + α₁₁|11⟩')}
<p>Measuring both qubits gives the two-bit result ab with probability |α<sub>ab</sub>|², and the four probabilities add to 1. As a column vector the state has four entries, listed in the order 00, 01, 10, 11, which is counting 0, 1, 2, 3 in binary.</p>
${C.define('Qubit order in this course', 'The first character of a label belongs to q0, the top wire of a circuit. So |01⟩ means q0 = 0 and q1 = 1. Software libraries differ: Qiskit writes bit strings the other way round, with q0 on the right. Always check the convention before comparing results from two tools.')}

<h2>Putting two qubits together: the tensor product</h2>
<p>Suppose q0 is prepared in a₀|0⟩ + a₁|1⟩ and, separately, q1 in b₀|0⟩ + b₁|1⟩. The amplitude of each joint result is the product of the single-qubit amplitudes, just as the probabilities of independent events multiply. This way of combining states is called the <b>tensor product</b>, written ⊗:</p>
${F('(a₀|0⟩ + a₁|1⟩) ⊗ (b₀|0⟩ + b₁|1⟩) = a₀b₀|00⟩ + a₀b₁|01⟩ + a₁b₀|10⟩ + a₁b₁|11⟩')}
<p>With columns, each entry of the first vector multiplies the whole second vector:</p>
${D(`${vec(['a₀', 'a₁'])} ⊗ ${vec(['b₀', 'b₁'])} = ${vec(['a₀b₀', 'a₀b₁', 'a₁b₀', 'a₁b₁'])}`)}
<p>The ⊗ is often dropped: |0⟩|1⟩ and |01⟩ both mean |0⟩ ⊗ |1⟩.</p>
${C.worked('Compute |+⟩ ⊗ |0⟩', [
  '|+⟩ = (1/√2, 1/√2) and |0⟩ = (1, 0).',
  'The four products: a₀b₀ = 1/√2, a₀b₁ = 0, a₁b₀ = 1/√2 and a₁b₁ = 0.',
  'So |+⟩|0⟩ = (|00⟩ + |10⟩)/√2.'
], 'q0 is a fair coin and q1 is certainly 0, so only the results 00 and 10 can occur.')}
${C.worked('Compute |+⟩ ⊗ |−⟩', [
  '|+⟩ = (1/√2)(1, 1) and |−⟩ = (1/√2)(1, −1).',
  'The four products are (1/2)(1·1, 1·(−1), 1·1, 1·(−1)) = (1/2)(1, −1, 1, −1).',
  'So |+⟩|−⟩ = (|00⟩ − |01⟩ + |10⟩ − |11⟩)/2.'
], 'All four results have probability 1/4, but the signs remember that q1 is |−⟩.')}
${C.bench('t-grid', 'Two independent qubits', 'Each cell = row amplitude × column amplitude')}
<p>In the panel, the 2 × 2 grid of joint amplitudes is a multiplication table: each cell is its row’s amplitude (from q0) times its column’s amplitude (from q1). Most two-qubit states cannot be written as such a table. Those are the entangled states of chapter ${ref('entangle')}.</p>

<h2>Probabilities for one qubit at a time</h2>
<p>To find the probability that q0 alone reads 0, add the probabilities of every result in which q0 is 0:</p>
${F('P(q0 = 0) = |α₀₀|² + |α₀₁|²')}
${C.worked('One-qubit probabilities from joint amplitudes', [
  'Take |ψ⟩ = (1/2)|00⟩ + (1/2)|01⟩ + (1/√2)|11⟩. Check: 1/4 + 1/4 + 1/2 = 1.',
  'P(q0 = 0) = |α₀₀|² + |α₀₁|² = 1/4 + 1/4 = 1/2.',
  'P(q1 = 1) = |α₀₁|² + |α₁₁|² = 1/4 + 1/2 = 3/4.',
  'P(q0 = 1 and q1 = 0) = |α₁₀|² = 0: that result never occurs.'
], 'Add the probabilities of all labels that agree on the bits you care about.')}

<h2>Three or more qubits</h2>
<p>The pattern continues. n qubits have 2ⁿ basis states, labelled by the n-bit strings from 00…0 to 11…1, and a general state has 2ⁿ amplitudes. Three qubits have eight: |000⟩, |001⟩, |010⟩, …, |111⟩. A tensor product of n single-qubit states multiplies one amplitude from each qubit, so |+⟩|+⟩|+⟩ gives each of the eight labels the amplitude (1/√2)³ = 1/(2√2).</p>

<h2>A gate on one qubit of many</h2>
<p>Applying H to q0 while leaving q1 alone is described by the 4 × 4 matrix H ⊗ I, but you rarely need to write it out. In the state vector, a gate on one qubit acts on <b>pairs of amplitudes</b>: the pairs of labels that differ only in that qubit’s bit. For H on q0 the pairs are (|00⟩, |10⟩) and (|01⟩, |11⟩), and the ordinary 2 × 2 matrix of H acts on each pair separately.</p>
${C.worked('Apply H to q0 of |00⟩', [
  'The state is (1, 0, 0, 0): α₀₀ = 1 and the other amplitudes are 0.',
  'The pair (|00⟩, |10⟩) holds (1, 0). H turns it into (1/√2, 1/√2).',
  'The pair (|01⟩, |11⟩) holds (0, 0), which stays (0, 0).',
  'The new state is (|00⟩ + |10⟩)/√2 = |+⟩|0⟩, as expected.'
])}
${C.bench('pairs', 'A gate on one qubit acts on pairs of amplitudes', 'Pick a gate and a qubit, then apply')}
<p>Every state-vector simulator, including the one running this page, works exactly like this: for each pair, a 2 × 2 matrix times a 2-entry column. In chapter ${ref('next')} you can write one yourself in a few lines of Python.</p>
${C.deeper('The tensor product of matrices', `<p>For matrices, A ⊗ B is the block matrix whose block in position (i, j) is the entry a<sub>ij</sub> times the whole matrix B. For example,</p>
${D(`H ⊗ I = (1/√2) ${mat([['1', '0', '1', '0'], ['0', '1', '0', '1'], ['1', '0', '−1', '0'], ['0', '1', '0', '−1']], 'small')}`)}
<p>It satisfies (A ⊗ B)(|u⟩ ⊗ |v⟩) = A|u⟩ ⊗ B|v⟩: applying a gate to each qubit of a product state gives the product of the two results. Notice the pattern in H ⊗ I: row 1 mixes entries 1 and 3, which are the labels |00⟩ and |10⟩. That is the pairs rule in matrix form.</p>`)}

<h2>Why simulation gets hard</h2>
<p>Every extra qubit doubles the number of amplitudes. Stored as complex numbers of 16 bytes each, n qubits need 16 × 2ⁿ bytes:</p>
${C.table(['Qubits', 'Amplitudes', 'Memory'], [
  ['10', '1,024', '16 kB'],
  ['20', 'about 1 million', '17 MB'],
  ['30', 'about 1 billion', '17 GB'],
  ['40', 'about 1 trillion', '18 TB'],
  ['50', 'about 10¹⁵', '18 PB']
], 'compact')}
${C.bench('t-mem', 'Memory for a full state vector')}
<p>This is both the promise and the difficulty of quantum computing. A machine with 50 good qubits holds a state that no ordinary computer can store in full. Yet you can never read the 2ⁿ amplitudes out (chapter ${ref('qubit')}): each run gives just n bits. Quantum algorithms are clever ways to make the answer you want show up in those few bits.</p>
${C.pitfall('Product states are the exception', `<p>If you pick the amplitudes of a two-qubit state at random, the grid is almost never a multiplication table. The states you can build by preparing each qubit separately are a tiny, special family, and everything else is entangled. That is why, in general, all 2ⁿ numbers really are needed.</p>`)}

${C.keyIdea('Independent qubits multiply their amplitudes, and a gate on one qubit acts on pairs of amplitudes. n qubits carry 2ⁿ amplitudes, which is the source of both the power of quantum computers and the difficulty of simulating them.')}
${C.tryThis([
  'In the first panel, set q0 to |+⟩ (θ = π/2, φ = 0) and q1 to |1⟩ (θ = π). Which cells are filled?',
  'Give q1 a relative phase of π and watch which cells change colour.',
  'In the pairs panel, apply H to q2, then to q0. How are the coloured pairs arranged in each case?',
  'Start the pairs panel from |000⟩ and apply H to each of the three qubits in turn. Which state do you end with?',
  'How many qubits can you simulate before the state vector no longer fits in 1 TB?',
  'On paper: write |−⟩ ⊗ |+i⟩ as a list of four amplitudes.'
])}
${C.recap([
  'Two qubits have four basis states |00⟩, |01⟩, |10⟩, |11⟩; n qubits have 2ⁿ. In this course the first bit belongs to q0.',
  'Separately prepared qubits combine by the tensor product: each joint amplitude is a product of one amplitude from each qubit.',
  'The probability of a result on one qubit is the sum over all labels that agree with it.',
  'A gate on one qubit acts on pairs of amplitudes whose labels differ only in that qubit.',
  'A full state vector needs 16 × 2ⁿ bytes, so around 50 qubits is beyond any classical memory.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'How many amplitudes describe a general state of 10 qubits?', options: ['1,024', '10', '20', '100'], answer: 0,
        why: '2¹⁰ = 1,024 complex amplitudes, one for each 10-bit string.' },
      { q: 'What is |1⟩ ⊗ |+⟩?', options: ['(|10⟩ + |11⟩)/√2', '(|01⟩ + |11⟩)/√2', '(|00⟩ + |01⟩)/√2', '(|10⟩ − |11⟩)/√2'], answer: 0,
        why: 'q0 is 1 in every term, and q1 carries (|0⟩ + |1⟩)/√2. With q0 written first, that gives (|10⟩ + |11⟩)/√2.' },
      { q: 'For |ψ⟩ = (1/2)|00⟩ + (1/2)|01⟩ + (1/√2)|11⟩, what is P(q1 = 1)?', options: ['3/4', '1/2', '1/4', '1/√2'], answer: 0,
        why: 'Add the probabilities of the labels with q1 = 1, which are |01⟩ and |11⟩: 1/4 + 1/2 = 3/4.' },
      { q: 'In this course, what does |01⟩ mean?', options: ['q0 = 0 and q1 = 1', 'q0 = 1 and q1 = 0', 'The number 1 on a single qubit', 'The same state as |10⟩'], answer: 0,
        why: 'The first character belongs to q0, the top wire. Qiskit would print this outcome as 10.' },
      { q: 'You apply X to q1 of a two-qubit state. Which amplitudes are paired?', options: ['|00⟩ with |01⟩, and |10⟩ with |11⟩', '|00⟩ with |10⟩, and |01⟩ with |11⟩', '|00⟩ with |11⟩, and |01⟩ with |10⟩', 'All four together'], answer: 0,
        why: 'A gate on q1 pairs labels that differ only in the second bit, and X swaps the two amplitudes in each pair.' },
      { q: 'About how much memory does a full 30-qubit state vector need, at 16 bytes per amplitude?', options: ['17 GB', '480 bytes', '17 MB', '17 TB'], answer: 0,
        why: '2³⁰ ≈ 1.07 billion amplitudes × 16 bytes ≈ 17 GB. The value 480 bytes is 30 × 16, what 30 separate numbers would take.' }
    ]
  });

  /* ===================================================================== 3.2 */
  C.text('multigates', {
    lede: `Controlled gates act on one qubit depending on another. On superpositions they act on every branch at once, which is how qubits become entangled. This chapter covers CNOT, CZ, SWAP and Toffoli, shows how to read their matrices, and explains the surprising effect called phase kickback.`,
    html: `
${C.objectives([
  'Apply CNOT, CZ, SWAP and Toffoli to basis states and to superpositions',
  'Read a two-qubit gate from its 4 × 4 matrix',
  'Build a controlled version of any single-qubit gate',
  'Show how CNOT turns a product state into an entangled one',
  'Explain phase kickback, and why a controlled gate can change its own control'
], ['tensor', 'gates'])}

<h2>CNOT, the controlled NOT</h2>
<p>The most important two-qubit gate is the <b>CNOT</b>, also called controlled-X. One qubit is the <b>control</b> and the other is the <b>target</b>. If the control is 1, X is applied to the target; if the control is 0, nothing happens. On the four basis states, with q0 as control:</p>
${C.table(['Input', 'Output'], [['|00⟩', '|00⟩'], ['|01⟩', '|01⟩'], ['|10⟩', '|11⟩'], ['|11⟩', '|10⟩']], 'compact')}
<p>In short, CNOT sends |a, b⟩ to |a, a ⊕ b⟩, where ⊕ is addition mod 2, also called exclusive or (XOR). In a circuit, the control is drawn as a dot and the target as ⊕:</p>
${C.circ(B => B(2).cx(0, 1), { caption: 'CNOT with q0 as control and q1 as target.', colNums: false })}
<p>Its matrix lists where each input goes, one column per input (chapter ${ref('linalg')}):</p>
${D(`CNOT = ${mat([['1', '0', '0', '0'], ['0', '1', '0', '0'], ['0', '0', '0', '1'], ['0', '0', '1', '0']])}`)}

<h2>On a superposition, CNOT makes entanglement</h2>
<p>On basis states, CNOT is just XOR. On a superposition it acts on every branch at once, because it is linear:</p>
${C.worked('Apply CNOT to |+⟩|0⟩', [
  '|+⟩|0⟩ = (|00⟩ + |10⟩)/√2.',
  'CNOT leaves |00⟩ alone (control 0) and turns |10⟩ into |11⟩ (control 1).',
  'The result is (|00⟩ + |11⟩)/√2.'
], 'This is the Bell state. It cannot be written as a state of q0 times a state of q1: the qubits are now entangled (chapter 3.3).')}
${C.circ(B => B(2).g('H', 0).cx(0, 1), { caption: 'The standard recipe for a Bell pair: H, then CNOT.' })}
<p>Notice what did not happen. CNOT did not copy the superposition into q1, which would give |+⟩|+⟩, a different state. It copied the classical bit in each branch, and the branches became correlated. That is why an unknown quantum state cannot be cloned, even though CNOT looks like a copying gate.</p>

<h2>CZ, SWAP and Toffoli</h2>
<ul>
  <li><b>CZ</b> (controlled-Z) multiplies |11⟩ by −1 and leaves the other three basis states alone. Its matrix is diagonal, with entries 1, 1, 1, −1. It is symmetric: "q0 controls Z on q1" and "q1 controls Z on q0" are the same gate, which is why circuits draw it as two dots.</li>
  <li><b>SWAP</b> exchanges the states of two qubits, so |01⟩ ↔ |10⟩. It can be built from three CNOTs (chapter ${ref('identities')}).</li>
  <li><b>Toffoli</b> (CCX, controlled-controlled-X) flips its target only when both controls are 1: |a, b, c⟩ → |a, b, c ⊕ ab⟩. With the target starting at 0, it computes the AND of a and b without erasing anything. Toffoli gates can build any classical logic circuit, so a quantum computer can run any classical computation.</li>
</ul>
${C.circ(B => B(3).cz(0, 1).swap(1, 2).ccx(0, 1, 2), { caption: 'Left to right: CZ on q0 and q1; SWAP of q1 and q2; Toffoli with controls q0, q1 and target q2.' })}
${C.worked('Apply CZ to |+⟩|+⟩', [
  '|+⟩|+⟩ = (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2.',
  'CZ flips the sign of |11⟩ only, giving (|00⟩ + |01⟩ + |10⟩ − |11⟩)/2.',
  'The entanglement test of chapter 3.3: α₀₀α₁₁ − α₀₁α₁₀ = (1/2)(−1/2) − (1/2)(1/2) = −1/2, which is not 0.'
], 'CZ entangles |+⟩|+⟩ even though it only changes a sign. Apply H to q1 afterwards and you get the Bell state.')}
${C.bench('mg', 'Controlled-gate bench', 'Pick a gate and an input for each qubit')}

<h2>Controlled versions of any gate</h2>
<p>Any single-qubit gate U can be controlled: apply U to the target only in the branch where the control is |1⟩. Using the outer products from chapter ${ref('linalg')}, with q0 as control,</p>
${F('C-U = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U')}
<p>As a matrix this is block diagonal: the 2 × 2 identity in the top-left corner (control 0, leave alone) and U in the bottom-right (control 1, apply U). CNOT is controlled-X and CZ is controlled-Z. The Circuit Lab lets you put a control dot on any gate, and an open circle ○ controls on |0⟩ instead of |1⟩.</p>
${C.bench('anatomy', 'Inside a controlled gate', 'Choose U and which qubit controls')}

<h2>Phase kickback</h2>
<p>Here is the most important trick in quantum algorithms. Give CNOT the control |+⟩ and the target |−⟩. The target |−⟩ is an eigenvector of X with eigenvalue −1 (chapter ${ref('eigen')}), so flipping it only multiplies it by −1:</p>
${C.worked('Apply CNOT to |+⟩|−⟩', [
  'Split the control into its two branches: |+⟩|−⟩ = (1/√2)(|0⟩|−⟩ + |1⟩|−⟩).',
  'In the |0⟩ branch nothing happens. In the |1⟩ branch X acts on the target, and X|−⟩ = −|−⟩.',
  'The result is (1/√2)(|0⟩|−⟩ − |1⟩|−⟩) = ((|0⟩ − |1⟩)/√2)|−⟩ = |−⟩|−⟩.'
], 'The target did not change at all, yet the control went from |+⟩ to |−⟩. The −1 was kicked back onto the control.')}
<p>The same happens for any controlled-U whose target is an eigenvector of U with eigenvalue e<sup>iφ</sup>: the control picks up the relative phase e<sup>iφ</sup> on its |1⟩ branch. A phase that would be global if U acted on the target alone becomes a relative phase on the control, and so a measurable one. Deutsch–Jozsa, Bernstein–Vazirani, phase estimation and Shor’s algorithm all run on this effect (Part V).</p>
<p>It also explains a puzzle from chapter ${ref('gates')}. Rz(λ) and P(λ) differ only by a global phase, yet controlled-Rz(λ) and controlled-P(λ) are different gates. Controlling a gate turns its global phase into a relative phase on the control.</p>
${C.deeper('Why kickback works for any eigenvector', `<p>Let U|u⟩ = e<sup>iφ</sup>|u⟩. Then</p>
${C.align([
  ['C-U (α|0⟩ + β|1⟩)|u⟩', 'α|0⟩|u⟩ + β|1⟩ U|u⟩', ''],
  ['', 'α|0⟩|u⟩ + β e<sup>iφ</sup> |1⟩|u⟩', ''],
  ['', '(α|0⟩ + e<sup>iφ</sup> β|1⟩) |u⟩', '']
])}
<p>The target is unchanged and the control has gained the phase e<sup>iφ</sup> on |1⟩. Phase estimation (chapter ${ref('qft')}) repeats this with U, U², U⁴, … to read φ out one bit at a time.</p>`)}
${C.pitfall('"Control" and "target" depend on the basis', `<p>It is tempting to think information only flows from the control to the target. Phase kickback shows otherwise. In fact, if you apply H to both qubits before and after a CNOT, the roles swap completely: the result is a CNOT controlled by q1 that targets q0. Chapter ${ref('identities')} checks this.</p>`)}

${C.keyIdea('A controlled gate is an "if" that never looks: it acts on every branch of the superposition at once. That is how entanglement is made, and it is why the control qubit can change even when the target does not.')}
${C.tryThis([
  'CNOT with q0 = |+⟩ and q1 = |0⟩. Is the output a product state?',
  'CNOT with q0 = |+⟩ and q1 = |−⟩. Which qubit changed?',
  'CZ with |+⟩|+⟩. Compare the output with CNOT on |+⟩|0⟩.',
  'Toffoli with q0 = |1⟩, q1 = |+⟩ and q2 = |0⟩. Which simpler gate does it act like?',
  'In the anatomy panel, switch between "q0 controls q1" and "q1 controls q0" for X. Where does the X block move?',
  'On paper: apply CNOT (q0 controls q1) to (|01⟩ + |10⟩)/√2. Is the result entangled?'
])}
${C.recap([
  'CNOT sends |a, b⟩ to |a, a ⊕ b⟩, and on a superposition it acts on every branch at once.',
  'H then CNOT turns |00⟩ into the Bell state (|00⟩ + |11⟩)/√2, an entangled state.',
  'CZ flips the sign of |11⟩ and is symmetric. SWAP exchanges two qubits. Toffoli is a reversible AND.',
  'Controlled-U = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U, block diagonal when q0 is the control.',
  'Phase kickback: if the target is an eigenvector of U, the eigenvalue appears as a relative phase on the control.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'What does CNOT (control q0) do to |10⟩?', options: ['Turns it into |11⟩', 'Leaves it alone', 'Turns it into |01⟩', 'Turns it into −|10⟩'], answer: 0,
        why: 'The control q0 is 1, so X flips the target q1 from 0 to 1.' },
      { q: 'What is CNOT applied to |+⟩|0⟩?', options: ['(|00⟩ + |11⟩)/√2', '|+⟩|+⟩', '(|00⟩ + |10⟩)/√2', '|+⟩|1⟩'], answer: 0,
        why: '|+⟩|0⟩ = (|00⟩ + |10⟩)/√2, and CNOT turns |10⟩ into |11⟩. The result is the entangled Bell state, not the copy |+⟩|+⟩.' },
      { q: 'CNOT acts on control |+⟩ and target |−⟩. What changes?', options: ['Only the control, which becomes |−⟩', 'Only the target', 'Both', 'Nothing'], answer: 0,
        why: 'Phase kickback: |−⟩ is an eigenvector of X with eigenvalue −1, so the control’s |1⟩ branch picks up a minus sign.' },
      { q: 'Which gate is symmetric, so that it does not matter which qubit is called the control?', options: ['CZ', 'CNOT', 'Controlled-H', 'Toffoli'], answer: 0,
        why: 'CZ only multiplies |11⟩ by −1, and |11⟩ looks the same from either qubit.' },
      { q: 'What does the matrix of a controlled-U look like when q0 is the control?', options: ['Block diagonal, with I in the top-left and U in the bottom-right', 'U in the top-left and I in the bottom-right', 'U ⊗ U', 'All zeros except the diagonal'], answer: 0,
        why: 'Controlled-U = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U. The labels with q0 = 0 come first, and on them the gate does nothing.' },
      { q: 'A Toffoli gate has controls q0 and q1 and target q2. When does it flip q2?', options: ['Only when q0 and q1 are both 1', 'When either q0 or q1 is 1', 'Always', 'Only when q2 starts at 1'], answer: 0,
        why: 'Toffoli applies X to the target only in the branch where both controls are 1, so with the target starting at 0 it computes q0 AND q1.' }
    ]
  });

  /* ===================================================================== 3.3 */
  C.text('entangle', {
    lede: `Entangled qubits share one state that cannot be split into a state for each qubit. Each qubit alone looks random, yet together they are perfectly correlated, in a way that no classical system can imitate.`,
    html: `
${C.objectives([
  'Decide whether a two-qubit state is a product state or entangled',
  'Work out what happens to one qubit when the other qubit of a pair is measured',
  'Explain why an entangled qubit has no Bloch vector of length 1',
  'Know the four Bell states and how to make them',
  'Explain the CHSH game, and why entanglement beats every classical strategy without sending signals'
], ['tensor', 'multigates', 'measure'])}

<h2>Product or entangled?</h2>
<p>A two-qubit state is a <b>product state</b> if it can be written as |a⟩ ⊗ |b⟩, with one state per qubit. Otherwise it is <b>entangled</b>. Chapter ${ref('tensor')} showed that a product state has amplitudes α<sub>ij</sub> = a<sub>i</sub>b<sub>j</sub>, so α₀₀α₁₁ = a₀b₀a₁b₁ = α₀₁α₁₀. That gives a one-line test:</p>
${F('a two-qubit state is a product exactly when α₀₀α₁₁ − α₀₁α₁₀ = 0')}
${C.worked('Test three states', [
  '(|00⟩ + |01⟩ + |10⟩ + |11⟩)/2: (1/2)(1/2) − (1/2)(1/2) = 0. A product state: it is |+⟩|+⟩.',
  '(|00⟩ + |11⟩)/√2: (1/√2)(1/√2) − 0 · 0 = 1/2. Entangled.',
  '(|00⟩ + |01⟩ + |11⟩)/√3: (1/√3)(1/√3) − (1/√3) · 0 = 1/3. Entangled, though less than the Bell state.'
], 'This simple test works for pure states of two qubits, which covers everything in this chapter.')}
${C.deeper('Where the test comes from', `<p>Arrange the amplitudes in a 2 × 2 grid, with q0 labelling the rows and q1 the columns. A product state’s grid is a multiplication table, so its two rows are multiples of the same vector (b₀, b₁). Two rows are multiples of one vector exactly when the grid’s determinant, α₀₀α₁₁ − α₀₁α₁₀, is zero. For more qubits, or for noisy states, deciding entanglement is much harder. The general tool for two parts of a pure state is the Schmidt decomposition; for two qubits it boils down to this determinant.</p>`)}

<h2>Measuring one qubit of a pair</h2>
<p>Measuring only q0 follows the same rule as before, applied to the labels. The probability that q0 reads 0 is the sum over the labels that start with 0. Afterwards only those labels survive, divided by the square root of that probability so that the state is normalized again:</p>
${C.align([
  ['P(q0 = 0)', '|α₀₀|² + |α₀₁|²', ''],
  ['state after reading 0', '(α₀₀|00⟩ + α₀₁|01⟩) / √P(q0 = 0)', 'cross out the labels with q0 = 1, then renormalize']
])}
${C.worked('Measure q0 of the Bell state', [
  'For (|00⟩ + |11⟩)/√2, P(q0 = 0) = 1/2 and P(q0 = 1) = 1/2.',
  'If q0 reads 0, only |00⟩ survives, so q1 is now |0⟩.',
  'If q0 reads 1, only |11⟩ survives, so q1 is now |1⟩.'
], 'Before the measurement q1 was a fair coin. Afterwards it is certain, and it always agrees with q0.')}
${C.worked('Measure q0 of (|00⟩ + |01⟩ + |11⟩)/√3', [
  'P(q0 = 0) = 1/3 + 1/3 = 2/3 and P(q0 = 1) = 1/3.',
  'Reading 0 keeps (|00⟩ + |01⟩)/√3. Dividing by √(2/3) gives (|00⟩ + |01⟩)/√2 = |0⟩|+⟩.',
  'Reading 1 keeps |11⟩/√3. Dividing by √(1/3) gives |11⟩.'
], 'The result on q0 decides which state q1 is left in: |+⟩ or |1⟩.')}
${C.bench('partial-meas', 'Measure one qubit of a pair', 'Choose a state and a qubit, then measure')}

<h2>No state of its own</h2>
<p>Ask for the Bloch vector of q0 alone in the Bell state. Its z coordinate is P(q0 = 0) − P(q0 = 1) = 0, and its x and y coordinates turn out to be 0 as well. So the arrow has length 0: on its own, each qubit of a Bell pair is a perfectly random coin along every axis. For a partly entangled state the arrow has a length between 0 and 1. A qubit whose arrow is shorter than 1 is in a <b>mixed state</b>, which chapter ${ref('noise')} describes in detail.</p>
<p>The information has not vanished. It sits in the correlations between the qubits, which no single-qubit picture can show. For a pure two-qubit state, a standard measure of how entangled it is uses the length |r| of either qubit’s arrow (both have the same length):</p>
${F('S = −λ log₂ λ − (1 − λ) log₂(1 − λ), &nbsp; with λ = (1 + |r|)/2')}
<p>This is the <b>entanglement entropy</b>. It is 0 bits for a product state, where |r| = 1, and 1 bit for a Bell state, where |r| = 0.</p>
${C.bench('e-dial', 'The entangler: Ry(θ) then CNOT', 'Turn θ from 0 to π/2 and watch both arrows shrink')}
${C.worked('How entangled is Ry(θ) followed by CNOT?', [
  'Ry(θ) on q0 gives (cos(θ/2)|0⟩ + sin(θ/2)|1⟩)|0⟩, and CNOT turns this into cos(θ/2)|00⟩ + sin(θ/2)|11⟩.',
  'The test: α₀₀α₁₁ − α₀₁α₁₀ = cos(θ/2) sin(θ/2) = (1/2) sin θ. The state is entangled for every θ strictly between 0 and π.',
  'For q0 alone, z = cos²(θ/2) − sin²(θ/2) = cos θ and x = y = 0, so |r| = |cos θ|.',
  'At θ = π/2 the arrow has length 0 and S = 1 bit: a Bell state. At θ = π/3, |r| = 1/2, λ = 3/4 and S ≈ 0.81 bits.'
])}

<h2>The four Bell states</h2>
<p>Adding an X, a Z, or both to one qubit of the Bell pair gives three more maximally entangled states:</p>
${C.table(['State', 'Amplitudes', 'Recipe from |00⟩'], [
  ['|Φ⁺⟩', '(|00⟩ + |11⟩)/√2', 'H on q0, then CNOT'],
  ['|Φ⁻⟩', '(|00⟩ − |11⟩)/√2', 'then Z on q0'],
  ['|Ψ⁺⟩', '(|01⟩ + |10⟩)/√2', 'then X on q0'],
  ['|Ψ⁻⟩', '(|01⟩ − |10⟩)/√2', 'then X and Z on q0']
], 'compact')}
<p>The four are orthogonal to each other, so they form a basis of the two-qubit space, the <b>Bell basis</b>. Teleportation and superdense coding (chapter ${ref('teleport')}) depend on it. Remarkably, whoever holds one qubit of |Φ⁺⟩ can turn it into any of the other three by acting on that one qubit alone.</p>
${C.bench('e-bell', 'Bell basis')}

<h2>Stronger than any classical correlation</h2>
<p>Measure both qubits of |Φ⁺⟩ in the Z basis and the two bits always agree. Measure both in the X basis and they always agree again. Could the pair simply carry answers agreed in advance, like two sealed envelopes holding matching notes? In 1964 John Bell showed that experiments can settle this question. The cleanest version is the <b>CHSH game</b>, named after Clauser, Horne, Shimony and Holt.</p>
<p>Alice and Bob each get one qubit. Alice measures along one of two directions, a or a′, and Bob along b or b′, all in the x–z plane of the Bloch sphere. Each records +1 or −1. For each pair of settings they compute the correlation E: the average of the product of their two results. Then they combine four correlations:</p>
${F('S = E(a, b) − E(a, b′) + E(a′, b) + E(a′, b′)')}
${C.worked('Why answers agreed in advance give |S| ≤ 2', [
  'Suppose each pair carries fixed answers: A and A′ for Alice’s two settings, B and B′ for Bob’s, each +1 or −1.',
  'The combination for one pair is AB − AB′ + A′B + A′B′ = A(B − B′) + A′(B + B′).',
  'B and B′ are each ±1, so one of B − B′ and B + B′ is 0 and the other is ±2. The combination is therefore ±2.',
  'S is an average of such numbers, so |S| ≤ 2.'
], 'No list of answers written in advance can do better, however clever.')}
<p>For |Φ⁺⟩, measurements along directions at angles α and β in the x–z plane have correlation E = cos(α − β).</p>
${C.worked('The quantum value', [
  'Choose a = 0, a′ = π/2, b = π/4 and b′ = 3π/4.',
  'E(a, b) = cos(−π/4) ≈ 0.707, E(a, b′) = cos(−3π/4) ≈ −0.707, E(a′, b) = cos(π/4) ≈ 0.707 and E(a′, b′) = cos(−π/4) ≈ 0.707.',
  'S ≈ 0.707 + 0.707 + 0.707 + 0.707 = 2√2 ≈ 2.83.'
], 'Entangled qubits beat the classical limit of 2. Experiments since the 1980s, including loophole-free tests in 2015, measure values close to 2√2, and the 2022 Nobel Prize in Physics recognized this work.')}
${C.bench('e-chsh', 'The CHSH game', 'For this state E(α, β) = cos(α − β)')}
<p>Noise mixes the pair with random states and multiplies every correlation by 1 − p, so S = 2√2 (1 − p). The quantum advantage disappears once p is above 1 − 1/√2 ≈ 0.29.</p>

<h2>Entanglement cannot send messages</h2>
<p>When Alice measures her qubit, Bob’s qubit changes at once, as the partial-measurement panel showed. Could Alice use that to signal to Bob faster than light? No. Bob does not know Alice’s result, so from his side his qubit is a fair coin before and after, whatever Alice measured and whenever she measured it. The correlations only appear when the two lists of results are brought together, which needs an ordinary channel. This is the <b>no-signalling</b> principle. Teleportation (chapter ${ref('teleport')}) uses entanglement together with two classical bits, and it needs both.</p>
${C.pitfall('Entanglement is more than correlation', `<p>Two coins glued together to show the same face are correlated too. What makes |Φ⁺⟩ different is that its qubits agree along every axis, Z and X alike, and that it beats the CHSH limit of 2. No hidden list of answers can do either.</p>`)}

${C.keyIdea('Entangled qubits have no individual states: their arrows shrink inside the sphere, and the information lives in the correlations. Those correlations beat every classical strategy, yet on their own they cannot carry a message.')}
${C.tryThis([
  'In the partial-measurement panel, choose the product state |+⟩|0⟩ and measure q0. Does q1 change?',
  'Choose the Bell state and measure q1 instead of q0. Compare the two branches with the q0 case.',
  'In the entangler, set θ = π/2. Run 1,000 shots with both Z, then with both X. Which outcomes never happen?',
  'Find the θ for which the entanglement entropy is 0.5 bits.',
  'In the CHSH game, set a = b and a′ = b′. What is S now?',
  'Raise the noise until S drops below 2. Compare with the 0.29 predicted above.'
])}
${C.recap([
  'A two-qubit pure state is a product exactly when α₀₀α₁₁ − α₀₁α₁₀ = 0. Otherwise it is entangled.',
  'Measuring one qubit keeps only the matching labels, renormalized, and the result decides the other qubit’s state.',
  'An entangled qubit on its own has a Bloch vector shorter than 1; for a Bell state the length is 0.',
  'The four Bell states form a basis, made with H, CNOT and an X or Z on one qubit.',
  'Answers agreed in advance give |S| ≤ 2 in the CHSH game; entangled qubits reach 2√2.',
  'Entanglement cannot send a message: the correlations only show when results are compared over an ordinary channel.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'Which state is entangled?', options: ['(|00⟩ + |11⟩)/√2', '(|00⟩ + |01⟩)/√2', '|+⟩ ⊗ |−⟩', '(|00⟩ + |01⟩ + |10⟩ + |11⟩)/2'], answer: 0,
        why: 'For (|00⟩ + |11⟩)/√2, α₀₀α₁₁ − α₀₁α₁₀ = 1/2, not 0. The others are |0⟩|+⟩, |+⟩|−⟩ and |+⟩|+⟩.' },
      { q: 'In the Bell state (|00⟩ + |11⟩)/√2, you measure q0 and get 1. What is q1 now?', options: ['|1⟩', '|0⟩', '|+⟩', 'Still a fair coin'], answer: 0,
        why: 'Only the label |11⟩ has q0 = 1, so after the measurement the state is |11⟩.' },
      { q: 'What is the Bloch vector of one qubit of a Bell pair?', options: ['The zero vector, of length 0', 'A unit vector along z', 'A unit vector on the equator', 'It depends on which qubit you pick'], answer: 0,
        why: 'Each qubit alone is a fair coin along every axis, so ⟨X⟩ = ⟨Y⟩ = ⟨Z⟩ = 0.' },
      { q: 'What is the largest CHSH value S that any strategy with answers agreed in advance can reach?', options: ['2', '2√2', '4', '1'], answer: 0,
        why: 'With fixed answers, A(B − B′) + A′(B + B′) is always ±2, so the average is at most 2. Entangled qubits reach 2√2.' },
      { q: 'Alice measures her half of a Bell pair. What does Bob see if he measures his half straight away, without hearing from Alice?', options: ['A fair coin, exactly as before', 'Always the same bit as Alice, which tells him her result', 'Always 0', 'Nothing, because his qubit is destroyed'], answer: 0,
        why: 'Bob’s results do agree with Alice’s, but without her result he only sees random bits. That is why entanglement alone cannot send a message.' },
      { q: 'Which gates turn |00⟩ into (|01⟩ − |10⟩)/√2?', options: ['H on q0, CNOT, then X and Z on q0', 'H on both qubits', 'CNOT alone', 'H on q0, then CNOT'], answer: 0,
        why: 'H and CNOT make (|00⟩ + |11⟩)/√2. X on q0 gives (|10⟩ + |01⟩)/√2, and Z on q0 then flips the sign of |10⟩.' }
    ]
  });
})(window);

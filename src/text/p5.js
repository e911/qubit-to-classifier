/* Words for Part V, algorithms. Interactive panels live in src/ch5.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref, mat = C.mat, PI = Math.PI;

  /* ===================================================================== 5.1 */
  C.text('teleport', {
    lede: `Shared entanglement plus two classical bits moves a qubit’s state from Alice to Bob without sending the qubit itself. Run backwards, the same idea sends two classical bits by mailing a single qubit. Both show entanglement at work as a resource.`,
    html: `
${C.objectives([
  'Explain why an unknown quantum state cannot be copied',
  'Follow the teleportation circuit step by step, including its four measurement branches',
  'Say exactly what is sent: two classical bits, no faster-than-light signal and no copy',
  'Send two classical bits with one qubit using superdense coding',
  'Treat entanglement as a resource that is used up'
], ['entangle', 'multigates', 'measure'])}

<h2>The problem: moving a state you cannot read</h2>
<p>Alice holds a qubit in a state |ψ⟩ = α|0⟩ + β|1⟩ that nobody knows. She wants Bob, far away, to end up with a qubit in the same state. She cannot measure α and β and phone them over, because a measurement returns one bit and destroys the superposition (chapter ${ref('qubit')}). Nor can she make a copy to measure at leisure: unknown quantum states cannot be copied at all.</p>
${C.deeper('Why an unknown state cannot be copied', `<p>Suppose some unitary U copied every state: U|ψ⟩|0⟩ = |ψ⟩|ψ⟩. Then U|0⟩|0⟩ = |0⟩|0⟩ and U|1⟩|0⟩ = |1⟩|1⟩. Since U is linear, U(|+⟩|0⟩) = (|00⟩ + |11⟩)/√2, the Bell state. But a copier should produce |+⟩|+⟩ = (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2, which is different. So no such U exists. This is the <b>no-cloning theorem</b>. Copying known basis states is fine, and a CNOT does exactly that; copying unknown superpositions is impossible.</p>`)}

<h2>Teleportation in four steps</h2>
<p>Alice and Bob make a Bell pair (|00⟩ + |11⟩)/√2 in advance, and each keeps one qubit. Later, with q0 holding the message, q1 holding Alice’s half of the pair and q2 holding Bob’s half:</p>
<ol>
  <li><b>Entangle.</b> Alice applies a CNOT from q0 to q1, then H to q0.</li>
  <li><b>Measure.</b> Alice measures q0 and q1, getting two bits m₀m₁.</li>
  <li><b>Send.</b> She sends those two bits to Bob over an ordinary channel.</li>
  <li><b>Correct.</b> Bob applies X if m₁ = 1, then Z if m₀ = 1. His qubit is now in the state |ψ⟩.</li>
</ol>
${C.circ(B => B(3).g('H', 1).cx(1, 2).cx(0, 1).g('H', 0).col([[0, { g: 'M' }], [1, { g: 'M' }]]).cx(1, 2).cz(0, 2), { inputs: ['|ψ⟩', '|0⟩', '|0⟩'], caption: 'Teleportation. The first two gates make the Bell pair. The last two are Bob’s corrections, controlled by Alice’s results.' })}
${C.worked('Why Bob’s qubit is already almost right', [
  'Before Alice acts, the three qubits are |ψ⟩ ⊗ (|00⟩ + |11⟩)/√2 = (1/√2)(α|000⟩ + α|011⟩ + β|100⟩ + β|111⟩).',
  'Rewrite Alice’s two qubits in the Bell basis of chapter 3.3. The algebra gives (1/2)[ |Φ⁺⟩(α|0⟩ + β|1⟩) + |Φ⁻⟩(α|0⟩ − β|1⟩) + |Ψ⁺⟩(α|1⟩ + β|0⟩) + |Ψ⁻⟩(α|1⟩ − β|0⟩) ], with Bob’s qubit written last.',
  'Alice’s CNOT and H turn the four Bell states into |00⟩, |10⟩, |01⟩ and |11⟩, so her measurement picks one of the four terms, each with probability 1/4.',
  'In each term Bob already holds |ψ⟩ with a known error: none, Z, X, or XZ. Alice’s two bits tell him which one, and he undoes it.'
], 'At no point did anyone need to know α or β.')}
${C.bench('tp', 'Teleportation, step by step', 'Grey arrow on q2 = the original message')}
${C.bench('tp-branches', 'The four branches', 'Change the message and watch every branch')}
<p>Three things are worth noticing. The four results are equally likely whatever |ψ⟩ is, so Alice’s two bits reveal nothing about the state. Until Bob receives them, his qubit on its own is a fair coin, so nothing travels faster than light. And Alice’s qubit ends up measured, so the state was moved, not copied.</p>
${C.pitfall('Teleportation moves a state, not matter', `<p>Nothing physical flies from Alice to Bob except two classical bits. Bob’s qubit was with him all along; what moves is the information that defines its state. The entangled pair is used up in the process, so teleporting another qubit needs a fresh pair.</p>`)}

<h2>Superdense coding</h2>
<p>Run the idea backwards. Alice and Bob share a Bell pair, and Alice wants to send two classical bits. By acting on her qubit alone she turns the pair into one of the four Bell states (chapter ${ref('entangle')}). Then she mails her single qubit to Bob. Bob now holds both qubits and reads the Bell state by applying a CNOT, then H, and measuring.</p>
${C.table(['Bits', 'Alice applies', 'Bell state sent', 'Bob reads'], [
  ['00', 'nothing', '|Φ⁺⟩', '00'], ['01', 'X', '|Ψ⁺⟩', '01'], ['10', 'Z', '|Φ⁻⟩', '10'], ['11', 'X, then Z', '|Ψ⁻⟩', '11']
], 'compact')}
${C.bench('sd', 'Superdense coding', 'Choose the two bits to send')}
<p>Two classical bits travelled inside one qubit. That does not break Holevo’s limit from chapter ${ref('qubit')}, because two qubits were involved in total: Bob’s half was delivered earlier, when the pair was shared.</p>

${C.keyIdea('Teleportation: one shared entangled pair plus two classical bits moves one unknown qubit state. Superdense coding: one shared entangled pair plus one qubit carries two classical bits. Either way, entanglement is a resource you spend.')}
${C.tryThis([
  'Step the teleportation circuit to the end, then press "New outcomes" several times. Does q2 always match the grey arrow?',
  'In the teleportation circuit, stop just before the measurements. Which single-qubit arrows have length 0?',
  'In the four-branches panel, move the message to |0⟩. In which branches does Bob already hold exactly |0⟩ before correcting?',
  'Send each of the four messages with superdense coding. Which Bell state does each one create?',
  'Why can Bob learn nothing about |ψ⟩ before Alice’s bits arrive? Look at the four branch probabilities.'
])}
${C.recap([
  'An unknown quantum state cannot be copied (no cloning), and measuring it destroys it.',
  'Teleportation: Alice entangles the message with her half of a Bell pair, measures two bits and sends them; Bob applies X and/or Z.',
  'Each of Alice’s four results has probability 1/4, so her bits reveal nothing about the state and nothing travels faster than light.',
  'Superdense coding: with a shared pair, one transmitted qubit carries two classical bits.',
  'Both protocols use up one entangled pair.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'In teleportation, how many classical bits must Alice send to Bob?', options: ['Two', 'None', 'One', 'As many as it takes to describe α and β'], answer: 0,
        why: 'Her two measurement results tell Bob which of four corrections to apply.' },
      { q: 'Before Bob receives Alice’s bits, what does his qubit look like on its own?', options: ['A fair coin along every axis', 'Exactly |ψ⟩', 'Exactly |0⟩', '|ψ⟩ with a small phase error'], answer: 0,
        why: 'Averaged over Alice’s four equally likely results, Bob’s qubit is maximally mixed. That is why teleportation cannot send a signal faster than light.' },
      { q: 'Why is teleportation not a copy of the state?', options: ['Alice’s qubit is measured and no longer holds the state', 'Bob only receives an approximation', 'The two states differ by a global phase', 'It is a copy; the no-cloning theorem does not apply'], answer: 0,
        why: 'Once Alice measures, her qubit is in a basis state. At the end only Bob’s qubit holds |ψ⟩.' },
      { q: 'Alice measures m₀ = 1 and m₁ = 0. What does Bob do?', options: ['Applies Z', 'Applies X', 'Applies X, then Z', 'Nothing'], answer: 0,
        why: 'With m₀ = 1 and m₁ = 0, Bob holds Z|ψ⟩, and Z undoes itself.' },
      { q: 'In superdense coding, how many qubits does Alice send to transmit two bits?', options: ['One', 'Two', 'None', 'Four'], answer: 0,
        why: 'She mails only her half of the pair. Bob’s half was shared earlier.' },
      { q: 'Why can no machine copy an arbitrary unknown state?', options: ['A copier that works on |0⟩ and |1⟩ would, by linearity, turn |+⟩|0⟩ into an entangled state instead of |+⟩|+⟩', 'Copying would need infinite energy', 'Qubits cannot be measured', 'Only because current hardware is noisy'], answer: 0,
        why: 'Linearity fixes what the machine does to superpositions once it is fixed on basis states, and the result is not a copy.' }
    ]
  });

  /* ===================================================================== 5.2 */
  C.text('oracles', {
    lede: `A quantum algorithm can learn a global property of a function from a single call, by turning the function’s answers into phases and letting them interfere. This chapter builds that machinery and uses it for the Deutsch–Jozsa and Bernstein–Vazirani algorithms.`,
    html: `
${C.objectives([
  'Describe an oracle as a reversible circuit for a function',
  'Turn function values into phases with phase kickback',
  'Compute the Hadamard transform of a basis state with the sign rule (−1)<sup>x·y</sup>',
  'Solve Deutsch’s problem with one query, by hand',
  'Run Deutsch–Jozsa and Bernstein–Vazirani, and compare their query counts with classical methods'
], ['multigates', 'interference'])}

<h2>Oracles: functions as circuits</h2>
<p>Many quantum algorithms are stated in terms of a black box, called an <b>oracle</b>, that computes a function f from n bits to one bit. You cannot look inside it; you can only call it. The question is how many calls, called <b>queries</b>, you need to learn something about f.</p>
<p>Quantum gates must be reversible, but a function such as "f(x) = 0 for every x" throws information away. The standard fix keeps the input and adds the answer to an extra qubit, called the <b>ancilla</b>:</p>
${F('U<sub>f</sub> |x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩')}
<p>Applying U<sub>f</sub> twice gives back the input, because y ⊕ f(x) ⊕ f(x) = y, so U<sub>f</sub> is reversible. It can always be built from CNOTs and Toffolis (chapter ${ref('multigates')}).</p>

<h2>From answers to phases</h2>
<p>Prepare the ancilla in |−⟩ = (|0⟩ − |1⟩)/√2. If f(x) = 0 the ancilla is untouched; if f(x) = 1 it is flipped, and X|−⟩ = −|−⟩. Either way,</p>
${F('U<sub>f</sub> |x⟩|−⟩ = (−1)<sup>f(x)</sup> |x⟩|−⟩')}
<p>The answer has become a sign on |x⟩, and the ancilla is left as it was. This is phase kickback (chapter ${ref('multigates')}). On a superposition of inputs, every input gets its own sign, all for the price of one query.</p>

<h2>Deutsch’s problem: the smallest example</h2>
<p>Take a function f from one bit to one bit. There are four such functions: f(x) = 0, f(x) = 1, f(x) = x and f(x) = 1 − x. The first two are <b>constant</b>, and the last two are <b>balanced</b>: 0 for one input and 1 for the other. A classical computer must query f twice to tell which kind it has. A quantum computer needs one query.</p>
${C.worked('Deutsch’s algorithm', [
  'Start with the input qubit in |0⟩ and the ancilla in |−⟩. Apply H to the input: (|0⟩ + |1⟩)/√2.',
  'Query once. Kickback gives ((−1)<sup>f(0)</sup>|0⟩ + (−1)<sup>f(1)</sup>|1⟩)/√2.',
  'If f is constant, the two signs are equal and the input is ±|+⟩. If f is balanced, they differ and the input is ±|−⟩.',
  'Apply H and measure: ±|+⟩ gives 0 and ±|−⟩ gives 1, with certainty.'
], 'One query decides whether f(0) = f(1). The individual values f(0) and f(1) are never learned, only how they relate.')}
${C.circ(B => B(2).g('H', 0).cx(0, 1).g('H', 0).m(0), { inputs: ['|0⟩', '|−⟩'], caption: 'Deutsch’s algorithm for the balanced function f(x) = x, whose oracle is a single CNOT.' })}

<h2>Hadamards on many qubits</h2>
<p>With n input qubits, H on every qubit sends |0…0⟩ to the equal superposition of all 2ⁿ inputs. Applied to a general basis state |x⟩, it gives</p>
${F('H<sup>⊗n</sup> |x⟩ = (1/√2ⁿ) Σ<sub>y</sub> (−1)<sup>x·y</sup> |y⟩')}
<p>where x·y = x₀y₀ + x₁y₁ + ⋯ mod 2 is the parity of the positions where both strings have a 1. The sign of each term is set by that parity.</p>
${C.worked('H ⊗ H applied to |10⟩', [
  'H|1⟩ = (|0⟩ − |1⟩)/√2 and H|0⟩ = (|0⟩ + |1⟩)/√2.',
  'Multiply out: (|0⟩ − |1⟩)(|0⟩ + |1⟩)/2 = (|00⟩ + |01⟩ − |10⟩ − |11⟩)/2.',
  'Check with the formula for x = 10: x·y = 1 when y = 10 or 11, and 0 when y = 00 or 01. Those are exactly the two minus signs.'
])}
<p>Putting the pieces together, after Hadamards, the oracle and Hadamards again, the amplitude of output y is</p>
${F('amplitude of |y⟩ = (1/2ⁿ) Σ<sub>x</sub> (−1)<sup>f(x) + x·y</sup>')}
<p>Read it as a comparison: it measures how well the sign pattern (−1)<sup>f(x)</sup> agrees with the parity pattern (−1)<sup>x·y</sup>. Try it for any function in the panel below.</p>
${C.bench('walsh', 'The Hadamard transform as a pattern detector', 'Edit the function and watch the outputs')}

<h2>Deutsch–Jozsa</h2>
<p>The promise: f is either constant or balanced, meaning 0 on exactly half of the 2ⁿ inputs. The amplitude of the all-zeros output y = 0…0 is the average of (−1)<sup>f(x)</sup>: ±1 if f is constant and 0 if it is balanced. So a single query decides with certainty. Measure: if every bit is 0, f is constant, and otherwise it is balanced.</p>
<p>A deterministic classical algorithm can need 2ⁿ⁻¹ + 1 queries in the worst case, because the first half of the inputs it tries might all give the same answer.</p>
${C.bench('or', 'Oracle lab', 'Pick a function, then step through')}

<h2>Bernstein–Vazirani</h2>
<p>Now the promise is that f(x) = s·x mod 2 for some hidden n-bit string s. The sign pattern (−1)<sup>s·x</sup> matches exactly one parity pattern, the one for y = s. So after the final Hadamards the inputs read s with certainty: one query reveals all n bits. Classically, each query reveals at most one bit of s, so n queries are needed.</p>
${C.worked('Bernstein–Vazirani with s = 101', [
  'The oracle is two CNOTs onto the ancilla, from q0 and from q2, because s has 1s in those positions.',
  'After the first Hadamards and the oracle, the input x carries the sign (−1)<sup>x₀ + x₂</sup>.',
  'That is exactly (−1)<sup>x·101</sup>, the parity pattern of y = 101.',
  'The final Hadamards turn this pattern into the single basis state |101⟩.'
], 'Choose "Bernstein–Vazirani s·x" in the oracle lab to watch it happen.')}
${C.pitfall('These speed-ups are modest in practice', `<p>A randomized classical algorithm settles Deutsch–Jozsa with high confidence after a handful of random queries, and Bernstein–Vazirani’s advantage is one query instead of n. Their value is the mechanism: query in superposition, write the answers as phases, and read out a global pattern with Hadamards. Simon’s algorithm and Shor’s algorithm use the same mechanism to reach an exponential advantage.</p>`)}

${C.keyIdea('Phase kickback turns function values into phases, and Hadamards turn global patterns in those phases into a single measurable bit string.')}
${C.tryThis([
  'In the pattern panel, start from "Constant 0" and flip one value. How does the probability of the all-zeros output change?',
  'Build a balanced function that is not linear. Where does the probability go?',
  'Choose "Linear: f = s·x" and check that the output is 11…1.',
  'In the oracle lab, step through the constant-1 oracle. Why does the X on the ancilla make no visible difference?',
  'On paper: run Deutsch’s algorithm for f(x) = 1 − x.'
])}
${C.recap([
  'An oracle computes f reversibly: |x⟩|y⟩ → |x⟩|y ⊕ f(x)⟩.',
  'With the ancilla in |−⟩, the oracle writes (−1)<sup>f(x)</sup> onto |x⟩: phase kickback.',
  'H<sup>⊗n</sup>|x⟩ = (1/√2ⁿ) Σ<sub>y</sub> (−1)<sup>x·y</sup>|y⟩, so the final Hadamards compare the sign pattern with every parity pattern.',
  'Deutsch–Jozsa: one query decides constant versus balanced. Bernstein–Vazirani: one query reveals s.',
  'The mechanism, more than these particular speed-ups, is what later algorithms build on.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'With the ancilla in |−⟩, what does the oracle do to |x⟩?', options: ['Multiplies it by (−1)<sup>f(x)</sup>', 'Replaces it by |f(x)⟩', 'Measures it', 'Nothing at all'], answer: 0,
        why: 'Flipping |−⟩ multiplies it by −1, so inputs with f(x) = 1 pick up a minus sign while the ancilla is unchanged.' },
      { q: 'In Deutsch’s algorithm, what does measuring 1 tell you?', options: ['f is balanced: f(0) ≠ f(1)', 'f(0) = 1', 'f(1) = 1', 'f is constant'], answer: 0,
        why: 'Different signs on |0⟩ and |1⟩ give ±|−⟩, which H turns into |1⟩.' },
      { q: 'What is H ⊗ H applied to |11⟩?', options: ['(|00⟩ − |01⟩ − |10⟩ + |11⟩)/2', '(|00⟩ + |01⟩ + |10⟩ + |11⟩)/2', '|00⟩', '(|00⟩ − |11⟩)/√2'], answer: 0,
        why: 'H|1⟩ = |−⟩ for both qubits, and |−⟩|−⟩ multiplies out to (|00⟩ − |01⟩ − |10⟩ + |11⟩)/2. The signs are (−1)<sup>x·y</sup> with x = 11.' },
      { q: 'Deutsch–Jozsa returns all zeros. What do you conclude?', options: ['f is constant', 'f is balanced', 'f(0…0) = 0', 'Nothing: you must run it again'], answer: 0,
        why: 'For a balanced f the all-zeros amplitude is exactly 0, so seeing all zeros rules it out.' },
      { q: 'Bernstein–Vazirani finds a hidden 20-bit string s. How many queries does it need, and how many does a classical method need?', options: ['1 and 20', '1 and 2²⁰', '20 and 20', '√20 and 20'], answer: 0,
        why: 'One quantum query reveals all of s. Classically, each query of s·x reveals at most one bit.' },
      { q: 'Why do these algorithms matter despite their modest speed-ups?', options: ['They show the mechanism, queries in superposition read out with Hadamards, that Simon’s and Shor’s algorithms exploit', 'They give exponential speed-ups for search', 'They factor large numbers directly', 'They prove quantum computers are faster at every problem'], answer: 0,
        why: 'The same pattern of kickback and interference, applied to a hidden period, gives the exponential speed-up of Shor’s algorithm.' }
    ]
  });

  /* ===================================================================== 5.3 */
  C.text('grover', {
    lede: `Grover’s algorithm finds one marked item among N in about (π/4)√N steps, by repeatedly rotating the state toward the answer. This chapter works through it by hand for four items, then uses a simple picture to explain how many steps to take.`,
    html: `
${C.objectives([
  'State the search problem and say what the oracle does',
  'Apply the oracle and the diffusion step by hand for N = 4',
  'Explain inversion about the mean, and why the marked amplitude grows',
  'Use the two-dimensional picture to predict the success probability after k rounds',
  'Choose the number of rounds, and explain why overshooting hurts'
], ['oracles', 'interference'])}

<h2>Unstructured search</h2>
<p>There are N items, labelled 0 to N − 1, and exactly one of them, w, is marked. An oracle tells you whether a given item is the marked one, and that is all you have: the items have no order or structure to exploit. Classically you must check items one by one, about N/2 of them on average and N − 1 in the worst case. Grover’s algorithm needs about (π/4)√N oracle calls.</p>
<p>With n qubits, N = 2ⁿ. The oracle is a phase oracle like those in chapter ${ref('oracles')}: it flips the sign of the marked item and leaves every other item alone.</p>

<h2>The algorithm</h2>
<ol>
  <li>Start in the uniform superposition: H on every qubit gives every item the amplitude 1/√N.</li>
  <li>Repeat about (π/4)√N times:
    <ul>
      <li><b>Oracle:</b> flip the sign of the marked item’s amplitude.</li>
      <li><b>Diffusion:</b> replace every amplitude a by 2 · (mean) − a. This is an inversion about the mean.</li>
    </ul>
  </li>
  <li>Measure. The result is w with high probability.</li>
</ol>
<p>The oracle pushes the marked amplitude below zero, which drags the mean down slightly. The inversion about the mean then throws the marked amplitude far above the mean, while the others barely move. Each round, the marked amplitude grows.</p>
${C.worked('Grover with four items, marked item w = 3', [
  'Start: all four amplitudes are 1/2.',
  'Oracle: the amplitudes become (1/2, 1/2, 1/2, −1/2). Their mean is (1/2 + 1/2 + 1/2 − 1/2)/4 = 1/4.',
  'Diffusion: each amplitude a becomes 2 · (1/4) − a = 1/2 − a. The first three become 1/2 − 1/2 = 0, and the marked one becomes 1/2 − (−1/2) = 1.',
  'The state is now |11⟩, the marked item, with probability 1.'
], 'For N = 4 a single round finds the answer with certainty. Load "Grover search, 2 qubits" in the Circuit Lab to see it as a circuit.')}
${C.bench('gr', 'Grover step by step', 'Click a bar to choose which item is marked')}

<h2>The geometry: a rotation in a plane</h2>
<p>The state never leaves a two-dimensional plane. One direction in it is |w⟩, the answer. The other is |s′⟩, the equal superposition of all the other N − 1 items. The starting state lies almost entirely along |s′⟩:</p>
${F('|s⟩ = sin θ |w⟩ + cos θ |s′⟩, &nbsp; with sin θ = 1/√N')}
<p>The oracle reflects the state across |s′⟩, because it flips the |w⟩ component. The diffusion reflects it across |s⟩. Two reflections make a rotation by twice the angle between the two mirrors, so each round turns the state by 2θ toward |w⟩. After k rounds the angle from |s′⟩ is (2k + 1)θ, and</p>
${F('P(success after k rounds) = sin²((2k + 1)θ)')}
<p>The best k makes (2k + 1)θ close to 90°, which gives k ≈ π/(4θ) − 1/2, about (π/4)√N when N is large.</p>
${C.worked('Eight items', [
  'N = 8, so sin θ = 1/√8 and θ ≈ 0.361 rad ≈ 20.7°.',
  'After one round: sin²(3θ) = sin²(62.1°) ≈ 0.78.',
  'After two rounds: sin²(5θ) = sin²(103.5°) ≈ 0.95. This is the best choice, close to π/(4θ) − 1/2 ≈ 1.7.',
  'After three rounds: sin²(7θ) = sin²(144.9°) ≈ 0.33. The state has rotated past the answer.'
], 'More rounds is not always better. Stop at the optimum.')}
${C.pitfall('Overshooting', `<p>Grover’s algorithm does not behave like a classical search that only ever improves. Because each round is a rotation, running past the optimum turns the state away from the answer again, and the success probability keeps rising and falling. You need to know roughly how many items are marked to choose the number of rounds. When you do not, there are versions of the algorithm that try a growing, random number of rounds.</p>`)}
${C.deeper('Several marked items, and why √N is the best possible', `<p>If M of the N items are marked, the same picture holds with sin θ = √(M/N), and about (π/4)√(N/M) rounds are needed. In 1997 Bennett, Bernstein, Brassard and Vazirani proved that no quantum algorithm can search an unstructured list with fewer than about √N oracle calls, so Grover’s algorithm is optimal. The speed-up is quadratic, not exponential: searching 10¹² items takes about 10⁶ rounds instead of about 10¹² checks. Each round also needs many gates, and error-correction overheads eat into the gain, which is why practical Grover speed-ups need large, fault-tolerant machines.</p>`)}

${C.keyIdea('Grover’s algorithm is a rotation: each oracle-plus-diffusion round turns the state by a fixed angle 2θ toward the answer. About (π/4)√N rounds land on it, and more rounds overshoot.')}
${C.tryThis([
  'With N = 4, how many iterations reach certainty?',
  'With N = 64, run past the optimum. How low does the success probability drop?',
  'Press only "Oracle" twice. Why does nothing change overall?',
  'Watch the mean line during a diffusion step. Which amplitudes move the most?',
  'On paper: for N = 16, compute θ and the best number of rounds, then check with the panel.'
])}
${C.recap([
  'Searching N unstructured items takes about N/2 classical checks, but only about (π/4)√N Grover oracle calls.',
  'Each round: the oracle flips the marked sign, and the diffusion inverts every amplitude about the mean.',
  'The state rotates by 2θ per round in the plane of |w⟩ and |s′⟩, with sin θ = 1/√N.',
  'P(success after k rounds) = sin²((2k + 1)θ). Stop near the optimum, because more rounds overshoot.',
  'This quadratic speed-up is provably the best possible for unstructured search.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'Grover search over N = 1,024 items needs roughly how many oracle calls?', options: ['25', '10', '512', '1,024'], answer: 0,
        why: '(π/4)√1024 = (π/4) × 32 ≈ 25.' },
      { q: 'With four items, the amplitudes after the oracle are (1/2, 1/2, −1/2, 1/2). What does the diffusion step produce?', options: ['(0, 0, 1, 0)', '(1/2, 1/2, 1/2, 1/2)', '(1/4, 1/4, −1/4, 1/4)', '(0, 0, −1, 0)'], answer: 0,
        why: 'The mean is 1/4, and each amplitude a becomes 2 × (1/4) − a = 1/2 − a.' },
      { q: 'What does the diffusion step do to each amplitude a?', options: ['Replaces it by 2 · mean − a', 'Flips its sign', 'Squares it', 'Divides it by the mean'], answer: 0,
        why: 'It is an inversion about the mean: amplitudes below the mean end up the same distance above it, and the other way round.' },
      { q: 'Why can running too many Grover rounds lower the success probability?', options: ['Each round is a rotation, so the state turns past the answer', 'Noise always grows with time', 'The oracle stops working after the optimum', 'Measurements are taken between rounds'], answer: 0,
        why: 'The success probability is sin²((2k + 1)θ), which rises to a peak and then falls.' },
      { q: 'If 4 of 64 items are marked, roughly how many rounds are needed?', options: ['3', '6', '16', '1'], answer: 0,
        why: 'About (π/4)√(N/M) = (π/4)√16 = π ≈ 3.' },
      { q: 'What kind of speed-up does Grover’s algorithm give for unstructured search?', options: ['Quadratic: about √N instead of N', 'Exponential', 'None at all', 'Logarithmic'], answer: 0,
        why: 'It needs about √N oracle calls instead of about N, and no quantum algorithm can do better.' }
    ]
  });

  /* ===================================================================== 5.4 */
  C.text('qft', {
    lede: `The quantum Fourier transform writes a number into the phases of qubits. Phase estimation uses it to read an eigenvalue out, and that is the engine inside Shor’s factoring algorithm.`,
    html: `
${C.objectives([
  'Write the QFT of a basis state, and compute it by hand for one and two qubits',
  'See the Fourier basis as counting in phases, with one turning speed per qubit',
  'Read the QFT circuit: Hadamards, controlled phases and a final reversal',
  'Explain phase estimation and how accurate it is',
  'Outline how phase estimation leads to Shor’s algorithm'
], ['multigates', 'oracles', 'complex'])}

<h2>The Fourier transform in one paragraph</h2>
<p>The discrete Fourier transform takes a list of N numbers and rewrites it as a sum of waves e<sup>2πijk/N</sup> with different frequencies k. It is one of the most used tools in science and engineering: it finds the notes in a sound, the repeating patterns in data, and speeds up the multiplication of huge numbers. The <b>quantum Fourier transform</b> (QFT) is the same transform, applied to the amplitudes of a quantum state.</p>

<h2>The QFT of a basis state</h2>
<p>With n qubits and N = 2ⁿ, the QFT sends each basis state |x⟩ to an equal superposition of all N basis states, with phases that turn at a speed set by x:</p>
${F('QFT|x⟩ = (1/√N) Σ<sub>k=0</sub><sup>N−1</sup> e<sup>2πi xk/N</sup> |k⟩')}
${C.worked('One qubit', [
  'N = 2: QFT|0⟩ = (|0⟩ + |1⟩)/√2, and QFT|1⟩ = (|0⟩ + e<sup>iπ</sup>|1⟩)/√2 = (|0⟩ − |1⟩)/√2.'
], 'The one-qubit QFT is just H.')}
${C.worked('Two qubits: QFT|01⟩, the number 1', [
  'N = 4, so the phase of |k⟩ is e<sup>2πi · 1 · k/4</sup> = i<sup>k</sup>.',
  'QFT|01⟩ = (|00⟩ + i|01⟩ − |10⟩ − i|11⟩)/2.',
  'This factors as ((|0⟩ − |1⟩)/√2) ⊗ ((|0⟩ + i|1⟩)/√2) = |−⟩|+i⟩.',
  'q0 has turned half a revolution (phase π) and q1 a quarter of a revolution (phase π/2).'
], 'The output is a product state, with each qubit on the equator at its own angle.')}

<h2>Counting in phases</h2>
<p>The example shows the general pattern. QFT|x⟩ is always a product state, with every qubit on the equator of its Bloch sphere. Qubit q, counting from the top and starting at 0, points at the angle 2πx/2<sup>q+1</sup>. As x goes up by 1, the top qubit turns half a revolution, the next a quarter, the next an eighth, and so on. It is counting, written in phases instead of in bits.</p>
${C.bench('qf', 'Counting in two bases', 'Top row: |x⟩ · bottom row: QFT|x⟩, viewed from above')}
${C.deeper('Why QFT|x⟩ is a product state', `<p>Write k in binary as k₀k₁…k<sub>n−1</sub>, with k₀ the most significant bit, so k = Σ<sub>q</sub> k<sub>q</sub> 2<sup>n−1−q</sup>. Then e<sup>2πixk/N</sup> = Π<sub>q</sub> e<sup>2πi x k<sub>q</sub>/2<sup>q+1</sup></sup>, one factor per qubit. The sum over all k therefore factors into a product over the qubits of (|0⟩ + e<sup>2πix/2<sup>q+1</sup></sup>|1⟩)/√2. This product form is also why the QFT circuit is so short.</p>`)}

<h2>The QFT circuit</h2>
<p>For each qubit in turn, starting at the top: apply H, then a controlled phase from each qubit below it, with angles π/2, π/4, π/8 and so on. Finally, reverse the order of the qubits with SWAPs. That is n(n + 1)/2 gates plus the swaps, so a number of gates that grows like n² for a transform acting on 2ⁿ amplitudes. The fastest classical method, the fast Fourier transform, needs about n · 2ⁿ operations on the full list.</p>
${C.circ(B => B(3).g('H', 0).cg('P', [1], 0, PI / 2).cg('P', [2], 0, PI / 4).g('H', 1).cg('P', [2], 1, PI / 2).g('H', 2).swap(0, 2), { caption: 'The three-qubit QFT: H and controlled phases, then a SWAP that reverses the qubit order.' })}
${C.bench('qft-lab', 'The QFT of |101⟩, step by step', 'Press Play, or step with the arrows')}
${C.pitfall('You cannot read out the Fourier coefficients', `<p>The QFT transforms 2ⁿ amplitudes with about n² gates, but that does not let a quantum computer Fourier-analyse data exponentially faster. The data would first have to be loaded into the amplitudes, which is usually expensive, and a measurement afterwards returns one sample, not the whole spectrum. The QFT pays off when the answer is concentrated on a few outcomes, as in phase estimation.</p>`)}

<h2>Phase estimation</h2>
<p>Suppose a gate U has an eigenvector |u⟩ with eigenvalue e<sup>2πiφ</sup>, for some unknown φ between 0 and 1. <b>Phase estimation</b> finds φ. It uses t counting qubits, all starting in |+⟩, and a second register holding |u⟩:</p>
<ol>
  <li>Counting qubit j controls U applied 2ʲ times. By phase kickback (chapter ${ref('multigates')}), it picks up the relative phase e<sup>2πi · 2ʲφ</sup>.</li>
  <li>The counting register now holds exactly the Fourier-basis pattern of the number 2ᵗφ, each qubit turned at its own speed.</li>
  <li>An inverse QFT turns the pattern back into bits, and measuring gives a t-bit approximation of φ.</li>
</ol>
${C.worked('φ = 0.375 with three counting qubits', [
  'In binary, 0.375 = 0.011, since 0/2 + 1/4 + 1/8 = 0.375.',
  'The counting qubits pick up the phases 2π · φ, 2π · 2φ and 2π · 4φ, which are 2π · 0.375, 2π · 0.75 and 2π · 1.5.',
  'That is exactly the pattern of QFT|x⟩ for x = 2³φ = 3, so the inverse QFT gives |011⟩ with certainty.',
  'Read 011 as the binary fraction 0.011 = 0.375.'
], 'When φ has an exact t-bit binary expansion, phase estimation is exact.')}
<p>If φ is not an exact t-bit fraction, the measurement gives one of the nearest t-bit fractions: the closest with probability at least 4/π² ≈ 0.405. Adding counting qubits sharpens the peak.</p>
${C.bench('qpe', 'Phase estimation outcomes', 'Vertical line = true φ')}

<h2>Shor’s algorithm in outline</h2>
<p>In 1994 Peter Shor showed that a quantum computer could factor large numbers efficiently, which would break the RSA encryption widely used on the internet. The steps are:</p>
<ol>
  <li>To factor N, pick a random number a and find the period r of f(x) = aˣ mod N, the smallest r with aʳ ≡ 1 (mod N).</li>
  <li>Find r with phase estimation, applied to the gate U|y⟩ = |a·y mod N⟩, whose eigenvalues are e<sup>2πis/r</sup>. Phase estimation returns a fraction s/r, and r is recovered from it with continued fractions.</li>
  <li>If r is even, gcd(a<sup>r/2</sup> − 1, N) and gcd(a<sup>r/2</sup> + 1, N) usually give factors of N. These last steps are ordinary arithmetic.</li>
</ol>
${C.worked('Factor 15 (the classical steps)', [
  'Pick a = 7. The powers of 7 mod 15 are 7, 4, 13, 1, so the period is r = 4.',
  'a<sup>r/2</sup> = 7² = 49 ≡ 4 (mod 15).',
  'gcd(4 − 1, 15) = 3 and gcd(4 + 1, 15) = 5.'
], '15 = 3 × 5. The quantum computer’s only job is step 1, finding r, which is very hard classically when N is large.')}
<p>Factoring numbers of cryptographic size is far beyond today’s machines: published estimates for breaking 2,048-bit RSA call for around a million physical qubits running error correction for days. That prospect is why new "post-quantum" encryption standards are already being deployed.</p>

${C.keyIdea('The QFT moves information between bit values and phases. Phase estimation reads a phase by letting kickback write it and the inverse QFT turn it into bits, and Shor’s algorithm uses that to find periods.')}
${C.tryThis([
  'Count from 0 to 7 with three qubits and watch how fast each Fourier qubit turns.',
  'Step through the QFT of |101⟩. After which gate does each qubit reach its final angle?',
  'Set φ = 0.375 with t = 3 counting qubits. Why is the answer certain?',
  'Set φ = 0.3 and raise t from 3 to 7. How does the peak change?',
  'On paper: compute QFT|10⟩ for two qubits and check that it is a product state.'
])}
${C.recap([
  'QFT|x⟩ = (1/√N) Σ<sub>k</sub> e<sup>2πixk/N</sup>|k⟩. For one qubit the QFT is H.',
  'QFT|x⟩ is a product state: qubit q sits on the equator at angle 2πx/2<sup>q+1</sup>. It is counting in phases.',
  'The circuit uses H and controlled phases, about n² gates, but the amplitudes cannot simply be read out.',
  'Phase estimation: controlled-U<sup>2ʲ</sup> gates write 2ʲφ into phases, and the inverse QFT reads φ out as t bits.',
  'Shor’s algorithm factors N by finding a period with phase estimation; the rest is classical arithmetic.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'What is the one-qubit QFT?', options: ['H', 'X', 'S', 'The identity'], answer: 0,
        why: 'QFT|0⟩ = (|0⟩ + |1⟩)/√2 and QFT|1⟩ = (|0⟩ − |1⟩)/√2, which is exactly what H does.' },
      { q: 'After QFT|x⟩ on three qubits, where is each qubit on its Bloch sphere?', options: ['On the equator, each at its own angle', 'At the poles, spelling x in binary', 'At the centre of the sphere', 'All at the same point'], answer: 0,
        why: 'QFT|x⟩ is a product state, and qubit q points at angle 2πx/2<sup>q+1</sup> on the equator.' },
      { q: 'Phase estimation with t counting qubits gives an exact result when φ…', options: ['has an exact t-bit binary expansion', 'is irrational', 'is close to 1/2', 'is 0 and nothing else'], answer: 0,
        why: 'Then 2ᵗφ is a whole number x, the counting register holds exactly QFT|x⟩, and the inverse QFT returns |x⟩.' },
      { q: 'In Shor’s algorithm, what does the quantum computer find?', options: ['The period r of aˣ mod N', 'The factors directly', 'A greatest common divisor', 'A random prime number'], answer: 0,
        why: 'Phase estimation finds the period; turning the period into factors is done classically with greatest common divisors.' },
      { q: 'For a = 7 and N = 15 the period is r = 4. Which numbers reveal the factors?', options: ['gcd(7² − 1, 15) and gcd(7² + 1, 15)', 'gcd(7, 15) and gcd(4, 15)', '7 and 4', '15/4 and 15/7'], answer: 0,
        why: '7² = 49 ≡ 4 (mod 15), and gcd(3, 15) = 3, gcd(5, 15) = 5.' },
      { q: 'Why does the QFT not give exponentially fast Fourier analysis of arbitrary data?', options: ['Loading the data and reading out the result are both costly: a measurement returns one sample', 'The QFT needs 2ⁿ gates', 'The QFT only works on one qubit', 'Fourier transforms are not unitary'], answer: 0,
        why: 'The circuit is short, but the input must be prepared as amplitudes and the output only ever yields one measurement outcome per run.' }
    ]
  });
})(window);

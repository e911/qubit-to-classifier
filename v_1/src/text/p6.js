/* Words for Part VI, noise and hardware. Interactive panels live in src/ch6.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref, mat = C.mat;
  const D = s => `<div class="eqn center">${s}</div>`;

  /* ===================================================================== 6.1 */
  C.text('noise', {
    lede: `Real qubits leak information into their surroundings. Their states become mixtures, and the sphere of possible states shrinks and deforms into an ellipsoid. This chapter introduces the density matrix, the tool that describes all of this.`,
    html: `
${C.objectives([
  'Tell a mixture from a superposition, and describe both with a density matrix',
  'Convert between a density matrix and a Bloch vector inside the ball',
  'Compute probabilities and purity from a density matrix',
  'Find the state of one qubit of an entangled pair',
  'Describe the standard noise channels and what each does to the Bloch ball'
], ['bloch', 'entangle', 'measure'])}

<h2>Mixtures are not superpositions</h2>
<p>Suppose a machine prepares |0⟩ or |1⟩ at random, each with probability 1/2, and does not tell you which. This is a <b>mixture</b>, or <b>mixed state</b>: ordinary uncertainty about which pure state you have. Compare it with |+⟩ = (|0⟩ + |1⟩)/√2. Both give 0 or 1 with probability 1/2 in the Z basis. In the X basis they differ: |+⟩ always gives +, while the mixture gives a fair coin, because |0⟩ and |1⟩ are each 50/50 in the X basis. A mixture is the hidden coin of chapter ${ref('qubit')}.</p>

<h2>The density matrix</h2>
<p>A mixture of states |ψ<sub>i</sub>⟩ with probabilities p<sub>i</sub> is described by its <b>density matrix</b>, built from the outer products of chapter ${ref('linalg')}:</p>
${F('ρ = Σ<sub>i</sub> p<sub>i</sub> |ψ<sub>i</sub>⟩⟨ψ<sub>i</sub>|')}
<p>For a pure state, ρ = |ψ⟩⟨ψ|. Every prediction comes from ρ. A measurement in a basis {|e<sub>k</sub>⟩} gives outcome k with probability ⟨e<sub>k</sub>|ρ|e<sub>k</sub>⟩, and the expectation value of an observable A is Tr(ρA), the sum of the diagonal entries of the matrix ρA.</p>
${C.worked('Two recipes, one density matrix', [
  `|0⟩ or |1⟩, 50:50: ρ = (1/2)|0⟩⟨0| + (1/2)|1⟩⟨1| = ${mat([['1/2', '0'], ['0', '1/2']], 'small')} = I/2.`,
  `|+⟩ or |−⟩, 50:50: |+⟩⟨+| = (1/2) ${mat([['1', '1'], ['1', '1']], 'small')} and |−⟩⟨−| = (1/2) ${mat([['1', '−1'], ['−1', '1']], 'small')}. Their average is again I/2.`,
  `The pure state |+⟩ alone: ρ = |+⟩⟨+| = ${mat([['1/2', '1/2'], ['1/2', '1/2']], 'small')}.`
], 'The two mixtures have the same ρ, so no measurement can ever tell them apart. The off-diagonal entries of |+⟩⟨+|, which the mixtures lack, record the relative phase. They are called coherences.')}

<h2>Inside the Bloch ball</h2>
<p>Every one-qubit density matrix can be written with a Bloch vector r = (x, y, z):</p>
${D(`ρ = (1/2)(I + xX + yY + zZ) = (1/2) ${mat([['1 + z', 'x − iy'], ['x + iy', '1 − z']])}`)}
<p>Pure states have |r| = 1 and sit on the surface. Mixtures have |r| &lt; 1 and sit inside, in the <b>Bloch ball</b>. The centre, r = 0, is ρ = I/2, the <b>maximally mixed state</b>: a random bit along every axis. A mixture of two states sits on the straight line between their Bloch points, closer to the more likely one.</p>
<p>The <b>purity</b> Tr(ρ²) = (1 + |r|²)/2 runs from 1/2 at the centre to 1 on the surface. Probabilities are read off exactly as before: P(0) = (1 + z)/2, and in general P(+ along n) = (1 + r·n)/2.</p>
${C.bench('mix', 'Mixtures inside the ball', 'Drag the two states or pick a preset')}
${C.pitfall('Different recipes can give the same state', `<p>"|0⟩ or |1⟩, 50:50" and "|+⟩ or |−⟩, 50:50" are physically identical: same ρ, same predictions for every possible measurement. The density matrix, not the recipe that produced it, is the state.</p>`)}

<h2>One qubit of an entangled pair</h2>
<p>Chapter ${ref('entangle')} found that one qubit of a Bell pair has a Bloch vector of length 0. Now we can say exactly what its state is. The state of one part of a larger system is found by averaging over the other part, an operation called the <b>partial trace</b>. For the Bell state it gives ρ = I/2, the maximally mixed state. A qubit entangled with something you cannot access looks exactly like a mixture.</p>
${C.worked('The state of q0 in cos(θ/2)|00⟩ + sin(θ/2)|11⟩', [
  'If q1 were measured, it would read 0 with probability cos²(θ/2), leaving q0 in |0⟩, or 1 with probability sin²(θ/2), leaving q0 in |1⟩.',
  'Whether or not anyone measures q1, q0 on its own behaves exactly like this mixture: ρ = cos²(θ/2)|0⟩⟨0| + sin²(θ/2)|1⟩⟨1|. (If it did not, measuring q1 could send a signal to q0.)',
  'Its Bloch vector is (0, 0, cos θ), of length |cos θ|, as chapter 3.3 found.'
], 'This is the deep link between entanglement and noise: noise is entanglement with the environment.')}

<h2>Noise channels</h2>
<p>A noise process maps the Bloch ball into itself. Such a map is called a <b>quantum channel</b>. The standard single-qubit channels each have a simple shape:</p>
${C.table(['Channel', 'What happens', 'Effect on the Bloch vector'], [
  ['Bit flip', 'X with probability p', 'y and z shrink by (1 − 2p)'],
  ['Phase flip', 'Z with probability p', 'x and y shrink by (1 − 2p)'],
  ['Depolarizing', 'replaced by I/2 with probability p', 'the whole ball shrinks by (1 − p)'],
  ['Amplitude damping', 'energy loss: |1⟩ decays to |0⟩ with probability γ', 'z → (1 − γ)z + γ; x and y shrink by √(1 − γ)'],
  ['Phase damping', 'pure loss of phase', 'x and y shrink by √(1 − λ)']
])}
${C.worked('Phase flip on |+⟩', [
  'With probability 1 − p nothing happens and the state stays |+⟩. With probability p, Z turns it into |−⟩.',
  'So ρ = (1 − p)|+⟩⟨+| + p|−⟩⟨−|, with Bloch vector (1 − p)(1, 0, 0) + p(−1, 0, 0) = (1 − 2p, 0, 0).',
  'At p = 1/2 the vector is 0: |+⟩ has become the maximally mixed state, and all its phase is lost.'
], 'P(0) and P(1) never changed. Only the relative phase, the thing interference needs, was destroyed.')}
${C.bench('nz', 'Noise channels on the Bloch ball', 'Orange wireframe = where every pure state ends up')}
${C.deeper('Kraus operators', `<p>Every channel can be written as ρ → Σ<sub>k</sub> K<sub>k</sub> ρ K<sub>k</sub>†, with matrices K<sub>k</sub> (the Kraus operators) that satisfy Σ<sub>k</sub> K<sub>k</sub>†K<sub>k</sub> = I. The bit flip has K₀ = √(1 − p) I and K₁ = √p X. Amplitude damping has</p>
${D(`K₀ = ${mat([['1', '0'], ['0', '√(1 − γ)']], 'small')} <span class="eqn-gap"></span> K₁ = ${mat([['0', '√γ'], ['0', '0']], 'small')}`)}
<p>K₁ takes |1⟩ to |0⟩, which is the decay. Every channel can also be realised as a unitary acting on the qubit together with an environment, followed by ignoring the environment, which is the precise version of "noise is entanglement with the environment".</p>`)}
<p>Why this matters: interference needs well-defined relative phases, and dephasing destroys exactly those. A heavily dephased quantum computer is an expensive random-number generator. Noise also limits how deep a useful circuit can be, and in machine learning it flattens the cost landscape (chapter ${ref('plateaus')}).</p>

${C.keyIdea('Noise turns pure states into mixtures, so the arrow shrinks inside the ball. A density matrix describes both, and a qubit entangled with an environment you cannot see is exactly such a mixture.')}
${C.tryThis([
  'In the mixture panel, compare "|0⟩ or |1⟩" with "|+⟩ or |−⟩". Does anything in the readout differ?',
  'Set the weight to 100% and drag ψ₁ around. Where does ρ go?',
  'In the noise panel, pick "Phase flip" with strength 0.5. What is left of |+⟩? What about |0⟩?',
  'Apply amplitude damping 20 times. Where does every state end up?',
  'Which channels leave |0⟩ untouched but damage |+⟩?',
  'On paper: write the density matrix of the mixture "3/4 |0⟩, 1/4 |+⟩" and find its Bloch vector.'
])}
${C.recap([
  'A mixture is classical uncertainty about which pure state was prepared; a superposition is one definite state.',
  'ρ = Σ p<sub>i</sub>|ψ<sub>i</sub>⟩⟨ψ<sub>i</sub>| = (I + xX + yY + zZ)/2. Pure states lie on the sphere, mixtures inside the ball, and I/2 at the centre.',
  'Different mixtures with the same ρ cannot be told apart by any measurement.',
  'One qubit of an entangled pair is in a mixed state; noise is entanglement with the environment.',
  'Channels shrink and shift the ball: flips squash it, depolarizing shrinks it, amplitude damping pulls it toward |0⟩.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'Where does the maximally mixed state sit?', options: ['At the centre of the ball', 'At the north pole', 'On the equator', 'At the south pole'], answer: 0,
        why: 'ρ = I/2 has Bloch vector r = 0: a random bit along every axis.' },
      { q: 'Which measurement tells |+⟩ apart from a 50:50 mixture of |0⟩ and |1⟩?', options: ['A measurement in the X basis', 'A measurement in the Z basis', 'None: they are the same state', 'Two Z measurements in a row'], answer: 0,
        why: '|+⟩ always gives + in the X basis, while the mixture gives a fair coin. In the Z basis both give 50/50.' },
      { q: 'Are "|0⟩ or |1⟩, 50:50" and "|+⟩ or |−⟩, 50:50" the same state?', options: ['Yes: both have ρ = I/2, so no measurement can tell them apart', 'No: one is in the Z basis and the other in the X basis', 'Only when measured in the Y basis', 'Only for a single qubit'], answer: 0,
        why: 'All predictions depend only on ρ, and both recipes give ρ = I/2.' },
      { q: 'Which channel pulls every state toward |0⟩?', options: ['Amplitude damping', 'Bit flip', 'Phase flip', 'Depolarizing'], answer: 0,
        why: 'Amplitude damping models energy loss: |1⟩ decays to |0⟩, so z → (1 − γ)z + γ.' },
      { q: 'A state has Bloch vector (0.6, 0, 0). What is its purity Tr(ρ²)?', options: ['0.68', '0.6', '0.36', '1'], answer: 0,
        why: 'Purity = (1 + |r|²)/2 = (1 + 0.36)/2 = 0.68.' },
      { q: 'Dephasing destroys…', options: ['the relative phase: the x and y components', 'the populations of |0⟩ and |1⟩', 'only the z component', 'nothing that can be measured'], answer: 0,
        why: 'Dephasing shrinks the equatorial components while leaving P(0) and P(1) alone.' }
    ]
  });

  /* ===================================================================== 6.2 */
  C.text('hardware', {
    lede: `Two time constants, T1 and T2, put a clock on every computation. Native gates, limited connectivity and imperfect gates and readout decide how circuits are compiled, and why error mitigation and error correction exist.`,
    html: `
${C.objectives([
  'Define T1 and T2 and read them off a decay curve',
  'Estimate how many gates fit in a circuit before errors take over',
  'Explain native gate sets, connectivity and routing',
  'Describe readout errors and correct them statistically',
  'Contrast error mitigation with error correction, and explain the threshold idea'
], ['noise', 'identities'])}

<h2>Two clocks: T1 and T2</h2>
<p><b>T1</b>, the relaxation time, measures how quickly an excited qubit decays from |1⟩ to |0⟩: amplitude damping, happening over time. Starting from |1⟩, P(1) after a time t is e<sup>−t/T1</sup>. <b>T2</b>, the coherence time, measures how long a relative phase survives: the x and y parts of the Bloch vector shrink like e<sup>−t/T2</sup>. Any energy loss also destroys phase, so T2 can never be longer than 2·T1.</p>
<p>Leave a superposition idle and its arrow traces a spiral: the equatorial part shrinks on the T2 clock while the arrow relaxes toward |0⟩ on the T1 clock. If the qubit’s frequency is slightly off the reference, which is called a detuning, the arrow also turns around the z axis. The resulting oscillation is the Ramsey experiment that labs use to measure T2.</p>
${C.bench('t12', 'T1 and T2 decay', 'Press Play to let the qubit sit idle')}
${C.worked('How much is left after 30 μs?', [
  'Take T1 = 100 μs and T2 = 60 μs, and start in |+⟩, so x = 1.',
  'After 30 μs, x = e<sup>−30/60</sup> = e<sup>−0.5</sup> ≈ 0.61. Almost 40% of the phase information is gone.',
  'Starting instead from |1⟩, P(1) = e<sup>−30/100</sup> = e<sup>−0.3</sup> ≈ 0.74 after the same time.'
], 'A circuit that runs for 30 μs on this qubit has lost much of its coherence before a single gate error is counted.')}
<p>What matters is the ratio of coherence time to gate time, because it limits how many operations fit in one run. Rough figures for the main platforms in the mid-2020s, which improve every year:</p>
${C.table(['Platform', 'Coherence time T2', 'Two-qubit gate time'], [
  ['Superconducting circuits', 'tens to hundreds of μs', 'tens to hundreds of ns'],
  ['Trapped ions', 'seconds or longer', 'tens to hundreds of μs'],
  ['Neutral atoms', 'around a second', 'around a μs']
], 'compact')}
${C.deeper('Why T2 ≤ 2T1', `<p>Amplitude damping with strength γ = 1 − e<sup>−t/T1</sup> shrinks x and y by √(1 − γ) = e<sup>−t/(2T1)</sup>. So energy loss alone already makes the phase decay with time constant 2T1. Any extra pure dephasing only makes it faster: 1/T2 = 1/(2T1) + 1/T<sub>φ</sub>, where T<sub>φ</sub> is the pure-dephasing time. Hence T2 ≤ 2T1.</p>`)}

<h2>Gate errors and the error budget</h2>
<p>Gates are imperfect too. On today’s best hardware each two-qubit gate fails with a probability of roughly 0.1% to 1%, and single-qubit gates are about ten times better. If a circuit has N two-qubit gates that each fail with probability ε, the chance that a run has no error at all is about</p>
${F('(1 − ε)<sup>N</sup> ≈ e<sup>−Nε</sup>')}
${C.worked('How big can a circuit be?', [
  'With ε = 0.5% = 0.005 and N = 100 gates, the expected number of errors is Nε = 0.5, and e<sup>−0.5</sup> ≈ 0.61.',
  'With N = 1,000 gates, Nε = 5 and e<sup>−5</sup> ≈ 0.007: almost every run contains an error.',
  'A 50% chance of an error-free run needs Nε ≈ ln 2 ≈ 0.69, so N ≈ 140 gates at this error rate.'
], 'Without error correction, useful circuits are limited to a few hundred two-qubit gates on most current hardware.')}
${C.bench('budget', 'The error budget of a circuit', 'Set the error rate and the circuit size')}

<h2>From circuit to chip</h2>
<ul>
  <li><b>Native gates.</b> Each device implements a small set of operations directly, typically single-qubit rotations plus one entangling gate such as CZ. A compiler, often called a <b>transpiler</b>, rewrites your circuit into those gates, using identities like the ones in chapter ${ref('identities')}.</li>
  <li><b>Connectivity.</b> On many devices two-qubit gates work only between physically coupled qubits. A CNOT between distant qubits needs SWAPs first, and each SWAP costs three CNOTs.</li>
  <li><b>Depth.</b> Two-qubit gates are usually the noisiest operation, so compilers minimise their number and the depth of the circuit, which also keeps the run short compared with T2.</li>
  <li><b>Readout errors.</b> Measurements sometimes report the wrong bit; a few percent is common.</li>
</ul>
${C.bench('route', 'Routing a CNOT on a line of qubits', 'Pick two qubits that are not neighbours')}
${C.worked('Correcting readout errors statistically', [
  'Calibrate: prepare |0⟩ many times and find that it reads as 1 in 2% of shots. Prepare |1⟩ and find that it reads as 0 in 5% of shots.',
  'If the true probability of 1 is q, the observed probability of reading 1 is 0.02(1 − q) + 0.95q = 0.02 + 0.93q.',
  'An experiment reads 1 in 40% of shots. Solving 0.02 + 0.93q = 0.40 gives q ≈ 0.409.'
], 'Inverting the calibration corrects the statistics, though never any individual shot. This is the simplest kind of error mitigation.')}

<h2>Mitigation versus correction</h2>
<p><b>Error mitigation</b> accepts noisy runs and post-processes the statistics. Besides readout correction, a common method runs the same circuit at several deliberately increased noise levels and extrapolates the results back to zero noise. Mitigation needs no extra qubits, but the number of shots it requires grows quickly with the size of the circuit.</p>
<p><b>Error correction</b> encodes one logical qubit in many physical qubits, detects errors with repeated measurements of carefully chosen checks, and fixes them while the computation runs. The simplest example protects against bit flips by repetition:</p>
${C.worked('The three-qubit repetition code', [
  'Encode |0⟩ as |000⟩ and |1⟩ as |111⟩. Two CNOTs do this; copying basis states is allowed.',
  'If each qubit flips with probability p, decoding by majority vote fails only when two or more flip: probability 3p²(1 − p) + p³ = 3p² − 2p³.',
  'For p = 1% that is about 0.03%, thirty times better. For p = 40% it is about 35%, only slightly better, and for p above 50% the code makes things worse.'
], 'Below a threshold, adding redundancy makes errors rarer; above it, redundancy hurts.')}
${C.bench('repetition', 'The repetition code', 'Change p and the number of copies')}
<p>Real quantum codes must also handle phase flips, and they cannot simply copy states or read the qubits directly, since either would destroy the superposition. Codes such as the <b>surface code</b> solve this by measuring only parities of groups of qubits, which reveal where an error happened without revealing the encoded state. Once the physical error rate is below the code’s threshold, around 1% for the surface code, making the code larger suppresses logical errors exponentially. Experiments in the mid-2020s have shown logical error rates falling as the code is made larger, a key milestone, but useful fault-tolerant machines will need many thousands of physical qubits or more.</p>
<p>Today’s machines mostly rely on mitigation, which is why near-term quantum machine learning (Part VII) uses shallow circuits.</p>
${C.pitfall('More qubits is not automatically better', `<p>A bigger device only helps if its qubits are good enough. Below threshold, more qubits make better logical qubits; above it, adding qubits mainly adds noise. That is why error rates matter as much as qubit counts when comparing machines.</p>`)}

${C.keyIdea('Hardware turns an ideal circuit into a race against T1, T2 and gate errors. The race is fought with compilation (fewer, cheaper gates), mitigation (smarter statistics) and eventually correction (redundant encoding below threshold).')}
${C.tryThis([
  'In the T1 and T2 panel, set T2 = 2·T1, then make T2 much shorter. How does the spiral change?',
  'Set the detuning to 0. What happens to the Ramsey oscillation?',
  'In the error budget, find the largest circuit with a 50% chance of no error at 0.1% error per gate.',
  'In the routing panel, route a CNOT from q0 to q5 on a line, then on a ring. Which needs fewer SWAPs?',
  'In the repetition code, set p = 10% and compare 3, 5 and 7 copies. Then set p = 45%.',
  'Send 10,000 bits with 3 copies at p = 20%. Does the count match 3p² − 2p³?'
])}
${C.recap([
  'T1 is the decay time from |1⟩ to |0⟩; T2 is the lifetime of relative phase; always T2 ≤ 2·T1.',
  'The chance of an error-free run is about e<sup>−Nε</sup>, so without correction circuits are limited to roughly 1/ε gates.',
  'Compilers translate circuits into native gates and insert SWAPs for limited connectivity, three CNOTs each.',
  'Error mitigation corrects statistics after the fact; error correction encodes logical qubits redundantly.',
  'Below a threshold, larger codes make logical errors exponentially rarer; above it, they make things worse.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'What does T2 measure?', options: ['How long a relative phase survives', 'How long |1⟩ takes to decay to |0⟩', 'The duration of one gate', 'The duration of a measurement'], answer: 0,
        why: 'T2 is the coherence time: the x and y components of the Bloch vector decay like e<sup>−t/T2</sup>. The decay of |1⟩ is T1.' },
      { q: 'Which relation always holds?', options: ['T2 ≤ 2·T1', 'T1 ≤ T2', 'T2 = T1', 'T1 ≤ 2·T2'], answer: 0,
        why: 'Energy loss alone already destroys phase with time constant 2·T1, and extra dephasing can only make T2 shorter.' },
      { q: 'A circuit has 200 two-qubit gates, each failing with probability 0.5%. Roughly what is the chance of an error-free run?', options: ['37%', '99.5%', '0.5%', '90%'], answer: 0,
        why: 'Nε = 200 × 0.005 = 1, and e<sup>−1</sup> ≈ 0.37.' },
      { q: 'Why does a CNOT between two distant qubits on a chip cost extra?', options: ['SWAPs must first bring the qubits together, and each SWAP is three CNOTs', 'Distant qubits have shorter T1', 'The CNOT has to be repeated several times', 'It does not cost anything extra'], answer: 0,
        why: 'With limited connectivity, the compiler inserts SWAPs along a path of neighbours, and every SWAP costs three CNOTs.' },
      { q: 'For the three-qubit repetition code with flip probability p = 1%, roughly what is the logical error rate?', options: ['0.03%', '1%', '3%', '0.0001%'], answer: 0,
        why: '3p² − 2p³ = 3 × 0.0001 − 2 × 0.000001 ≈ 0.0003.' },
      { q: 'What distinguishes error correction from error mitigation?', options: ['Correction encodes logical qubits in many physical ones and fixes errors during the run; mitigation post-processes noisy results', 'Mitigation needs more qubits than correction', 'They are two names for the same thing', 'Correction only fixes readout errors'], answer: 0,
        why: 'Mitigation improves the statistics of noisy runs without extra qubits; correction actively removes errors and needs many extra qubits.' }
    ]
  });
})(window);

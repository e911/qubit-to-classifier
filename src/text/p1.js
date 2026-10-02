/* Words for Part I, one qubit. Interactive panels live in src/ch1.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref;

  /* ===================================================================== 1.1 */
  C.text('qubit', {
    lede: `A bit is 0 or 1. A qubit is described by two amplitudes, and measuring it gives 0 or 1 with odds set by those amplitudes. This chapter is about what that sentence means, and also what it does not mean.`,
    html: `
${C.objectives([
  'Say what a classical bit and a random bit are, and what a qubit adds',
  'Write a qubit state α|0⟩ + β|1⟩ and get the measurement probabilities from the Born rule',
  'Describe what a measurement does to the state',
  'Estimate a probability from repeated shots, and say how the error shrinks',
  'Explain why a superposition is more than "0 or 1, but we do not know which"'
], ['complex', 'linalg'])}

<h2>Classical bits</h2>
<p>A <b>bit</b> is the smallest unit of information: a yes or a no, stored in anything with two clearly different states. A switch is up or down, a wire carries a high or a low voltage, a spot on a disk is magnetized one way or the other. Three facts about bits are so obvious that nobody bothers to state them: at every moment a bit is either 0 or 1; you can read it without changing it; and you can copy it as often as you like.</p>
<p>Sometimes we do not know a bit’s value. A coin that has been flipped and covered before anyone looked is a <b>random bit</b>. We describe it with two probabilities, p₀ for 0 and p₁ for 1, which add up to 1. The coin is heads or tails all along; the probabilities only describe what we do not know.</p>

<h2>Qubits</h2>
<p>A <b>qubit</b> is a physical system with two distinguishable states that obeys the rules of quantum mechanics. Real qubits include the spin of an electron, the polarization of a photon, two energy levels of a trapped ion, and the two lowest energy states of a tiny superconducting circuit. The mathematics in this course is the same for all of them.</p>
<p>The two distinguishable states are written ${K('0')} and ${K('1')}, read "ket zero" and "ket one". They are the qubit’s version of 0 and 1. A general state of the qubit is</p>
${F('|ψ⟩ = α|0⟩ + β|1⟩')}
<p>where α and β are complex numbers called <b>amplitudes</b>. In the language of chapter ${ref('linalg')}, the state is the column vector (α, β). When both amplitudes are nonzero, the qubit is said to be in a <b>superposition</b> of |0⟩ and |1⟩.</p>
${C.define('Qubit state', 'A column of two complex amplitudes (α, β), written α|0⟩ + β|1⟩, with |α|² + |β|² = 1. The amplitudes are not probabilities, but they determine the probabilities.')}

<h2>The Born rule: from amplitudes to probabilities</h2>
<p>You never see the amplitudes directly. Measuring a qubit returns one ordinary bit, with these probabilities:</p>
${F('P(0) = |α|² &nbsp;&nbsp; and &nbsp;&nbsp; P(1) = |β|²')}
<p>This is the <b>Born rule</b>, named after the physicist Max Born. One of the two outcomes must happen, so the probabilities add to 1, which is the normalization condition |α|² + |β|² = 1 from chapter ${ref('linalg')}.</p>
${C.worked('Probabilities from amplitudes', [
  '|ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩. P(0) = (√3/2)² = 3/4 and P(1) = (1/2)² = 1/4. They add to 1.',
  '|ψ⟩ = (1/√2)|0⟩ + (i/√2)|1⟩. P(0) = 1/2. For P(1), take the squared length of the complex number i/√2: |i/√2|² = 1/2.',
  '|ψ⟩ = 0.6|0⟩ − 0.8|1⟩. P(0) = 0.36 and P(1) = 0.64. The minus sign does not affect either probability.',
  'The column (1, 2) is not a state, because 1² + 2² = 5. Divided by √5 it becomes (1/√5)|0⟩ + (2/√5)|1⟩, with P(0) = 1/5 and P(1) = 4/5.'
], 'The probabilities are the squared lengths of the amplitudes, never the amplitudes themselves.')}
${C.pitfall('The amplitude is not the probability', `<p>An amplitude of 1/√2 ≈ 0.707 does not mean a 70.7% chance. Square it: |1/√2|² = 1/2, so the chance is 50%. Amplitudes can also be negative or complex, which probabilities never are.</p>`)}

<h2>Measurement changes the state</h2>
<p>Measuring also changes the qubit. If the measurement returns 0, the state afterwards is |0⟩, whatever it was before; if it returns 1, the state is |1⟩. Measure again straight away and you get the same answer every time. This jump is called <b>collapse</b>. The original amplitudes are gone, so you cannot measure one qubit twice to learn more about how it started.</p>
<p>Measurement is the only step in quantum computing that is random, and the only one that cannot be undone. Gates, which arrive in Part II, are always reversible.</p>
${C.bench('q-real', 'A qubit with real amplitudes', 'Drag the slider or tap a preset')}
<p>In this panel the amplitudes are kept real, so the state is an arrow of length 1 at some angle t, with α = cos t and β = sin t. The orange bar is the shadow of the arrow on the |0⟩ axis and the green bar is its shadow on the |1⟩ axis. Each probability is the square of a shadow, and because cos² t + sin² t = 1 they always add up to 1. "Measure once" picks an outcome at random with the Born-rule odds and snaps the arrow to it.</p>

<h2>One shot tells you very little</h2>
<p>A single measurement gives one bit. If you get 1, you cannot tell whether P(1) was 1% or 99%. To learn the probabilities you prepare the same state again and again, measure each copy once, and count. Each repetition is called a <b>shot</b>, and real quantum computers report their results as counts over thousands of shots.</p>
<p>With N shots, the estimate of P(1) is simply the fraction of shots that gave 1. It is never exact. Its typical error, called the <b>standard error</b>, is</p>
${F('√( p(1 − p) / N )')}
<p>where p is the true probability. The error shrinks like 1/√N: four times as many shots halve it, and a hundred times as many shrink it tenfold.</p>
${C.worked('How good is an estimate from 100 shots?', [
  'Suppose the true P(1) is 0.25 and we run N = 100 shots.',
  'The standard error is √(0.25 × 0.75 / 100) = √0.001875 ≈ 0.043.',
  'So a typical estimate lands within about 0.04 of 0.25, between roughly 0.21 and 0.29. Results as far off as 0.16 or 0.34, two standard errors away, happen about one time in twenty.',
  'With 10,000 shots the standard error is √(0.1875 / 10,000) ≈ 0.0043, ten times smaller.'
], 'A hundred times more shots buys one more reliable decimal place.')}
${C.deeper('Where √(p(1 − p)/N) comes from', `<p>Score each shot as 1 or 0. A single shot has mean p, and its variance (the average of (x − p)²) is p(1 − p)² + (1 − p)p² = p(1 − p). The estimate is the average of N independent shots, and averaging N independent copies divides the variance by N. So the estimate has variance p(1 − p)/N, and its standard deviation, the standard error, is the square root of that.</p>
<p>The worst case is p = 1/2, where the error is 1/(2√N): about 0.05 for 100 shots, 0.016 for 1,000 and 0.005 for 10,000.</p>`)}

<h2>A superposition is not a hidden coin</h2>
<p>It is tempting to read α|0⟩ + β|1⟩ as "the qubit is secretly 0 or 1, and |α|² and |β|² are our odds", like the covered coin. A measurement of 0 or 1 cannot tell the two ideas apart, because both give the same statistics. Other experiments can.</p>
<p>Compare two qubits. The first is |+⟩ = (|0⟩ + |1⟩)/√2. The second is a hidden coin: it was prepared as |0⟩ or as |1⟩ by a fair coin toss, and nobody tells you which. Apply the Hadamard gate H from chapter ${ref('linalg')} to each, then measure.</p>
${C.worked('Apply H, then measure', [
  'The qubit in |+⟩: H|+⟩ = |0⟩, because H undoes itself and H|0⟩ = |+⟩. Measuring gives 0 every time.',
  'The hidden coin, if it was |0⟩: H|0⟩ = |+⟩, which gives 0 or 1 with probability 1/2 each.',
  'The hidden coin, if it was |1⟩: H|1⟩ = |−⟩, which also gives 0 or 1 with probability 1/2 each.',
  'So the hidden coin still gives 50/50 after H, while |+⟩ gives 0 every time.'
], 'Identical statistics before H, completely different after. A superposition is a definite state of its own, not a gap in our knowledge.')}
<p>The panel above shows the same effect. With real amplitudes, H acts as a mirror: it reflects the arrow in the line at 22.5°. Press "Apply H" with the arrow at 45° and it lands on |0⟩. Start instead at −45°, the state (|0⟩ − |1⟩)/√2, and it lands on |1⟩. Those two starting states have exactly the same probabilities, so no measurement of 0 or 1 could tell them apart, yet a single gate makes them perfectly distinguishable. What differs between them is their <b>phase</b>, the subject of the next chapter.</p>
${C.deeper('Why H is a mirror for real amplitudes', `<p>H sends the column (cos t, sin t) to ((cos t + sin t)/√2, (cos t − sin t)/√2). The angle-difference formulas give (cos t + sin t)/√2 = cos(π/4 − t) and (cos t − sin t)/√2 = sin(π/4 − t). So H moves the arrow at angle t to the arrow at angle π/4 − t. Those two angles are mirror images in the line at π/8 = 22.5°, and an arrow on that line is left where it is: it is an eigenvector of H, as you can check in chapter ${ref('eigen')}.</p>`)}
${C.pitfall('A qubit does not hold an unlimited amount of information', `<p>α and β can take infinitely many values, so it can seem that one qubit stores endless information. You cannot read it out. Each measurement gives one bit and destroys the superposition, and an unknown quantum state cannot be copied to measure it many times (the <b>no-cloning theorem</b>). A theorem by Alexander Holevo makes this exact: n qubits can carry at most n bits of retrievable classical information.</p>`)}

${C.keyIdea('Amplitudes set the probabilities, but one measurement returns one bit and collapses the state. Everything you can learn about a quantum state comes from statistics over many identically prepared copies.')}
${C.tryThis([
  'Set the state so that P(1) = 25%. Which angle did you need? Why is it not 25% of 90°?',
  'Run 100 shots five times in a row. How far does the estimate of P(1) wander? Now do the same with 1,000 shots.',
  'Measure once, then press "Measure once" again several times. Why does the answer never change?',
  'Put the arrow at 45° and press "Apply H". Then choose the (|0⟩−|1⟩)/√2 preset and press "Apply H" again. Explain the two results.',
  'Press "Apply H" twice in a row from any starting angle. What happens, and why?',
  'On paper: a state has amplitudes 0.28 and 0.96i. Check that it is normalized and find P(0).'
])}
${C.recap([
  'A qubit state is α|0⟩ + β|1⟩: a column of two complex amplitudes with |α|² + |β|² = 1.',
  'Born rule: a measurement gives 0 with probability |α|² and 1 with probability |β|².',
  'Measurement collapses the state to |0⟩ or |1⟩, so repeating it gives the same answer.',
  'Probabilities are estimated from many shots, and the error shrinks like 1/√N.',
  'A superposition is a state in its own right: |+⟩ and a hidden coin agree on 0/1 statistics but behave differently after H.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'A qubit is in the state (√3/2)|0⟩ + (1/2)|1⟩. What is the probability of measuring 1?', options: ['1/4', '1/2', '√3/2', '3/4'], answer: 0,
        why: 'P(1) = |β|² = (1/2)² = 1/4. The value 1/2 is the amplitude itself, before squaring, and 3/4 is P(0).' },
      { q: 'Which of these is a valid qubit state?', options: ['0.6|0⟩ + 0.8i|1⟩', '0.5|0⟩ + 0.5|1⟩', '|0⟩ + |1⟩', '0.6|0⟩ − 0.6|1⟩'], answer: 0,
        why: '0.6² + |0.8i|² = 0.36 + 0.64 = 1. The other three have squared lengths 0.5, 2 and 0.72, so they are not normalized.' },
      { q: 'You measure a qubit and get 1. You measure it again straight away. What do you get?', options: ['1, with certainty', '0 or 1 with the original probabilities', '0, with certainty', '0 or 1 with probability 1/2 each'], answer: 0,
        why: 'The first measurement collapsed the state to |1⟩, which gives 1 every time.' },
      { q: 'You estimate a probability from 400 shots. How many shots do you need to halve the error?', options: ['1,600', '800', '200', '400, measuring each copy twice'], answer: 0,
        why: 'The error shrinks like 1/√N, so halving it takes four times as many shots. Measuring a copy twice gives no new information, because the first measurement collapsed it.' },
      { q: 'Qubit A is |+⟩. Qubit B was set to |0⟩ or |1⟩ by a fair coin toss. Which experiment tells them apart?', options: ['Apply H, then measure: A always gives 0, B gives 0 or 1 at random', 'Measure each one in the 0/1 basis many times', 'Measure each qubit twice in a row', 'No experiment can tell them apart'], answer: 0,
        why: 'Both give 50/50 in a plain measurement. After H, A becomes |0⟩, while B becomes |+⟩ or |−⟩, which still give 50/50.' },
      { q: 'A qubit has amplitudes α = 1/√2 and β = −1/√2. What is P(1)?', options: ['1/2', '−1/2', '−1/√2', '0'], answer: 0,
        why: 'P(1) = |−1/√2|² = 1/2. A probability is a squared length and is never negative.' }
    ]
  });

  /* ===================================================================== 1.2 */
  C.text('phase', {
    lede: `Amplitudes are complex numbers. Their lengths set the probabilities; their angles, called phases, decide how amplitudes combine. One kind of phase can be measured and one cannot, and telling them apart is the point of this chapter.`,
    html: `
${C.objectives([
  'Draw each amplitude as an arrow and read off its size and its phase',
  'Separate the global phase, which no experiment can see, from the relative phase, which is real',
  'Find the relative phase of a state and remove its global phase',
  'Compute P(+) and P(−), and see how the relative phase sets them',
  'Read the phase colour wheel used in the rest of the course'
], ['qubit', 'complex', 'eigen'])}

<h2>Amplitudes are arrows</h2>
<p>In chapter ${ref('qubit')} the amplitudes were real. In general they are complex numbers, and each one is an arrow in the complex plane, as in chapter ${ref('complex')}. In polar form,</p>
${F('α = |α| e<sup>iγ₀</sup> &nbsp;&nbsp; and &nbsp;&nbsp; β = |β| e<sup>iγ₁</sup>')}
<p>The lengths |α| and |β| set the probabilities |α|² and |β|². The angles γ₀ and γ₁ are the <b>phases</b>. A probability is a squared length, so the phases never change P(0) or P(1). Here are three states with identical probabilities and different phases:</p>
${C.table(['State', 'α', 'β', 'P(0)', 'P(1)'], [
  ['|+⟩ = (|0⟩ + |1⟩)/√2', '1/√2', '1/√2', '1/2', '1/2'],
  ['|−⟩ = (|0⟩ − |1⟩)/√2', '1/√2', '−1/√2 = e<sup>iπ</sup>/√2', '1/2', '1/2'],
  ['|+i⟩ = (|0⟩ + i|1⟩)/√2', '1/√2', 'i/√2 = e<sup>iπ/2</sup>/√2', '1/2', '1/2']
])}
<p>A measurement of 0 or 1 cannot tell these three apart. Yet chapter ${ref('linalg')} showed that |+⟩ and |−⟩ are orthogonal, as different as two states can be. The phases must be doing something.</p>

<h2>Global phase: invisible</h2>
<p>Multiply the whole state by a phase factor e<sup>iγ</sup> and both arrows turn by the same angle γ. As chapter ${ref('eigen')} showed, this changes no probability of any measurement in any basis, ever. So |ψ⟩ and e<sup>iγ</sup>|ψ⟩ are the same physical state, and the shared angle is called the <b>global phase</b>. For example, i|0⟩ and −|0⟩ are both simply |0⟩.</p>

<h2>Relative phase: real</h2>
<p>What does matter is the angle between the two arrows:</p>
${F('φ = arg β − arg α')}
<p>This is the <b>relative phase</b>. Turning both arrows together leaves φ unchanged; turning only β changes it. Once the global phase is removed, every qubit state can be written with a real, non-negative α:</p>
${F('|ψ⟩ = |α| |0⟩ + e<sup>iφ</sup> |β| |1⟩')}
<p>So a qubit has exactly two numbers that matter: how the probability is split between |0⟩ and |1⟩, and the relative phase φ.</p>
${C.worked('Remove the global phase from (i|0⟩ + |1⟩)/√2', [
  'The amplitude of |0⟩ is i = e<sup>iπ/2</sup>. Factor it out of both terms: (i|0⟩ + |1⟩)/√2 = i (|0⟩ + (1/i)|1⟩)/√2.',
  '1/i = −i (chapter 0.1), so the state is i · (|0⟩ − i|1⟩)/√2.',
  'Drop the global factor i. Physically the state is (|0⟩ − i|1⟩)/√2, which is |−i⟩.',
  'Check with the relative phase directly: arg β − arg α = 0 − π/2 = −π/2, the angle of −i.'
], '(i|0⟩ + |1⟩)/√2 and |−i⟩ are the same physical state.')}
${C.bench('q-phase', 'Two amplitudes as arrows', 'Rotate both together, or only β')}
<p>The panel draws α and β as arrows, with the Bloch sphere of the next chapter on the right. Turning both arrows together changes nothing on the right. Turning β alone moves the state around the sphere, even though P(0) and P(1) stay exactly the same.</p>

<h2>Where relative phase shows up: other measurements</h2>
<p>Measure in the X basis instead, asking "|+⟩ or |−⟩?". By the rule from chapter ${ref('linalg')}, the amplitude of |+⟩ in |ψ⟩ is ⟨+|ψ⟩, and the amplitude of |−⟩ is ⟨−|ψ⟩:</p>
${C.align([
  ['⟨+|ψ⟩', '(α + β)/√2', 'the bra ⟨+| is the row (1/√2, 1/√2)'],
  ['P(+)', '|α + β|² / 2', ''],
  ['P(−)', '|α − β|² / 2', 'the same steps with ⟨−| = (1/√2, −1/√2)']
])}
<p>Now the amplitudes are <b>added</b> before squaring, and when complex numbers are added their angles matter (chapter ${ref('complex')}). For an equal split, |α| = |β| = 1/√2:</p>
${C.worked('P(+) for the state (|0⟩ + e<sup>iφ</sup>|1⟩)/√2', [
  'α + β = (1 + e<sup>iφ</sup>)/√2, so P(+) = |1 + e<sup>iφ</sup>|² / 4.',
  '1 + e<sup>iφ</sup> = (1 + cos φ) + i sin φ, so |1 + e<sup>iφ</sup>|² = (1 + cos φ)² + sin² φ = 2 + 2 cos φ.',
  'So P(+) = (1 + cos φ)/2, and in the same way P(−) = (1 − cos φ)/2.',
  'φ = 0 (the state |+⟩) gives P(+) = 1. φ = π (|−⟩) gives P(+) = 0. φ = π/2 (|+i⟩) gives P(+) = 1/2.'
], 'The relative phase alone decides the X-basis result, all the way from a certain + to a certain −.')}
${C.bench('add-amps', 'Why the phase matters in the X basis', 'Turn φ and watch α + β and α − β change length')}
<p>This is the mechanism behind every quantum algorithm. A gate such as H combines amplitudes; their phases decide whether the combined amplitudes reinforce or cancel; and the result shows up as a change in probabilities. Chapter ${ref('interference')} shows the same picture with many more arrows.</p>

<h2>The phase colour wheel</h2>
<p>A phase is an angle, so it can be shown as a colour on a wheel. The rest of the course uses this wheel whenever many amplitudes are shown at once: blue is a positive real amplitude (phase 0), amber a negative one (phase π), and the colours in between are the complex phases. Wherever colour carries phase, a needle or an arrow carries it too, so you never have to rely on colour alone.</p>
<div class="formula" data-wheel></div>
${C.pitfall('A minus sign is not a negative probability', `<p>−1/√2 is an amplitude, and its probability is |−1/√2|² = 1/2. A negative amplitude means the arrow points the other way, which matters only when it is added to another amplitude. Probabilities always lie between 0 and 1.</p>`)}
${C.deeper('Why a global phase can never be detected', `<p>Every experiment is a sequence of gates followed by a measurement. Gates are linear, so U(e<sup>iγ</sup>|ψ⟩) = e<sup>iγ</sup> U|ψ⟩: the factor rides along unchanged. At the end, each outcome has probability |⟨e|e<sup>iγ</sup>Uψ⟩|² = |e<sup>iγ</sup>|² |⟨e|Uψ⟩|² = |⟨e|Uψ⟩|², because |e<sup>iγ</sup>| = 1. Every probability is the same with or without the factor, so nothing can reveal it.</p>
<p>One subtlety: a phase is global only if it multiplies the entire state of everything you are describing. With two qubits, a phase on one qubit’s |1⟩ alone is relative. Chapter ${ref('multigates')} shows a surprising consequence called <b>phase kickback</b>, where a controlled gate turns a phase that would be global for one qubit into a relative phase on another.</p>`)}

${C.keyIdea('Only the relative phase is physical. It is invisible to a plain 0/1 measurement, but it decides whether amplitudes reinforce or cancel when they are combined, and that shows up in other measurements.')}
${C.tryThis([
  'Press "Turn both by 45° (global)" a few times. Does anything on the right-hand side change?',
  'Set the split to π/2 and turn β by π in total. You have made |−⟩ from |+⟩: P(0) stayed at 50%, but P(+) went from 100% to 0%.',
  'In the second panel, choose |+i⟩. Why are α + β and α − β exactly the same length?',
  'In the second panel, choose |0⟩. Why does φ make no difference at all here?',
  'Find a state with P(0) = 50% and P(+) = 50%. Where is it on the sphere?',
  'On paper: is (−|0⟩ + |1⟩)/√2 the same physical state as |−⟩? Hint: factor out −1.'
])}
${C.recap([
  'Each amplitude is an arrow: its length sets a probability and its angle is its phase.',
  'A global phase e<sup>iγ</sup> turns both arrows together and can never be detected.',
  'The relative phase φ = arg β − arg α is physical. Every state can be written |α| |0⟩ + e<sup>iφ</sup> |β| |1⟩.',
  'In the X basis, P(±) = |α ± β|²/2. For an equal split, P(+) = (1 + cos φ)/2.',
  'Phase is invisible to a 0/1 measurement but decides how amplitudes combine.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'Which change to a state can no measurement ever detect?', options: ['Multiplying the whole state by e<sup>iγ</sup>', 'Changing the relative phase', 'Moving from |+⟩ to |−⟩', 'Changing how the probability is split between |0⟩ and |1⟩'], answer: 0,
        why: 'A global phase multiplies every amplitude by the same number of length 1, so every probability of every measurement stays the same.' },
      { q: 'What is the relative phase of (|0⟩ + i|1⟩)/√2?', options: ['π/2', '0', 'π', '−π/2'], answer: 0,
        why: 'arg β − arg α = arg(i) − arg(1) = π/2 − 0 = π/2.' },
      { q: 'A qubit in (|0⟩ − |1⟩)/√2 is measured in the X basis. What is P(+)?', options: ['0', '1/2', '1', '1/4'], answer: 0,
        why: 'P(+) = |α + β|²/2 = |1/√2 − 1/√2|²/2 = 0. This state is |−⟩, so the answer is always −.' },
      { q: 'For the state (|0⟩ + e<sup>iφ</sup>|1⟩)/√2, what is P(+)?', options: ['(1 + cos φ)/2', '1/2 for every φ', 'cos² φ', '(1 + sin φ)/2'], answer: 0,
        why: '|1 + e<sup>iφ</sup>|² = 2 + 2 cos φ, and P(+) is a quarter of that.' },
      { q: 'Are (i|0⟩ + i|1⟩)/√2 and |+⟩ the same physical state?', options: ['Yes: they differ only by the global phase i', 'No: one of them has complex amplitudes', 'No: their values of P(0) differ', 'Only when they are measured in the X basis'], answer: 0,
        why: '(i|0⟩ + i|1⟩)/√2 = i|+⟩. The factor i multiplies the whole state, so it is a global phase.' },
      { q: 'Two states have the same P(0) and the same P(1). What can you conclude?', options: ['Nothing more: they can still differ in relative phase', 'They are the same state', 'They differ only by a global phase', 'They are orthogonal'], answer: 0,
        why: '|+⟩ and |−⟩ have identical P(0) and P(1) but are orthogonal. The 0/1 probabilities miss the relative phase entirely.' }
    ]
  });

  /* ===================================================================== 1.3 */
  C.text('bloch', {
    lede: `Drop the global phase and every qubit state becomes a point on a sphere. It is the most useful picture in quantum computing. This chapter builds it step by step and shows how to read probabilities straight off it.`,
    html: `
${C.objectives([
  'Write any state as cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩ and find its two angles',
  'Place |0⟩, |1⟩, |±⟩ and |±i⟩ on the sphere',
  'Read P(0) from the height of the arrow',
  'Explain why orthogonal states sit at opposite points',
  'Compute the Bloch vector (x, y, z) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩) from the amplitudes'
], ['phase', 'eigen'])}

<h2>Two numbers, two angles</h2>
<p>A qubit state has two complex amplitudes, which is four real numbers. Normalization, |α|² + |β|² = 1, removes one of them. The global phase, which no experiment can see, removes another. Two real numbers are left, and chapter ${ref('phase')} named them: the split between |0⟩ and |1⟩, and the relative phase φ.</p>
<p>Because |α|² + |β|² = 1 and both lengths are at least 0, we can write |α| = cos(θ/2) and |β| = sin(θ/2) for some angle θ between 0 and π. Every state then takes the form</p>
${F('|ψ⟩ = cos(θ/2) |0⟩ + e<sup>iφ</sup> sin(θ/2) |1⟩')}
<p>with θ from 0 to π and φ from 0 to 2π. Two angles like these pick out a point on a sphere, the way latitude and longitude pick out a place on Earth: θ is measured down from the north pole, and φ is measured around the equator, counterclockwise from the x axis. This is the <b>Bloch sphere</b>, named after the physicist Felix Bloch.</p>
<p>The point’s coordinates are (x, y, z) = (sin θ cos φ, sin θ sin φ, cos θ). The arrow from the centre to this point is called the <b>Bloch vector</b>.</p>

<h2>Six landmarks</h2>
${C.table(['State', 'θ', 'φ', '(x, y, z)', 'Where'], [
  ['|0⟩', '0', 'any', '(0, 0, 1)', 'north pole'],
  ['|1⟩', 'π', 'any', '(0, 0, −1)', 'south pole'],
  ['|+⟩', 'π/2', '0', '(1, 0, 0)', 'equator, +x'],
  ['|−⟩', 'π/2', 'π', '(−1, 0, 0)', 'equator, −x'],
  ['|+i⟩', 'π/2', 'π/2', '(0, 1, 0)', 'equator, +y'],
  ['|−i⟩', 'π/2', '3π/2', '(0, −1, 0)', 'equator, −y']
], 'compact')}
<p>At the poles φ has no meaning, just as longitude has none at Earth’s poles: one of the amplitudes is zero, so there is no relative phase to speak of. Every equal superposition of |0⟩ and |1⟩ lies on the equator.</p>
${C.worked('Place (√3/2)|0⟩ + (1/2)|1⟩ on the sphere', [
  'α = √3/2 is real and positive, so there is no global phase to remove. cos(θ/2) = √3/2 means θ/2 = π/6 (30°), so θ = π/3 (60°).',
  'β = 1/2 is real and positive, so φ = 0.',
  '(x, y, z) = (sin 60°, 0, cos 60°) ≈ (0.866, 0, 0.5).',
  'Check: P(0) = (√3/2)² = 3/4, and (1 + z)/2 = (1 + 0.5)/2 = 3/4.'
], 'The state sits 60° down from the north pole, on the side facing +x.')}
${C.worked('Place (i|0⟩ − |1⟩)/√2 on the sphere', [
  'α = i is not real, so first remove the global phase by factoring out i: (i|0⟩ − |1⟩)/√2 = i (|0⟩ + i|1⟩)/√2, because −1/i = i.',
  'Now α = 1/√2 = cos(π/4), so θ = π/2: the state is on the equator.',
  'β = i/√2 = e<sup>iπ/2</sup>/√2, so φ = π/2.',
  '(x, y, z) = (0, 1, 0). The state is |+i⟩.'
], 'Always remove the global phase first, by making α real and non-negative.')}
${C.bench('q-bloch', 'Explore the sphere', 'Drag the arrow tip to move the state · drag elsewhere to turn the view · double-click to reset')}

<h2>Reading probabilities off the sphere</h2>
<p>The height of the arrow gives the 0/1 probabilities. Since cos θ = cos²(θ/2) − sin²(θ/2) = P(0) − P(1), and P(0) + P(1) = 1,</p>
${F('P(0) = (1 + z)/2 &nbsp;&nbsp; and &nbsp;&nbsp; P(1) = (1 − z)/2')}
<p>All points at the same height, around a circle of latitude, have the same P(0). The north pole gives 0 for certain, the south pole gives 1 for certain, and the whole equator gives a fair coin. Moving around a circle of latitude changes only φ, which is why the relative phase is invisible to a 0/1 measurement.</p>

<h2>The coordinates are averages you can measure</h2>
<p>The three coordinates of the Bloch vector are the expectation values of the three Pauli matrices from chapter ${ref('eigen')}:</p>
${F('x = ⟨X⟩, &nbsp;&nbsp; y = ⟨Y⟩, &nbsp;&nbsp; z = ⟨Z⟩')}
<p>So each coordinate is something an experiment can estimate: measure along that axis many times, score each result as +1 or −1, and average. Chapter ${ref('measure')} shows how to do this on real hardware.</p>
${C.deeper('Deriving x, y and z from the amplitudes', `<p>Take α = cos(θ/2) and β = e<sup>iφ</sup> sin(θ/2), and use the expectation-value formula ⟨A⟩ = ⟨ψ|A|ψ⟩ from chapter ${ref('eigen')}.</p>
${C.align([
  ['⟨Z⟩', '|α|² − |β|² = cos²(θ/2) − sin²(θ/2)', ''],
  ['', 'cos θ', 'double-angle formula'],
  ['⟨X⟩', 'α*β + β*α = 2 Re(α*β)', 'X swaps the amplitudes'],
  ['', '2 cos(θ/2) sin(θ/2) cos φ = sin θ cos φ', 'because α*β = cos(θ/2) sin(θ/2) e<sup>iφ</sup>'],
  ['⟨Y⟩', '2 Im(α*β)', 'Y turns (α, β) into (−iβ, iα)'],
  ['', 'sin θ sin φ', '']
])}
<p>These are exactly the coordinates of the point at angles θ and φ, which is why the sphere picture and the expectation values always agree.</p>`)}

<h2>Why θ/2? Opposite points are orthogonal states</h2>
<p>The formula uses θ/2, not θ, and this is the most surprising feature of the sphere. |0⟩ and |1⟩ are orthogonal vectors, at 90° to each other in the column-vector picture of chapter ${ref('linalg')}, yet on the sphere they sit at opposite poles, 180° apart. <b>Angles on the sphere are twice the angles between state vectors.</b></p>
<p>The general rule links the overlap of two states to the angle γ between their Bloch vectors r and s:</p>
${F('|⟨ψ|χ⟩|² = (1 + r·s)/2 = cos²(γ/2)')}
<p>Opposite points have r·s = −1 and overlap 0: they are orthogonal, the pairs that a single measurement can tell apart perfectly. Points at right angles on the sphere, such as |0⟩ and |+⟩, have overlap 1/2.</p>
${C.bench('bloch-pair', 'Two states on the sphere', 'Drag either arrow tip')}
${C.deeper('Checking the overlap rule', `<p>Take χ = |0⟩, the north pole, so s = (0, 0, 1). Then |⟨0|ψ⟩|² = cos²(θ/2) = (1 + cos θ)/2 = (1 + z)/2 = (1 + r·s)/2, just as the rule says. For any other χ, turn the whole sphere until χ is at the north pole. Chapter ${ref('gates')} shows that turning the sphere is exactly what a gate does. Gates keep overlaps (they are unitary) and keep the angles between Bloch vectors (they are rotations), so the rule holds for every pair.</p>`)}
${C.pitfall('The arrow on the sphere is not the state vector', `<p>In the flat picture of chapter ${ref('qubit')}, the state cos t|0⟩ + sin t|1⟩ was an arrow at angle t. On the sphere, the same state sits at θ = 2t in the x–z plane. So the arrow at 45° in chapter 1.1 is |+⟩, which on the sphere is 90° from the north pole, on the equator. Whenever you move between the two pictures, double or halve the angle.</p>`)}
${C.pitfall('One sphere describes one qubit', `<p>Two qubits are not simply two spheres. Entangled states, which arrive in chapter ${ref('entangle')}, cannot be drawn as one arrow per qubit: each qubit’s own arrow shrinks inside its sphere. The inside of the sphere, called the Bloch ball, also holds the noisy mixed states of chapter ${ref('noise')}.</p>`)}

${C.keyIdea('A pure qubit state is a point on the sphere. Its height sets the odds of 0 versus 1, and its angle around the vertical axis is the relative phase. Opposite points are orthogonal states.')}
${C.tryThis([
  'Drag the arrow anywhere on the equator. What is P(0) there?',
  'Find a state with P(0) = 85%, ⟨X⟩ = 0 and ⟨Y⟩ greater than 0.',
  'Move the arrow to |−i⟩ and read the amplitudes. Which one carries the phase?',
  'In the two-state panel, put χ at the south pole. Where must ψ be for the overlap to be 3/4?',
  'Choose "|0⟩ and |+⟩". They are 90° apart on the sphere. What is the angle between the state vectors?',
  'On paper: find θ and φ for (|0⟩ − i|1⟩)/√2, then check your answer with the first panel.'
])}
${C.recap([
  'Every state can be written cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩: a point on the Bloch sphere.',
  '|0⟩ and |1⟩ are the poles; |±⟩ and |±i⟩ sit on the equator along ±x and ±y.',
  'The Bloch vector is (x, y, z) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩) = (sin θ cos φ, sin θ sin φ, cos θ).',
  'P(0) = (1 + z)/2: the height sets the 0/1 odds, and φ is the relative phase.',
  'Opposite points are orthogonal states, and |⟨ψ|χ⟩|² = (1 + r·s)/2.',
  'Remove the global phase (make α real and non-negative) before reading off θ and φ.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'Where on the Bloch sphere is |−i⟩ = (|0⟩ − i|1⟩)/√2?', options: ['On the equator, along −y', 'At the south pole', 'On the equator, along −x', 'At the north pole'], answer: 0,
        why: 'Equal sizes put it on the equator, and the relative phase −π/2 (the same as 3π/2) points along −y.' },
      { q: 'A state has z = 0.6. What is P(0)?', options: ['0.8', '0.6', '0.36', '0.3'], answer: 0,
        why: 'P(0) = (1 + z)/2 = 1.6/2 = 0.8.' },
      { q: '|0⟩ and |1⟩ are orthogonal. Where are they on the sphere?', options: ['At opposite points, 180° apart', '90° apart', 'At the same point', '45° apart'], answer: 0,
        why: 'Angles on the sphere are twice the angles between state vectors. Orthogonal vectors, at 90°, become opposite points at 180°.' },
      { q: 'Which state has θ = π/2 and φ = π?', options: ['|−⟩', '|+⟩', '|1⟩', '|−i⟩'], answer: 0,
        why: 'cos(π/4)|0⟩ + e<sup>iπ</sup> sin(π/4)|1⟩ = (|0⟩ − |1⟩)/√2 = |−⟩.' },
      { q: 'What is the Bloch vector of (√3/2)|0⟩ + (1/2)|1⟩?', options: ['(√3/2, 0, 1/2)', '(1/2, 0, √3/2)', '(0, 0, 1)', '(√3/2, 1/2, 0)'], answer: 0,
        why: 'θ = π/3 and φ = 0, so (sin θ cos φ, sin θ sin φ, cos θ) = (√3/2, 0, 1/2).' },
      { q: 'Two states sit at right angles on the sphere, like |0⟩ and |+⟩. What is |⟨ψ|χ⟩|²?', options: ['1/2', '0', '1', '1/√2'], answer: 0,
        why: '(1 + r·s)/2 with r·s = 0 gives 1/2. Check directly: |⟨0|+⟩|² = (1/√2)² = 1/2.' }
    ]
  });
})(window);

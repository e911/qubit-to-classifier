/* Words for Part II, gates and measurement. Interactive panels live in src/ch2.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref, mat = C.mat;
  const D = s => `<div class="eqn center">${s}</div>`;

  /* ===================================================================== 2.1 */
  C.text('gates', {
    lede: `A single-qubit gate is a 2 × 2 unitary matrix, and on the Bloch sphere every one of them is a rotation. This chapter introduces the standard gates, works out what each one does with matrix arithmetic, and shows how to combine them and read circuits.`,
    html: `
${C.objectives([
  'Know the matrices of X, Y, Z, H, S and T, and of the rotations Rx, Ry and Rz',
  'Apply a gate to a state by hand and find the new point on the sphere',
  'See every single-qubit gate as a turn of the sphere about an axis',
  'Combine gates in the right order and read a circuit diagram',
  'Use identities such as HZH = X to simplify circuits'
], ['bloch', 'linalg', 'eigen'])}

<h2>What a gate does</h2>
<p>A <b>gate</b> changes a qubit’s state without measuring it. Mathematically it is a 2 × 2 matrix U, and the new state is U times the old column of amplitudes (chapter ${ref('linalg')}). As chapter ${ref('eigen')} explained, U must be unitary, U†U = I, so that the probabilities still add up to 1 for every input. Unitary also means reversible: every gate can be undone by applying U†.</p>
<p>In a <b>circuit diagram</b>, each qubit is a horizontal wire, time runs from left to right, and each gate is a box on the wire:</p>
${C.circ(B => B(1).g('H', 0).g('S', 0), { caption: 'Start in |0⟩, apply H, then S. The small numbers count the steps.' })}
<p>As a formula, this circuit is S H |0⟩, written from right to left because the matrix next to the state acts first.</p>

<h2>The Pauli gates X, Y and Z</h2>
${C.table(['Gate', 'Matrix', 'On |0⟩', 'On |1⟩', 'On the sphere'], [
  ['X', mat([['0', '1'], ['1', '0']], 'small'), '|1⟩', '|0⟩', 'half turn about x'],
  ['Y', mat([['0', '−i'], ['i', '0']], 'small'), 'i|1⟩', '−i|0⟩', 'half turn about y'],
  ['Z', mat([['1', '0'], ['0', '−1']], 'small'), '|0⟩', '−|1⟩', 'half turn about z']
])}
<p>X is the quantum NOT: it swaps the two amplitudes. Z leaves |0⟩ alone and flips the sign of |1⟩. This is called a <b>phase flip</b>: it changes neither P(0) nor P(1), yet it turns |+⟩ into |−⟩. Y does both at once, up to a factor of i: Y = iXZ.</p>
${C.worked('Z turns |+⟩ into |−⟩', [
  'Z (1/√2, 1/√2) = (1/√2, −1/√2), which is |−⟩.',
  'On the sphere, |+⟩ is at +x and |−⟩ is at −x. A half turn about the z axis carries +x to −x.',
  'Z|0⟩ = |0⟩ and Z|1⟩ = −|1⟩, which is |1⟩ up to a global phase. The poles lie on the z axis, so a turn about z leaves them where they are.'
], 'The matrix and the rotation describe the same thing.')}

<h2>The Hadamard gate</h2>
${D(`H = (1/√2) ${mat([['1', '1'], ['1', '−1']])}`)}
<p>H turns |0⟩ into |+⟩ and |1⟩ into |−⟩, and since H² = I it also turns |+⟩ back into |0⟩ and |−⟩ into |1⟩. It swaps the Z basis with the X basis. On the sphere, H is a half turn about the diagonal axis halfway between x and z. That turn swaps the x and z axes and flips the y axis over, so it should send |+i⟩ to |−i⟩. Here is the check:</p>
${C.worked('Where does H send |+i⟩?', [
  'H (1/√2)(1, i): row 1 gives (1 + i)/2 and row 2 gives (1 − i)/2.',
  'Factor out (1 + i)/2. Since (1 − i)/(1 + i) = −i, the result is ((1 + i)/2)(|0⟩ − i|1⟩) = ((1 + i)/√2) · (|0⟩ − i|1⟩)/√2.',
  '(1 + i)/√2 = e<sup>iπ/4</sup> has length 1, so it is a global phase. H|+i⟩ = e<sup>iπ/4</sup> |−i⟩.'
], 'On the sphere, +y goes to −y, just as a half turn about the x + z diagonal predicts.')}

<h2>Phase gates S and T</h2>
${D(`S = ${mat([['1', '0'], ['0', 'i']])} <span class="eqn-gap"></span> T = ${mat([['1', '0'], ['0', 'e<sup>iπ/4</sup>']])}`)}
<p>Phase gates leave |0⟩ alone and multiply |1⟩ by a phase factor, so they never change P(0) or P(1). They change only the relative phase φ, which on the sphere means turning about the z axis: S by a quarter turn (90°) and T by an eighth turn (45°). Two T gates make an S, and two S gates make a Z. Their inverses S† and T† turn the other way. The general version is the phase gate P(λ), which multiplies |1⟩ by e<sup>iλ</sup> and turns the sphere by λ about z.</p>
${C.worked('Follow |+⟩ through T', [
  'T|+⟩ = (1/√2)(1, e<sup>iπ/4</sup>), so the relative phase is now φ = π/4.',
  'The split is still equal, so the state is on the equator, 45° from +x toward +y.',
  'Apply T again: φ = π/2, which is |+i⟩. So TT does what S does.'
], 'Eight T gates take |+⟩ all the way around the equator and back to |+⟩.')}

<h2>Rotations by any angle</h2>
<p>The rotation gates turn the sphere by any angle θ about the x, y or z axis:</p>
${D(`Rx(θ) = ${mat([['cos(θ/2)', '−i sin(θ/2)'], ['−i sin(θ/2)', 'cos(θ/2)']], 'small')} <span class="eqn-gap"></span> Ry(θ) = ${mat([['cos(θ/2)', '−sin(θ/2)'], ['sin(θ/2)', 'cos(θ/2)']], 'small')} <span class="eqn-gap"></span> Rz(θ) = ${mat([['e<sup>−iθ/2</sup>', '0'], ['0', 'e<sup>iθ/2</sup>']], 'small')}`)}
<p>These are the knobs of the trainable quantum models in Part VII: a number θ is fed into a rotation, and training adjusts θ.</p>
${C.worked('Ry(θ) applied to |0⟩', [
  'Ry(θ)|0⟩ is the first column of Ry(θ): cos(θ/2)|0⟩ + sin(θ/2)|1⟩.',
  'Compare with the Bloch form from chapter 1.3: the relative phase is 0 and the polar angle is θ. The arrow has tipped by θ from the north pole toward +x.',
  'θ = π/2 gives (|0⟩ + |1⟩)/√2 = |+⟩, and θ = π gives |1⟩.',
  'P(1) = sin²(θ/2), which grows smoothly from 0 to 1 as θ goes from 0 to π.'
], 'This is the simplest way to load a number into a qubit. It returns as angle encoding in chapter 7.2.')}
<p>Rz(λ) and P(λ) differ only by a global phase: Rz(λ) = e<sup>−iλ/2</sup> P(λ). On a single qubit they are the same gate. Chapter ${ref('multigates')} shows why the difference starts to matter once the gate is controlled by another qubit.</p>
${C.pitfall('A full turn of the sphere gives −1', `<p>Because the matrices use θ/2, a full turn Rx(2π) has entries cos π = −1 and sin π = 0, so Rx(2π) = −I. A full turn of the sphere multiplies every state by −1, a global phase, so physically nothing has changed. The matrix itself only returns to I after two full turns, θ = 4π. This is the same halving of angles you met on the Bloch sphere.</p>`)}

<h2>Every single-qubit gate is a rotation</h2>
<p>Any 2 × 2 unitary matrix is, up to a global phase, a turn of the Bloch sphere by some angle about some axis. Here are the axes and angles of the standard gates:</p>
${C.table(['Gate', 'Axis', 'Angle'], [
  ['X, Y, Z', 'x, y, z', 'π'],
  ['H', '(x + z)/√2, the diagonal', 'π'],
  ['S, S†', 'z', 'π/2, −π/2'],
  ['T, T†', 'z', 'π/4, −π/4'],
  ['√X', 'x', 'π/2'],
  ['Rx(θ), Ry(θ), Rz(θ)', 'x, y, z', 'θ']
], 'compact')}
${C.bench('g-bench', 'Gate bench', 'Tap a gate to apply it to the current state')}
<p>The brass line is the rotation axis, and the trail shows the path of the arrow. For each step, the inspector shows the matrix multiplication, so you can check it against your own arithmetic.</p>
${C.bench('gate-sphere', 'Every gate turns the whole sphere', 'Watch all six landmark states move at once')}
<p>A gate does not move just one state: it turns the whole sphere and carries every state with it. This panel follows the six landmark states together. The table shows exactly where each one ends up, including any global phase the matrix produces, such as Y|0⟩ = i|1⟩. Those phases do not move the points, which is why no measurement can see them.</p>

<h2>Combining gates</h2>
<p>Gates applied one after another multiply their matrices, and the order matters, because turns about different axes do not commute.</p>
${C.worked('H then S, versus S then H, starting from |0⟩', [
  'H then S: H|0⟩ = |+⟩, and S|+⟩ = |+i⟩ (chapter 0.2). As a formula, SH|0⟩ = |+i⟩.',
  'S then H: S|0⟩ = |0⟩, because S leaves |0⟩ alone. Then H|0⟩ = |+⟩. As a formula, HS|0⟩ = |+⟩.',
  '|+i⟩ and |+⟩ are different states, 90° apart on the sphere.'
], 'SH and HS are different gates.')}
${C.worked('Show that HZH = X', [
  `ZH = ${mat([['1', '0'], ['0', '−1']], 'small')} · (1/√2) ${mat([['1', '1'], ['1', '−1']], 'small')} = (1/√2) ${mat([['1', '1'], ['−1', '1']], 'small')}.`,
  `H(ZH) = (1/2) ${mat([['1', '1'], ['1', '−1']], 'small')} ${mat([['1', '1'], ['−1', '1']], 'small')} = (1/2) ${mat([['0', '2'], ['2', '0']], 'small')}.`,
  `That is ${mat([['0', '1'], ['1', '0']], 'small')} = X.`
], 'On the sphere: H swaps the x and z axes, so a half turn about z, sandwiched between two H gates, becomes a half turn about x.')}
${C.circ(B => B(1).g('H', 0).g('Z', 0).g('H', 0), { caption: 'These three gates together do exactly what one X gate does.' })}
${C.table(['Identity', 'Why it holds'], [
  ['HXH = Z and HZH = X', 'H swaps the x and z axes'],
  ['HYH = −Y', 'H flips the y axis over'],
  ['X² = Y² = Z² = H² = I', 'a half turn done twice is a full turn'],
  ['T² = S and S² = Z', 'turns about the same axis add up'],
  ['SXS† = Y', 'S turns the x axis onto the y axis'],
  ['XZ = −ZX', 'different Pauli matrices anticommute']
], 'compact')}
${C.deeper('The rotation formula', `<p>Every rotation gate can be written as</p>
${F('R<sub>n</sub>(θ) = cos(θ/2) I − i sin(θ/2) (n<sub>x</sub> X + n<sub>y</sub> Y + n<sub>z</sub> Z)')}
<p>where n = (n<sub>x</sub>, n<sub>y</sub>, n<sub>z</sub>) is the axis, a unit vector. For n = z this gives the diagonal matrix with entries e<sup>−iθ/2</sup> and e<sup>iθ/2</sup>, which is Rz(θ). Apply it to cos(a/2)|0⟩ + e<sup>iφ</sup> sin(a/2)|1⟩: the result is e<sup>−iθ/2</sup> [cos(a/2)|0⟩ + e<sup>i(φ + θ)</sup> sin(a/2)|1⟩]. Apart from the global phase, φ has grown by θ, so the point has turned by θ about the z axis. The same calculation in turned coordinates works for any axis. Since X = i R<sub>x</sub>(π), the Pauli gates are half turns up to the global phase i.</p>`)}

${C.keyIdea('For one qubit, every gate is a rotation of the Bloch sphere. The matrix and the rotation are two descriptions of the same thing. Composing gates composes rotations, so the order matters.')}
${C.tryThis([
  'From |0⟩ apply H, then Z, then H. Which single gate did you just build?',
  'Start from |+⟩ and apply T eight times. Why are you back where you started?',
  'From |0⟩, compare H with Ry(π/2). Do they reach the same point? Now start from |+i⟩ and compare again.',
  'In the whole-sphere panel, apply S four times. Which landmark states never move, and why?',
  'In the whole-sphere panel, apply H and read the table. Which outputs carry a global phase?',
  'Apply S then H, then reset and apply H then S. Do you get the same state?'
])}
${C.recap([
  'A gate is a unitary matrix: the new state is the matrix times the old column, and every gate can be undone.',
  'X, Y and Z are half turns about x, y and z. H is a half turn about the x + z diagonal and swaps the Z and X bases.',
  'S and T are quarter and eighth turns about z. They change only the relative phase.',
  'Rx, Ry and Rz turn by any angle θ, and their matrices use θ/2.',
  'Every single-qubit gate is a rotation of the sphere, up to a global phase.',
  'Gates in a circuit multiply from right to left, and the order matters: SH is not HS.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'What is HZH?', options: ['X', 'Y', 'Z', 'The identity'], answer: 0,
        why: 'H swaps the x and z axes, so a half turn about z becomes a half turn about x. Multiplying the matrices gives [[0, 1], [1, 0]] = X.' },
      { q: 'Starting from |0⟩, which sequence produces |+i⟩?', options: ['H, then S', 'S, then H', 'Z, then H', 'H, then Z'], answer: 0,
        why: 'H gives |+⟩, and S turns it a quarter turn about z to |+i⟩. S first does nothing to |0⟩, so S then H gives |+⟩. H then Z gives |−⟩, and Z then H gives |+⟩.' },
      { q: 'What does the T gate do on the Bloch sphere?', options: ['Turns it 45° about the z axis', 'Turns it 90° about the z axis', 'Turns it 45° about the x axis', 'Turns it half a turn about the x + z diagonal'], answer: 0,
        why: 'T multiplies the |1⟩ amplitude by e<sup>iπ/4</sup>, which adds π/4 to the relative phase: an eighth turn about z.' },
      { q: 'What is Ry(π)|0⟩?', options: ['|1⟩', '|+⟩', '|0⟩', '|−⟩'], answer: 0,
        why: 'Ry(θ)|0⟩ = cos(θ/2)|0⟩ + sin(θ/2)|1⟩, and θ = π gives |1⟩: a half turn about y carries the north pole to the south pole.' },
      { q: 'What is the matrix Rx(2π)?', options: ['−I', 'I', 'X', '−X'], answer: 0,
        why: 'The entries use θ/2 = π, and cos π = −1, sin π = 0. A full turn multiplies every state by −1, a global phase, so physically nothing changes.' },
      { q: 'Which gate never changes P(0) or P(1), whatever the input?', options: ['S', 'H', 'X', 'Ry(π/2)'], answer: 0,
        why: 'S multiplies the |1⟩ amplitude by i, which changes its phase but not its length. The other three move states up or down the sphere.' }
    ]
  });

  /* ===================================================================== 2.2 */
  C.text('measure', {
    lede: `Measuring asks a qubit a yes-or-no question along one axis. You get one bit, the state collapses, and only many repetitions reveal the probabilities. This chapter shows how to measure along any axis, why some questions cannot be answered together, and how to rebuild a whole state from measurements.`,
    html: `
${C.objectives([
  'Measure in the Z basis, and in any other basis by rotating first',
  'Compute outcome probabilities from inner products or from the Bloch vector',
  'Explain why a state that is certain along one axis is random along the perpendicular ones',
  'Estimate an expectation value from shots, with its error bar',
  'Reconstruct an unknown state with tomography'
], ['bloch', 'gates'])}

<h2>The standard measurement</h2>
<p>The ordinary measurement, called a measurement in the <b>Z basis</b> or the computational basis, asks: 0 or 1? As chapters ${ref('qubit')} and ${ref('bloch')} showed, it gives 0 with probability P(0) = |⟨0|ψ⟩|² = (1 + z)/2, and the state collapses to |0⟩ or |1⟩. On the sphere it asks "up or down?" along the z axis, and the arrow jumps to the pole that was reported.</p>
${C.circ(B => B(1).g('H', 0).m(0), { caption: 'Prepare |+⟩ and measure it. The meter symbol is a measurement in the Z basis.' })}

<h2>Measuring in any basis</h2>
<p>Any pair of orthogonal states |e₀⟩ and |e₁⟩ defines a measurement, and the rule is the same as before:</p>
${F('P(k) = |⟨e<sub>k</sub>|ψ⟩|², &nbsp; and afterwards the state is |e<sub>k</sub>⟩')}
<p>On the sphere, an orthogonal pair is a pair of opposite points, so a basis is an axis n through the sphere. The probability of the + end of the axis depends only on the shadow of the Bloch vector r on that axis:</p>
${F('P(+) = (1 + r·n)/2 &nbsp;&nbsp; and &nbsp;&nbsp; P(−) = (1 − r·n)/2')}
<p>This is the overlap rule from chapter ${ref('bloch')}, with the second state placed at the + end of the axis.</p>
${C.worked('Measure |0⟩ in the X basis', [
  'With inner products: ⟨+|0⟩ = 1/√2, so P(+) = 1/2, and likewise P(−) = 1/2.',
  'With the sphere: r = (0, 0, 1) and n = (1, 0, 0), so r·n = 0 and P(+) = (1 + 0)/2 = 1/2.',
  'Afterwards the qubit is |+⟩ or |−⟩. It is no longer |0⟩.'
], '|0⟩ is certain in the Z basis and a fair coin in the X basis.')}
${C.worked('One tilted state, measured three ways', [
  'Take θ = π/3 and φ = 0, so r = (sin 60°, 0, cos 60°) ≈ (0.866, 0, 0.5).',
  'Z basis: P(0) = (1 + 0.5)/2 = 0.75.',
  'X basis: P(+) = (1 + 0.866)/2 ≈ 0.933.',
  'Y basis: P(+i) = (1 + 0)/2 = 0.5.'
], 'One state, three questions, three differently weighted coins.')}

<h2>Hardware measures Z, so rotate first</h2>
<p>Most quantum computers can only measure in the Z basis. To measure along another axis, first apply a gate that turns that axis onto z, then measure Z:</p>
<ul>
  <li><b>X basis:</b> apply H, then measure. H swaps |+⟩ with |0⟩ and |−⟩ with |1⟩, so reading 0 means +.</li>
  <li><b>Y basis:</b> apply S†, then H, then measure. S† turns |+i⟩ into |+⟩, and H turns that into |0⟩.</li>
</ul>
${C.circ(B => B(1).g('SDG', 0).g('H', 0).m(0), { caption: 'A Y-basis measurement built from S†, H and an ordinary Z measurement.' })}
${C.worked('Check that S† then H sends |+i⟩ to |0⟩', [
  `S† = ${mat([['1', '0'], ['0', '−i']], 'small')}, so S†|+i⟩ = (1/√2)(1, −i · i) = (1/√2)(1, 1) = |+⟩.`,
  'H|+⟩ = |0⟩.',
  'In the same way, S† sends |−i⟩ to |−⟩, and H sends that to |1⟩.'
], 'Reading 0 means +i and reading 1 means −i.')}
${C.bench('m-axis', 'Measure along any axis', 'The brass line is the measurement axis')}

<h2>Complementary questions</h2>
<p>A pure state is a point on the sphere, so x² + y² + z² = 1. If a state is certain along one axis, say z = 1, then x = y = 0: it is completely random along x and along y. No state is certain along two different axes at once. This trade-off is the qubit version of the <b>uncertainty principle</b>, and pairs of bases such as Z and X are called <b>complementary</b>.</p>
<p>It also means the order of measurements matters. Measure X and get +: the state is now |+⟩. Measure Z: you get 0 or 1 at random, and the state becomes |0⟩ or |1⟩. Measure X again: the result is random again, because the Z measurement erased the earlier answer.</p>
${C.pitfall('You cannot measure X, Y and Z on one copy', `<p>Each measurement collapses the state, so a second measurement sees the collapsed state, not the original. To learn ⟨X⟩, ⟨Y⟩ and ⟨Z⟩ of a state you need fresh copies for each axis. That is why the tomography below prepares the state again for every shot.</p>`)}

<h2>Expectation values from shots</h2>
<p>Score each Z measurement as +1 for outcome 0 and −1 for outcome 1, and average over many shots. The average estimates the expectation value ⟨Z⟩ = P(0) − P(1) = z from chapter ${ref('eigen')}. Measuring along X or Y in the same way estimates x and y. Expectation values are exactly what the quantum models of Part VII output.</p>
${C.worked('Estimate ⟨Z⟩ from 1,000 shots', [
  'Suppose 620 shots gave 0 and 380 gave 1.',
  'The estimate is (620 − 380)/1000 = 0.24, which corresponds to an estimated P(0) of 0.62.',
  'Each shot is ±1, with variance 1 − ⟨Z⟩². So the standard error is √((1 − 0.24²)/1000) = √(0.9424/1000) ≈ 0.031.',
  'So ⟨Z⟩ ≈ 0.24 ± 0.03. The true value is very likely between about 0.18 and 0.30, two standard errors either side.'
], 'Halving the error bar costs four times as many shots.')}
${C.bench('converge', 'Shot noise', 'Run the same experiment again and again')}

<h2>Tomography: rebuilding a state</h2>
<p>To identify an unknown state, estimate all three coordinates: measure X on N copies, Y on N more and Z on N more. The three averages give the Bloch vector, and the Bloch vector is the whole state. This is called <b>state tomography</b>. With N shots per axis, each coordinate is off by about 1/√N, and the whole arrow by about √(2/N) for a pure state.</p>
${C.bench('m-tomo', 'Reconstruct a hidden state', 'Blue = true state (toggle) · orange = your estimate · dots = earlier estimates')}
${C.pitfall('An estimate can land outside the sphere', `<p>With few shots, the estimated arrow can come out longer than 1, which no real state allows. That is shot noise, not physics. Careful tomography fixes it by choosing the closest physical state, a method called maximum likelihood, but the simplest fix is to take more shots.</p>`)}
${C.deeper('Projectors: the general measurement rule', `<p>In the notation of chapter ${ref('linalg')}, a measurement in the basis {|e₀⟩, |e₁⟩} uses the projectors Π<sub>k</sub> = |e<sub>k</sub>⟩⟨e<sub>k</sub>|. The probability of outcome k is P(k) = ⟨ψ|Π<sub>k</sub>|ψ⟩, and the state afterwards is Π<sub>k</sub>|ψ⟩ divided by its length √P(k).</p>
<p>An observable A with eigenvalues a<sub>k</sub> and eigenvectors |e<sub>k</sub>⟩ can be written A = Σ a<sub>k</sub> Π<sub>k</sub>. Measuring it gives a<sub>k</sub> with probability P(k), so the average result is Σ a<sub>k</sub> P(k) = ⟨ψ|A|ψ⟩. That is the expectation-value formula of chapter ${ref('eigen')}, now derived.</p>`)}
${C.deeper('Why measuring along n gives (1 + r·n)/2', `<p>Turn the sphere so that n points straight up. A rotation does not change the dot product r·n, and after the turn the axis is z, where P(+) = (1 + z)/2 and the new height z of the arrow is exactly r·n. Measuring along n is described by the observable n·σ = n<sub>x</sub>X + n<sub>y</sub>Y + n<sub>z</sub>Z. Its eigenvalues are +1 and −1, and its expectation value is r·n.</p>`)}

${C.keyIdea('A measurement returns a bit, not a state. To measure along an axis, rotate that axis onto z first. Everything you know about a quantum state comes from statistics over many identical runs, and the error shrinks only like 1/√N.')}
${C.tryThis([
  'Put the state at |+⟩ and run 1,000 shots along Z. Then switch the axis to X and run again.',
  'Measure once along X, then along Z, then along X again. Why can the second X answer differ from the first?',
  'Choose "Any axis" and line the axis up with the state arrow. What is P(+)? Now point the axis the opposite way.',
  'In the shot-noise panel, set the true P(0) to 50% and press "Run 5 more". Roughly how many shots does it take before the runs stay within ±0.05 of the truth?',
  'Set the true P(0) to 100%. Why does the band disappear?',
  'In the tomography panel, go from 100 to 10,000 shots per axis. How much smaller does the cloud of estimates get?'
])}
${C.recap([
  'A Z measurement gives 0 with probability (1 + z)/2 and collapses the state to |0⟩ or |1⟩.',
  'Any basis is an axis n through the sphere: P(+) = (1 + r·n)/2 = |⟨e₊|ψ⟩|².',
  'Hardware measures Z, so rotate first: H for the X basis, S† then H for the Y basis.',
  'Certain along one axis means random along the perpendicular axes, and measurements disturb the state, so their order matters.',
  'An expectation value is the average of ±1 outcomes, with error √((1 − ⟨Z⟩²)/N).',
  'Tomography estimates ⟨X⟩, ⟨Y⟩ and ⟨Z⟩ on fresh copies and rebuilds the Bloch vector.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'A qubit in |+⟩ is measured in the Z basis. What do you get?', options: ['0 or 1, with probability 1/2 each', '0 every time', '1 every time', '0 with probability 85%'], answer: 0,
        why: '|+⟩ lies on the equator, so its shadow on the z axis is 0 and P(0) = (1 + 0)/2 = 1/2.' },
      { q: 'Your hardware only measures Z. How do you measure in the X basis?', options: ['Apply H, then measure', 'Apply X, then measure', 'Apply S, then measure', 'Measure twice and compare'], answer: 0,
        why: 'H swaps the X and Z bases, so |+⟩ becomes |0⟩ and |−⟩ becomes |1⟩. Reading 0 then means +.' },
      { q: 'The Bloch vector is (0.6, 0, 0.8). What is P(+) for an X-basis measurement?', options: ['0.8', '0.6', '0.9', '0.3'], answer: 0,
        why: 'P(+) = (1 + x)/2 = 1.6/2 = 0.8. A Z measurement would give P(0) = (1 + 0.8)/2 = 0.9.' },
      { q: 'You measure X and get +. You then measure Z. What is P(0)?', options: ['1/2', '1', '0', 'It depends on the state before the first measurement'], answer: 0,
        why: 'After the X measurement the state is |+⟩, whatever it was before, and |+⟩ gives 0 or 1 with probability 1/2 each.' },
      { q: 'Why does estimating ⟨Z⟩ take many shots?', options: ['Each shot returns only one ±1 value', 'Gates are noisy', 'The state changes between shots on purpose', 'Measurement is deterministic'], answer: 0,
        why: 'One run gives +1 or −1. Only the average over many runs estimates the expectation value, with an error that shrinks like 1/√N.' },
      { q: 'To make the error of an estimated ⟨Z⟩ ten times smaller, you need', options: ['100 times as many shots', '10 times as many shots', '√10 times as many shots', '1,000 times as many shots'], answer: 0,
        why: 'The error is proportional to 1/√N, so a tenfold improvement needs N multiplied by 10² = 100.' }
    ]
  });
})(window);

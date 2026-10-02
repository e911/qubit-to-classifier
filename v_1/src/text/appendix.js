/* Words for the appendix: A, conventions, symbols and glossary; B, the formula sheet.
   The glossary entries themselves live in src/ch7b.js (GLOSS), which also builds the list. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, ref = C.ref, mat = C.mat;
  const chap = id => C.byId(id) || { num: id, title: id };
  const see = id => `<a href="#${id}" class="ch-tag" title="${chap(id).title.replace(/"/g, '&quot;')}">${chap(id).num}</a>`;
  const sm = rows => mat(rows, 'small');
  const sp = '&nbsp;&nbsp; ';

  /* one convention: [topic, what this course does, what other sources do] */
  const conv = list => `<div class="conv">${list.map(([t, here, other]) => `<div class="conv-row"><p class="conv-t">${t}</p><div class="conv-b"><p>${here}</p>${other ? `<p class="conv-else"><span>Elsewhere</span>${other}</p>` : ''}</div></div>`).join('')}</div>`;
  /* one formula: [name, formula, chapter id, note] */
  const sheet = list => `<div class="fsheet">${list.map(([name, f, id, note]) => `<div class="fs-row"><div class="fs-name">${name}</div><div class="fs-f">${f}${note ? `<span class="fs-note">${note}</span>` : ''}</div><div class="fs-ref">${id ? see(id) : ''}</div></div>`).join('')}</div>`;
  const greek = list => `<div class="greek">${list.map(([g, name, use]) => `<div><span class="g-sym" aria-hidden="true">${g}</span><span class="g-name">${name}</span><span class="g-use">${use}</span></div>`).join('')}</div>`;

  /* ===================================================================== A */
  C.text('glossary', {
    lede: `The conventions this course follows, how to read its symbols, and every term it uses, each linked to the chapter that explains it.`,
    html: `
<h2>Conventions used in this course</h2>
<p>Books and software packages make different choices for a few things, such as the order of qubits in a label or the sign inside a rotation. These are the choices made here, with what to watch for when you move on to other material.</p>
${conv([
  ['Qubit order', `q0 is the top wire of a circuit and the leftmost character of a label: ${K('q0 q1 q2')}. That label is basis state number 4q0 + 2q1 + q2 in the list of amplitudes.`,
    'Nielsen &amp; Chuang and PennyLane use the same order. Qiskit reverses it: the rightmost character is qubit 0, so a Qiskit count labelled 01 means q0 = 1 and q1 = 0.'],
  ['Rotation gates', `${M('Rx(θ) = e<sup>−iθX/2</sup>')}, and likewise Ry and Rz. Each turns the Bloch vector by the angle θ about its axis.`,
    'Qiskit, PennyLane and Nielsen &amp; Chuang agree. A few texts define Rx(θ) = e<sup>−iθX</sup> without the 1/2, so their angles are half of the ones used here. Check one matrix before copying a circuit.'],
  ['Phase gate', `${M('P(λ) = diag(1, e<sup>iλ</sup>)')}. Then Z = P(π), S = P(π/2) and T = P(π/4).`,
    'P(λ) equals Rz(λ) up to the global phase e<sup>iλ/2</sup>, and some texts use the two names for the same thing. Older Qiskit code calls P(λ) u1(λ).'],
  ['General one-qubit gate', `${M('U(θ, φ, λ)')} has the matrix on the formula sheet, and equals Rz(φ) Ry(θ) Rz(λ) up to a global phase.`,
    'This is Qiskit’s U gate. PennyLane’s Rot(φ, θ, ω) = Rz(ω) Ry(θ) Rz(φ) takes its angles in a different order.'],
  ['Bloch sphere', `${K('0')} at the north pole (+z), ${K('1')} at the south pole, ${K('+')} on +x and ${K('+i')} on +y. A rotation by a positive angle turns counterclockwise when its axis points toward you.`, ''],
  ['Measurement results', `Measuring a qubit gives the bit 0 or 1. When Z is used as an observable, 0 counts as +1 and 1 counts as −1, so ${M('⟨Z⟩ = P(0) − P(1)')}.`,
    'Physics texts often write the outcomes as +1 and −1 directly, or as spin up and spin down.'],
  ['Classes in Part VII', `Blue is class 0 and red is class 1. A model output ${M('f = ⟨Z⟩')} predicts blue when f &gt; 0, and ${M('p(red) = (1 − f)/2')}.`,
    'Many papers label the classes +1 and −1 and predict the sign of f.'],
  ['Colour', 'Phase is drawn on a colour wheel: blue for phase 0, a positive real amplitude, and amber for π, a negative one. A needle or arrow always shows the same angle, so colour never carries information on its own.', ''],
  ['Angles and logarithms', 'Angles are in radians, so π = 180°. log means the natural logarithm, and log₂ appears where information is counted in bits.', '']
])}

<h2>Reading the symbols</h2>
<p>Mathematical notation is a compressed language. When a formula looks forbidding, read it aloud with this table; most of them become short sentences.</p>
${C.table(['Symbol', 'Say it as', 'What it means'], [
  [M('|ψ⟩'), 'ket psi', `A state, written as a column of amplitudes. ${see('linalg')}`],
  [M('⟨ψ|'), 'bra psi', `The conjugate transpose of ${K('ψ')}, written as a row. ${see('linalg')}`],
  [M('⟨a|b⟩'), 'the inner product of a and b', `One complex number that measures the overlap of two states. ${see('linalg')}`],
  [M('|a⟩⟨b|'), 'ket a, bra b', `The outer product, a matrix. ${see('linalg')}`],
  [M('z*'), 'z star', `The complex conjugate: ${M('a + bi')} becomes ${M('a − bi')}. ${see('complex')}`],
  [M('|z|'), 'the modulus of z', `The length of a complex number, such as an amplitude. ${see('complex')}`],
  [M('‖v‖'), 'the norm of v', `The length of a vector. ${see('linalg')}`],
  [M('e<sup>iθ</sup>'), 'e to the i theta', `The point at angle θ on the unit circle, ${M('cos θ + i sin θ')}. ${see('complex')}`],
  [M('A†'), 'A dagger', `The conjugate transpose: swap rows and columns, and conjugate every entry. ${see('linalg')}`],
  [M('I'), 'the identity', `The matrix that changes nothing. ${see('linalg')}`],
  [M('Tr A'), 'the trace of A', `The sum of the diagonal entries. ${see('eigen')}`],
  [M('⟨A⟩'), 'the expectation of A', `The average result of measuring A many times. ${see('eigen')}`],
  [M('⊗'), 'tensor', `Combines separate systems: ${M('|0⟩ ⊗ |1⟩ = |01⟩')}. ${see('tensor')}`],
  [M('⊕'), 'x-or, or plus mod 2', `Adds bits, with ${M('1 ⊕ 1 = 0')}. ${see('multigates')}`],
  [M('x · y'), 'x dot y', `For vectors, ${M('x₁y₁ + x₂y₂ + …')}, and for bit strings the same sum taken mod 2. ${see('oracles')}`],
  [M('2<sup>n</sup>'), 'two to the n', `The number of amplitudes of n qubits. ${see('tensor')}`],
  [M('Σ<sub>k</sub>'), 'the sum over k', 'Add up the expression for every value of k.'],
  [M('Π<sub>k</sub>'), 'the product over k', 'Multiply the expression for every value of k.'],
  [M('≈'), 'is approximately', 'Equal after rounding.'],
  [M('∝'), 'is proportional to', 'Equal up to a constant factor.'],
  [M('∂f/∂θ'), 'the partial derivative of f by θ', `How fast f changes when θ alone changes. ${see('gradients')}`],
  [M('∇L'), 'grad L', `The gradient: all the partial derivatives of L, as a list. ${see('qml')}`],
  [M('θ ← θ − η∇L'), 'set θ to θ minus eta grad L', `An update: the new value replaces the old. ${see('qml')}`]
], 'compact sym-table')}

<h2>Greek letters</h2>
<p>Greek letters stand for numbers just as x and y do. These are the ones this course uses, with their usual jobs here.</p>
${greek([
  ['α', 'alpha', 'amplitude of |0⟩'],
  ['β', 'beta', 'amplitude of |1⟩'],
  ['γ', 'gamma', 'a phase angle; damping strength'],
  ['δ, Δ', 'delta', 'an angle; a difference'],
  ['ε', 'epsilon', 'a small error rate'],
  ['η', 'eta', 'learning rate'],
  ['θ', 'theta', 'polar angle; rotation angle; parameters'],
  ['λ', 'lambda', 'eigenvalue; phase-gate angle'],
  ['π', 'pi', '3.14159…, half a turn'],
  ['ρ', 'rho', 'density matrix'],
  ['σ, Σ', 'sigma', 'sigmoid function; a sum'],
  ['φ', 'phi', 'azimuthal angle, relative phase; encoded state |φ(x)⟩'],
  ['χ', 'chi', 'a second state |χ⟩; a rotation angle'],
  ['ψ', 'psi', 'a quantum state |ψ⟩'],
  ['Φ, Ψ', 'capital phi, psi', 'Bell states |Φ⁺⟩, |Ψ⁻⟩, …'],
  ['Π', 'capital pi', 'a product']
])}

<h2>Glossary</h2>
<p>Search, or jump to a letter. The tag after each definition is the chapter that explains the term.</p>
<div data-gloss></div>
`
  });

  /* ===================================================================== B */
  /* [anchor id, label in the topic bar, section heading] */
  const TOPICS = [
    ['fs-complex', 'Complex numbers', 'Complex numbers'],
    ['fs-linalg', 'Vectors and matrices', 'Vectors and matrices'],
    ['fs-eigen', 'Eigenvectors', 'Eigenvectors, unitary and Hermitian matrices'],
    ['fs-qubit', 'One qubit', 'One qubit'],
    ['fs-gates', 'Gates', 'Gates'],
    ['fs-measure', 'Measurement', 'Measurement and statistics'],
    ['fs-multi', 'Several qubits', 'Several qubits'],
    ['fs-circuits', 'Circuits', 'Circuits and interference'],
    ['fs-alg', 'Algorithms', 'Algorithms'],
    ['fs-noise', 'Noise', 'Noise and hardware'],
    ['fs-ml', 'Machine learning', 'Machine learning'],
    ['fs-numbers', 'Handy numbers', 'Handy numbers']
  ];
  const H2 = id => `<h2 id="${id}">${TOPICS.find(t => t[0] === id)[2]}</h2>`;

  C.text('formulas', {
    lede: `Every formula of the course on one page, grouped by topic. The number at the end of each row is the chapter that derives it.`,
    html: `
<p>Use this page to look things up once you have met them in a chapter, or as a checklist: if a row looks unfamiliar, follow its chapter link. Symbols are explained in ${ref('glossary')}.</p>
<div class="fs-toc" role="navigation" aria-label="Topics on this page">${TOPICS.map(([id, label]) => `<button type="button" data-jump="${id}">${label}</button>`).join('')}</div>

${H2('fs-complex')}
${sheet([
  ['Imaginary unit', 'i² = −1', 'complex'],
  ['Real and imaginary parts', `z = a + bi, ${sp}Re z = a, ${sp}Im z = b`, 'complex'],
  ['Adding', '(a + bi) + (c + di) = (a + c) + (b + d)i', 'complex'],
  ['Multiplying', '(a + bi)(c + di) = (ac − bd) + (ad + bc)i', 'complex'],
  ['Conjugate', `z* = a − bi, ${sp}zz* = |z|²`, 'complex'],
  ['Modulus', '|z| = √(a² + b²)', 'complex'],
  ['Dividing', '1/(a + bi) = (a − bi)/(a² + b²)', 'complex'],
  ['Polar form', `z = r(cos θ + i sin θ) = re<sup>iθ</sup>, ${sp}r = |z|, ${sp}θ = arg z`, 'complex'],
  ['Euler’s formula', `e<sup>iθ</sup> = cos θ + i sin θ, ${sp}e<sup>iπ</sup> = −1`, 'complex'],
  ['Multiplying in polar form', 're<sup>iα</sup> × se<sup>iβ</sup> = rs e<sup>i(α + β)</sup>', 'complex', 'Lengths multiply and angles add.'],
  ['Adding two arrows', '|z + w|² = r² + s² + 2rs cos Δ', 'complex', 'Here r = |z|, s = |w| and Δ is the angle between the arrows. The last term is the interference term.'],
  ['Powers of i', `i⁰ = 1, ${sp}i¹ = i, ${sp}i² = −1, ${sp}i³ = −i, ${sp}i⁴ = 1`, 'complex']
])}

${H2('fs-linalg')}
${sheet([
  ['Ket and bra', `|ψ⟩ = ${sm([['α'], ['β']])} ${sp}⟨ψ| = ${sm([['α*', 'β*']])}`, 'linalg'],
  ['Basis states', `|0⟩ = ${sm([['1'], ['0']])} ${sp}|1⟩ = ${sm([['0'], ['1']])}`, 'linalg'],
  ['Length', '‖v‖ = √(|v₀|² + |v₁|²) = √⟨v|v⟩', 'linalg'],
  ['Inner product', `⟨a|b⟩ = a₀*b₀ + a₁*b₁, ${sp}⟨b|a⟩ = ⟨a|b⟩*`, 'linalg'],
  ['Normalized and orthogonal', `⟨a|a⟩ = 1, ${sp}⟨a|b⟩ = 0`, 'linalg'],
  ['Matrix times vector', `${sm([['a', 'b'], ['c', 'd']])} ${sm([['x'], ['y']])} = ${sm([['ax + by'], ['cx + dy']])}`, 'linalg'],
  ['Matrix product', '(AB)<sub>ij</sub> = Σ<sub>k</sub> A<sub>ik</sub> B<sub>kj</sub>', 'linalg', 'In AB|ψ⟩, B acts first. In general AB ≠ BA.'],
  ['Outer product', '(|a⟩⟨b|)<sub>ij</sub> = a<sub>i</sub> b<sub>j</sub>*', 'linalg'],
  ['Projectors', `|0⟩⟨0| = ${sm([['1', '0'], ['0', '0']])} ${sp}|1⟩⟨1| = ${sm([['0', '0'], ['0', '1']])}`, 'linalg', 'Together they make the identity: |0⟩⟨0| + |1⟩⟨1| = I.'],
  ['Conjugate transpose', `(A†)<sub>ij</sub> = (A<sub>ji</sub>)*, ${sp}(AB)† = B†A†, ${sp}(|ψ⟩)† = ⟨ψ|`, 'linalg'],
  ['Identity and inverse', `I = ${sm([['1', '0'], ['0', '1']])} ${sp}A⁻¹A = AA⁻¹ = I`, 'linalg']
])}

${H2('fs-eigen')}
${sheet([
  ['Eigenvector', 'Av = λv', 'eigen', 'A only stretches v, by the factor λ.'],
  ['Determinant', `det ${sm([['a', 'b'], ['c', 'd']])} = ad − bc`, 'eigen'],
  ['Eigenvalues of a 2 × 2 matrix', 'det(A − λI) = (a − λ)(d − λ) − bc = 0', 'eigen'],
  ['Sum and product of eigenvalues', `λ₁ + λ₂ = Tr A = a + d, ${sp}λ₁λ₂ = det A`, 'eigen'],
  ['Unitary', 'U†U = I', 'eigen', 'Keeps lengths and inner products, and every eigenvalue has |λ| = 1. Every gate is unitary.'],
  ['Hermitian', 'A† = A', 'eigen', 'Real eigenvalues and orthogonal eigenvectors. Every observable is Hermitian.'],
  ['Expectation value', '⟨A⟩ = ⟨ψ|A|ψ⟩ = Σ<sub>k</sub> λ<sub>k</sub> P(λ<sub>k</sub>)', 'eigen'],
  ['Pauli matrices', `X = ${sm([['0', '1'], ['1', '0']])} ${sp}Y = ${sm([['0', '−i'], ['i', '0']])} ${sp}Z = ${sm([['1', '0'], ['0', '−1']])}`, 'eigen'],
  ['Pauli products', `X² = Y² = Z² = I, ${sp}XY = iZ, ${sp}YZ = iX, ${sp}ZX = iY, ${sp}YX = −iZ`, 'eigen'],
  ['Pauli eigenstates', `Z: |0⟩, |1⟩ ${sp}X: |+⟩, |−⟩ ${sp}Y: |+i⟩, |−i⟩`, 'eigen', 'The eigenvalue +1 state first, then −1.']
])}

${H2('fs-qubit')}
${sheet([
  ['State', `|ψ⟩ = α|0⟩ + β|1⟩, ${sp}|α|² + |β|² = 1`, 'qubit'],
  ['Born rule', `P(0) = |α|², ${sp}P(1) = |β|²`, 'qubit'],
  ['Amplitudes in polar form', `α = |α|e<sup>iγ₀</sup>, ${sp}β = |β|e<sup>iγ₁</sup>`, 'phase'],
  ['Relative phase', 'φ = arg β − arg α', 'phase', 'Up to a global phase, |ψ⟩ = |α| |0⟩ + e<sup>iφ</sup>|β| |1⟩.'],
  ['Global phase', 'e<sup>iγ</sup>|ψ⟩ and |ψ⟩ give identical predictions', 'phase'],
  ['Bloch angles', `|ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩, ${sp}0 ≤ θ ≤ π`, 'bloch'],
  ['Bloch vector', '(x, y, z) = (sin θ cos φ, sin θ sin φ, cos θ) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩)', 'bloch'],
  ['Bloch vector from amplitudes', `x + iy = 2α*β, ${sp}z = |α|² − |β|²`, 'bloch'],
  ['Probabilities from z', `P(0) = (1 + z)/2, ${sp}P(1) = (1 − z)/2`, 'bloch'],
  ['Overlap of two states', '|⟨ψ|χ⟩|² = (1 + r·s)/2 = cos²(γ/2)', 'bloch', 'r and s are the two Bloch vectors and γ is the angle between them. Opposite points are orthogonal states.'],
  ['Six named states', `|±⟩ = (|0⟩ ± |1⟩)/√2 on ±x, ${sp}|±i⟩ = (|0⟩ ± i|1⟩)/√2 on ±y`, 'bloch']
])}

${H2('fs-gates')}
${sheet([
  ['Hadamard', `H = (1/√2) ${sm([['1', '1'], ['1', '−1']])} ${sp}H|0⟩ = |+⟩, ${sp}H|1⟩ = |−⟩`, 'gates'],
  ['S and T', `S = ${sm([['1', '0'], ['0', 'i']])} ${sp}T = ${sm([['1', '0'], ['0', 'e<sup>iπ/4</sup>']])} ${sp}T² = S, ${sp}S² = Z`, 'gates'],
  ['Phase gate', 'P(λ) = diag(1, e<sup>iλ</sup>) = e<sup>iλ/2</sup> Rz(λ)', 'gates'],
  ['Rx', `Rx(θ) = ${sm([['cos(θ/2)', '−i sin(θ/2)'], ['−i sin(θ/2)', 'cos(θ/2)']])}`, 'gates'],
  ['Ry', `Ry(θ) = ${sm([['cos(θ/2)', '−sin(θ/2)'], ['sin(θ/2)', 'cos(θ/2)']])}`, 'gates'],
  ['Rz', `Rz(θ) = ${sm([['e<sup>−iθ/2</sup>', '0'], ['0', 'e<sup>iθ/2</sup>']])}`, 'gates'],
  ['Rotation about any axis', 'R<sub>n</sub>(θ) = cos(θ/2) I − i sin(θ/2)(n<sub>x</sub>X + n<sub>y</sub>Y + n<sub>z</sub>Z)', 'gates', 'Turns the Bloch vector by θ about the unit axis n.'],
  ['Same-axis rotations add', 'Ry(a) Ry(b) = Ry(a + b)', 'gates'],
  ['Square root of X', `√X = (1/2) ${sm([['1 + i', '1 − i'], ['1 − i', '1 + i']])} ${sp}(√X)² = X`, 'gates'],
  ['General gate', `U(θ, φ, λ) = ${sm([['cos(θ/2)', '−e<sup>iλ</sup> sin(θ/2)'], ['e<sup>iφ</sup> sin(θ/2)', 'e<sup>i(φ + λ)</sup> cos(θ/2)']])}`, 'identities'],
  ['Three rotations', 'U = e<sup>iα</sup> Rz(β) Ry(γ) Rz(δ)', 'identities', 'Every single-qubit gate has this form, for some angles α, β, γ and δ.'],
  ['Hadamard sandwiches', `HXH = Z, ${sp}HZH = X, ${sp}HYH = −Y, ${sp}HH = I`, 'identities']
])}

${H2('fs-measure')}
${sheet([
  ['Measuring in a basis', 'P(k) = |⟨e<sub>k</sub>|ψ⟩|²', 'measure', 'Afterwards the state is |e<sub>k</sub>⟩.'],
  ['Projector', `P<sub>k</sub> = |e<sub>k</sub>⟩⟨e<sub>k</sub>|, ${sp}P(k) = ⟨ψ|P<sub>k</sub>|ψ⟩`, 'measure'],
  ['Along a Bloch axis n', `P(+) = (1 + r·n)/2, ${sp}P(−) = (1 − r·n)/2`, 'measure'],
  ['Expectation of Z', `⟨Z⟩ = P(0) − P(1) = z, ${sp}P(0) = (1 + ⟨Z⟩)/2`, 'measure'],
  ['Measuring X and Y', `X: H, then measure. ${sp}Y: S†, then H, then measure.`, 'measure'],
  ['Uncertainty', 'x² + y² + z² = 1, so z = ±1 forces x = y = 0', 'measure', 'For a pure state, certainty along one axis means a fair coin along the other two.'],
  ['Shot noise of a probability', '√(p(1 − p)/N)', 'qubit', 'The standard error of a probability p estimated from N shots. It is largest, 1/(2√N), at p = 1/2.'],
  ['Shot noise of ⟨Z⟩', '√((1 − ⟨Z⟩²)/N) ≤ 1/√N', 'measure'],
  ['Holevo’s limit', 'n qubits carry at most n bits that can be read out', 'qubit']
])}

${H2('fs-multi')}
${sheet([
  ['Two-qubit state', '|ψ⟩ = α₀₀|00⟩ + α₀₁|01⟩ + α₁₀|10⟩ + α₁₁|11⟩', 'tensor'],
  ['Tensor product', `${sm([['a₀'], ['a₁']])} ⊗ ${sm([['b₀'], ['b₁']])} = ${sm([['a₀b₀'], ['a₀b₁'], ['a₁b₀'], ['a₁b₁']])}`, 'tensor'],
  ['Gates on separate qubits', '(A ⊗ B)(|u⟩ ⊗ |v⟩) = A|u⟩ ⊗ B|v⟩', 'tensor'],
  ['Counting basis states', 'n qubits have 2ⁿ amplitudes', 'tensor', '|q0 q1 … q<sub>n−1</sub>⟩ is number 2<sup>n−1</sup>q0 + 2<sup>n−2</sup>q1 + … + q<sub>n−1</sub>.'],
  ['One qubit of two', 'P(q0 = 0) = |α₀₀|² + |α₀₁|²', 'tensor'],
  ['After reading q0 = 0', '(α₀₀|00⟩ + α₀₁|01⟩) / √P(q0 = 0)', 'entangle', 'Cross out the terms with q0 = 1, then renormalize.'],
  ['CNOT', '|a, b⟩ → |a, b ⊕ a⟩', 'multigates', 'Control a, target b.'],
  ['CZ', '|a, b⟩ → (−1)<sup>ab</sup>|a, b⟩', 'multigates'],
  ['Toffoli', '|a, b, c⟩ → |a, b, c ⊕ ab⟩', 'multigates'],
  ['Controlled-U', 'C-U = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U', 'multigates'],
  ['Phase kickback', 'C-U (α|0⟩ + β|1⟩)|u⟩ = (α|0⟩ + e<sup>iλ</sup>β|1⟩)|u⟩', 'multigates', 'When U|u⟩ = e<sup>iλ</sup>|u⟩. The phase lands on the control.'],
  ['Bell states', `|Φ<sup>±</sup>⟩ = (|00⟩ ± |11⟩)/√2, ${sp}|Ψ<sup>±</sup>⟩ = (|01⟩ ± |10⟩)/√2`, 'entangle'],
  ['Product or entangled', 'a product state exactly when α₀₀α₁₁ − α₀₁α₁₀ = 0', 'entangle'],
  ['Entanglement entropy', `S = −λ log₂ λ − (1 − λ) log₂(1 − λ), ${sp}λ = (1 + |r|)/2`, 'entangle', '|r| is the length of either qubit’s Bloch vector. S = 0 for a product state and 1 for a Bell state.'],
  ['Bell-pair correlation', 'E(α, β) = cos(α − β) for |Φ⁺⟩', 'entangle', 'Both qubits measured along axes in the x–z plane, at angles α and β.'],
  ['CHSH', 'S = E(a, b) − E(a, b′) + E(a′, b) + E(a′, b′)', 'entangle', 'Answers fixed in advance give |S| ≤ 2. Entangled qubits reach 2√2 ≈ 2.83.']
])}

${H2('fs-circuits')}
${sheet([
  ['Two paths to one outcome', 'P = |a₁ + a₂|² = |a₁|² + |a₂|² + 2 Re(a₁*a₂)', 'interference', 'Add the amplitudes first, then square. The last term is the interference.'],
  ['H, phase, H', `P(0) = cos²(φ/2), ${sp}P(1) = sin²(φ/2)`, 'interference', 'For the circuit H, P(φ), H acting on |0⟩.'],
  ['Which-path marker', `P(0) = (1 + V cos φ)/2, ${sp}V = |⟨m₀|m₁⟩|`, 'interference'],
  ['Paths and matrices', '(ABC)<sub>ij</sub> = Σ<sub>k</sub> Σ<sub>l</sub> A<sub>ik</sub> B<sub>kl</sub> C<sub>lj</sub>', 'interference', 'Each term is one path through the circuit.'],
  ['Equivalent circuits', 'U₁ = e<sup>iγ</sup>U₂ for some angle γ', 'identities'],
  ['SWAP from CNOTs', 'SWAP = CNOT<sub>0→1</sub> CNOT<sub>1→0</sub> CNOT<sub>0→1</sub>', 'identities'],
  ['Reversing a CNOT', '(H ⊗ H) CNOT<sub>0→1</sub> (H ⊗ H) = CNOT<sub>1→0</sub>', 'identities'],
  ['CNOT and CZ', '(I ⊗ H) CNOT<sub>0→1</sub> (I ⊗ H) = CZ', 'identities'],
  ['Universality', '{H, T, CNOT} approximates any unitary as closely as you like', 'identities']
])}

${H2('fs-alg')}
${sheet([
  ['Teleportation', 'Bob applies X if m₁ = 1, then Z if m₀ = 1', 'teleport', 'm₀ and m₁ are Alice’s results on q0 and q1.'],
  ['Superdense coding', `00: nothing, ${sp}01: X, ${sp}10: Z, ${sp}11: X then Z`, 'teleport', 'What Alice applies to her half of |Φ⁺⟩ to send two bits.'],
  ['No cloning', 'no U has U|ψ⟩|0⟩ = |ψ⟩|ψ⟩ for every |ψ⟩', 'teleport'],
  ['Bit oracle', 'U<sub>f</sub>|x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩', 'oracles'],
  ['Phase oracle', 'U<sub>f</sub>|x⟩|−⟩ = (−1)<sup>f(x)</sup>|x⟩|−⟩', 'oracles'],
  ['Hadamards on n qubits', 'H<sup>⊗n</sup>|x⟩ = (1/√2ⁿ) Σ<sub>y</sub> (−1)<sup>x·y</sup>|y⟩', 'oracles', 'x·y = x₁y₁ + x₂y₂ + … mod 2. For one qubit, H|x⟩ = (|0⟩ + (−1)<sup>x</sup>|1⟩)/√2.'],
  ['Deutsch–Jozsa', 'amplitude of |y⟩ = (1/2ⁿ) Σ<sub>x</sub> (−1)<sup>f(x) + x·y</sup>', 'oracles', 'For y = 00…0 this is ±1 when f is constant and 0 when f is balanced.'],
  ['Bernstein–Vazirani', 'f(x) = s·x mod 2: one query returns s', 'oracles'],
  ['Grover, start', `|s⟩ = sin θ|w⟩ + cos θ|s′⟩, ${sp}sin θ = 1/√N`, 'grover', 'With M marked items, sin θ = √(M/N).'],
  ['Grover, success', `P(after k rounds) = sin²((2k + 1)θ), ${sp}best k ≈ (π/4)√(N/M)`, 'grover'],
  ['Grover, diffusion', 'each amplitude a → 2 × mean − a', 'grover'],
  ['Quantum Fourier transform', `QFT|x⟩ = (1/√N) Σ<sub>k=0</sub><sup>N−1</sup> e<sup>2πixk/N</sup>|k⟩, ${sp}N = 2ⁿ`, 'qft'],
  ['QFT, qubit by qubit', 'qubit q of QFT|x⟩ = (|0⟩ + e<sup>2πix/2<sup>q+1</sup></sup>|1⟩)/√2', 'qft', 'q counts from the top wire, starting at 0. Every qubit sits on the equator.'],
  ['QFT cost', 'n(n + 1)/2 gates plus swaps', 'qft', 'The classical fast Fourier transform needs about n2ⁿ operations on the full list of 2ⁿ numbers.'],
  ['Phase estimation', 'U|u⟩ = e<sup>2πiφ</sup>|u⟩: t counting qubits read 2ᵗφ in binary', 'qft', 'If 2ᵗφ is not a whole number, the nearest t-bit value comes out with probability at least 4/π² ≈ 0.405.'],
  ['Shor’s algorithm', `r = period of aˣ mod N, ${sp}factors from gcd(a<sup>r/2</sup> ± 1, N)`, 'qft', 'For N = 15 and a = 7: r = 4, gcd(48, 15) = 3 and gcd(50, 15) = 5.']
])}

${H2('fs-noise')}
${sheet([
  ['Density matrix', `ρ = Σ<sub>i</sub> p<sub>i</sub>|ψ<sub>i</sub>⟩⟨ψ<sub>i</sub>|, ${sp}pure: ρ = |ψ⟩⟨ψ|`, 'noise'],
  ['One qubit', `ρ = (1/2)(I + xX + yY + zZ) = (1/2) ${sm([['1 + z', 'x − iy'], ['x + iy', '1 − z']])}`, 'noise'],
  ['Predictions', `P(k) = ⟨e<sub>k</sub>|ρ|e<sub>k</sub>⟩, ${sp}⟨A⟩ = Tr(ρA)`, 'noise'],
  ['Purity', 'Tr(ρ²) = (1 + |r|²)/2', 'noise', '1 for a pure state on the surface, 1/2 for the maximally mixed state I/2 at the centre.'],
  ['Channels', `ρ → Σ<sub>k</sub> K<sub>k</sub> ρ K<sub>k</sub>†, ${sp}Σ<sub>k</sub> K<sub>k</sub>†K<sub>k</sub> = I`, 'noise'],
  ['Bit flip, probability p', '(x, y, z) → (x, (1 − 2p)y, (1 − 2p)z)', 'noise'],
  ['Phase flip, probability p', '(x, y, z) → ((1 − 2p)x, (1 − 2p)y, z)', 'noise'],
  ['Depolarizing', 'r → (1 − p)r', 'noise'],
  ['Amplitude damping', `z → (1 − γ)z + γ, ${sp}x and y shrink by √(1 − γ)`, 'noise'],
  ['Phase damping', 'x and y shrink by √(1 − λ)', 'noise'],
  ['T1 decay', 'P(1) = e<sup>−t/T1</sup>, starting from |1⟩', 'hardware'],
  ['T2 decay', `x and y shrink like e<sup>−t/T2</sup>, ${sp}T2 ≤ 2T1`, 'hardware'],
  ['Error budget', '(1 − ε)<sup>N</sup> ≈ e<sup>−Nε</sup>', 'hardware', 'The chance that N gates, each failing with probability ε, all succeed.'],
  ['Readout correction', 'observed P(1) = a(1 − q) + bq', 'hardware', 'q is the true probability of 1, a = P(read 1 | was 0) and b = P(read 1 | was 1). Solve for q.'],
  ['Repetition code', 'P(logical error) = 3p² − 2p³', 'hardware', 'Three copies and a majority vote, each copy flipping with probability p.']
])}

${H2('fs-ml')}
${sheet([
  ['Logistic regression', `p(red) = σ(w₁x₁ + w₂x₂ + b), ${sp}σ(z) = 1/(1 + e<sup>−z</sup>)`, 'qml'],
  ['Cross-entropy loss', `L = −log p if the label is red, ${sp}L = −log(1 − p) if blue`, 'qml', 'Averaged over the training examples, with natural logarithms.'],
  ['Gradient descent', 'θ ← θ − η∇L(θ)', 'qml', 'η is the learning rate.'],
  ['Angle encoding, one feature', `Ry(x)|0⟩ = cos(x/2)|0⟩ + sin(x/2)|1⟩, ${sp}⟨Z⟩ = cos x`, 'encoding'],
  ['Angle encoding in Part VII', `θ = π(x₁ + 1)/2, ${sp}φ = πx₂, ${sp}then Ry(θ) and Rz(φ)`, 'encoding'],
  ['Amplitude encoding', '|x⟩ = (x₀|0⟩ + x₁|1⟩ + … + x<sub>N−1</sub>|N − 1⟩) / ‖x‖', 'encoding', 'N = 2ⁿ numbers stored in n qubits.'],
  ['Re-uploading', 'f(x) = a₀ + Σ<sub>k=1</sub><sup>L</sup> (a<sub>k</sub> cos kx + b<sub>k</sub> sin kx)', 'encoding', 'With L encoding gates, the model is a Fourier series with frequencies up to L.'],
  ['Quantum model', 'f(x; θ) = ⟨φ(x, θ)| O |φ(x, θ)⟩', 'pqc', 'With O = Z: predict blue if f &gt; 0, and p(red) = (1 − f)/2.'],
  ['One-qubit classifier', 'f(x) = n · r(x)', 'pqc', 'r(x) is the encoded Bloch vector and n the measurement axis. The boundary is a plane through the centre.'],
  ['One angle at a time', 'f(θ) = A + B cos θ + C sin θ', 'gradients'],
  ['Parameter-shift rule', '∂f/∂θ = [f(θ + π/2) − f(θ − π/2)] / 2', 'gradients', 'Exact for gates e<sup>−iθP/2</sup> with P a Pauli matrix, such as Rx, Ry and Rz.'],
  ['Finite difference', '[f(θ + h) − f(θ − h)] / (2h)', 'gradients', 'Only approximate, and dividing by the small number 2h magnifies shot noise.'],
  ['Chain rule', '∂L/∂θ<sub>k</sub> = (1/N) Σ (∂L/∂f)(∂f/∂θ<sub>k</sub>)', 'gradients'],
  ['Quantum kernel', 'k(x, x′) = |⟨φ(x)|φ(x′)⟩|²', 'kernels'],
  ['One-feature kernel', 'k(x, x′) = cos²(cπ(x − x′)/2)', 'kernels', 'For the encoding Ry(cπx)|0⟩ with bandwidth c.'],
  ['Kernel model', 'f(x) = Σ<sub>i</sub> α<sub>i</sub> k(x, x<sub>i</sub>)', 'kernels'],
  ['Barren plateau', 'Var(∂L/∂θ) shrinks exponentially with the number of qubits', 'plateaus'],
  ['Shots per gradient', 'about 1/g² shots to resolve a gradient of size g', 'plateaus']
])}

${H2('fs-numbers')}
<p>Values that come up again and again. The row cos²(θ/2) is P(0) after Ry(θ) acts on |0⟩.</p>
${C.table(['θ', '0', 'π/6', 'π/4', 'π/3', 'π/2', 'π'], [
  ['degrees', '0°', '30°', '45°', '60°', '90°', '180°'],
  ['cos θ', '1', '√3/2 ≈ 0.866', '1/√2 ≈ 0.707', '1/2', '0', '−1'],
  ['sin θ', '0', '1/2', '1/√2 ≈ 0.707', '√3/2 ≈ 0.866', '1', '0'],
  ['cos²(θ/2)', '1', '≈ 0.933', '≈ 0.854', '3/4', '1/2', '0'],
  ['e<sup>iθ</sup>', '1', '(√3 + i)/2', '(1 + i)/√2', '(1 + √3 i)/2', 'i', '−1']
], 'compact angle-table numbers-table')}
${C.table(['Constant', 'Value', 'Where it appears'], [
  ['√2', '≈ 1.414', 'the 1/√2 in |+⟩, |−⟩ and the Bell states'],
  ['1/√2', '≈ 0.707', 'amplitudes of an equal superposition of two states'],
  ['π', '≈ 3.14159', 'half a turn, in radians'],
  ['e', '≈ 2.71828', 'Euler’s formula and the sigmoid'],
  ['ln 2', '≈ 0.693', 'the cross-entropy of a 50:50 guess'],
  ['2¹⁰', '= 1,024 ≈ 10³', 'ten more qubits multiply the amplitudes by about a thousand'],
  ['4/π²', '≈ 0.405', 'the minimum chance phase estimation returns the nearest value'],
  ['2√2', '≈ 2.83', 'the largest CHSH score']
], 'compact')}
`
  });
})(window);

/* Words for Part 0, the math toolkit. Interactive panels live in src/ch0.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, B = C.B, M = C.M, F = C.F, ref = C.ref;
  const D = s => `<div class="eqn center">${s}</div>`;
  const mat = C.mat, vec = C.vec;
  const r2 = '1/√2';

  /* ===================================================================== 0.1 */
  C.text('complex', {
    lede: `Quantum states are written with complex numbers, so that is where the course starts. You will learn what i is, how to add and multiply complex numbers by hand, why multiplying turns arrows, and the formula that appears on almost every page that follows: e<sup>iθ</sup> = cos θ + i sin θ.`,
    html: `
${C.objectives([
  'Write a complex number as a + bi and draw it as an arrow in a plane',
  'Add, subtract, multiply and divide complex numbers by hand',
  'Find the length |z|, the angle arg z and the conjugate z*',
  'Use the polar form r e<sup>iθ</sup> and Euler’s formula',
  'Explain why |z|² = z z* is the number that becomes a probability',
  'See why a phase e<sup>iφ</sup> changes nothing on its own but matters when amplitudes are added'
])}

<h2>Why quantum computing needs complex numbers</h2>
<p>A qubit is described by numbers called <b>amplitudes</b>, one for each possible measurement result. You will meet them properly in chapter ${ref('qubit')}. For now, all you need is the rule that connects them to experiments: the probability of a result is the squared length of its amplitude.</p>
<p>If amplitudes could only be positive, adding two of them could never give zero. Real quantum systems do cancel: two routes to the same result can wipe each other out completely. This adding and cancelling is called <b>interference</b>, and every quantum algorithm runs on it. To describe it, each amplitude needs both a size and a direction. A complex number is exactly that: an arrow with a length and an angle.</p>
<p>The rest of the course leans on four facts from this chapter:</p>
<ol>
  <li>Adding complex numbers is adding arrows.</li>
  <li>Multiplying complex numbers multiplies their lengths and adds their angles.</li>
  <li>The squared length |z|² = z z* is a real number that is never negative. Probabilities are built from it.</li>
  <li>e<sup>iθ</sup> is the arrow of length 1 at angle θ.</li>
</ol>

<h2>The number i</h2>
<p>No ordinary number squares to a negative: 3² = 9 and (−3)² = 9 as well. So we introduce a new number, called <b>i</b>, defined by a single rule:</p>
${F('i² = −1')}
<p>Everything else follows from treating i like a letter in algebra and replacing i² by −1 whenever it appears. For example, the powers of i repeat every four steps:</p>
${C.table(['Power', 'i⁰', 'i¹', 'i²', 'i³', 'i⁴', 'i⁵', 'i⁶'], [['Value', '1', 'i', '−1', '−i', '1', 'i', '−1']], 'compact angle-table')}
<p>Each step multiplies by i once more: i³ = i² · i = −i and i⁴ = i² · i² = (−1)(−1) = 1.</p>
${C.define('Complex number', `A number of the form ${M('z = a + bi')}, where a and b are ordinary real numbers. The number a is the <b>real part</b> of z, written Re z, and b is the <b>imaginary part</b>, written Im z. For z = 3 − 2i, Re z = 3 and Im z = −2. The imaginary part is the real number −2, without the i.`)}

<h2>Complex numbers live in a plane</h2>
<p>A real number is a point on a line. A complex number has two parts, so it is a point in a plane. Put the real part on the horizontal axis and the imaginary part on the vertical axis: z = a + bi is the point (a, b). This picture is called the <b>complex plane</b>, and we usually draw z as an arrow from 0 to its point.</p>
<ul>
  <li>Real numbers such as 2 or −1 lie on the horizontal axis.</li>
  <li>Numbers such as i, 2i or −0.5i lie on the vertical axis. They are called <b>purely imaginary</b>.</li>
  <li>Everything else, such as 1 + i, lies off the axes.</li>
</ul>

<h2>Adding and subtracting</h2>
<p>Add the real parts together and add the imaginary parts together:</p>
${F('(a + bi) + (c + di) = (a + c) + (b + d)i')}
<p>In the plane, this is adding arrows. Place the tail of w at the tip of z; the tip of that second arrow is z + w. It is the same rule as adding two moves on a map: three steps east and two north, followed by one step east and four south, leaves you four east and two south of where you began.</p>
${C.worked('Add and subtract z = 3 + 2i and w = 1 − 4i', [
  'Real parts: 3 + 1 = 4. Imaginary parts: 2 + (−4) = −2.',
  'So z + w = 4 − 2i.',
  'For z − w, subtract part by part: (3 − 1) + (2 − (−4))i = 2 + 6i.'
], 'z + w = 4 − 2i and z − w = 2 + 6i.')}
${C.bench('cx-plane', 'The complex plane', 'Drag z and w, or type them in')}
<p>In the panel, the faint copy of w starts at the tip of z, and its tip is z + w. Below the plane, the panel writes out the arithmetic with the actual numbers, so you can check your hand calculations against it.</p>

<h2>Multiplying</h2>
<p>Multiply out the brackets as in ordinary algebra, then replace i² by −1:</p>
${C.align([
  ['(a + bi)(c + di)', 'ac + adi + bci + bd i²', 'multiply every term by every term'],
  ['', 'ac + adi + bci − bd', 'because i² = −1'],
  ['', '(ac − bd) + (ad + bc)i', 'collect the real and imaginary parts']
])}
<p>You do not need to memorise the last line. Expanding the brackets every time is just as fast and harder to get wrong.</p>
${C.worked('Multiply (2 + 3i)(1 − i)', [
  'Multiply every term by every term: 2·1 + 2·(−i) + 3i·1 + 3i·(−i).',
  'That is 2 − 2i + 3i − 3i².',
  'Replace i² by −1, so −3i² becomes +3.',
  'Collect: (2 + 3) + (−2 + 3)i = 5 + i.'
], '(2 + 3i)(1 − i) = 5 + i. Check it in the panel: choose z × w, type 2+3i and 1-i, and press Enter.')}
<h3>Multiplying by i is a quarter turn</h3>
<p>Take z = 3 + 2i and multiply by i: i(3 + 2i) = 3i + 2i² = −2 + 3i. The point (3, 2) has moved to (−2, 3), which is the same arrow turned 90° counterclockwise. Multiply by i again and it turns another 90°: i(−2 + 3i) = −2i + 3i² = −3 − 2i, which is −z. Two quarter turns make a half turn, and a half turn is multiplication by −1. That is the picture behind i² = −1.</p>

<h2>Length, angle and the polar form</h2>
<p>An arrow can be described by its two coordinates (a, b), or by how long it is and which way it points.</p>
${C.define('Modulus and argument', `The <b>modulus</b> |z| is the length of the arrow. By Pythagoras, ${M('|z| = √(a² + b²)')}. The <b>argument</b> arg z is the angle from the positive real axis to the arrow, measured counterclockwise.`)}
<p>Angles in quantum computing are almost always given in radians. A full turn is 2π radians, so π radians is 180°. These are the ones you will meet most:</p>
${C.table(['Degrees', '0°', '45°', '90°', '180°', '270°', '360°'], [['Radians', '0', 'π/4', 'π/2', 'π', '3π/2', '2π']], 'compact angle-table')}
<p>If z has length r and angle θ, basic trigonometry gives its coordinates as a = r cos θ and b = r sin θ. So every complex number can be written as</p>
${F('z = r (cos θ + i sin θ)')}
${C.worked('Find the length and angle of z = 1 + i', [
  'Length: |z| = √(1² + 1²) = √2 ≈ 1.414.',
  'The point (1, 1) lies on the diagonal of the first quadrant, so the angle is 45°, which is π/4 radians.',
  'Check: √2 · cos 45° = √2 · (1/√2) = 1, the real part. In the same way √2 · sin 45° = 1, the imaginary part.'
], '1 + i has length √2 and angle π/4.')}
${C.pitfall('The calculator angle can point the wrong way', `<p>It is tempting to compute the angle as arctan(b/a). For z = −1 − i this gives arctan(1) = 45°, but the point (−1, −1) is in the lower-left quadrant, at 225°, which is the same direction as −135°. The ratio b/a is the same for z and for −z, so arctan alone cannot tell them apart. Always check which quadrant the point is in. In code, use the two-argument function atan2(b, a), which does the check for you.</p>`)}

<h2>Multiplying multiplies lengths and adds angles</h2>
<p>Here is the single most useful fact about complex numbers. When you multiply z by w:</p>
<ul>
  <li>the length of zw is |z| times |w|;</li>
  <li>the angle of zw is arg z plus arg w.</li>
</ul>
${C.worked('Check the rule on (2 + 3i)(1 − i) = 5 + i', [
  'Lengths: |2 + 3i| = √13 ≈ 3.606 and |1 − i| = √2 ≈ 1.414. Their product is √26 ≈ 5.099.',
  'The answer 5 + i has length √(25 + 1) = √26 ≈ 5.099. The lengths multiplied.',
  'Angles: arg(2 + 3i) ≈ 56.3° and arg(1 − i) = −45°. Their sum is about 11.3°.',
  'The answer 5 + i has angle arctan(1/5) ≈ 11.3°. The angles added.'
])}
<p>So multiplying by a number of length 1 is a pure turn. Multiplying by i (length 1, angle 90°) turns by 90°. Multiplying by −1 (length 1, angle 180°) turns by 180°. Multiplying by 2 (length 2, angle 0) only stretches. Choose z × w in the panel above and watch the three arcs near the origin: the angle of the product is the sum of the other two.</p>
${C.deeper('Why the angles add', `<p>Take two numbers of length 1, z = cos α + i sin α and w = cos β + i sin β, and multiply them out:</p>
${C.align([
  ['zw', '(cos α cos β − sin α sin β) + i(sin α cos β + cos α sin β)', 'expand and use i² = −1'],
  ['', 'cos(α + β) + i sin(α + β)', 'the angle-addition formulas from trigonometry']
])}
<p>The product is the point at angle α + β. For numbers of any length, write z = r(cos α + i sin α) and w = s(cos β + i sin β). The lengths r and s are ordinary numbers that come out in front, so the product has length rs.</p>`)}

<h2>The conjugate, and the number behind every probability</h2>
${C.define('Complex conjugate', `The conjugate of z = a + bi is ${M('z* = a − bi')}. It is the mirror image of z in the real axis: the same length, with the opposite angle. Some books write it with a bar over the z instead of a star.`)}
<p>Multiply a number by its own conjugate and something useful happens:</p>
${C.align([
  ['z z*', '(a + bi)(a − bi)', ''],
  ['', 'a² − abi + abi − b² i²', 'expand'],
  ['', 'a² + b²', 'the middle terms cancel, and −b²i² = +b²'],
  ['', '|z|²', 'Pythagoras']
])}
<p>The answer is always a real number, and it is never negative. In quantum computing this is the number that becomes a probability: if a measurement result has amplitude z, it happens with probability |z|² = z z*.</p>
${C.worked('Turn amplitudes into probabilities', [
  'z = 3 + 4i: z* = 3 − 4i and z z* = 9 + 16 = 25, so |z| = 5.',
  'z = (1 + i)/2: |z|² = (1² + 1²)/4 = 2/4 = 1/2. An amplitude of (1 + i)/2 means a probability of 50%.',
  'z = −0.6: |z|² = 0.36. The minus sign makes no difference to the probability.',
  'z = 0.8i: |z|² = 0² + 0.8² = 0.64.'
], 'The probabilities 0.36 and 0.64 add to 1, so −0.6 and 0.8i could be the two amplitudes of a single qubit.')}
${C.pitfall('|z|² is not z²', `<p>For z = i, z² = −1, a negative number, while |z|² = 1. For z = 1 + i, z² = 1 + 2i + i² = 2i, which is not even real, while |z|² = 2. Squaring a complex number doubles its angle; it does not give a probability. Probabilities always use |z|² = z z* = a² + b².</p>`)}
<h3>Dividing</h3>
<p>To divide by a + bi, multiply the top and the bottom by its conjugate. The bottom then becomes the real number a² + b²:</p>
${F('1 / (a + bi) = (a − bi) / (a² + b²)')}
<p>For example, 1/i = −i/1 = −i. Check: i · (−i) = −i² = 1. Dividing undoes multiplying, so dividing by i is a quarter turn clockwise. You will rarely divide in this course, but it always works, except by 0.</p>

<h2>Euler’s formula: e<sup>iθ</sup></h2>
<p>The arrow of length 1 at angle θ is cos θ + i sin θ. It is used so often that it gets a short name:</p>
${F('e<sup>iθ</sup> = cos θ + i sin θ')}
<p>This is <b>Euler’s formula</b>. On a first reading, treat the left side as shorthand for "the point at angle θ on the circle of radius 1", which is called the <b>unit circle</b>. The exponential notation is well chosen, because it obeys the usual rule for exponents: ${M('e<sup>iα</sup> e<sup>iβ</sup> = e<sup>i(α + β)</sup>')}. That is the angle-adding rule from the previous section written in a new way.</p>
${C.table(['θ', '0', 'π/4', 'π/2', 'π', '3π/2', '2π'], [['e<sup>iθ</sup>', '1', '(1 + i)/√2', 'i', '−1', '−i', '1']], 'compact angle-table')}
<p>Every complex number can now be written in <b>polar form</b> as z = r e<sup>iθ</sup>: a length r times a direction e<sup>iθ</sup>. Polar form makes multiplication easy, ${M('(r e<sup>iα</sup>)(s e<sup>iβ</sup>) = rs e<sup>i(α + β)</sup>')}, and conjugation too: ${M('(r e<sup>iθ</sup>)* = r e<sup>−iθ</sup>')}.</p>
${C.bench('cx-euler', 'Euler’s formula on the unit circle', 'Drag θ or pick a preset')}
${C.worked('Write z = −2i in polar form, then multiply it by e<sup>iπ/4</sup>', [
  'z = −2i is the point (0, −2): length r = 2, pointing straight down, at angle −π/2 (or 3π/2, the same direction).',
  'So z = 2 e<sup>−iπ/2</sup>.',
  'Multiply: 2 e<sup>−iπ/2</sup> · e<sup>iπ/4</sup> = 2 e<sup>i(−π/2 + π/4)</sup> = 2 e<sup>−iπ/4</sup>.',
  'Back to a + bi: 2(cos(−π/4) + i sin(−π/4)) = 2(1/√2 − i/√2) = √2 − √2 i.'
], 'Check in the a + bi form: −2i · (1 + i)/√2 = (−2i − 2i²)/√2 = (2 − 2i)/√2 = √2 − √2 i.')}
${C.deeper('Why e<sup>iθ</sup> deserves to be called an exponential', `<p>The exponential function has the power series e<sup>x</sup> = 1 + x + x²/2! + x³/3! + x⁴/4! + ⋯. Put x = iθ and use the cycle i² = −1, i³ = −i, i⁴ = 1:</p>
${F('e<sup>iθ</sup> = 1 + iθ − θ²/2! − iθ³/3! + θ⁴/4! + iθ⁵/5! − ⋯')}
<p>The terms without i are 1 − θ²/2! + θ⁴/4! − ⋯, which is the series for cos θ. The terms with i are θ − θ³/3! + θ⁵/5! − ⋯, the series for sin θ. So the shorthand really is the exponential function.</p>
<p>A second way to see it: the derivative of e<sup>iθ</sup> with respect to θ is i e<sup>iθ</sup>. Multiplying by i turns by 90°, so the velocity of the point is always at right angles to its position. That is exactly the motion of a point going round a circle at speed 1. Setting θ = π gives the famous identity e<sup>iπ</sup> = −1.</p>`)}

<h2>Phase: what quantum computing calls the angle</h2>
<p>In quantum computing, the angle of an amplitude is called its <b>phase</b>, and a number of the form e<sup>iφ</sup> is called a <b>phase factor</b>. Two facts about phases explain much of what follows.</p>
<p><b>A phase on its own changes no probability.</b> Multiplying an amplitude by e<sup>iφ</sup> turns it without changing its length, so |e<sup>iφ</sup> z|² = |z|². Switch on "Also multiply z" in the panel above and turn θ: the arrow for z swings round, and its length stays fixed.</p>
<p><b>Phases matter when amplitudes are added.</b> Take two amplitudes of length 1/2 and add them. The squared length of the sum depends on the angle between them:</p>
${C.table(['The two amplitudes', 'Their sum', '|sum|²', 'What happened'], [
  ['1/2 and 1/2', '1', '1', 'same direction: they reinforce'],
  ['1/2 and i/2', '(1 + i)/2', '1/2', 'at right angles: no gain and no loss'],
  ['1/2 and −1/2', '0', '0', 'opposite directions: they cancel']
])}
<p>The same two lengths give three different answers. This is <b>interference</b>, and chapter ${ref('interference')} shows it at work inside circuits.</p>
${C.deeper('A formula for |z + w|²', `<p>Expand using conjugates: |z + w|² = (z + w)(z* + w*) = |z|² + |w|² + z w* + z* w. The last two terms are conjugates of each other, and a number plus its conjugate is twice its real part, so they add up to 2 Re(z w*). If z and w have lengths r and s and the angle between them is Δ, then Re(z w*) = rs cos Δ, and</p>
${F('|z + w|² = r² + s² + 2rs cos Δ')}
<p>With r = s = 1/2 this is 1/2 + (1/2) cos Δ: 1 when Δ = 0, 1/2 when Δ = 90° and 0 when Δ = 180°, matching the table. The term 2rs cos Δ is called the <b>interference term</b>.</p>`)}

${C.keyIdea('A complex number is an arrow. Adding adds arrows; multiplying multiplies lengths and adds angles. A probability is the squared length |z|² = z z*, which a turn e<sup>iφ</sup> never changes. Turns only matter when arrows are added together.')}
${C.tryThis([
  'In the complex plane, choose z × w and set w = i. Drag z around and check that the product is always z turned by 90°.',
  'Set z = i and w = i in the z × w mode. Where does the product land, and which fact from this chapter does that show?',
  'In the z + w mode, drag w until z + w = 0. How is w related to z?',
  'In the z* mode, move z around a circle centred at 0. What happens to |z|², and why?',
  'With Euler’s formula, find the θ that gives −1. Then switch on the rotation of z: what does θ = π do to z?',
  'On paper, compute (1 + i)² and |1 + i|². Explain why they are different.'
])}
${C.recap([
  'i² = −1. A complex number z = a + bi is the point (a, b) in the complex plane.',
  'Add part by part. Multiply by expanding the brackets and replacing i² with −1.',
  '|z| = √(a² + b²) is the length of z, and arg z is its angle from the positive real axis.',
  'e<sup>iθ</sup> = cos θ + i sin θ is the point at angle θ on the unit circle; z = r e<sup>iθ</sup> is the polar form.',
  'Multiplying multiplies lengths and adds angles, so multiplying by i is a quarter turn.',
  'z* = a − bi, and z z* = |z|² = a² + b² is real and never negative. Probabilities are built from it.',
  'A phase factor e<sup>iφ</sup> keeps every length, but changes how amplitudes add.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'What is (1 + 2i)(3 − i)?', options: ['5 + 5i', '1 + 5i', '3 − 2i', '5 − 5i'], answer: 0,
        why: 'Expand: 3 − i + 6i − 2i². Since i² = −1, the term −2i² is +2. Total: (3 + 2) + (−1 + 6)i = 5 + 5i.' },
      { q: 'What is |3 − 4i|²?', options: ['25', '5', '−7', '7'], answer: 0,
        why: '|z|² = a² + b² = 3² + (−4)² = 9 + 16 = 25. The value −7 is the real part of z², a different thing: squaring is not the same as taking the squared length. The value 5 is |z| itself.' },
      { q: 'What does multiplying a complex number by i do to its arrow?', options: ['Turns it 90° counterclockwise', 'Turns it 90° clockwise', 'Doubles its length', 'Reflects it in the real axis'], answer: 0,
        why: 'i has length 1 and angle 90°. Multiplying multiplies the length by 1 and adds 90° to the angle: a quarter turn counterclockwise. Reflecting in the real axis is what the conjugate does.' },
      { q: 'What is e<sup>iπ</sup>?', options: ['−1', '1', 'i', '0'], answer: 0,
        why: 'e<sup>iπ</sup> = cos π + i sin π = −1 + 0i, the point halfway round the unit circle.' },
      { q: 'A measurement result has amplitude (1 − i)/2. What is its probability?', options: ['1/2', '1/4', '0', '1/√2'], answer: 0,
        why: '|z|² = (1² + (−1)²) / 2² = 2/4 = 1/2. The value 1/√2 is the length |z|, before squaring.' },
      { q: 'Which statement about a phase factor e<sup>iφ</sup> is true?', options: ['On its own it changes no probability, but it changes the result when amplitudes are added', 'It halves the length of any amplitude', 'It always equals 1', 'It multiplies every probability by cos φ'], answer: 0,
        why: 'e<sup>iφ</sup> has length 1, so |e<sup>iφ</sup> z|² = |z|². But |1 + e<sup>iφ</sup>|² = 2 + 2 cos φ depends on φ. That dependence is interference.' }
    ]
  });

  /* ===================================================================== 0.2 */
  C.text('linalg', {
    lede: `A qubit’s state is a column of two complex numbers, and every gate is a 2 × 2 grid of numbers called a matrix. This chapter shows exactly how a matrix acts on a column, one row at a time, and teaches the ket and bra notation, |ψ⟩ and ⟨ψ|, in which the rest of the course is written.`,
    html: `
${C.objectives([
  'Write a state as a column vector and as a ket α|0⟩ + β|1⟩',
  'Multiply a 2 × 2 matrix by a column vector by hand',
  'Multiply two matrices, and see why the order matters',
  'Compute lengths and inner products ⟨a|b⟩, and normalize a state',
  'Know what orthogonal and basis mean, and rewrite a state in another basis',
  'Form the conjugate transpose, written with a dagger †'
], ['complex'])}

<h2>Vectors are lists of numbers</h2>
<p>In this course a <b>vector</b> is an ordered list of numbers written as a column. Vectors of the same size are added entry by entry, and multiplying a vector by a single number, called a <b>scalar</b>, multiplies every entry:</p>
${D(`${vec(['1', '2'])} + ${vec(['3', '−1'])} = ${vec(['4', '1'])} <span class="eqn-gap"></span> 3 ${vec(['1', '2'])} = ${vec(['3', '6'])}`)}
<p>A vector with two real entries is an arrow in a plane, just like a complex number. The entries of a quantum state are complex, so the arrow picture stops being literal, but every rule in this chapter works the same way.</p>

<h2>Kets: names for columns</h2>
<p>Physicists write vectors in <b>Dirac notation</b>: ${K('name')}, read "ket name", stands for a column vector. The label inside is only a name. The two most important kets are</p>
${D(`${K('0')} = ${vec(['1', '0'])} <span class="eqn-gap"></span> ${K('1')} = ${vec(['0', '1'])}`)}
<p>Any column of two numbers is a combination of these two:</p>
${D(`${vec(['α', 'β'])} = α ${vec(['1', '0'])} + β ${vec(['0', '1'])} = α|0⟩ + β|1⟩`)}
<p>So a qubit state written α|0⟩ + β|1⟩ is the column with α on top and β below. The top entry is the amplitude of the result 0 and the bottom entry is the amplitude of the result 1. Four more states come up so often that they have their own names:</p>
${C.table(['Name', 'As a ket', 'As a column'], [
  [K('+'), '(|0⟩ + |1⟩)/√2', `${vec([r2, r2], 'small')}`],
  [K('−'), '(|0⟩ − |1⟩)/√2', `${vec([r2, '−' + r2], 'small')}`],
  [K('+i'), '(|0⟩ + i|1⟩)/√2', `${vec([r2, 'i/√2'], 'small')}`],
  [K('−i'), '(|0⟩ − i|1⟩)/√2', `${vec([r2, '−i/√2'], 'small')}`]
], 'compact')}
${C.pitfall('|0⟩ is not the zero vector', `<p>The ket |0⟩ is the column (1, 0): a perfectly good state, with length 1. The zero vector, with every entry 0, is not a state at all, and it is never written |0⟩. The 0 inside the ket is a label that means "the result 0".</p>`)}

<h2>Length and normalization</h2>
<p>The length of a vector with complex entries uses the squared lengths of the entries:</p>
${F('‖v‖ = √(|v₀|² + |v₁|²)')}
<p>A quantum state must have length 1, which means ${M('|α|² + |β|² = 1')}. The reason is that |α|² and |β|² are the probabilities of reading 0 and 1, and one of the two must happen. A vector of length 1 is called <b>normalized</b>. Any nonzero vector can be normalized by dividing it by its length.</p>
${C.worked('Normalize 3|0⟩ + 4i|1⟩', [
  'Squared lengths of the entries: |3|² = 9 and |4i|² = 16. They add to 25.',
  'The length is √25 = 5.',
  'Divide every entry by 5: the state is 0.6|0⟩ + 0.8i|1⟩.',
  'Check: 0.6² + 0.8² = 0.36 + 0.64 = 1.'
], 'Measured, this qubit gives 0 with probability 36% and 1 with probability 64%.')}

<h2>A matrix acts on a vector</h2>
<p>A 2 × 2 <b>matrix</b> is a square of four numbers. It acts on a column vector like this:</p>
${D(`${mat([['a', 'b'], ['c', 'd']])} ${vec(['x', 'y'])} = ${vec(['ax + by', 'cx + dy'])}`)}
<p>Each entry of the answer is one row of the matrix times the column: multiply the first entries together, multiply the second entries together, and add. That is the whole rule.</p>
${C.worked('Apply X to a general state', [
  `X = ${mat([['0', '1'], ['1', '0']], 'small')} and the state is the column (α, β).`,
  'Row 1 is (0, 1). Times the column: 0·α + 1·β = β.',
  'Row 2 is (1, 0). Times the column: 1·α + 0·β = α.',
  'So X turns (α, β) into (β, α): it swaps the two amplitudes.'
], 'In particular X|0⟩ = |1⟩ and X|1⟩ = |0⟩. X is the quantum NOT gate.')}
${C.worked('Apply H to |0⟩', [
  `H = (1/√2) ${mat([['1', '1'], ['1', '−1']], 'small')}. A number in front of a matrix multiplies every entry, so work with the matrix of 1s and −1 and multiply by 1/√2 at the end.`,
  'Row 1 is (1, 1). Times (1, 0): 1·1 + 1·0 = 1.',
  'Row 2 is (1, −1). Times (1, 0): 1·1 + (−1)·0 = 1.',
  'So H|0⟩ = (1/√2)(1, 1), which is |+⟩.'
], 'The same steps with |1⟩ = (0, 1) give H|1⟩ = (1/√2)(1, −1) = |−⟩.')}
${C.bench('mv-step', 'Matrix times vector, one row at a time', 'Pick a gate and an input, then step')}
<p>There is a shortcut hidden in the worked examples. Because |0⟩ = (1, 0) picks out the first column, M|0⟩ is the first column of M, and M|1⟩ is the second column. So you can read a gate straight off its matrix: <b>column 0 says where |0⟩ goes, and column 1 says where |1⟩ goes</b>.</p>
<p>Matrices are also <b>linear</b>: they act on each part of a sum separately, M(α|0⟩ + β|1⟩) = α M|0⟩ + β M|1⟩. So once you know what a gate does to |0⟩ and to |1⟩, you know what it does to every state.</p>
${C.worked('Apply S to |+⟩', [
  `S = ${mat([['1', '0'], ['0', 'i']], 'small')} and |+⟩ = (1/√2, 1/√2).`,
  'Row 1 is (1, 0): 1·(1/√2) + 0·(1/√2) = 1/√2.',
  'Row 2 is (0, i): 0·(1/√2) + i·(1/√2) = i/√2.',
  'So S|+⟩ = (1/√2, i/√2), which is |+i⟩.'
], 'S left the amplitude of 0 alone and turned the amplitude of 1 by 90°.')}

<h2>Multiplying matrices</h2>
<p>Applying B to a vector and then A gives A(Bv). You can also combine A and B first into a single matrix AB and apply that: A(Bv) = (AB)v. The entry in row r and column c of AB is row r of A times column c of B.</p>
${C.worked('Compute XZ and ZX', [
  `X = ${mat([['0', '1'], ['1', '0']], 'small')} and Z = ${mat([['1', '0'], ['0', '−1']], 'small')}.`,
  'XZ, top row: row 1 of X is (0, 1). Times column 1 of Z, (1, 0), gives 0. Times column 2 of Z, (0, −1), gives −1.',
  'XZ, bottom row: row 2 of X is (1, 0). Times (1, 0) gives 1, and times (0, −1) gives 0.',
  `So XZ = ${mat([['0', '−1'], ['1', '0']], 'small')}.`,
  `The same steps in the other order give ZX = ${mat([['0', '1'], ['−1', '0']], 'small')}.`
], 'ZX = −XZ. Swapping the order changed the answer, here by a sign. In general AB and BA are different matrices.')}
${C.pitfall('Circuits read left to right, formulas read right to left', `<p>In a circuit diagram, gates are applied from left to right along the wire. In a formula, the matrix next to the vector acts first, so a formula reads from right to left. The circuit "H, then Z" is the matrix ZH, and the state after it is ZH|ψ⟩. Getting this backwards is the most common slip in quantum computing.</p>`)}
<p>The <b>identity matrix</b> I = ${mat([['1', '0'], ['0', '1']], 'small')} leaves every vector unchanged. The <b>inverse</b> of A, written A⁻¹, undoes A: A⁻¹A = I. Some gates are their own inverse. You can check that XX = I and HH = I, so applying either one twice does nothing at all.</p>

<h2>The dagger: transpose and conjugate</h2>
<p>Three operations rearrange a matrix:</p>
<ul>
  <li>The <b>transpose</b> swaps rows and columns: the first row becomes the first column.</li>
  <li>The <b>complex conjugate</b> conjugates every entry, so i becomes −i.</li>
  <li>The <b>conjugate transpose</b> does both. It is written with a dagger, M†, and read "M dagger".</li>
</ul>
${C.worked('Find the dagger of a matrix', [
  `M = ${mat([['1', 'i'], ['2', '3 − i']], 'small')}.`,
  `Transpose (rows become columns): ${mat([['1', '2'], ['i', '3 − i']], 'small')}.`,
  `Conjugate every entry: ${mat([['1', '2'], ['−i', '3 + i']], 'small')}.`
], 'That is M†.')}
<p>The dagger of a column is a row. The dagger of the ket |ψ⟩ is written ${B('ψ')} and read "bra psi". If |ψ⟩ is the column (α, β), then ⟨ψ| is the row (α*, β*), with both entries conjugated.</p>

<h2>The inner product ⟨a|b⟩</h2>
<p>Put a bra next to a ket and you get a row times a column, which is a single number:</p>
${F('⟨a|b⟩ = a₀* b₀ + a₁* b₁')}
<p>This is the <b>inner product</b>, also called the <b>overlap</b>. Its name "bra-ket" comes from the bracket ⟨ | ⟩ it makes. It tells you three things:</p>
<ul>
  <li>⟨v|v⟩ = |v₀|² + |v₁|² is the squared length of v. Every state has ⟨ψ|ψ⟩ = 1.</li>
  <li>⟨a|b⟩ = 0 means a and b are <b>orthogonal</b>: as different as two states can be.</li>
  <li>For two states, |⟨a|b⟩|² lies between 0 and 1. Chapter ${ref('measure')} shows it is a probability: prepare b, measure in a basis that contains a, and the result is a with probability |⟨a|b⟩|².</li>
</ul>
${C.worked('Three overlaps', [
  '⟨0|+⟩ = 1·(1/√2) + 0·(1/√2) = 1/√2, so |⟨0|+⟩|² = 1/2.',
  '⟨+|−⟩ = (1/√2)(1/√2) + (1/√2)(−1/√2) = 1/2 − 1/2 = 0. So |+⟩ and |−⟩ are orthogonal.',
  'For ⟨+i|+⟩, first form the bra: |+i⟩ = (1/√2, i/√2), so ⟨+i| is the row (1/√2, −i/√2), with the i conjugated.',
  'Then ⟨+i|+⟩ = (1/√2)(1/√2) + (−i/√2)(1/√2) = (1 − i)/2, whose squared length is (1 + 1)/4 = 1/2.'
])}
${C.pitfall('Forgetting the conjugate in the bra', `<p>Without the conjugate, ⟨+i|+i⟩ would come out as (1/√2)² + (i/√2)² = 1/2 − 1/2 = 0, as if the state had no overlap with itself. With the conjugate it is (1/√2)(1/√2) + (−i/√2)(i/√2) = 1/2 + 1/2 = 1, as it must be. Whenever a bra appears, conjugate its entries.</p>`)}
${C.bench('overlap', 'Overlap of two states', 'Drag the arrow tips or pick a pair')}
<p>For real amplitudes the overlap has a picture: it is the length of the shadow one arrow casts on the other, which is the cosine of the angle between them. Arrows at right angles cast no shadow, so they are orthogonal. This flat picture is only a helper for real amplitudes. It is not the Bloch sphere of chapter ${ref('bloch')}, where |0⟩ and |1⟩ sit at opposite poles.</p>

<h2>Bases: different ways to describe the same state</h2>
${C.define('Basis', 'For one qubit, a basis is a pair of orthogonal states of length 1. Every state can be written as a combination of the two, in exactly one way.')}
<p>Three bases are used all the time:</p>
${C.table(['Basis', 'States', 'Other names'], [
  ['Z basis', '|0⟩, |1⟩', 'computational or standard basis'],
  ['X basis', '|+⟩, |−⟩', 'Hadamard or plus-minus basis'],
  ['Y basis', '|+i⟩, |−i⟩', 'circular basis']
], 'compact')}
<p>To write a state in a basis, use inner products: the coefficient of a basis state |e⟩ in |ψ⟩ is ⟨e|ψ⟩.</p>
${C.worked('Write |0⟩ in the X basis', [
  'Coefficient of |+⟩: ⟨+|0⟩ = (1/√2)·1 + (1/√2)·0 = 1/√2.',
  'Coefficient of |−⟩: ⟨−|0⟩ = (1/√2)·1 + (−1/√2)·0 = 1/√2.',
  'So |0⟩ = (|+⟩ + |−⟩)/√2.',
  'Check by adding columns: (1/√2)[(1/√2, 1/√2) + (1/√2, −1/√2)] = (1/2)(2, 0) = (1, 0).'
], 'One state, two descriptions. In the Z basis |0⟩ is certain. In the X basis it is an equal mix of |+⟩ and |−⟩, so measuring it in the X basis gives a fair coin flip.')}

<h2>Outer products</h2>
<p>A column times a row is a matrix. With kets and bras this is written |a⟩⟨b|. For example</p>
${D(`|0⟩⟨0| = ${mat([['1', '0'], ['0', '0']], 'small')} <span class="eqn-gap"></span> |0⟩⟨1| = ${mat([['0', '1'], ['0', '0']], 'small')} <span class="eqn-gap"></span> |1⟩⟨0| = ${mat([['0', '0'], ['1', '0']], 'small')}`)}
<p>Any 2 × 2 matrix is a sum of the four products |r⟩⟨c|, each weighted by the entry in row r and column c. For instance X = |0⟩⟨1| + |1⟩⟨0| and Z = |0⟩⟨0| − |1⟩⟨1|. A matrix |ψ⟩⟨ψ| built from one state is called a <b>projector</b>. You will need projectors for measurement in chapter ${ref('measure')} and for density matrices in chapter ${ref('noise')}; for now it is enough to recognise the notation.</p>
${C.deeper('Where the row-times-column rule comes from', `<p>Write v = x|0⟩ + y|1⟩. Linearity gives Mv = x M|0⟩ + y M|1⟩. Since M|0⟩ is the first column (a, c) and M|1⟩ is the second column (b, d),</p>
${F('Mv = x(a, c) + y(b, d) = (ax + by, cx + dy)')}
<p>Reading the answer one entry at a time gives the row-times-column rule. Matrix multiplication is defined so that the columns of AB are A applied to the columns of B, which is exactly what makes (AB)v = A(Bv) true.</p>`)}

${C.keyIdea('A state is a column of amplitudes and a gate is a matrix. Applying a gate means matrix times column: each new amplitude is one row times the old column. The overlap ⟨a|b⟩, a conjugated row times a column, measures how alike two states are.')}
${C.tryThis([
  'In the matrix panel, apply H to |0⟩ and then to |1⟩. Compare each answer with the columns of H.',
  'Apply X to |+⟩. The state does not change. Why not, in terms of its two amplitudes?',
  'Apply Z to |+⟩ and to |−⟩. Which named states come out?',
  'Apply S to |+⟩, then feed each answer back in as the next input. How many S gates bring you back to |+⟩?',
  'In the overlap panel, choose "opposite signs". The overlap is negative, but the probability matches "same state". Why?',
  'On paper, normalize |0⟩ + 2|1⟩, then compute its overlap with |+⟩ and the squared overlap.'
])}
${C.recap([
  '|0⟩ = (1, 0) and |1⟩ = (0, 1). The state α|0⟩ + β|1⟩ is the column (α, β), with |α|² + |β|² = 1.',
  'Matrix times vector: each entry of the answer is one row times the column. Column j of a matrix is what it does to |j⟩.',
  'Matrix times matrix: in ABv, B acts first. Circuits read left to right; formulas read right to left.',
  'The dagger M† is the transpose with every entry conjugated. The bra ⟨ψ| is the dagger of the ket |ψ⟩.',
  '⟨a|b⟩ = a₀*b₀ + a₁*b₁. Every state has ⟨ψ|ψ⟩ = 1, and ⟨a|b⟩ = 0 means orthogonal.',
  'In a basis {|e⟩}, the coefficient of |e⟩ in |ψ⟩ is ⟨e|ψ⟩.'
])}
${C.quizSection()}`,
    quiz: [
      { q: `What is ${mat([['1', '2'], ['3', '4']], 'small')} times the column ${vec(['1', '−1'], 'small')}?`, options: ['(−1, −1)', '(3, 7)', '(−2, −2)', '(1, 1)'], answer: 0,
        why: 'Row 1: 1·1 + 2·(−1) = −1. Row 2: 3·1 + 4·(−1) = −1. The answer (3, 7) is what you get for the column (1, 1).' },
      { q: 'Which column is |−⟩?', options: ['(1/√2, −1/√2)', '(1, −1)', '(0, −1)', '(−1/√2, −1/√2)'], answer: 0,
        why: '|−⟩ = (|0⟩ − |1⟩)/√2. The column (1, −1) points the right way but has length √2, (0, −1) is −|1⟩, and (−1/√2, −1/√2) is −|+⟩.' },
      { q: 'What is ⟨1|+⟩?', options: ['1/√2', '0', '1/2', '1'], answer: 0,
        why: '⟨1| is the row (0, 1). Times (1/√2, 1/√2), it picks out the second entry: 1/√2. Its square, 1/2, is a probability.' },
      { q: 'If |v⟩ is the column (i/√2, 1/√2), what is ⟨v|?', options: ['The row (−i/√2, 1/√2)', 'The row (i/√2, 1/√2)', 'The column (−i/√2, 1/√2)', 'The row (1/√2, i/√2)'], answer: 0,
        why: 'A bra is the conjugate transpose of the ket: turn the column into a row and conjugate each entry, so i becomes −i.' },
      { q: 'A circuit applies H and then Z to |ψ⟩. Which formula gives the final state?', options: ['ZH|ψ⟩', 'HZ|ψ⟩', 'H|ψ⟩Z', 'Z|ψ⟩H'], answer: 0,
        why: 'The matrix next to the state acts first, so H must sit next to |ψ⟩: Z(H|ψ⟩) = ZH|ψ⟩.' },
      { q: 'Which pair of states is orthogonal?', options: ['|+⟩ and |−⟩', '|0⟩ and |+⟩', '|+⟩ and −|+⟩', '|+i⟩ and |+⟩'], answer: 0,
        why: '⟨+|−⟩ = 1/2 − 1/2 = 0. The other pairs have overlaps of size 1/√2, 1 and 1/√2.' }
    ]
  });

  /* ===================================================================== 0.3 */
  C.text('eigen', {
    lede: `Three ideas from linear algebra carry most of quantum computing. An eigenvector is a direction that a matrix only stretches or flips. A unitary matrix keeps every length, which is why every gate is one. A Hermitian matrix has real eigenvalues, which is why every measurement is described by one.`,
    html: `
${C.objectives([
  'Recognize eigenvectors and eigenvalues, in a picture and in a calculation',
  'Find the eigenvalues of a 2 × 2 matrix from the characteristic equation',
  'Test whether a matrix is unitary, and explain why every gate must be',
  'Test whether a matrix is Hermitian, and connect its eigenvalues to measurement results',
  'Know the Pauli matrices X, Y and Z and their eigenstates',
  'Tell a global phase, which changes nothing, from a relative phase, which does'
], ['complex', 'linalg'])}

<h2>Eigenvectors: arrows a matrix does not turn</h2>
<p>Feed an arrow into a matrix and it usually comes out pointing somewhere else. A few special arrows come out along the same line they went in on, only stretched, shrunk or flipped:</p>
${F('A v = λ v')}
<p>Such a v is called an <b>eigenvector</b> of A, and the number λ (the Greek letter lambda) is its <b>eigenvalue</b>. "Eigen" is German for "own": these are the matrix’s own directions. If λ = 2 the arrow doubles in length, if λ = −1 it flips round, and if λ = 1 it is left exactly as it was.</p>
<p>You have already met some. X swaps amplitudes, so X|+⟩ = |+⟩: eigenvalue 1. And X turns |−⟩ = (1/√2, −1/√2) into (−1/√2, 1/√2) = −|−⟩: eigenvalue −1.</p>
${C.bench('eigen', 'Find the eigenvectors', 'Drag the arrow v until it lies on a brass line')}
<p>The blue arrow is the input v and the orange arrow is the output Av. With the ring switched on, each small blue dot on the circle is joined by a thin line to the orange dot where the matrix sends it, so you can see the whole action at once. Arrows on the brass lines are eigenvectors: they come out on the same line. For X the brass lines are the diagonals, the directions of |+⟩ and |−⟩.</p>

<h2>Finding eigenvalues</h2>
<p>If Av = λv for some nonzero v, then (A − λI)v = 0: the matrix A − λI squashes a whole direction down to nothing. A matrix that does that has determinant 0. For a 2 × 2 matrix, the <b>determinant</b> is</p>
${D(`det ${mat([['p', 'q'], ['r', 's']])} = ps − qr`)}
<p>so the eigenvalues are the solutions of the <b>characteristic equation</b></p>
${F('det(A − λI) = (a − λ)(d − λ) − bc = 0')}
<p>where a, b, c and d are the entries of A, read row by row.</p>
${C.worked(`Eigenvalues and eigenvectors of A = ${mat([['2', '1'], ['1', '2']], 'small')}`, [
  'A − λI has entries 2 − λ, 1, 1, 2 − λ. Its determinant is (2 − λ)² − 1.',
  'Set it to zero: (2 − λ)² = 1, so 2 − λ = 1 or 2 − λ = −1. The eigenvalues are λ = 1 and λ = 3.',
  'For λ = 3, (A − 3I)v = 0 reads −x + y = 0, so y = x. An eigenvector is (1, 1), or (1/√2, 1/√2) after normalizing.',
  'For λ = 1, (A − I)v = 0 reads x + y = 0, so y = −x. An eigenvector is (1, −1)/√2.',
  'Check: A(1, 1) = (2 + 1, 1 + 2) = (3, 3) = 3·(1, 1), and A(1, −1) = (2 − 1, 1 − 2) = (1, −1) = 1·(1, −1).'
], 'Eigenvalue 3 along one diagonal and 1 along the other. To see it, choose "Your own" in the panel and set a = 2, b = 1 and d = 2.')}
<p>Two shortcuts help you check an answer. The eigenvalues add up to the <b>trace</b>, the sum of the diagonal entries a + d, and they multiply to the determinant ad − bc. Above: 3 + 1 = 4 = 2 + 2, and 3 × 1 = 3 = 2·2 − 1·1.</p>
${C.pitfall('An eigenvector is a direction, not one particular arrow', `<p>If v is an eigenvector, so are 2v, −v and iv, with the same eigenvalue: they all lie along the same line through 0. When people say "the" eigenvector they mean any one of them, usually scaled to length 1. In quantum computing this freedom is harmless, because multiplying a state by a number of length 1 changes nothing you can measure (see global phase, below).</p>`)}
${C.deeper('Why squashing a direction means determinant zero', `<p>The determinant of a 2 × 2 matrix is the factor by which it scales areas, with a minus sign if it flips the plane over. If a matrix squashes some direction to 0, it flattens the whole plane onto a line, every area becomes 0, and so the determinant is 0. Conversely, a matrix with determinant 0 cannot be undone, because some nonzero vector is sent to 0.</p>
<p>Expanding det(A − λI) gives λ² − (a + d)λ + (ad − bc). A quadratic λ² − Sλ + P has two roots that add to S and multiply to P, which is where the trace and determinant shortcuts come from.</p>`)}

<h2>The Pauli matrices</h2>
${D(`X = ${mat([['0', '1'], ['1', '0']])} <span class="eqn-gap"></span> Y = ${mat([['0', '−i'], ['i', '0']])} <span class="eqn-gap"></span> Z = ${mat([['1', '0'], ['0', '−1']])}`)}
<p>These three matrices are the building blocks of single-qubit quantum computing. Each one squares to the identity: X² = Y² = Z² = I. Each has the eigenvalues +1 and −1, and their eigenvectors are the six named states from the last chapter:</p>
${C.table(['Matrix', 'Eigenvalue +1', 'Eigenvalue −1'], [
  ['Z', '|0⟩', '|1⟩'],
  ['X', '|+⟩', '|−⟩'],
  ['Y', '|+i⟩', '|−i⟩']
], 'compact')}
${C.worked('Check that Y|+i⟩ = |+i⟩', [
  '|+i⟩ = (1/√2)(1, i). The factor 1/√2 passes straight through the matrix, so check the column (1, i).',
  'Row 1 of Y is (0, −i): 0·1 + (−i)·i = −i² = 1.',
  'Row 2 of Y is (i, 0): i·1 + 0·i = i.',
  'So Y(1, i) = (1, i).'
], '|+i⟩ is an eigenvector of Y with eigenvalue +1.')}
<p>The Pauli matrices also multiply into each other: XY = iZ, YZ = iX and ZX = iY, while reversing the order flips the sign, so YX = −iZ. In the last chapter you found ZX = −XZ by hand; this is the same fact. Pairs that pick up a minus sign when swapped are said to <b>anticommute</b>.</p>

<h2>Unitary matrices: every gate is one</h2>
<p>A qubit’s probabilities |α|² + |β|² always add to 1, so a state is a vector of length 1. A gate must turn every state into another state, so it must keep the length of every vector. Matrices that keep all lengths are called <b>unitary</b>, and there is a simple test:</p>
${F('U†U = I')}
<p>An equivalent test: the columns of U each have length 1, and different columns are orthogonal. Unitary matrices keep overlaps as well as lengths, ⟨Ua|Ub⟩ = ⟨a|b⟩, so they preserve how alike any two states are. They can always be undone: the inverse of U is simply U†.</p>
${C.worked('Is H unitary?', [
  `H = (1/√2) ${mat([['1', '1'], ['1', '−1']], 'small')} is real and symmetric, so H† = H.`,
  `H†H = HH = (1/2) ${mat([['1·1 + 1·1', '1·1 + 1·(−1)'], ['1·1 + (−1)·1', '1·1 + (−1)(−1)']], 'small')} = (1/2) ${mat([['2', '0'], ['0', '2']], 'small')} = I.`,
  'Column test: (1, 1)/√2 and (1, −1)/√2 each have length 1, and their overlap is (1 − 1)/2 = 0.'
], 'H is unitary, and since H† = H it is its own inverse.')}
${C.worked(`A matrix that cannot be a gate: A = ${mat([['1', '1'], ['0', '1']], 'small')}`, [
  'A|1⟩ is the second column of A, which is (1, 1).',
  'That vector has squared length 1² + 1² = 2.',
  'So a state with total probability 1 would come out with total probability 2, which is impossible.'
], 'A is not unitary, and no quantum computer can apply it.')}
<p>Every eigenvalue of a unitary matrix has length 1. If Uv = λv, the length of Uv is |λ| times the length of v. But U keeps lengths, so |λ| = 1, and λ = e<sup>iφ</sup> for some angle φ. A unitary can only multiply its eigenvectors by a phase, never stretch them. The "Rotate 45°" matrix in the panel is unitary: every dot on the ring stays on the circle. Its eigenvalues are e<sup>±iπ/4</sup>, complex numbers of length 1, which is why no real arrow keeps its direction.</p>

<h2>Hermitian matrices: every measurement is one</h2>
<p>A matrix is <b>Hermitian</b> if it equals its own dagger: A† = A. For a 2 × 2 matrix that means the diagonal entries are real and the two off-diagonal entries are conjugates of each other:</p>
${D(`A = ${mat([['a', 'b'], ['b*', 'd']])} <span class="eqn-gap"></span> with a and d real`)}
<p>Hermitian matrices have two properties that make them perfect for describing measurements: their eigenvalues are always real numbers, and eigenvectors with different eigenvalues are orthogonal. In quantum mechanics a measurable quantity, called an <b>observable</b>, is a Hermitian matrix. The possible results of the measurement are its eigenvalues, and the states that give each result with certainty are its eigenvectors.</p>
<p>Z is the standard example. Its eigenvalues +1 and −1 are the two results of an ordinary measurement, with +1 standing for outcome 0 and −1 for outcome 1. Its eigenvectors |0⟩ and |1⟩ are the states that give those results for sure.</p>
<p>The average result of measuring the observable A on the state |ψ⟩ many times is called the <b>expectation value</b>:</p>
${F('⟨A⟩ = ⟨ψ|A|ψ⟩')}
${C.worked('The expectation value of Z', [
  'Take |ψ⟩ = (α, β). Then Z|ψ⟩ = (α, −β).',
  '⟨ψ|Z|ψ⟩ = α*·α + β*·(−β) = |α|² − |β|².',
  'That is P(0) − P(1): the average of +1, which happens with probability P(0), and −1, which happens with probability P(1).',
  'For |0⟩ the answer is 1. For |+⟩ it is 1/2 − 1/2 = 0. For √0.8|0⟩ + √0.2|1⟩ it is 0.8 − 0.2 = 0.6.'
], '⟨Z⟩ is the main output of the quantum classifiers in Part VII.')}
${C.deeper('Why a Hermitian matrix has real eigenvalues', `<p>Suppose Av = λv with ⟨v|v⟩ = 1. Then ⟨v|A|v⟩ = λ⟨v|v⟩ = λ. Now take the complex conjugate of the number ⟨v|A|v⟩: it is ⟨v|A†|v⟩, which equals ⟨v|A|v⟩ because A† = A. A number equal to its own conjugate is real, so λ is real.</p>
<p>A similar argument shows that eigenvectors with different eigenvalues are orthogonal. If Av = λv and Aw = μw, then ⟨w|A|v⟩ equals both λ⟨w|v⟩ and μ⟨w|v⟩, so (λ − μ)⟨w|v⟩ = 0. When λ ≠ μ, ⟨w|v⟩ must be 0.</p>`)}
${C.table(['Matrix', 'Unitary?', 'Hermitian?'], [
  ['X, Y, Z', 'yes', 'yes'],
  ['H', 'yes', 'yes'],
  [`S = ${mat([['1', '0'], ['0', 'i']], 'small')}`, 'yes', `no: S† = ${mat([['1', '0'], ['0', '−i']], 'small')}`],
  [`T = ${mat([['1', '0'], ['0', 'e<sup>iπ/4</sup>']], 'small')}`, 'yes', 'no'],
  [mat([['2', '1'], ['1', '2']], 'small'), 'no: it stretches', 'yes'],
  [mat([['1', '1'], ['0', '1']], 'small'), 'no', 'no']
], 'compact')}
<p>A matrix that is both unitary and Hermitian is its own inverse, since U² = U†U = I. That is why X, Y, Z and H each undo themselves.</p>

<h2>Global phase and relative phase</h2>
<p>Multiplying a whole state by a phase factor e<sup>iφ</sup> turns every amplitude by the same angle. Every probability |e<sup>iφ</sup> α|² = |α|² stays the same, in every basis, so no experiment can ever detect the change. This is called a <b>global phase</b>, and two states that differ only by a global phase are the same physical state.</p>
<p>This is why eigenvectors of a gate are special. If U|v⟩ = e<sup>iφ</sup>|v⟩, the gate leaves that state physically unchanged.</p>
<p>A <b>relative phase</b> is different. Changing the phase of one amplitude but not the other does change the state. |+⟩ = (|0⟩ + |1⟩)/√2 and |−⟩ = (|0⟩ − |1⟩)/√2 have identical Z-basis probabilities, yet they are orthogonal, and a measurement in the X basis tells them apart every time.</p>
${C.pitfall('−|ψ⟩ is the same state as |ψ⟩, but |−⟩ is not |+⟩', `<p>−|+⟩ = (−|0⟩ − |1⟩)/√2 is |+⟩ multiplied by the global phase −1 = e<sup>iπ</sup>: physically identical. But |−⟩ = (|0⟩ − |1⟩)/√2 has a minus sign on only one amplitude. That is a relative phase, and |−⟩ is a different state. To decide whether two states are physically equal, ask whether one is a single number of length 1 times the other.</p>`)}

${C.keyIdea('Gates are unitary: they keep every length, so probabilities always add to 1, and they can always be undone. Observables are Hermitian: their eigenvalues are the possible results, and their eigenvectors are the states that give those results for certain. A global phase changes nothing; a relative phase changes the state.')}
${C.tryThis([
  'Choose X and turn v until the panel says Eigenvector. Find both brass lines and read off their eigenvalues.',
  'Choose Z. Which arrows are left alone, and which are flipped?',
  'Choose H. Its eigenvectors lie at 22.5° and 112.5°, halfway between those of Z and those of X. Check their eigenvalues.',
  'Choose "Your own", set a = 2, b = 1 and d = 2, and compare with the worked example. Then set b = 0: where do the eigenvectors go, and why?',
  'Choose "Rotate 45°" and turn v all the way round. Why does no arrow ever stay on its own line?',
  'On paper, check that S is unitary but not Hermitian.'
])}
${C.recap([
  'Av = λv: v is an eigenvector of A and λ is its eigenvalue. Find λ from det(A − λI) = 0. The eigenvalues add to the trace and multiply to the determinant.',
  'Unitary means U†U = I. Lengths and overlaps are kept, U is undone by U†, and every eigenvalue has length 1. Every gate is unitary.',
  'Hermitian means A† = A: real eigenvalues and orthogonal eigenvectors. Every observable is Hermitian.',
  'The Pauli matrices X, Y and Z square to I. Their ±1 eigenvectors are |±⟩, |±i⟩, and |0⟩ and |1⟩.',
  '⟨ψ|A|ψ⟩ is the average result of measuring A. For Z it is P(0) − P(1).',
  'A global phase e<sup>iφ</sup>|ψ⟩ cannot be detected. A relative phase between the amplitudes can.'
])}
${C.quizSection()}`,
    quiz: [
      { q: `What are the eigenvalues of ${mat([['3', '0'], ['0', '−2']], 'small')}?`, options: ['3 and −2', '1 and −1', '3 and 2', '0 and 1'], answer: 0,
        why: 'For a diagonal matrix, |0⟩ and |1⟩ are eigenvectors and the eigenvalues are the diagonal entries. The characteristic equation (3 − λ)(−2 − λ) = 0 says the same.' },
      { q: 'Which matrix is not unitary?', options: [mat([['1', '1'], ['0', '1']], 'small'), mat([['0', '1'], ['1', '0']], 'small'), mat([['1', '0'], ['0', 'i']], 'small'), `(1/√2) ${mat([['1', '1'], ['1', '−1']], 'small')}`], answer: 0,
        why: 'Its second column (1, 1) has length √2, so it would turn |1⟩ into a vector with total probability 2. The other three have orthonormal columns: they are X, S and H.' },
      { q: 'Why must every quantum gate be unitary?', options: ['So that the probabilities still add to 1 for every input state', 'So that its entries are real', 'So that it has an eigenvalue equal to 1', 'So that it is its own inverse'], answer: 0,
        why: 'A gate has to turn every state into a state, and keeping the length of every vector is exactly what unitary means. The other options describe some gates but not all: S has complex entries, and T is not its own inverse.' },
      { q: 'What eigenvalue does |−⟩ have for the X gate?', options: ['−1', '+1', 'i', '0'], answer: 0,
        why: 'X swaps the amplitudes of (1/√2, −1/√2), giving (−1/√2, 1/√2) = −|−⟩. So the eigenvalue is −1.' },
      { q: 'For |ψ⟩ = √0.8 |0⟩ + √0.2 |1⟩, what is ⟨ψ|Z|ψ⟩?', options: ['0.6', '1', '0.8', '−0.6'], answer: 0,
        why: '⟨Z⟩ = P(0) − P(1) = 0.8 − 0.2 = 0.6.' },
      { q: 'Which two describe the same physical state?', options: ['|+⟩ and −|+⟩', '|+⟩ and |−⟩', '|0⟩ and |1⟩', '|+i⟩ and |−i⟩'], answer: 0,
        why: '−|+⟩ is |+⟩ times the global phase −1 = e<sup>iπ</sup>, which no measurement can detect. The other three pairs are orthogonal: as different as two states can be.' }
    ]
  });
})(window);

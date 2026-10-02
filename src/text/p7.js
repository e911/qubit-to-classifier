/* Words for Part VII, quantum machine learning. Interactive panels live in src/ch7a.js and src/ch7b.js. */
(function (G) {
  'use strict';
  const C = G.C, K = C.K, M = C.M, F = C.F, ref = C.ref, mat = C.mat;

  /* ===================================================================== 7.1 */
  C.text('qml', {
    lede: `Machine learning finds patterns in data by tuning a model until it predicts well. Quantum machine learning uses quantum circuits as the model, or quantum computers to process the data. This chapter teaches the machine-learning basics first, then maps out the quantum side.`,
    html: `
${C.objectives([
  'Describe supervised learning: features, labels, a model, a loss and training',
  'Train a classical classifier by gradient descent and read its loss curve',
  'Explain training and test sets, and what overfitting means',
  'See why the choice of features decides what a model can learn',
  'Place quantum machine learning on a map of four settings, and describe the variational loop',
  'Say honestly where the field stands today'
], ['measure', 'interference'])}

<h2>Machine learning in one paragraph</h2>
<p>In <b>supervised learning</b> you are given examples: inputs x, each with a known answer y called its <b>label</b>. For instance, x could be two measurements of a flower and y its species. The goal is a <b>model</b>, a function f(x; θ) with adjustable numbers θ called <b>parameters</b>, whose predictions match the labels, including on examples it has never seen. Learning means choosing θ.</p>
<p>Throughout Part VII, x is a point (x₁, x₂) in a square and y is one of two classes, drawn as blue (y = 0) and red (y = 1). Predicting the class is called <b>binary classification</b>.</p>

<h2>Loss: a number that says how wrong the model is</h2>
<p>To choose θ we need a score for how badly the model does, called the <b>loss</b>. A classifier usually outputs a probability p that the class is red. If the true class is red, a good model has p near 1; if it is blue, p near 0. The <b>cross-entropy loss</b> of one example is</p>
${F('L = −log p &nbsp; if the label is red, &nbsp;&nbsp; L = −log(1 − p) &nbsp; if it is blue')}
<p>It is 0 for a confident correct prediction and grows without limit for a confident wrong one. The loss of the model is the average over all the training examples.</p>
${C.worked('Cross-entropy for three predictions', [
  'The label is red and the model says p = 0.9: L = −log 0.9 ≈ 0.105. Right and confident, so the loss is small.',
  'The label is red and p = 0.5: L = −log 0.5 ≈ 0.693. A shrug, so the loss is medium.',
  'The label is red and p = 0.1: L = −log 0.1 ≈ 2.303. Confidently wrong, so the loss is large.'
], 'The logarithms are natural logarithms. Minimizing the average loss pushes every prediction toward the right class.')}

<h2>Gradient descent: walking downhill</h2>
<p>The loss depends on the parameters θ. Picture it as a landscape over θ, with the best parameters at the bottom of a valley. The <b>gradient</b> ∇L, the list of partial derivatives ∂L/∂θ<sub>k</sub>, points uphill. So training repeats one step:</p>
${F('θ ← θ − η ∇L(θ)')}
<p>where η (eta), the <b>learning rate</b>, sets the size of each step. Too small and training crawls; too large and it overshoots the valley and bounces around. One pass through the training data is called an <b>epoch</b>.</p>
${C.worked('Gradient descent by hand', [
  'Take the loss L(θ) = (θ − 3)², whose valley is at θ = 3. Its gradient is dL/dθ = 2(θ − 3).',
  'Start at θ = 0, where the gradient is 2(0 − 3) = −6.',
  'With η = 0.1, the step gives θ ← 0 − 0.1 × (−6) = 0.6.',
  'Repeating gives 0.6, 1.08, 1.464, … closing in on 3: each step removes 20% of the remaining distance.'
], 'Real models have many parameters, but every step is the same idea in many directions at once.')}

<h2>A classical classifier, trained live</h2>
<p>The panel below trains <b>logistic regression</b>, the simplest classifier: p(red) = σ(w₁x₁ + w₂x₂ + b), where σ(z) = 1/(1 + e<sup>−z</sup>) squashes any number into a probability. The parameters are the weights w₁, w₂ and the bias b, and the decision boundary, where p = 1/2, is a straight line.</p>
${C.bench('ml-basics', 'A classical classifier', 'Pick a dataset and features, then train')}
<p>Two lessons from this panel carry straight over to quantum models. First, on the circle data no straight line separates the classes, however long you train. Second, adding the features x₁² and x₂² fixes that: with those features the boundary w₁x₁ + w₂x₂ + w₃x₁² + w₄x₂² + b = 0 can be a circle. <b>The features you give a model decide what it can learn.</b> In quantum machine learning, the encoding of x into a quantum state plays exactly this role (chapter ${ref('encoding')}).</p>

<h2>Training and test data</h2>
<p>A model can do well on its training examples by memorizing them without learning the pattern. To check for this, part of the data, the <b>test set</b>, is held back and never used for training. If the training accuracy is high and the test accuracy much lower, the model is <b>overfitting</b>: it has fitted the noise in the training examples. The cures are a simpler model, more data, or <b>regularization</b>, a penalty on extreme parameters. In the panels of this part, filled dots are training data and hollow dots are test data.</p>
${C.pitfall('High training accuracy is not the goal', `<p>A model is only useful if it works on new data. Always judge it by its test accuracy, and be suspicious of a large gap between training and test.</p>`)}

<h2>Where quantum computers come in</h2>
<p>"Quantum machine learning" covers four combinations of data and processing:</p>
${C.table(['', 'Classical processing', 'Quantum processing'], [
  ['Classical data', '<b>CC</b>: ordinary machine learning, plus "quantum-inspired" classical algorithms', '<b>CQ</b>: trainable circuits and quantum kernels applied to classical datasets. <b>The rest of this part.</b>'],
  ['Quantum data', '<b>QC</b>: classical machine learning on measurement records, for calibrating devices or decoding error correction', '<b>QQ</b>: quantum processing of states that come from quantum sensors or simulations']
])}

<h2>The variational loop</h2>
<p>The most studied setting today is <b>variational</b>, or hybrid, learning: a quantum circuit with adjustable rotation angles plays the role of the model, and an ordinary computer trains it.</p>
${C.bench('loop', 'The variational loop')}
<ol>
  <li><b>Encode</b> the input x into a quantum state |φ(x)⟩ (chapter ${ref('encoding')}).</li>
  <li><b>Transform</b> it with a trainable circuit U(θ), called the <b>ansatz</b>.</li>
  <li><b>Measure</b> an observable, usually Z on one qubit, many times. The average ⟨Z⟩ is the model output f(x; θ), and p(red) = (1 − f)/2 (chapter ${ref('pqc')}).</li>
  <li><b>Score</b> the output against the label with the loss, on an ordinary computer.</li>
  <li><b>Update</b> θ by gradient descent. The gradients come from running the same circuit at shifted angles (chapter ${ref('gradients')}).</li>
</ol>
<p>Compare this with the logistic regression above. The encoding replaces the hand-picked features, the circuit and the measurement replace w·x + b and σ, and the training loop is unchanged. The quantum part is the model; everything else is ordinary machine learning.</p>

<h2>Where the field stands</h2>
<p>As of the mid-2020s, there is no demonstrated practical advantage of quantum models on classical datasets. The obstacles are well understood: <b>trainability</b> (gradients can vanish exponentially, chapter ${ref('plateaus')}), the cost of <b>loading data</b> into quantum states, hardware <b>noise</b>, and <b>dequantization</b> results showing that some proposed quantum speed-ups can be matched by clever classical algorithms. The most promising directions involve data that is quantum to begin with, problems with structure or symmetry that a circuit can exploit, and carefully designed kernels. Treat quantum machine learning as an active research field rather than a toolbox with guaranteed gains. That is exactly what makes it a good place to do research.</p>

${C.keyIdea('A variational quantum model is a circuit with knobs. Classical data goes in through an encoding, a number comes out as an expectation value, and an ordinary optimizer turns the knobs by gradient descent, exactly as in classical machine learning.')}
${C.tryThis([
  'Train on "Two clusters" with the features x₁ and x₂. After how many steps does the test accuracy stop improving?',
  'Switch to "Circle" and train with x₁ and x₂ only. What is the best accuracy you can reach, and why?',
  'Now add the squared features and train again. Are the trained weights w₃ and w₄ similar?',
  'Set the learning rate to 3 and train. What happens to the loss curve?',
  'On paper: continue the gradient descent by hand for two more steps.'
])}
${C.recap([
  'Supervised learning fits a model f(x; θ) to labelled examples by choosing its parameters θ.',
  'The loss scores the model; cross-entropy punishes confident wrong predictions hard.',
  'Gradient descent repeats θ ← θ − η∇L, and the learning rate η sets the step size.',
  'Features decide what a model can learn; in quantum models the encoding plays that role.',
  'Judge models on held-out test data: a large gap from the training accuracy means overfitting.',
  'A variational quantum model encodes x, applies a trainable circuit, measures ⟨Z⟩, and is trained classically.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'What does the loss function measure?', options: ['How wrong the model’s predictions are, averaged over the training examples', 'How many parameters the model has', 'How long training takes', 'The accuracy on the test set'], answer: 0,
        why: 'The loss is a single number that is small when the predictions match the labels. Training tries to make it as small as possible.' },
      { q: 'A red example gets p(red) = 0.1. What is its cross-entropy loss?', options: ['About 2.30', 'About 0.10', 'About 0.69', '0'], answer: 0,
        why: '−ln 0.1 ≈ 2.30. A confidently wrong prediction is expensive.' },
      { q: 'One gradient-descent step on L(θ) = (θ − 3)², starting from θ = 1 with η = 0.25, gives…', options: ['2', '1.5', '3', '0'], answer: 0,
        why: 'dL/dθ = 2(1 − 3) = −4, so θ ← 1 − 0.25 × (−4) = 2.' },
      { q: 'Training accuracy is 99% and test accuracy is 70%. What is the likely problem?', options: ['Overfitting', 'The learning rate is too small', 'The model is too simple', 'The test set is too large'], answer: 0,
        why: 'The model fits the training data far better than new data, so it has memorized rather than learned the pattern.' },
      { q: 'Why can logistic regression with the features x₁ and x₂ not classify the circle dataset?', options: ['Its decision boundary is a straight line, and no line separates the inside of a circle from the outside', 'It has too few training points', 'The learning rate is wrong', 'No model can learn a circle'], answer: 0,
        why: 'With the extra features x₁² and x₂², the same algorithm can draw a circle.' },
      { q: 'In a variational quantum classifier, what plays the role of the hand-picked features?', options: ['The encoding of x into a quantum state', 'The optimizer', 'The loss function', 'The number of shots'], answer: 0,
        why: 'The encoding decides which functions of x the circuit can compute, just as features do for a classical model.' }
    ]
  });

  /* ===================================================================== 7.2 */
  C.text('encoding', {
    lede: `Before a circuit can process x, x has to become a quantum state. The choice of encoding decides, more than anything else, what a quantum model can learn.`,
    html: `
${C.objectives([
  'Encode data with basis, angle and amplitude encoding, and know what each one costs',
  'Compute an angle-encoded state and its point on the Bloch sphere by hand',
  'Choose the scale of an encoding, and recognize when it is too small or too large',
  'Explain why a model with one encoding gate is a single sine wave in x',
  'Use re-uploading to give a model higher frequencies'
], ['qml', 'gates', 'tensor'])}

<h2>Three ways to load data</h2>
<p>An encoding, or <b>feature map</b>, is a circuit that turns an input into a state: x → |φ(x)⟩. The three basic options:</p>
${C.table(['Encoding', 'How it works', 'Qubits', 'Cost'], [
  ['Basis', 'bits become a basis state: x = 101 → |101⟩', 'one per bit', 'a few X gates'],
  ['Angle', 'each feature sets a rotation angle, such as Ry(x)', 'about one per feature', 'one rotation per feature'],
  ['Amplitude', 'a normalized list of 2ⁿ numbers becomes the 2ⁿ amplitudes', 'log₂ of the list length', 'in general about 2ⁿ gates']
])}
${C.worked('Angle-encode the point x = (0.5, −0.5)', [
  'The encoding used in this part sets the latitude from x₁ and the longitude from x₂: θ = π(x₁ + 1)/2 and φ = πx₂, applied as Ry(θ) and then Rz(φ) to |0⟩.',
  'θ = π × 1.5/2 = 3π/4, which is 135° down from the north pole, and φ = −π/2.',
  'The Bloch vector is (sin θ cos φ, sin θ sin φ, cos θ) ≈ (0, −0.707, −0.707).',
  'P(0) = (1 + z)/2 ≈ 0.15: the point sits below the equator, toward −y.'
], 'Every input in the square lands somewhere on the sphere, and nearby inputs land on nearby points.')}
${C.bench('enc-angle', 'Angle encoding puts data on the sphere', 'Hover a point to find it in both views')}
<p>The scale of the angles matters. Too small, and all the points crowd together near one pole, so no model can tell them apart. Too large, and the map wraps around the sphere, sending distant inputs to nearby states. Choosing the scale is the quantum version of choosing a kernel bandwidth (chapter ${ref('kernels')}).</p>
${C.worked('Amplitude-encode x = (0.8, −0.3, 0.5, 0.1)', [
  'Length: √(0.64 + 0.09 + 0.25 + 0.01) = √0.99 ≈ 0.995.',
  'Divide by it: (0.804, −0.302, 0.503, 0.101).',
  'These become the amplitudes of |00⟩, |01⟩, |10⟩ and |11⟩: four numbers stored in two qubits.'
], 'n qubits hold 2ⁿ numbers, an exponential saving in qubits. But the length 0.995 is lost, and preparing an arbitrary state generally takes about 2ⁿ gates, which can cancel the saving.')}
${C.bench('enc-amp', 'Amplitude encoding', 'Four numbers → two qubits')}

<h2>Entangling feature maps</h2>
<p>Angle encoding prepares each qubit on its own, so the encoded states are product states, which an ordinary computer handles easily. Feature maps that entangle the qubits can be much harder to imitate. A well-known example is the <b>ZZ feature map</b> of Havlíček and colleagues (2019): layers of H, single-qubit phases set by each feature, and two-qubit phases set by products of features such as (π − x₁)(π − x₂). Chapter ${ref('kernels')} uses it as a kernel.</p>

<h2>Models are Fourier series</h2>
<p>What can a model built on an angle encoding compute? Take the simplest case: one qubit, an encoding gate Rx(x), trainable gates before and after it, and a Z measurement at the end.</p>
${C.worked('Why one encoding gives a single frequency', [
  'Rx(x) = cos(x/2) I − i sin(x/2) X, so every amplitude of the final state is a combination of cos(x/2) and sin(x/2), with coefficients set by the trainable gates.',
  'The output ⟨Z⟩ multiplies pairs of amplitudes, so it contains cos²(x/2), sin²(x/2) and cos(x/2) sin(x/2).',
  'By the double-angle formulas these are (1 + cos x)/2, (1 − cos x)/2 and (sin x)/2.',
  'So f(x) = a + b cos x + c sin x for some numbers a, b and c: a single wave of frequency 1.'
], 'The trainable gates only choose a, b and c. They cannot make the model wiggle faster.')}
<p>To get faster wiggles, encode the same x again. With L encoding gates separated by trainable gates, the model is a Fourier series with frequencies 0, 1, …, L (Schuld, Sweke and Meyer, 2021). This is <b>data re-uploading</b>, and it lets even a single qubit represent complicated functions.</p>
${C.bench('enc-fourier', 'A random re-uploading model and its spectrum', 'The trainable gates are random; only the structure matters here')}
${C.deeper('Where the frequencies come from', `<p>Rx(x) = e<sup>−ixX/2</sup>, and X/2 has the eigenvalues +1/2 and −1/2, so each encoding gate multiplies each path through the circuit by e<sup>−ix/2</sup> or e<sup>+ix/2</sup> (chapter ${ref('interference')}). An expectation value combines one path with the complex conjugate of another, so each encoding gate contributes a frequency of −1, 0 or +1 to each term. With L gates the frequencies run from −L to L, and since f(x) is real, that means cos(kx) and sin(kx) for k = 0, 1, …, L. Generators with larger eigenvalues, or encodings on several qubits in parallel, widen the spectrum in the same way.</p>`)}
${C.pitfall('More qubits do not automatically mean a more powerful model', `<p>Encoding x₁ on one qubit and x₂ on another, once each, still gives a model with at most frequency 1 in each feature. Expressive power comes from how the data enters, meaning how often and through which gates, and from the trainable parts, not from the number of qubits alone.</p>`)}

${C.keyIdea('The encoding fixes the family of functions a quantum model can express. Angle encoding gives sines and cosines of x, and each extra re-upload adds a higher frequency.')}
${C.tryThis([
  'In the angle-encoding panel, set the scale to 2 and watch points from opposite corners of the square land on the same spot.',
  'Set the scale to 0.2. Why would any classifier struggle now?',
  'Raise L from 1 to 4 in the spectrum panel. How many nonzero bars are there?',
  'In amplitude encoding, set all four sliders equal. Which state do you get?',
  'On paper: angle-encode x = (−1, 0). Where on the sphere does it land?'
])}
${C.recap([
  'Basis encoding turns bits into basis states, angle encoding turns features into rotation angles, and amplitude encoding stores 2ⁿ numbers in 2ⁿ amplitudes at a high preparation cost.',
  'The scale of the angles must suit the data: too small crowds the points together, too large wraps them around.',
  'Entangling feature maps such as the ZZ map are harder to imitate classically.',
  'With one encoding gate a model is a + b cos x + c sin x; with L re-uploads it is a Fourier series up to frequency L.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'Which encoding stores 2ⁿ numbers in n qubits?', options: ['Amplitude encoding', 'Basis encoding', 'Angle encoding', 'None of them'], answer: 0,
        why: 'n qubits have 2ⁿ amplitudes, and amplitude encoding uses each of them for one number of a normalized list.' },
      { q: 'A one-qubit model has a single encoding gate Rx(x). What kind of function of x can it compute?', options: ['a + b cos x + c sin x', 'Any function of x', 'Only constants', 'Any polynomial in x'], answer: 0,
        why: 'One encoding gate gives frequencies 0 and 1 only, whatever the trainable gates do.' },
      { q: 'What does data re-uploading add to a model?', options: ['Higher frequencies in x', 'More qubits', 'Less noise', 'Exact gradients'], answer: 0,
        why: 'Each extra encoding of x adds the next frequency to the Fourier series the model can represent.' },
      { q: 'Why can angle encoding with a very large scale be harmful?', options: ['Distant inputs wrap around to nearby states', 'The circuit becomes deeper', 'The qubits become entangled', 'The gradients become exact'], answer: 0,
        why: 'The angle is periodic, so inputs whose angles differ by a full turn land on the same point.' },
      { q: 'With amplitude encoding of the vector (3, 4), what information is lost?', options: ['Its length 5: only the direction (0.6, 0.8) is stored', 'The signs of the entries', 'Nothing', 'The second entry'], answer: 0,
        why: 'A state must have length 1, so the vector is divided by its length before it is loaded.' },
      { q: 'What is the main practical cost of amplitude encoding?', options: ['Preparing an arbitrary state generally takes about 2ⁿ gates', 'It needs 2ⁿ qubits', 'It cannot represent negative numbers', 'It only works for binary data'], answer: 0,
        why: 'The qubit count is small, but the circuit that writes 2ⁿ arbitrary amplitudes is, in general, exponentially long.' }
    ]
  });

  /* ===================================================================== 7.3 */
  C.text('pqc', {
    lede: `A parameterized circuit followed by a measurement is a function f(x; θ). For one qubit you can see exactly what it computes: a plane slicing the Bloch sphere. This chapter builds that picture, then scales it up.`,
    html: `
${C.objectives([
  'Write a quantum model as f(x; θ) = ⟨φ(x, θ)|O|φ(x, θ)⟩ and turn it into a class prediction',
  'Compute a one-qubit model by hand',
  'See a one-qubit classifier as a plane through the Bloch sphere',
  'Explain why the boundary is curved in input space, and why XOR is out of reach',
  'Describe layered circuits, and the trade-off between expressibility and trainability'
], ['encoding', 'measure'])}

<h2>A model is an expectation value</h2>
${F('f(x; θ) = ⟨φ(x, θ)| O |φ(x, θ)⟩')}
<p>Here |φ(x, θ)⟩ is the state after the encoding and the trainable gates, and O is an observable, usually Z on the first qubit. With O = Z, f lies between −1 and 1. For classification, predict blue when f &gt; 0 and red when f &lt; 0, or turn f into a probability p(red) = (1 − f)/2 and train with the cross-entropy loss of chapter ${ref('qml')}. On hardware, f is estimated from shots, so every prediction carries shot noise of about 1/√N (chapter ${ref('measure')}).</p>
${C.worked('A one-qubit model by hand', [
  'Encode x with Ry(x) and follow it with one trainable gate Ry(θ). Rotations about the same axis add, so the state is Ry(x + θ)|0⟩ = cos((x + θ)/2)|0⟩ + sin((x + θ)/2)|1⟩.',
  'Measure Z: f = cos²((x + θ)/2) − sin²((x + θ)/2) = cos(x + θ).',
  'The boundary f = 0 lies where x + θ = ±π/2, so training θ slides the boundary along the x axis.',
  'With θ = π/2 − 0.3 ≈ 1.27, the boundary sits at x = 0.3: inputs a little below it are blue, inputs just above it are red.'
], 'Chapter 7.5 trains exactly this model, one step at a time.')}

<h2>One qubit: a plane through the sphere</h2>
<p>Now use the two-feature encoding of chapter ${ref('encoding')}, which places each input at a point r(x) on the sphere. Apply a trainable rotation, then measure Z. Rotating and then measuring Z is the same as measuring along a tilted axis n (chapter ${ref('measure')}), so</p>
${F('f(x) = n · r(x)')}
<p>The decision boundary f = 0 is the set of points on the sphere at right angles to n: a great circle, cut out by a <b>plane through the centre</b>. Training tilts the plane. It is a linear classifier on the sphere, just as logistic regression is linear in its features. Because the encoding is nonlinear, the boundary is curved when drawn back in the input square.</p>
${C.bench('pqc', 'A one-qubit classifier', 'Tilt the measurement axis by hand, or press Fit')}
${C.worked('Why this model cannot learn XOR', [
  'With this encoding, the XOR rule becomes: red where the height z and the coordinate y on the sphere have opposite signs, blue where they have the same sign.',
  'So the red points gather around two regions near (0, −1, 1)/√2 and (0, 1, −1)/√2, which are exactly opposite each other on the sphere.',
  'For opposite points r and −r, f = n·r and n·(−r) always have opposite signs. A plane through the centre therefore always puts opposite points on opposite sides.',
  'So the two red regions can never both be on the red side: no tilt of the plane works.'
], 'This is the quantum version of a straight line failing on XOR, the classic example of why models need more depth.')}

<h2>Scaling up: layers and entanglement</h2>
<p>Real models use several qubits. A common design, the <b>hardware-efficient ansatz</b>, alternates layers of single-qubit rotations with layers of entangling gates such as CZ or CNOT, and often re-uploads the data in every layer. The output can be ⟨Z⟩ on one qubit or an average of several such terms. Each extra layer adds parameters and lets the model represent more complicated functions.</p>
<p>This brings a tension that runs through the rest of Part VII. A more <b>expressive</b> circuit can represent more functions, but if it becomes expressive enough to look like a random unitary, its loss landscape goes flat and it can no longer be trained (chapter ${ref('plateaus')}). Good models are expressive enough for the problem, and no more.</p>
${C.pitfall('A quantum model is not automatically more powerful', `<p>Many small quantum models compute functions that an ordinary computer evaluates easily, such as the a + b cos x + c sin x of chapter ${ref('encoding')}. A quantum model is only interesting if it computes something useful that is hard to compute classically, and showing that is the hard part of research in this field.</p>`)}
${C.deeper('Counting parameters and circuit runs', `<p>A layer of Ry and Rz rotations on n qubits has 2n parameters, so L layers have 2nL. Each training step needs the derivative with respect to every parameter, which by the parameter-shift rule costs two circuit evaluations each (chapter ${ref('gradients')}), for every training example. With 100 examples, 24 parameters and 1,000 shots per evaluation, one step already takes 100 × 24 × 2 × 1,000 = 4.8 million shots.</p>`)}

${C.keyIdea('One qubit, one encoding, one measurement: the classifier is a plane through the Bloch sphere. Everything bigger is a way of bending that plane, at the risk of making it untrainable.')}
${C.tryThis([
  'Press Fit on the two clusters. Where does the measurement axis end up?',
  'Switch to XOR and press Fit. Which points stay misclassified, and why?',
  'Look at the input-space panel: why is the boundary curved, even though it is a plane on the sphere?',
  'On the circle data, how good does the best plane get?',
  'On paper: for the model f = cos(x + θ), find the θ that puts the boundary at x = 0.'
])}
${C.recap([
  'A quantum model is an expectation value f(x; θ) = ⟨φ(x, θ)|O|φ(x, θ)⟩; f &gt; 0 means blue and p(red) = (1 − f)/2.',
  'For one qubit, f(x) = n · r(x): the boundary is a plane through the centre of the Bloch sphere.',
  'The boundary is curved in the input square because the encoding is nonlinear.',
  'XOR needs more than one plane, because a plane through the centre always separates opposite points.',
  'Layers and entanglement add expressive power, at the risk of flat, untrainable landscapes.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'A model outputs f = ⟨Z⟩ = −0.6. What is p(red), and which class does it predict?', options: ['0.8, red', '0.2, blue', '0.6, red', '0.4, blue'], answer: 0,
        why: 'p(red) = (1 − f)/2 = 1.6/2 = 0.8, and f &lt; 0 predicts red.' },
      { q: 'For the encoding Ry(x), then Ry(θ), then a Z measurement, what is f?', options: ['cos(x + θ)', 'cos x · cos θ', 'sin(x + θ)', 'x + θ'], answer: 0,
        why: 'Two Ry rotations add up to Ry(x + θ), and ⟨Z⟩ for Ry(α)|0⟩ is cos α.' },
      { q: 'What does the decision boundary of a one-qubit classifier look like on the Bloch sphere?', options: ['A great circle cut out by a plane through the centre', 'A single point', 'A small circle around a pole', 'Any curve the training chooses'], answer: 0,
        why: 'f(x) = n · r(x), which is zero exactly on the plane through the centre at right angles to n.' },
      { q: 'Why can the one-qubit model not learn XOR?', options: ['The two red regions sit at opposite points of the sphere, and a plane through the centre always separates opposite points', 'It has too few training points', 'XOR data cannot be encoded', 'The learning rate is too small'], answer: 0,
        why: 'n·r and n·(−r) always have opposite signs, so opposite points always fall on opposite sides of the boundary.' },
      { q: 'What is the main risk of making the ansatz very expressive?', options: ['The loss landscape can become flat and untrainable', 'The circuit stops being unitary', 'It can only learn straight lines', 'It needs fewer shots'], answer: 0,
        why: 'Circuits that behave like random unitaries have barren plateaus (chapter 7.7).' },
      { q: 'How many circuit evaluations does a parameter-shift gradient need for a model with 10 parameters, on one input?', options: ['20', '10', '2', '100'], answer: 0,
        why: 'Two shifted evaluations per parameter: 2 × 10 = 20.' }
    ]
  });

  /* ===================================================================== 7.4 */
  C.text('gradients', {
    lede: `To train a circuit you need the slope of its output with respect to each angle. Quantum hardware can measure that slope exactly, with two extra runs of the same circuit.`,
    html: `
${C.objectives([
  'Explain why the output of a circuit is a sinusoid in each rotation angle',
  'Derive and use the parameter-shift rule',
  'Compare it with finite differences when there is shot noise',
  'Combine it with the chain rule, for the loss and for angles such as w·x + b',
  'Count the cost of a gradient in circuit runs'
], ['pqc', 'qml'])}

<h2>Why we need gradients</h2>
<p>Gradient descent (chapter ${ref('qml')}) needs ∂L/∂θ<sub>k</sub> for every parameter. The loss depends on θ only through the model outputs f(x; θ), so by the chain rule</p>
${F('∂L/∂θ<sub>k</sub> = (1/N) Σ<sub>examples</sub> (∂L/∂f) · (∂f/∂θ<sub>k</sub>)')}
<p>The factor ∂L/∂f is ordinary arithmetic on a classical computer. The factor ∂f/∂θ<sub>k</sub> is the hard part: f is an expectation value measured on a quantum computer, and nobody can look inside the circuit to differentiate it.</p>

<h2>Every angle traces a sinusoid</h2>
<p>Take any gate of the form e<sup>−iθP/2</sup>, where P is a Pauli matrix; Rx, Ry and Rz are all like this. As a function of that one angle, with everything else fixed, the expectation value is a pure sinusoid:</p>
${F('f(θ) = A + B cos θ + C sin θ')}
<p>for some numbers A, B and C that depend on the rest of the circuit. The reason is the one from chapter ${ref('encoding')}: the gate contributes only the frequencies −1, 0 and 1 to f.</p>
${C.worked('The simplest case', [
  'One qubit, the gate Ry(θ) applied to |0⟩, then a Z measurement: f(θ) = cos θ (chapter 7.3 with x = 0).',
  'Evaluate a quarter turn to either side: f(θ + π/2) = cos(θ + π/2) = −sin θ and f(θ − π/2) = cos(θ − π/2) = sin θ.',
  'Half their difference is (−sin θ − sin θ)/2 = −sin θ.',
  'The true derivative of cos θ is −sin θ. They agree exactly.'
], 'Two runs of the same circuit at shifted angles give the exact slope.')}

<h2>The parameter-shift rule</h2>
${F('∂f/∂θ = [ f(θ + π/2) − f(θ − π/2) ] / 2')}
<p>This is the <b>parameter-shift rule</b> (Mitarai and colleagues, 2018; Schuld and colleagues, 2019). It is exact, not an approximation, and it needs only the circuit you already have, run at two shifted angles.</p>
${C.deeper('Proof for any sinusoid', `<p>If f(θ) = A + B cos θ + C sin θ, then f(θ + π/2) = A − B sin θ + C cos θ and f(θ − π/2) = A + B sin θ − C cos θ. Half their difference is −B sin θ + C cos θ, which is exactly f′(θ). The shift π/2 is not small: the rule relies on f being a sinusoid, not on π/2 being close to 0.</p>`)}
${C.bench('ps', 'The landscape along one angle', 'Circuit: |0⟩ → Ry(0.9) → Rz(0.7) → Rx(θ) → measure Z')}

<h2>Why not finite differences?</h2>
<p>The usual numerical derivative is [f(θ + h) − f(θ − h)]/(2h) for a small step h. On hardware every f is estimated from N shots and carries noise of about 1/√N. A finite difference divides that noise by the tiny number 2h, so it explodes. The parameter-shift rule uses a large shift and divides by 2.</p>
${C.worked('The noise in the two estimates', [
  'Suppose each f is estimated from 1,000 shots, so each carries an error of up to about 0.03.',
  'Parameter shift: the difference of two estimates has an error of about √2 × 0.03 ≈ 0.045, and dividing by 2 leaves about 0.02.',
  'Finite difference with h = 0.01: the same 0.045, divided by 2h = 0.02, is about 2.2, far larger than the gradient itself.'
], 'With shots, finite differences need a step so small that the noise swamps the signal. The parameter-shift rule does not.')}
${C.bench('ps-noise', 'Repeat both gradient estimates 300 times', 'Same shots for both estimators')}

<h2>Angles that depend on the data</h2>
<p>In the classifier of chapter ${ref('train')}, a gate angle is w·x + b, with a trainable weight w and bias b. The parameter-shift rule gives the derivative with respect to the whole angle, and the chain rule does the rest: ∂f/∂b = ∂f/∂(angle) and ∂f/∂w = x · ∂f/∂(angle). If the same parameter appears in several gates, add up the contributions from each gate.</p>

<h2>The cost</h2>
<p>Each gate angle needs two circuit evaluations per training example, and each evaluation needs many shots. A model with G angles and N training examples costs about 2GN circuit runs per gradient step. Simulators avoid this with <b>backpropagation</b>, the method used for neural networks, which gets every derivative for about the cost of one extra pass. Hardware cannot do that, because the intermediate quantum states cannot be stored and read out. Cheaper ways to estimate gradients are an active research topic.</p>
${C.pitfall('The shift is π/2 only for these gates', `<p>The rule as written holds for gates e<sup>−iθP/2</sup> with a Pauli matrix P, whose generator P/2 has the eigenvalues ±1/2. Gates with other generators need different shifts or more evaluations; a controlled rotation, for example, needs a four-term rule. Libraries such as PennyLane handle this automatically.</p>`)}

${C.keyIdea('Every rotation angle traces a sinusoid, so its exact slope is half the difference of two shifted evaluations. That makes gradients measurable on real hardware, at the price of many circuit runs.')}
${C.tryThis([
  'Move θ to a peak of the curve. What does the parameter-shift rule give there?',
  'Switch to 100 shots and press "Re-sample" several times. How much does the estimate move?',
  'In the second panel, compare the spread of the two estimators at 10,000 shots and at 100 shots.',
  'On paper: apply the rule to f(θ) = 0.3 + 0.5 cos θ − 0.2 sin θ at θ = 1, and check it against the derivative.'
])}
${C.recap([
  'The chain rule splits ∂L/∂θ into a classical factor ∂L/∂f and a quantum factor ∂f/∂θ.',
  'For a gate e<sup>−iθP/2</sup>, the output is f(θ) = A + B cos θ + C sin θ.',
  'Parameter-shift rule: ∂f/∂θ = [f(θ + π/2) − f(θ − π/2)]/2, exactly.',
  'Finite differences amplify shot noise by about 1/h; the parameter-shift rule does not.',
  'A gradient step costs about 2 × (gate angles) × (examples) circuit runs, each with many shots.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'For a Pauli rotation, the parameter-shift rule computes ∂f/∂θ as…', options: ['[f(θ + π/2) − f(θ − π/2)] / 2', '[f(θ + h) − f(θ)] / h for a small h', 'f(θ) · cos θ', 'Backpropagation through the hardware'], answer: 0,
        why: 'The output is a sinusoid in θ, so two evaluations a quarter turn to either side give the exact slope.' },
      { q: 'For f(θ) = cos θ at θ = 0, what does the rule give?', options: ['0', '1', '−1', '1/2'], answer: 0,
        why: '[cos(π/2) − cos(−π/2)]/2 = (0 − 0)/2 = 0, matching −sin 0 = 0: θ = 0 is the top of the curve.' },
      { q: 'Why are finite differences a bad idea on hardware?', options: ['Shot noise is divided by the tiny step and swamps the gradient', 'They are harder to write down', 'They need entangling gates', 'They only work for one qubit'], answer: 0,
        why: 'Each estimate has noise of about 1/√N, and dividing by 2h with h small amplifies it enormously.' },
      { q: 'A gate angle is w·x + b. How do you get ∂f/∂w?', options: ['Multiply the derivative with respect to the angle by x', 'Shift w itself by π/2', 'It is always zero', 'Use finite differences'], answer: 0,
        why: 'By the chain rule, ∂(angle)/∂w = x, so ∂f/∂w = x · ∂f/∂(angle).' },
      { q: 'A model has 20 gate angles and 50 training examples. About how many circuit evaluations does one full gradient take?', options: ['2,000', '20', '100', '1,000,000'], answer: 0,
        why: '2 × 20 × 50 = 2,000 evaluations, each needing many shots.' },
      { q: 'Why can simulators use backpropagation but hardware cannot?', options: ['Hardware cannot store and read out the intermediate quantum states', 'Hardware has too few qubits', 'Backpropagation needs complex numbers', 'Simulators cannot compute expectation values'], answer: 0,
        why: 'Backpropagation reuses stored intermediate results. On hardware, reading a state means measuring it, which destroys it.' }
    ]
  });

  /* ===================================================================== 7.5 */
  C.text('train', {
    lede: `Everything so far, working together: first a single training step worked out number by number, then a full classifier with re-uploading, entanglement, a cross-entropy loss and parameter-shift gradients, trained live in your browser.`,
    html: `
${C.objectives([
  'Follow one training step of a quantum model with every number shown',
  'Describe the classifier: re-uploading layers, CZ entanglers and a Z measurement',
  'Read loss and accuracy curves, and spot underfitting and overfitting',
  'See how shot noise changes training',
  'Choose the number of layers and qubits for a dataset by experiment'
], ['gradients', 'pqc', 'qml'])}

<h2>One step, every number</h2>
<p>Start with the smallest possible model: one qubit, the encoding Ry(x), one trainable gate Ry(θ) and a Z measurement, so f(x; θ) = cos(x + θ) (chapter ${ref('pqc')}). The data are seven points on a line, four blue on the left and three red on the right. One training step does this:</p>
<ol>
  <li><b>Forward pass.</b> For each point, run the circuit and estimate f = ⟨Z⟩. Here f is computed exactly.</li>
  <li><b>Loss.</b> Turn f into p(red) = (1 − f)/2 and average the cross-entropy over the points.</li>
  <li><b>Gradient.</b> For each point, run the circuit at θ + π/2 and θ − π/2 to get ∂f/∂θ, and multiply by ∂L/∂f from the loss formula.</li>
  <li><b>Update.</b> θ ← θ − η · dL/dθ.</li>
</ol>
${C.bench('one-step', 'One training step, every number shown', 'Press "Take one step" and follow the numbers')}
${C.worked('The first step, from θ = 0', [
  'At θ = 0 the model is f = cos x, which is positive for every point here, so all seven points are predicted blue and the three red points are wrong.',
  'The average loss is about 0.80.',
  'The gradient works out to dL/dθ ≈ −1.10, so increasing θ lowers the loss.',
  'With η = 0.6, θ becomes 0 − 0.6 × (−1.10) ≈ 0.66. Repeating the step, θ settles near 1.28, which puts the boundary at x = π/2 − 1.28 ≈ 0.29, between the last blue point and the first red one.'
], 'That is the whole training algorithm. The bigger classifier below does exactly the same, with more parameters.')}

<h2>The full classifier</h2>
<p><b>The model.</b> Each layer applies, on every qubit, Ry(w₁x₁ + b₁), then Rz(w₂x₂ + b₂), then Ry(b₃), followed by a CZ between the two qubits in the two-qubit model. The weights w and biases b are trainable, so every layer re-uploads the data with its own scaling (chapter ${ref('encoding')}). The output is f(x) = ⟨Z⟩ on q0, and p(red) = (1 − f)/2.</p>
<p><b>The training.</b> Cross-entropy loss, the Adam optimizer (a version of gradient descent that adapts the step size of each parameter), and full-batch gradients from the parameter-shift rule: for every data point, every gate angle is evaluated at ±π/2. The counter shows how many circuit evaluations that costs. With shots switched on, every evaluation carries realistic sampling noise.</p>
${C.bench('tr', 'Quantum classifier lab', 'Filled dots: training set · hollow: test set · hover a dot to see its final state')}
${C.worked('Counting the cost', [
  'One qubit with three layers has 9 rotation gates and 15 parameters: w₁, b₁, w₂, b₂ and b₃ in each layer.',
  'Each example needs one forward run plus two shifted runs per gate: 1 + 2 × 9 = 19 circuit evaluations.',
  'With 80 training examples, one epoch costs 80 × 19 = 1,520 evaluations, and 300 epochs cost 456,000.',
  'At 1,000 shots per evaluation, that is about 456 million shots.'
], 'This is why training on real hardware is slow and expensive, and why most quantum machine learning research runs on simulators.')}
<p>Read the curves as you would for any machine-learning model. If both training and test accuracy stay low, the model is too simple, which is called <b>underfitting</b>: add layers. If training accuracy keeps rising while test accuracy stalls or falls, it is <b>overfitting</b>. Hover over a data point to see the final state of q0 for that input: the classifier works by steering each input’s Bloch vector into the upper or lower half of the sphere.</p>
${C.pitfall('Shot noise changes how training behaves', `<p>With shots switched on, every loss value and every gradient is a random estimate. The loss curve turns jagged, and training stalls once the true gradient is smaller than the noise in its estimate. More shots, a smaller learning rate or averaging over steps all help, at extra cost.</p>`)}
${C.deeper('What Adam does', `<p>Adam keeps running averages of each parameter’s gradient and of its square. It moves each parameter by its average gradient divided by the square root of its average squared gradient, times the learning rate. Parameters whose gradients are consistently large get proportionally smaller steps, and noisy gradients are damped, which makes training less sensitive to the choice of learning rate. Most quantum machine learning code uses Adam or a close relative.</p>`)}

${C.keyIdea('A quantum classifier is trained exactly like a neural network, except that every forward pass is a measurement and every gradient costs two more circuit runs per gate angle.')}
${C.tryThis([
  'In the one-step panel, set η to 2 and take a few steps. What happens to θ and to the loss?',
  'XOR with 1 qubit and 1 layer: why does it fail? Add layers until it works.',
  'Circle with 2 qubits and 3 layers: compare training and test accuracy. Is it overfitting?',
  'Switch to 100 shots. What happens to the loss curve, and to the number of useful epochs?',
  'Moons with 1 qubit: what is the smallest number of layers that reaches 95% test accuracy?'
])}
${C.recap([
  'A training step is a forward pass, the loss, a parameter-shift gradient and an update.',
  'The classifier re-uploads (x₁, x₂) in every layer through trainable angles w·x + b, and measures ⟨Z⟩ on q0.',
  'Each example costs 1 + 2 × (number of gate angles) circuit evaluations per epoch.',
  'Low accuracy everywhere means underfitting; a gap between training and test means overfitting.',
  'Shot noise makes the loss jagged and can stall training when the gradients are small.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'In the one-step model f = cos(x + θ), what does increasing θ do to the decision boundary?', options: ['Moves it to smaller x', 'Moves it to larger x', 'Leaves it where it is', 'Removes it'], answer: 0,
        why: 'The boundary sits at x = π/2 − θ, so a larger θ moves it to the left.' },
      { q: 'Which four parts make up one training step?', options: ['Forward pass, loss, gradient, update', 'Encode, measure, discard, repeat', 'Initialize, entangle, measure, stop', 'Shuffle, encode, decode, compare'], answer: 0,
        why: 'Every gradient-based training loop, classical or quantum, repeats these four parts.' },
      { q: 'A model reaches 98% training accuracy and 70% test accuracy. What should you try?', options: ['A simpler model, fewer layers, or more data', 'More layers', 'A larger learning rate', 'Fewer test points'], answer: 0,
        why: 'The gap means overfitting. Reducing the model’s capacity or adding data helps; adding layers makes it worse.' },
      { q: 'Why does each example need 1 + 2G circuit evaluations per epoch?', options: ['One forward run, plus two shifted runs for each of the G gate angles', 'One run per parameter', 'One run per qubit', 'Two runs in total'], answer: 0,
        why: 'The forward run gives the loss; the parameter-shift rule needs f at θ ± π/2 for every gate angle.' },
      { q: 'Why does the two-qubit model need its CZ gates?', options: ['Without them, q1 could never affect the measured qubit q0, and the second qubit would be wasted', 'To measure both qubits', 'To make the circuit unitary', 'To remove shot noise'], answer: 0,
        why: 'Only an entangling gate lets information from q1 reach q0, where the output is measured.' },
      { q: 'What does shot noise do to training?', options: ['Makes every loss and gradient a random estimate, so curves are jagged and small gradients get lost', 'Nothing at all', 'Makes training faster', 'Makes the gradients exact'], answer: 0,
        why: 'Each estimate has noise of about 1/√N, which hides any gradient smaller than that.' }
    ]
  });

  /* ===================================================================== 7.6 */
  C.text('kernels', {
    lede: `Instead of training the circuit, use it only to compare data points. The overlap of two encoded states is a kernel, and a classical kernel method does the learning.`,
    html: `
${C.objectives([
  'Explain what a kernel is and how a kernel method makes predictions',
  'Compute a quantum kernel from an encoding, and say how to estimate it on hardware',
  'See how the bandwidth controls underfitting and overfitting',
  'Compare the angle-encoding kernel with the ZZ feature map',
  'Explain exponential concentration, the kernel version of barren plateaus'
], ['encoding', 'qml', 'bloch'])}

<h2>Similarity instead of parameters</h2>
<p>A <b>kernel</b> k(x, x′) is a number that says how similar two inputs are. A kernel method predicts at a new point by comparing it with every training point and taking a weighted vote:</p>
${F('f(x) = Σ<sub>i</sub> α<sub>i</sub> k(x, x<sub>i</sub>)')}
<p>Training only chooses the weights α<sub>i</sub>, one per training point. It is a convex problem with a single best answer, which a classical computer solves directly. Kernel ridge regression, used here, solves (K + λI)α = y, where K is the matrix of kernel values between training points and λ is a small regularization constant. Support-vector machines are the other common choice.</p>
${C.worked('Predicting with three training points', [
  'Three training points x₁, x₂, x₃ have weights α = (0.8, −0.5, 0.6).',
  'A new point x has similarities k(x, x₁) = 0.9, k(x, x₂) = 0.2 and k(x, x₃) = 0.1.',
  'f(x) = 0.8 × 0.9 − 0.5 × 0.2 + 0.6 × 0.1 = 0.72 − 0.10 + 0.06 = 0.68.',
  'f &gt; 0, so the prediction is the class that the positive weights stand for, the class of x₁, which x most resembles.'
], 'Every prediction is a similarity-weighted vote of the training data.')}

<h2>The quantum kernel</h2>
<p>A quantum kernel uses an encoding x → |φ(x)⟩ and measures similarity as the overlap of the encoded states (chapter ${ref('bloch')}):</p>
${F('k(x, x′) = |⟨φ(x)|φ(x′)⟩|²')}
<p>On hardware it is estimated by preparing |φ(x)⟩, undoing the encoding of x′, and measuring: run U(x′)†U(x) on |0…0⟩ and count how often every qubit returns 0. The probability of that outcome is exactly |⟨φ(x′)|φ(x)⟩|², so the fraction of shots estimates the kernel. The circuit only computes similarities. No circuit parameters are trained, so the training itself has no barren plateaus.</p>
${C.worked('The kernel of angle encoding for one feature', [
  'Encode x as Ry(cπx)|0⟩ = cos(cπx/2)|0⟩ + sin(cπx/2)|1⟩, where the scale c is called the bandwidth.',
  'The overlap of two such states is cos(cπx/2) cos(cπx′/2) + sin(cπx/2) sin(cπx′/2) = cos(cπ(x − x′)/2).',
  'So k(x, x′) = cos²(cπ(x − x′)/2): it is 1 when x = x′ and falls as the points move apart.',
  'With several features, each encoded on its own qubit, the kernel is the product of one such factor per feature.'
], 'This kernel is easy to compute classically. Entangling feature maps give kernels that, for many qubits, are believed to be hard.')}
${C.bench('kernel-1d', 'A kernel model in one dimension', 'Change the bandwidth and the number of copies')}
<p>In this panel the training points are blue in the middle and red at the edges. Each training point contributes a bump α<sub>i</sub> k(x, x<sub>i</sub>), and the model is the sum of the bumps. Encoding x on several qubits multiplies the kernel by itself, which makes the bumps narrower. A narrow kernel can follow fine detail but treats every point as unlike the others; a wide kernel gives smooth, simple models.</p>

<h2>Two feature maps on real data</h2>
<ul>
  <li><b>Angle encoding</b> gives k = Π<sub>i</sub> cos²(cπ(x<sub>i</sub> − x<sub>i</sub>′)/2), a smooth kernel that is easy to compute classically.</li>
  <li>The <b>ZZ feature map</b> (Havlíček and colleagues, 2019) first turns each feature into an angle φ<sub>i</sub> = cπ(x<sub>i</sub> + 1). Each of its two repetitions applies H to both qubits, a phase P(2φ<sub>i</sub>) to each, and an entangling phase φ₁₂ = 2(π − φ₁)(π − φ₂) between them, built from CNOT, P and CNOT. For many qubits its kernel is believed to be hard to compute classically.</li>
</ul>
${C.bench('kr', 'Kernel lab', 'Click a training point to see its similarity to everything else')}
<p>The kernel matrix on the left shows k between every pair of training points, sorted by class. A useful kernel shows two bright blocks along the diagonal, because points of the same class look similar, and dim blocks off the diagonal, because points of different classes look different.</p>

<h2>Bandwidth and exponential concentration</h2>
<p>Scaling the inputs by c changes how quickly similarity decays. With too large a c, every point looks unrelated to every other: the kernel matrix approaches the identity, and the model memorizes the training points without generalizing. With many qubits this goes further. For typical feature maps, the kernel values between different points become exponentially small in the number of qubits, an effect called <b>exponential concentration</b> (Thanasilp and colleagues, 2024). Estimating such tiny values from shots needs exponentially many measurements, so the estimated kernel looks like the identity whatever the data. This is the kernel counterpart of barren plateaus, and tuning the bandwidth is the first remedy (Shaydulin and Wild, 2022).</p>
${C.pitfall('A kernel that is hard to compute is not automatically a good one', `<p>Being hard to simulate classically is necessary for a quantum advantage, but it is not enough. The kernel also has to measure similarity in a way that matches the structure of the problem. A random-looking kernel that is hard to compute usually generalizes worse than a simple classical one.</p>`)}
${C.deeper('Why the kernel picture covers variational models too', `<p>A variational model f(x) = ⟨φ(x)|U(θ)†OU(θ)|φ(x)⟩ is a linear function of the matrix |φ(x)⟩⟨φ(x)|, with coefficients set by θ. Kernel methods with the quantum kernel search over all such linear functions at once and find the best one directly. So on the training data, the best kernel model is at least as good as any variational model built on the same encoding (Schuld, 2021). Variational models can still win in practice, because a kernel method needs the kernel between every pair of training points, which becomes expensive for large datasets.</p>`)}

${C.keyIdea('A quantum kernel uses the circuit only to measure similarity. Training becomes convex and free of plateaus, but the kernel must be well scaled, or every point looks unlike every other.')}
${C.tryThis([
  'In the one-dimensional panel, start at c = 0.6 with 2 qubits, then raise the number of copies to 8. When does the model start to memorize?',
  'Set c to 2 with 1 qubit. Why do points a distance 1 apart look identical?',
  'ZZ feature map on the circle data: raise c from 0.25 to 1.5 and watch training and test accuracy separate.',
  'Compare the kernel matrices of the two feature maps at c = 0.5. Which shows a cleaner two-block structure?',
  'Click a point near the class boundary. Which points does the kernel consider similar?'
])}
${C.recap([
  'A kernel method predicts with f(x) = Σ α<sub>i</sub> k(x, x<sub>i</sub>), and training the weights is convex.',
  'A quantum kernel is k(x, x′) = |⟨φ(x)|φ(x′)⟩|², estimated by running U(x′)†U(x) and counting all-zero outcomes.',
  'Angle encoding gives a product of cos² factors; entangling feature maps can be hard to compute classically.',
  'The bandwidth trades smoothness against memorization.',
  'With many qubits, kernel values can concentrate exponentially: the kernel version of barren plateaus.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'How is a quantum kernel value k(x, x′) defined?', options: ['|⟨φ(x)|φ(x′)⟩|², the overlap of the encoded states', '⟨Z⟩ of a trained ansatz', 'A classical Gaussian kernel', 'The number of CNOTs in the circuit'], answer: 0,
        why: 'The kernel is the fidelity between the two encoded states.' },
      { q: 'How is k(x, x′) estimated on hardware?', options: ['Run U(x′)†U(x) on |0…0⟩ and count how often every qubit returns 0', 'Measure ⟨Z⟩ after U(x)', 'Train a variational circuit', 'Use the parameter-shift rule'], answer: 0,
        why: 'The probability of the all-zeros outcome is |⟨0…0|U(x′)†U(x)|0…0⟩|² = |⟨φ(x′)|φ(x)⟩|².' },
      { q: 'What is trained in a kernel method?', options: ['The weights α<sub>i</sub>, one per training point, by a convex classical optimization', 'The rotation angles of the circuit', 'The number of qubits', 'Nothing at all'], answer: 0,
        why: 'The circuit is fixed; only the classical weights of the vote are fitted.' },
      { q: 'For one-feature angle encoding with c = 1, what is k(0.2, 0.2)?', options: ['1', '0', '1/2', 'cos(0.2)'], answer: 0,
        why: 'Every state has overlap 1 with itself: cos²(0) = 1.' },
      { q: 'The kernel matrix looks almost like the identity. What is happening?', options: ['Every point looks unlike every other: the bandwidth is too large and the model memorizes', 'The kernel is perfect', 'The data are linearly separable', 'There are too few qubits'], answer: 0,
        why: 'Off-diagonal similarities near 0 mean the model has nothing to generalize from.' },
      { q: 'What is exponential concentration?', options: ['Kernel values between different inputs shrinking exponentially with the number of qubits', 'Training data clustering in one corner', 'Gradients growing exponentially', 'Shot noise disappearing'], answer: 0,
        why: 'Tiny kernel values cannot be resolved from a reasonable number of shots, so the kernel carries no usable information.' }
    ]
  });

  /* ===================================================================== 7.7 */
  C.text('plateaus', {
    lede: `For large random circuits the loss landscape becomes exponentially flat: gradients vanish, and an optimizer working from finite shots sees only noise. This is the central obstacle to scaling variational quantum machine learning.`,
    html: `
${C.objectives([
  'Explain what a barren plateau is and why it makes training impossible',
  'Read the experiment: gradient variance against the number of qubits',
  'Explain why global costs plateau sooner than local costs',
  'List the causes and the known remedies',
  'Describe the open question linking trainability and classical simulation'
], ['gradients', 'train', 'noise'])}

<h2>Flat landscapes</h2>
<p>Gradient descent needs a slope to follow. McClean and colleagues (2018) showed that for sufficiently deep random parameterized circuits, the gradient of the cost is zero on average, and its typical size, measured by its variance, shrinks exponentially as qubits are added. The landscape is flat almost everywhere, and the useful valleys take up an exponentially small part of it. This is a <b>barren plateau</b>.</p>
${C.worked('Why a tiny gradient is a practical wall', [
  'Suppose the typical gradient on 30 qubits is about 2⁻¹⁵ ≈ 3 × 10⁻⁵.',
  'An estimate from N shots has noise of about 1/√N.',
  'To see a slope of 3 × 10⁻⁵ above that noise, 1/√N must be well below 3 × 10⁻⁵, so N must run into the billions, for every gradient component at every step.'
], 'With a realistic shot budget, the optimizer sees only noise and wanders at random.')}

<h2>The experiment</h2>
<p>Below, your browser runs the experiment. It draws random circuits with Ry and Rz on every qubit and a ladder of CZ gates, computes the gradient of the first angle with the parameter-shift rule, and measures the variance of that gradient over many random draws. Two costs are compared:</p>
<ul>
  <li><b>Global cost:</b> the probability that all n qubits read 0. It checks every qubit at once.</li>
  <li><b>Local cost:</b> the average, over the qubits, of the probability that each one reads 0.</li>
</ul>
${C.bench('bp', 'Gradient variance versus number of qubits', 'Runs in your browser; larger depths take a few seconds')}
<p>On a logarithmic axis, exponential decay is a straight line sloping down. The global cost’s line falls steeply from the start. For shallow circuits the local cost decays much more slowly, until the circuit is deep enough to scramble everything.</p>

<h2>Why global costs are worse</h2>
<p>The global cost asks whether all n qubits are 0 at once. For a scrambled state that probability is about 1/2ⁿ, and changing one angle can only move it by a similarly tiny amount. A local cost looks at one qubit at a time, and in a shallow circuit only a few nearby gates can influence any one qubit, so its gradient stays reasonably large (Cerezo and colleagues, 2021).</p>
${C.bench('bp-slice', 'What a flat landscape looks like', 'The global cost along the first angle, for one random circuit')}

<h2>Causes and remedies</h2>
${C.table(['Cause', 'Why it flattens the landscape', 'What helps'], [
  ['Deep, very expressive circuits', 'they behave like random unitaries, which spread every state evenly', 'shallow circuits; structured, problem-inspired designs'],
  ['Global cost functions', 'they ask about all the qubits at once', 'local costs that look at a few qubits'],
  ['Entangling data encodings', 'they scramble the information before training starts', 'gentler encodings that respect the problem’s structure'],
  ['Hardware noise', 'it pushes every state toward the maximally mixed state, where every cost is flat', 'shorter circuits, error mitigation, better hardware'],
  ['Random initial angles', 'they start the search in the flat part', 'starting near the identity, or training layer by layer'],
  ['No symmetry', 'the circuit explores a needlessly huge space', 'circuits that build in the symmetries of the problem']
])}

<h2>An open question</h2>
<p>Recent work argues that the circuits we can prove free of barren plateaus often turn out to be efficiently simulable on classical computers, because the same structure that keeps the gradients large also lets a classical computer predict them (Cerezo and colleagues, 2025). Whether there are variational models that are both trainable and hard to simulate classically, for useful problems, is one of the central open questions of the field. Gradient-free training does not escape the problem on its own: a flat landscape is flat for any optimizer that estimates the cost from shots.</p>
${C.pitfall('Plateaus are not local minima', `<p>A local minimum is a valley that is not the deepest one. An optimizer can get stuck there, but at least it sees a slope on the way down. A barren plateau has no visible slope at all, so the optimizer cannot even tell which way to go. Different problems need different remedies.</p>`)}
${C.deeper('Where the exponential comes from', `<p>A circuit deep enough to act like a random unitary spreads any input state evenly over all 2ⁿ basis states. Expectation values in such random states cluster tightly around their average, and the spread shrinks exponentially with n. This is the same effect that makes random kernel values concentrate in chapter ${ref('kernels')}. A gradient is a difference of two such expectation values (the parameter-shift rule), so its spread shrinks exponentially as well.</p>`)}

${C.keyIdea('Barren plateaus are about concentration: at scale, random circuits give nearly the same cost everywhere. Trainable quantum models need structure, locality and shallow depth, and whether those leave room for a quantum advantage is still an open question.')}
${C.tryThis([
  'Run the experiment with 2 layers, then with 20. How does the local-cost line change?',
  'Read the per-qubit shrink factor of the global cost. About how many qubits does it take for the variance to fall a millionfold?',
  'In the slice panel, compare the two curves. Why does the 10-qubit one look flat?',
  'Why might starting every trainable angle at 0, so that the circuit begins as the identity, help?'
])}
${C.recap([
  'In a barren plateau the variance of the gradient shrinks exponentially with the number of qubits.',
  'Shot noise then hides the gradient: resolving it needs exponentially many shots.',
  'Global costs plateau sooner than local costs; deep, random-like circuits plateau whatever you measure.',
  'Remedies: shallow, structured circuits, local costs, gentle encodings, careful initialization and less noise.',
  'Whether trainable models can also be hard to simulate classically is an open question.'
])}
${C.quizSection()}`,
    quiz: [
      { q: 'A barren plateau means…', options: ['gradients vanish exponentially as qubits are added', 'the loss has many local minima', 'the circuit is too shallow to learn', 'the data were not normalized'], answer: 0,
        why: 'The variance of the gradient decays exponentially with n, so the landscape looks flat from any realistic number of shots.' },
      { q: 'Why can an optimizer not simply follow a tiny gradient?', options: ['Shot noise of about 1/√N hides it unless N is enormous', 'Tiny gradients point the wrong way', 'Optimizers ignore small numbers', 'The parameter-shift rule fails for small gradients'], answer: 0,
        why: 'A gradient of size g needs roughly 1/g² shots per estimate before it stands out from the noise.' },
      { q: 'In a shallow circuit, which cost is more likely to plateau?', options: ['The global cost: the probability that all qubits read 0', 'A local cost on one qubit', 'They behave the same', 'Neither ever plateaus'], answer: 0,
        why: 'The global cost depends on every qubit at once and is about 1/2ⁿ for scrambled states.' },
      { q: 'Which change does not help against barren plateaus?', options: ['Making the circuit deeper and more random', 'Using a local cost', 'Starting near the identity', 'Using a structured, problem-inspired design'], answer: 0,
        why: 'Deeper, more random circuits are exactly what produces plateaus.' },
      { q: 'How does hardware noise affect the landscape?', options: ['It pushes states toward the maximally mixed state, which flattens the cost', 'It makes gradients larger', 'It has no effect on gradients', 'It removes local minima'], answer: 0,
        why: 'Every cost is the same for the maximally mixed state, so noise drives the landscape toward a constant.' },
      { q: 'Does gradient-free optimization escape barren plateaus?', options: ['No: a flat landscape is flat for any optimizer that estimates the cost from shots', 'Yes, always', 'Only for global costs', 'Only on simulators'], answer: 0,
        why: 'Any optimizer compares cost estimates, and on a plateau the differences are buried in shot noise.' }
    ]
  });

  /* ===================================================================== 7.8 */
  C.text('next', {
    lede: `You now have the visual intuition for circuits and the vocabulary of quantum machine learning. Here is how to turn that into working code and research.`,
    html: `
<h2>A path from here</h2>
<ol>
  <li><b>Consolidate.</b> Redo the "Try this" boxes and the quizzes without looking, and rebuild each Circuit Lab example from memory.</li>
  <li><b>Write your own simulator</b>, starting from the one below. Check it against the Circuit Lab and its Qiskit export.</li>
  <li><b>Re-implement the classifier</b> from chapter ${ref('train')} in PennyLane, below. Then swap in the ZZ feature map with a precomputed-kernel support-vector machine from scikit-learn.</li>
  <li><b>Read the limits literature</b> (barren plateaus, kernel concentration, dequantization) before choosing a problem, so you know which claims hold up.</li>
  <li><b>Pick a research angle.</b> Open directions include circuits as reinforcement-learning policies, gradient-free training and architecture search for circuits, quantum continual learning, kernels designed around a problem’s structure, and learning from genuinely quantum data.</li>
</ol>

<h2>Your own state-vector simulator</h2>
<p>About thirty lines of NumPy. The state of n qubits is an array of 2ⁿ amplitudes. Reshaping it into n axes of size 2 gives one axis per qubit, and a single-qubit gate becomes a 2 × 2 matrix applied along one axis. That is exactly the pairs-of-amplitudes rule of chapter ${ref('tensor')}.</p>
${C.bench('np-sim', 'A state-vector simulator in NumPy')}
<p>Extensions to try: a general controlled gate, measurement with collapse, the parameter-shift gradient, and finally the classifier of chapter ${ref('train')}. Compare every result with the panels in this course.</p>

<h2>The classifier from chapter 7.5, in PennyLane</h2>
<p>Same circuit, same loss, same optimizer. The option <code>diff_method="parameter-shift"</code> makes PennyLane compute gradients the way hardware would.</p>
<div data-code></div>

<h2>Tools</h2>
<ul>
  <li><a href="https://pennylane.ai" target="_blank" rel="noopener">PennyLane</a>: differentiable quantum programming, with many tutorials on quantum machine learning.</li>
  <li><a href="https://github.com/Qiskit/qiskit" target="_blank" rel="noopener">Qiskit</a> and <a href="https://github.com/qiskit-community/qiskit-machine-learning" target="_blank" rel="noopener">Qiskit Machine Learning</a>: circuits, compilation and hardware access. The Circuit Lab exports Qiskit code.</li>
  <li><a href="https://www.tensorflow.org/quantum" target="_blank" rel="noopener">TensorFlow Quantum</a> and <a href="https://github.com/mit-han-lab/torchquantum" target="_blank" rel="noopener">TorchQuantum</a>: quantum layers inside classical deep-learning frameworks.</li>
  <li><a href="https://algassert.com/quirk" target="_blank" rel="noopener">Quirk</a>: a fast drag-and-drop circuit simulator for quick experiments.</li>
</ul>

<h2>Reading list</h2>
<div data-refs></div>
${C.quizSection('Final review: the whole course')}`,
    quiz: [
      { q: 'What is the probability of measuring 1 for the state 0.6|0⟩ + 0.8i|1⟩?', options: ['0.64', '0.8', '0.36', '0.8i'], answer: 0,
        why: 'P(1) = |0.8i|² = 0.64 (chapter 1.1).' },
      { q: 'Which pair of states can a single measurement tell apart perfectly?', options: ['|+⟩ and |−⟩', '|0⟩ and |+⟩', '|+⟩ and |+i⟩', '|0⟩ and (|0⟩ + |1⟩)/√2'], answer: 0,
        why: 'They are orthogonal: opposite points on the Bloch sphere (chapter 1.3). An X-basis measurement separates them every time.' },
      { q: 'H on q0 and then CNOT from q0 to q1, applied to |00⟩, produce…', options: ['the Bell state (|00⟩ + |11⟩)/√2', '|+⟩|+⟩', '|11⟩', '(|00⟩ + |10⟩)/√2'], answer: 0,
        why: 'H makes (|00⟩ + |10⟩)/√2, and the CNOT turns |10⟩ into |11⟩ (chapter 3.2).' },
      { q: 'Why does Grover’s algorithm get worse after about (π/4)√N rounds?', options: ['Each round is a rotation, and further rounds turn past the answer', 'The oracle wears out', 'Noise builds up', 'The state collapses'], answer: 0,
        why: 'The success probability is sin²((2k + 1)θ), which peaks and then falls (chapter 5.3).' },
      { q: 'What does T2 limit?', options: ['How long relative phases, and with them interference, survive', 'How many qubits a chip can have', 'How many measurements can be made', 'The speed of the classical computer'], answer: 0,
        why: 'T2 is the coherence time; interference needs well-defined relative phases (chapter 6.2).' },
      { q: 'The parameter-shift rule gives ∂f/∂θ from…', options: ['two runs of the same circuit, at θ ± π/2', 'one run with a tiny shift', 'backpropagation through the hardware', 'the number of shots'], answer: 0,
        why: 'Each rotation angle traces a sinusoid, so two shifted evaluations give the exact slope (chapter 7.4).' },
      { q: 'A barren plateau is…', options: ['a flat loss landscape whose gradients vanish exponentially with the number of qubits', 'a local minimum', 'a kind of noise channel', 'a classical dataset'], answer: 0,
        why: 'Chapter 7.7: at scale, random circuits give nearly the same cost everywhere.' }
    ]
  });
})(window);

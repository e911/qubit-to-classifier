/* Part III — Many qubits */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, ketExpr, cx, phaseColor, bits, ket } = G.U;
  const { BlochView, CircleGrid, bars, linePlot, unitaryHTML, svg } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  /* small static circle-notation glyph */
  function circSVG(re, im, size = 54, label = '') {
    const T = Theme.tokens(), c = size / 2, R = size * 0.4, m = Math.hypot(re, im), ph = Math.atan2(im, re);
    let s = `<svg class="plot" width="${size}" height="${size + (label ? 14 : 0)}" viewBox="0 0 ${size} ${size + (label ? 14 : 0)}" role="img" aria-label="amplitude">`;
    s += `<circle cx="${c}" cy="${c}" r="${R}" fill="${T.surface}" stroke="${T.lineStrong}"/>`;
    if (m > 1e-4) s += `<circle cx="${c}" cy="${c}" r="${Math.max(1.2, R * m)}" fill="${phaseColor(ph)}"/><line x1="${c}" y1="${c}" x2="${c + R * Math.cos(ph)}" y2="${c - R * Math.sin(ph)}" stroke="${T.ink}" stroke-width="1.5"/>`;
    if (label) s += `<text x="${c}" y="${size + 11}" text-anchor="middle" style="fill:${T.ink2};font-family:${T.fontMath};font-size:12px">${label}</text>`;
    return s + '</svg>';
  }
  G.circSVG = circSVG;
  const STATES = { '0': [1, 0, 0, 0], '1': [0, 0, 1, 0], '+': [Math.SQRT1_2, 0, Math.SQRT1_2, 0], '−': [Math.SQRT1_2, 0, -Math.SQRT1_2, 0], '+i': [Math.SQRT1_2, 0, 0, Math.SQRT1_2] };
  const H2 = (x) => (x <= 0 || x >= 1) ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);
  function miniCircuit(host, circ, inputs) {
    host.innerHTML = '';
    const v = new G.CircuitLab.CircuitView(host, { editable: false, showPlayhead: false, inputs });
    v.set(circ, circ.cols.length);
    return v;
  }

  /* ------------------------------------------------------------------ 3.1 */
  C.add({
    id: 'tensor', part: 3, num: '3.1', title: 'Two qubits and the tensor product',
    lede: 'Two qubits need four amplitudes; n qubits need 2ⁿ. That exponential bookkeeping is both the source of quantum computing\'s power and the reason it is hard to simulate.',
    html: `
      <p>Two qubits have four basis states, ${K('00')}, ${K('01')}, ${K('10')} and ${K('11')}. A general two-qubit state is
      <span class="m">α₀₀|00⟩ + α₀₁|01⟩ + α₁₀|10⟩ + α₁₁|11⟩</span>, with the squared magnitudes adding up to 1.</p>
      <p>If the two qubits are prepared independently, the joint state is their <b>tensor product</b>:</p>
      <div class="formula">(a₀|0⟩ + a₁|1⟩) ⊗ (b₀|0⟩ + b₁|1⟩) = a₀b₀|00⟩ + a₀b₁|01⟩ + a₁b₀|10⟩ + a₁b₁|11⟩</div>
      <p>Every amplitude is a product of one number from each qubit, so the 2×2 grid of amplitudes below is an outer product.</p>
      <p><b>Labels in this course:</b> the first character is q0, the top wire, so ${K('q0 q1')}. Qiskit prints bit strings the other way round, with q0 on the right. Check the convention whenever you compare tools.</p>
      ${C.bench('t-grid', 'Two independent qubits', 'Each cell = row amplitude × column amplitude')}
      <h2>Why simulation gets hard</h2>
      <p>Every extra qubit doubles the number of amplitudes. A classical computer storing each as a complex number with 16 bytes needs <span class="m">16 × 2ⁿ</span> bytes.</p>
      ${C.bench('t-mem', 'Memory for a full state vector')}
      ${C.keyIdea('Independent qubits multiply their amplitudes. Most states of n qubits are not such products: those are the entangled ones, and they are what make 2ⁿ amplitudes necessary.')}
      ${C.tryThis([
        'Set q0 to |+⟩ and q1 to |1⟩. Which cells are filled?',
        'Give q1 a relative phase of π and watch which cells change colour.',
        'How many qubits can you add before the state vector no longer fits in 1 TB?'
      ])}`,
    init(root) {
      {
        const body = C.body(root, 't-grid');
        const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
        const left = h('div', { class: 'stack' }), right = h('div', { class: 'stack' }); grid.append(left, right);
        const st = [[PI / 2, 0], [PI / 3, PI / 2]];
        const sph = [], sl = [];
        const sphRow = h('div', { class: 'grid2' });
        for (let q = 0; q < 2; q++) {
          const box = h('div', { class: 'stack' });
          const bh = h('div');
          box.append(h('p', { class: 'panel-label', text: 'q' + q }), bh);
          sph.push(new BlochView(bh, { compact: true, maxSize: 190, shadow: false }));
          const a = slider({ label: 'θ', min: 0, max: PI, step: 0.01, value: st[q][0], snapPi: true, fmt: angle, oninput: v => { st[q][0] = v; draw(); } });
          const b = slider({ label: 'φ', min: 0, max: 2 * PI, step: 0.01, value: st[q][1], snapPi: true, fmt: angle, oninput: v => { st[q][1] = v; draw(); } });
          sl.push([a, b]); box.append(a.el, b.el); sphRow.appendChild(box);
        }
        left.appendChild(sphRow);
        const table = h('div', { style: { display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '6px 14px', alignItems: 'center', justifyContent: 'start' } });
        const ketEl = h('div', { class: 'ket-line' });
        right.append(h('p', { class: 'panel-label', text: 'Joint amplitudes' }), table, ketEl, h('div', { class: 'caption', text: 'Circle area = probability, colour and needle = phase. Rows are q0, columns are q1.' }));
        function draw() {
          const a = Q.stateFromBloch(...st[0]), b = Q.stateFromBloch(...st[1]);
          sph[0].set({ vectors: [{ v: Q.blochOf(a), main: true }] }); sph[1].set({ vectors: [{ v: Q.blochOf(b), main: true }] });
          const s = Q.State.product([a, b]);
          const amp = (v, i) => [v[2 * i], v[2 * i + 1]];
          const head = (v, i, who) => `<div style="text-align:center" class="readout">${who}=|${i}⟩<br>${circSVG(...amp(v, i), 40)}<br><b>${cx(...amp(v, i), { d: 2 })}</b></div>`;
          let html = '<div></div>' + head(b, 0, 'q1') + head(b, 1, 'q1');
          for (let i = 0; i < 2; i++) {
            html += head(a, i, 'q0');
            for (let j = 0; j < 2; j++) { const k = i * 2 + j; html += `<div style="text-align:center">${circSVG(s.re[k], s.im[k], 64, ket(bits(k, 2)))}</div>`; }
          }
          table.innerHTML = html;
          ketEl.innerHTML = '|ψ⟩ = ' + ketExpr(s.re, s.im, 2);
        }
        draw();
      }
      {
        const body = C.body(root, 't-mem');
        const grid = h('div', { class: 'grid2' }); body.appendChild(grid);
        const left = h('div', { class: 'stack' }), plot = h('div'); grid.append(left, plot);
        let n = 30;
        const fmtBytes = b => {
          const u = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']; let i = 0;
          while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; }
          return (b < 10 ? b.toFixed(2) : b < 100 ? b.toFixed(1) : Math.round(b)) + ' ' + u[i];
        };
        const read = h('div', { class: 'stats' });
        const s = slider({ label: 'Qubits n', min: 1, max: 60, step: 1, value: n, fmt: v => String(v), oninput: v => { n = v; draw(); } });
        left.append(s.el, read, h('div', { class: 'caption', text: 'Decimal units (1 GB = 10⁹ bytes). Clever simulators exploit structure (few entangled qubits, Clifford circuits, tensor networks), but a general state needs all 2ⁿ numbers.' }));
        function draw() {
          const amps = 2 ** n, bytes = 16 * amps;
          read.innerHTML = `<div class="stat"><span class="k">amplitudes 2ⁿ</span><span class="v">${amps < 1e15 ? amps.toLocaleString() : amps.toExponential(2)}</span></div><div class="stat"><span class="k">memory at 16 bytes each</span><span class="v">${fmtBytes(bytes)}</span></div>`;
          const T = Theme.tokens(), pts = []; for (let k = 1; k <= 60; k++) pts.push([k, 16 * 2 ** k]);
          linePlot(plot, { height: 220, x: [1, 60], y: [10, 1e20], yLog: true, xTitle: 'qubits n', yTitle: 'bytes needed', xName: 'n', series: [{ name: 'memory', color: T.q, points: pts }], markers: [{ x: n, y: bytes, color: T.q, label: fmtBytes(bytes) }], hlines: [{ y: 1.6e10, label: '16 GB laptop', color: T.muted }, { y: 1e15, label: '1 PB', color: T.muted }], yFmt2: v => fmtBytes(v) });
        }
        draw();
      }
    }
  });

  /* ------------------------------------------------------------------ 3.2 */
  const MG = {
    CNOT: { n: 2, build: () => Q.builder(2).cx(0, 1), text: 'Flips q1 when q0 is 1: |a, b⟩ → |a, a⊕b⟩.' },
    CZ: { n: 2, build: () => Q.builder(2).cz(0, 1), text: 'Multiplies |11⟩ by −1 and leaves the rest alone. Symmetric: either qubit can be called the control.' },
    SWAP: { n: 2, build: () => Q.builder(2).swap(0, 1), text: 'Exchanges the two qubits.' },
    CH: { n: 2, build: () => Q.builder(2).cg('H', [0], 1), text: 'Applies H to q1 only in the branch where q0 is 1.' },
    CS: { n: 2, build: () => Q.builder(2).cg('S', [0], 1), text: 'Controlled-S: multiplies |11⟩ by i. Like CZ, it only touches phases.' },
    CCX: { n: 3, build: () => Q.builder(3).ccx(0, 1, 2), text: 'Toffoli: flips q2 when q0 and q1 are both 1. The reversible AND.' }
  };
  C.add({
    id: 'multigates', part: 3, num: '3.2', title: 'Multi-qubit gates',
    lede: 'Controlled gates act on one qubit depending on another. On superpositions they act on every branch at once, which is how qubits become entangled.',
    html: `
      <ul>
        <li><b>CNOT</b> (controlled-X) flips the target when the control is 1: <span class="m">|a, b⟩ → |a, a ⊕ b⟩</span>. On basis states it is a reversible XOR.</li>
        <li><b>CZ</b> multiplies ${K('11')} by −1 and does nothing else. It is symmetric, so there is no real difference between control and target.</li>
        <li><b>SWAP</b> exchanges two qubits.</li>
        <li><b>Toffoli</b> (CCX) flips the target when both controls are 1. With it you can build any classical logic circuit reversibly.</li>
        <li><b>Controlled-U</b> applies U to the target only in the branch where the control is ${K('1')}. In the Circuit Lab you can put a control dot on any gate.</li>
      </ul>
      <p>The 4×4 matrix of a two-qubit gate lists where each input goes: column ${K('ab')} is the output for input ${K('ab')}.</p>
      ${C.bench('mg', 'Controlled-gate bench', 'Pick a gate and an input for each qubit')}
      <h2>Phase kickback</h2>
      <p>Give CNOT the control ${K('+')} and the target ${K('−')}. The target is an eigenstate of X with eigenvalue −1, so flipping it only multiplies that branch by −1:</p>
      <div class="formula">|+⟩|−⟩ = ½(|0⟩ + |1⟩)|−⟩ → ½(|0⟩ − |1⟩)|−⟩ = |−⟩|−⟩</div>
      <p>The "target" did not change, but the control flipped from ${K('+')} to ${K('−')}. The phase was kicked back onto the control. Deutsch–Jozsa, Bernstein–Vazirani, phase estimation and Shor's algorithm all run on this effect.</p>
      ${C.keyIdea('A controlled gate is an "if" that never looks: it acts on every branch of the superposition, and the control qubit can change even when the target does not.')}
      ${C.tryThis([
        'CNOT with q0 = |+⟩ and q1 = |0⟩. Is the output a product state?',
        'CNOT with q0 = |+⟩ and q1 = |−⟩. Which qubit changed?',
        'CZ with |+⟩|+⟩. Compare the output with CNOT on |+⟩|0⟩.',
        'Toffoli with q0 = |1⟩, q1 = |+⟩, q2 = |0⟩. What does it reduce to?'
      ])}`,
    init(root) {
      const body = C.body(root, 'mg');
      let gate = 'CNOT'; const inp = ['+', '0', '0'];
      const top = h('div', { class: 'row' });
      const gSeg = seg({ label: 'gate', value: gate, options: Object.keys(MG).map(k => ({ value: k, label: k === 'CCX' ? 'Toffoli' : k })), onchange: v => { gate = v; draw(); } });
      top.append(gSeg.el);
      const inRow = h('div', { class: 'row' });
      const inSegs = [0, 1, 2].map(q => seg({ label: 'input q' + q, value: inp[q], options: Object.keys(STATES).map(k => ({ value: k, label: `|${k}⟩` })), onchange: v => { inp[q] = v; draw(); } }));
      const inWraps = inSegs.map((s, q) => h('div', { class: 'row tight' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'q' + q }), s.el));
      inRow.append(...inWraps);
      const desc = h('p', { class: 'note' });
      const circHost = h('div');
      const grid = h('div', { class: 'grid2' });
      const bL = h('div', { class: 'stack' }), bR = h('div', { class: 'stack' }); grid.append(bL, bR);
      const cgIn = h('div'), cgOut = h('div');
      const ketIn = h('div', { class: 'ket-line' }), ketOut = h('div', { class: 'ket-line' });
      bL.append(h('p', { class: 'panel-label', text: 'Before' }), ketIn, cgIn);
      bR.append(h('p', { class: 'panel-label', text: 'After' }), ketOut, cgOut);
      const circIn = new CircleGrid(cgIn, { maxCols: 8 }), circOut = new CircleGrid(cgOut, { maxCols: 8 });
      const sphRow = h('div', { class: 'spheres' }), ent = h('div', { class: 'row' }), matEl = h('div', { class: 'eqn', style: { overflowX: 'auto' } });
      body.append(top, inRow, desc, circHost, grid, h('p', { class: 'panel-label', text: 'Each qubit after the gate' }), sphRow, ent, h('p', { class: 'panel-label', text: 'Matrix' }), matEl);
      let spheres = [];
      function draw() {
        const g = MG[gate], n = g.n;
        inWraps[2].hidden = n < 3;
        desc.textContent = g.text;
        const circ = { n, cols: g.build().cols };
        miniCircuit(circHost, circ, inp.slice(0, n).map(k => '|' + k + '⟩'));
        const s0 = Q.State.product(inp.slice(0, n).map(k => STATES[k]));
        const s1 = s0.clone(); circ.cols.forEach(col => Q.applyColumn(s1, col));
        circIn.update(s0.re, s0.im, n); circOut.update(s1.re, s1.im, n);
        ketIn.innerHTML = ketExpr(s0.re, s0.im, n); ketOut.innerHTML = ketExpr(s1.re, s1.im, n);
        if (spheres.length !== n) {
          sphRow.innerHTML = ''; spheres = [];
          for (let q = 0; q < n; q++) { const b = h('div'), cap = h('div', { class: 'caption' }); sphRow.appendChild(h('div', { class: 'sphere-cell' }, b, cap)); spheres.push([new BlochView(b, { compact: true, maxSize: 170, shadow: false }), cap]); }
        }
        let entangled = false;
        spheres.forEach(([bv, cap], q) => {
          const before = s0.bloch(q), after = s1.bloch(q), L = Math.hypot(...after);
          if (L < 0.999) entangled = true;
          bv.set({ vectors: [{ v: before, color: Theme.tokens().muted, alpha: 0.7, dot: false, width: 2 }, { v: after, main: true }] });
          cap.innerHTML = `q${q} · length ${num(L, 2)}`;
        });
        ent.innerHTML = entangled ? '<span class="pill acc">Entangled output</span> <span class="note">Some arrows are shorter than 1: those qubits have no state of their own.</span>' : '<span class="pill">Product output</span> <span class="note">Every arrow still has length 1. Grey = before, blue = after.</span>';
        const U = Q.unitary(circ);
        matEl.innerHTML = unitaryHTML(U, 'small');
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 3.3 */
  C.add({
    id: 'entangle', part: 3, num: '3.3', title: 'Entanglement',
    lede: 'Entangled qubits share one state that cannot be split into a state per qubit. Each qubit alone looks random; together they are perfectly correlated.',
    html: `
      <p>A two-qubit state is a <b>product state</b> if it can be written as ${K('a')} ⊗ ${K('b')}. Otherwise it is <b>entangled</b>. For two qubits there is a one-line test:
      the state is a product exactly when <span class="m">α₀₀α₁₁ − α₀₁α₁₀ = 0</span>, that is, when the 2×2 amplitude grid is an outer product.</p>
      <p>The workhorse is the Bell state made by H and CNOT: <span class="m">(|00⟩ + |11⟩)/√2</span>. It fails the test (½ − 0 ≠ 0).</p>
      <p><b>No state of its own.</b> If you only hold one qubit of an entangled pair, the best description of it is a mixed state, and its Bloch arrow is shorter than 1. For a maximally entangled pair the arrow has length 0: a perfectly random coin along every axis.
      The amount of entanglement of a pure two-qubit state can be measured by the <b>entanglement entropy</b> <span class="m">S = −λ log₂λ − (1−λ) log₂(1−λ)</span>, with <span class="m">λ = (1 + |r|)/2</span> from the single-qubit arrow length |r|. It is 0 bits for a product state and 1 bit for a Bell state.</p>
      ${C.bench('e-dial', 'The entangler: Ry(θ) then CNOT', 'Turn θ from 0 to π/2 and watch both arrows shrink')}
      <h2>The four Bell states</h2>
      <p>Adding an X and/or a Z to one qubit of the Bell pair gives the other three maximally entangled states. Together they form the <b>Bell basis</b>, used by teleportation and superdense coding (chapter 5.1).</p>
      ${C.bench('e-bell', 'Bell basis')}
      <h2>Stronger than classical correlations</h2>
      <p>Measure both qubits of <span class="m">(|00⟩ + |11⟩)/√2</span> along Z and you always get equal bits. Measure both along X and they are again always equal. Could the pair simply carry pre-agreed answers, like two sealed envelopes? The <b>CHSH test</b> says no.
      Alice measures along angle a or a′, Bob along b or b′ (all in the x–z plane), and they compute
      <span class="m">S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′)</span>, where E is the average product of their ±1 outcomes. Any pre-agreed strategy gives |S| ≤ 2. The Bell state reaches <span class="m">2√2 ≈ 2.83</span>.</p>
      ${C.bench('e-chsh', 'The CHSH game', 'For this state E(α, β) = cos(α − β)')}
      <p><b>No signalling.</b> Whatever Alice measures, Bob's qubit on its own stays a fair coin. Entanglement creates correlations but cannot send a message; it needs a classical channel to be useful, as teleportation shows.</p>
      ${C.keyIdea('Entangled qubits have no individual states: their arrows shrink inside the sphere. The information lives in the correlations, which can beat any classical strategy.')}
      ${C.tryThis([
        'Set θ = π/2. Measure 1,000 shots in ZZ, then in XX. What never happens?',
        'Find θ for which the entropy is 0.5 bits.',
        'In the CHSH game, set a = b and a′ = b′. What is S now?',
        'Raise the noise until S drops below 2. How much noise does it take?'
      ])}
      ${C.quizSection('Check yourself: Part III')}`,
    quiz: [
      { q: 'How many amplitudes describe a general state of 10 qubits?', options: ['10', '20', '100', '1,024'], answer: 3, why: '2¹⁰ = 1,024 complex amplitudes.' },
      { q: 'Which state is entangled?', options: ['(|00⟩ + |01⟩)/√2', '(|00⟩ + |11⟩)/√2', '|+⟩ ⊗ |−⟩', '(|00⟩ + |01⟩ + |10⟩ + |11⟩)/2'], answer: 1, why: 'For (|00⟩ + |11⟩)/√2, α₀₀α₁₁ − α₀₁α₁₀ = 1/2 ≠ 0. The others factor into single-qubit states.' },
      { q: 'CNOT acts with control |+⟩ and target |−⟩. What changes?', options: ['Only the target', 'Only the control, which becomes |−⟩', 'Both', 'Nothing'], answer: 1, why: 'Phase kickback: |−⟩ is an eigenstate of X with eigenvalue −1, so the control\'s |1⟩ branch picks up a minus sign.' }
    ],
    init(root) {
      const rng = Q.mulberry32(7);
      /* entangler */
      {
        const body = C.body(root, 'e-dial');
        let th = PI / 4, basis = 'ZZ', shots = true;
        const sT = slider({ label: 'θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
        const circHost = h('div');
        const grid = h('div', { class: 'grid2' }), L = h('div', { class: 'stack' }), R = h('div', { class: 'stack' }); grid.append(L, R);
        const cg = h('div'), ketEl = h('div', { class: 'ket-line' }), read = h('div', { class: 'readout' }), meter = h('div');
        const circ = new CircleGrid(cg, { maxCols: 4 });
        L.append(h('p', { class: 'panel-label', text: 'Joint state' }), ketEl, cg, read, meter);
        const sph = h('div', { class: 'grid2' }); const bvs = [0, 1].map(q => { const b = h('div'), cap = h('div', { class: 'caption' }); sph.appendChild(h('div', { class: 'sphere-cell' }, b, cap)); return [new BlochView(b, { compact: true, maxSize: 180, shadow: false }), cap]; });
        const bSeg = seg({ label: 'measurement basis', value: basis, options: [{ value: 'ZZ', label: 'both Z' }, { value: 'XX', label: 'both X' }, { value: 'ZX', label: 'Z and X' }], onchange: v => { basis = v; draw(); } });
        const hist = h('div');
        R.append(h('p', { class: 'panel-label', text: 'Each qubit alone' }), sph, h('p', { class: 'panel-label', text: 'Joint measurement' }), h('div', { class: 'row' }, bSeg.el, button('Run 1,000 shots', () => { shots = true; draw(); }, 'btn primary')), hist);
        body.append(sT.el, circHost, grid);
        function draw() {
          const cc = Q.builder(2).g('RY', 0, th).cx(0, 1).build();
          miniCircuit(circHost, { n: 2, cols: cc.cols });
          const s = Q.runCircuit(cc);
          circ.update(s.re, s.im, 2); ketEl.innerHTML = '|ψ⟩ = ' + ketExpr(s.re, s.im, 2);
          const b0 = s.bloch(0), b1 = s.bloch(1), len = Math.hypot(...b0), lam = (1 + len) / 2, S = H2(lam);
          bvs[0][0].set({ vectors: [{ v: b0, main: true }] }); bvs[1][0].set({ vectors: [{ v: b1, main: true }] });
          bvs[0][1].textContent = `q0 · length ${num(len, 2)}`; bvs[1][1].textContent = `q1 · length ${num(Math.hypot(...b1), 2)}`;
          const dr = s.re[0] * s.re[3] - s.im[0] * s.im[3] - (s.re[1] * s.re[2] - s.im[1] * s.im[2]);
          const di = s.re[0] * s.im[3] + s.im[0] * s.re[3] - (s.re[1] * s.im[2] + s.im[1] * s.re[2]);
          read.innerHTML = `α₀₀α₁₁ − α₀₁α₁₀ = <b>${num(Math.hypot(dr, di), 3)}</b> ${Math.hypot(dr, di) < 1e-9 ? '→ product state' : '→ entangled'}<br>entanglement entropy S = <b>${num(S, 3)} bits</b>`;
          const T = Theme.tokens(), W = Math.min(320, L.clientWidth || 300);
          meter.innerHTML = `<svg class="plot" width="${W}" height="30" viewBox="0 0 ${W} 30" role="img" aria-label="entropy meter"><rect x="0" y="6" width="${W}" height="10" rx="5" fill="${T.surface3}"/><rect x="0" y="6" width="${Math.max(0, W * S)}" height="10" rx="5" fill="${T.accent}"/><text x="0" y="29" style="fill:${T.muted}" font-size="10">0 bits (product)</text><text x="${W}" y="29" text-anchor="end" style="fill:${T.muted}" font-size="10">1 bit (Bell state)</text></svg>`;
          if (shots) {
            const m = s.clone();
            if (basis[0] === 'X') m.gate('H', 0);
            if (basis[1] === 'X') m.gate('H', 1);
            const cnt = Q.sampleCounts(m.probs(), 1000, rng), P = m.probs();
            bars(hist, { labels: ['00', '01', '10', '11'], values: cnt.map(c => c / 1000), marks: Array.from(P), max: 1, fmt: v => pct(v), valueName: 'measured', markName: 'exact', height: 140, yTicks: [0, 0.5, 1] });
            const same = (cnt[0] + cnt[3]) / 1000;
            hist.appendChild(h('div', { class: 'caption', text: `Outcomes agree in ${pct(same)} of shots. Correlation ⟨${basis[0]}⊗${basis[1]}⟩ ≈ ${num(2 * same - 1, 2)}.` }));
          } else hist.innerHTML = '<div class="caption">Labels read q0 then q1 (in the chosen basis: 0 means +, 1 means − for X).</div>';
        }
        draw();
      }
      /* Bell states */
      {
        const body = C.body(root, 'e-bell');
        const defs = [
          ['Φ⁺', b => b, '(|00⟩ + |11⟩)/√2'], ['Φ⁻', b => b.g('Z', 0), '(|00⟩ − |11⟩)/√2'],
          ['Ψ⁺', b => b.g('X', 0), '(|01⟩ + |10⟩)/√2'], ['Ψ⁻', b => b.g('X', 0).g('Z', 0), '(|01⟩ − |10⟩)/√2']
        ];
        const row = h('div', { class: 'row' }), circHost = h('div'), cg = h('div'), cap = h('div', { class: 'ket-line' });
        const circ = new CircleGrid(cg, { maxCols: 4 });
        const sel = seg({ label: 'Bell state', value: 0, options: defs.map((d, i) => ({ value: i, label: '|' + d[0] + '⟩' })), onchange: i => draw(i) });
        row.appendChild(sel.el);
        body.append(row, circHost, h('div', { class: 'grid2' }, h('div', { class: 'stack' }, cap, h('div', { class: 'caption', text: 'Ψ⁻ is the only one that is antisymmetric: swapping the qubits flips its sign.' })), cg));
        function draw(i) {
          const d = defs[i], cc = d[1](Q.builder(2).g('H', 0).cx(0, 1)).build();
          miniCircuit(circHost, { n: 2, cols: cc.cols });
          const s = Q.runCircuit(cc); circ.update(s.re, s.im, 2);
          cap.innerHTML = `|${d[0]}⟩ = ${d[2]}`;
        }
        draw(0);
      }
      /* CHSH */
      {
        const body = C.body(root, 'e-chsh');
        const ang = { a: 0, a2: PI / 2, b: PI / 4, b2: 3 * PI / 4 }; let p = 0, emp = null;
        const mk = (k, lab) => slider({ label: lab, min: -PI, max: PI, step: 0.01, value: ang[k], snapPi: true, fmt: angle, oninput: v => { ang[k] = v; emp = null; draw(); } });
        const sl = [mk('a', 'Alice a'), mk('a2', 'Alice a′'), mk('b', 'Bob b'), mk('b2', 'Bob b′')];
        const sp = slider({ label: 'Noise p', min: 0, max: 1, step: 0.01, value: 0, fmt: v => num(v, 2), oninput: v => { p = v; emp = null; draw(); } });
        const grid = h('div', { class: 'grid2' }), L = h('div', { class: 'stack' }), R = h('div', { class: 'stack' }); grid.append(L, R);
        const read = h('div', { class: 'readout' }), meter = h('div'), empEl = h('div', { class: 'readout' });
        L.append(...sl.map(s => s.el), sp.el, h('div', { class: 'caption', text: 'Noise mixes the Bell state with a random state (depolarizing): every correlation is multiplied by (1 − p).' }));
        R.append(read, meter, h('div', { class: 'row' }, button('Play 1,000 rounds per setting', () => { play(); draw(); }, 'btn primary'), button('Reset angles', () => { Object.assign(ang, { a: 0, a2: PI / 2, b: PI / 4, b2: 3 * PI / 4 }); sl[0].set(0); sl[1].set(PI / 2); sl[2].set(PI / 4); sl[3].set(3 * PI / 4); emp = null; draw(); }, 'btn')), empEl);
        body.appendChild(grid);
        const E = (x, y) => (1 - p) * Math.cos(x - y);
        function play() {
          const r = {};
          for (const [k, x, y] of [['ab', ang.a, ang.b], ['ab2', ang.a, ang.b2], ['a2b', ang.a2, ang.b], ['a2b2', ang.a2, ang.b2]]) {
            const same = Q.binomial(1000, (1 + E(x, y)) / 2, rng); r[k] = (2 * same - 1000) / 1000;
          }
          emp = r.ab - r.ab2 + r.a2b + r.a2b2;
        }
        function draw() {
          const e1 = E(ang.a, ang.b), e2 = E(ang.a, ang.b2), e3 = E(ang.a2, ang.b), e4 = E(ang.a2, ang.b2), S = e1 - e2 + e3 + e4;
          read.innerHTML = `E(a,b) = ${num(e1, 3)} · E(a,b′) = ${num(e2, 3)}<br>E(a′,b) = ${num(e3, 3)} · E(a′,b′) = ${num(e4, 3)}<br>S = <b>${num(S, 3)}</b> ${Math.abs(S) > 2 + 1e-9 ? '<span class="pill good">beats every classical strategy</span>' : '<span class="pill">within the classical limit</span>'}`;
          const T = Theme.tokens(), W = Math.min(360, R.clientWidth || 320), X = v => 10 + (W - 20) * v / 3;
          const val = Math.min(3, Math.abs(S));
          meter.innerHTML = `<svg class="plot" width="${W}" height="54" viewBox="0 0 ${W} 54" role="img" aria-label="CHSH value ${num(S, 2)}">
            <rect x="10" y="14" width="${W - 20}" height="12" rx="6" fill="${T.surface3}"/>
            <rect x="10" y="14" width="${X(val) - 10}" height="12" rx="6" fill="${Math.abs(S) > 2 ? T.good : T.q}"/>
            <line x1="${X(2)}" x2="${X(2)}" y1="8" y2="32" stroke="${T.ink}" stroke-width="1.5"/><text x="${X(2)}" y="46" text-anchor="middle" font-size="10" style="fill:${T.ink2}">classical limit 2</text>
            <line x1="${X(2 * Math.SQRT2)}" x2="${X(2 * Math.SQRT2)}" y1="8" y2="32" stroke="${T.accent}" stroke-width="1.5"/><text x="${X(2 * Math.SQRT2)}" y="6" text-anchor="middle" font-size="10" style="fill:${T.ink2}">2√2</text>
            <text x="10" y="46" font-size="10" style="fill:${T.muted}">0</text><text x="${W - 10}" y="46" text-anchor="end" font-size="10" style="fill:${T.muted}">|S| = 3</text></svg>`;
          const se = Math.sqrt([e1, e2, e3, e4].reduce((acc, e) => acc + (1 - e * e) / 1000, 0));
          empEl.innerHTML = emp === null ? '' : `Measured over 4,000 rounds: S ≈ <b>${num(emp, 2)}</b> (statistical error ≈ ±${num(se, 2)}).`;
        }
        draw();
      }
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });
})(window);

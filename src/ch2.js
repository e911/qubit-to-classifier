/* Part II — Gates and measurement */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, animate, Theme, ketExpr, cx, reduceMotion } = G.U;
  const { BlochView, bars, m2HTML, vecHTML, matHTML } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;
  const INFO = () => G.CircuitLab.INFO;

  function axisName(n) {
    const r = v => Math.round(v * 1000) / 1000;
    const [x, y, z] = n.map(r);
    const names = [[[1, 0, 0], 'x'], [[-1, 0, 0], '−x'], [[0, 1, 0], 'y'], [[0, -1, 0], '−y'], [[0, 0, 1], 'z'], [[0, 0, -1], '−z']];
    for (const [v, s] of names) if (Math.abs(v[0] - x) < 1e-3 && Math.abs(v[1] - y) < 1e-3 && Math.abs(v[2] - z) < 1e-3) return s;
    if (Math.abs(x - Math.SQRT1_2) < 1e-3 && Math.abs(y) < 1e-3 && Math.abs(z - Math.SQRT1_2) < 1e-3) return '(x + z)/√2';
    return `(${num(x, 2)}, ${num(y, 2)}, ${num(z, 2)})`;
  }

  /* ------------------------------------------------------------------ 2.1 */
  C.add({
    id: 'gates', part: 2, num: '2.1', title: 'Gates are rotations',
    lede: 'A single-qubit gate is a 2×2 unitary matrix. On the Bloch sphere every one of them is a rotation.',
    html: `
      <p>A gate changes the amplitudes: the new pair (α′, β′) is a matrix times the old pair. For the result to be a valid state for every input, the matrix must be
      <b>unitary</b>, <span class="m">U<sup>†</sup>U = I</span>. Unitary also means reversible: every gate can be undone by its inverse <span class="m">U<sup>†</sup></span>.</p>
      <p>Geometrically, every single-qubit gate turns the whole Bloch sphere as a rigid body, about some axis by some angle. Pick a gate below and watch the axis (brass line) and the path.</p>
      <ul>
        <li><b>X, Y, Z</b>: half-turns about x, y and z. X swaps ${K('0')} and ${K('1')}, the quantum NOT. Z flips the sign of ${K('1')}, which moves ${K('+')} to ${K('−')}.</li>
        <li><b>H</b> (Hadamard): a half-turn about the axis halfway between x and z. It swaps the poles with the equator: ${K('0')} ↔ ${K('+')}, ${K('1')} ↔ ${K('−')}.</li>
        <li><b>S</b> and <b>T</b>: quarter- and eighth-turns about z. They change only the relative phase.</li>
        <li><b>Rx(θ), Ry(θ), Rz(θ)</b>: turns by any angle about x, y, z. These are the trainable knobs of the quantum models in Part VII.</li>
      </ul>
      ${C.bench('g-bench', 'Gate bench', 'Tap a gate to apply it to the current state')}
      <p><b>Order matters.</b> Rotations about different axes don't commute. From ${K('0')}, H then S lands on ${K('+i')}, while S then H lands on ${K('+')}.</p>
      <p><b>Reading circuits.</b> Time runs left to right in a circuit, but in matrix notation the first gate is written on the right: the circuit ─H─S─ is the matrix <span class="m">S·H</span>. The bench multiplies them in that order for you.</p>
      ${C.keyIdea('For one qubit, every gate is a rotation of the sphere. The matrix and the rotation are two descriptions of the same thing.')}
      ${C.tryThis([
        'From |0⟩ apply H, then Z, then H. Which single gate did you just build?',
        'Start from |+⟩ and apply T eight times. Why are you back where you started?',
        'From |0⟩, compare H with Ry(π/2). Same end point? Same matrix?',
        'Apply S then H, then reset and apply H then S. Same result?'
      ])}`,
    init(root) {
      const body = C.body(root, 'g-bench');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div', { class: 'stack' }), right = h('div', { class: 'stack' }); grid.append(left, right);
      const bv = new BlochView(h('div'), { maxSize: 420 }); left.appendChild(bv.host);
      const start = h('div', { class: 'row tight' });
      left.append(h('p', { class: 'panel-label', text: 'Start from' }), start);
      let v = [1, 0, 0, 0], v0 = v.slice(), hist = [], busy = false, trail = [], total = [1, 0, 0, 0, 0, 0, 1, 0];
      const fixed = h('div', { class: 'row tight' });
      ['X', 'Y', 'Z', 'H', 'S', 'SDG', 'T', 'TDG', 'SX'].forEach(g => fixed.appendChild(h('button', { type: 'button', class: 'gatebtn', html: G.CircuitLab.LABEL[g], title: Q.GATES[g].name, onclick: () => apply(g) })));
      let theta = PI / 2;
      const sAng = slider({ label: 'Angle θ', min: -2 * PI, max: 2 * PI, step: 0.01, value: theta, snapPi: true, fmt: angle, oninput: x => { theta = x; } });
      const rot = h('div', { class: 'row tight' });
      ['RX', 'RY', 'RZ', 'P'].forEach(g => rot.appendChild(h('button', { type: 'button', class: 'gatebtn', html: G.CircuitLab.LABEL[g] + '(θ)', onclick: () => apply(g, theta) })));
      let U3 = [PI / 3, PI / 4, 0];
      const uS = ['θ', 'φ', 'λ'].map((nm, k) => slider({ label: 'U ' + nm, min: -PI, max: PI, step: 0.01, value: U3[k], snapPi: true, fmt: angle, oninput: x => { U3[k] = x; } }));
      const uBtn = h('button', { type: 'button', class: 'gatebtn', html: 'U(θ,φ,λ)', onclick: () => apply('U', U3.slice()) });
      const info = h('div', { class: 'inspector' });
      const histEl = h('div', { class: 'readout' });
      const ctl = h('div', { class: 'row tight' }, button('Undo', () => undo(), 'btn'), button('Reset', () => reset(v0), 'btn'));
      right.append(h('p', { class: 'panel-label', text: 'Fixed gates' }), fixed,
        h('p', { class: 'panel-label', text: 'Rotations' }), sAng.el, rot,
        h('details', {}, h('summary', { class: 'note', text: 'General gate U(θ, φ, λ)' }), h('div', { class: 'stack', style: { marginTop: '8px' } }, ...uS.map(s => s.el), uBtn)),
        info, h('p', { class: 'panel-label', text: 'History' }), histEl, ctl);
      [['|0⟩', [1, 0, 0, 0]], ['|1⟩', [0, 0, 1, 0]], ['|+⟩', [Math.SQRT1_2, 0, Math.SQRT1_2, 0]], ['|−⟩', [Math.SQRT1_2, 0, -Math.SQRT1_2, 0]], ['|+i⟩', [Math.SQRT1_2, 0, 0, Math.SQRT1_2]]].forEach(([l, s]) => start.appendChild(button(l, () => reset(s), 'btn')));

      function reset(s) { v0 = s.slice(); v = s.slice(); hist = []; trail = []; total = [1, 0, 0, 0, 0, 0, 1, 0]; bv.set({ axis: null }); showInfo(null); render(); }
      function undo() {
        if (!hist.length) return;
        hist.pop(); v = v0.slice(); total = [1, 0, 0, 0, 0, 0, 1, 0];
        for (const e of hist) { const m = Q.gateMatrix(e.g, e.p); v = Q.m2apply(m, v); total = Q.m2mul(m, total); }
        trail = []; bv.set({ axis: null }); showInfo(hist.length ? hist[hist.length - 1] : null); render();
      }
      function gateTitle(g, p) {
        const L = G.CircuitLab.LABEL[g];
        if (g === 'U') return `U(${p.map(x => angle(x)).join(', ')})`;
        return Q.GATES[g].params ? `${L}(${angle(p)})` : L;
      }
      function showInfo(e, before, after) {
        if (!e) { info.innerHTML = '<span class="note">Apply a gate to see its matrix and its rotation.</span>'; return; }
        const m = Q.gateMatrix(e.g, e.p), r = Q.gateRotation(e.g, e.p);
        info.innerHTML = `<div><b>${gateTitle(e.g, e.p)}</b> · ${Q.GATES[e.g].name}</div>
          <div class="note">${INFO()[e.g] || ''}</div>
          <div class="note">Rotation of <b>${angle(r.theta)}</b> about <b>${axisName(r.n)}</b>.</div>
          ${before ? `<div class="eqn">${vecHTML(after, 'small')} = ${m2HTML(m, 'small')} ${vecHTML(before, 'small')}</div>` : `<div class="eqn">${m2HTML(m, 'small')}</div>`}`;
      }
      async function apply(g, p) {
        if (busy) return; busy = true;
        const m = Q.gateMatrix(g, p), r = Q.gateRotation(g, p), b0 = Q.blochOf(v), before = v.slice();
        trail = [b0];
        showInfo({ g, p }, before, Q.m2apply(m, v));
        bv.set({ axis: r.n });
        const dur = reduceMotion() ? 0 : 380 + 520 * Math.min(2, Math.abs(r.theta) / PI);
        await animate(dur, k => { const b = Q.rotateVec(b0, r.n, r.theta * k); trail.push(b); bv.set({ vectors: [{ v: b, main: true }], trail }); }, { linear: false });
        v = Q.m2apply(m, v); total = Q.m2mul(m, total); hist.push({ g, p });
        render(); busy = false;
      }
      function render() {
        const b = Q.blochOf(v);
        bv.set({ vectors: [{ v: b, main: true }], trail });
        const circ = hist.length ? '─' + hist.map(e => gateTitle(e.g, e.p)).join('─') + '─' : '(no gates yet)';
        histEl.innerHTML = `<div>circuit: <b>${circ}</b></div><div class="ket-line" style="font-size:1rem">|ψ⟩ = ${ketExpr([v[0], v[2]], [v[1], v[3]], 1)}</div>` +
          (hist.length > 1 ? `<div class="eqn" style="margin-top:6px"><span>total =</span> ${m2HTML(total, 'small')}<span class="note">(${hist.map(e => gateTitle(e.g, e.p)).reverse().join('·')})</span></div>` : '');
      }
      showInfo(null); render();
    }
  });

  /* ------------------------------------------------------------------ 2.2 */
  C.add({
    id: 'measure', part: 2, num: '2.2', title: 'Measurement and bases',
    lede: 'Measuring asks the qubit a yes-or-no question along one axis. You get one bit, the state collapses, and only many repetitions reveal the probabilities.',
    html: `
      <p>A standard measurement (the <b>Z basis</b>) asks: up or down? It returns 0 with probability <span class="m">P(0) = (1 + z)/2</span> and leaves the qubit at the pole it reported.</p>
      <p>You can ask along any axis <span class="m">n̂</span> instead. The probability of the + answer is <span class="m">(1 + r·n̂)/2</span>: it depends only on the shadow of the arrow on that axis.
      Hardware usually only measures Z, so to measure along another axis you rotate first: <b>H</b> then measure gives an X measurement; <b>S†</b>, <b>H</b>, then measure gives Y.</p>
      ${C.bench('m-axis', 'Measure along any axis', 'The brass line is the measurement axis')}
      <p>A state that is certain along one axis is random along the perpendicular axes: ${K('0')} always gives 0 in the Z basis but a fair coin in the X basis. No state is certain in both. This is the qubit's version of the uncertainty principle.</p>
      <h2>Expectation values and tomography</h2>
      <p>Record each outcome as +1 or −1 and average over many shots. That average is the <b>expectation value</b>: <span class="m">⟨Z⟩ = P(0) − P(1) = z</span>, and likewise <span class="m">⟨X⟩ = x</span> and <span class="m">⟨Y⟩ = y</span>.
      Expectation values are exactly what the quantum models in Part VII output.</p>
      <p>Measuring all three gives the whole Bloch vector. This is <b>state tomography</b>. With N shots per axis each coordinate carries an error of about <span class="m">1/√N</span>, so halving the error costs four times the shots.</p>
      ${C.bench('m-tomo', 'Reconstruct a hidden state', 'Blue = true state (toggle) · orange = your estimate · dots = earlier estimates')}
      ${C.keyIdea('A measurement returns a bit, not a state. Everything you know about a quantum state comes from statistics over many identical runs.')}
      ${C.tryThis([
        'Put the state at |+⟩ and run 1,000 shots along Z. Then switch the axis to X.',
        'Measure once along X, then along Z, then along X again. Why can the second X answer differ from the first?',
        'In the tomography panel, go from 100 to 10,000 shots per axis. How much smaller does the cloud of estimates get?'
      ])}
      ${C.quizSection('Check yourself: Part II')}`,
    quiz: [
      { q: 'What is H·Z·H?', options: ['X', 'Y', 'Z', 'The identity'], answer: 0, why: 'H swaps the x and z axes, so a half-turn about z becomes a half-turn about x.' },
      { q: 'A qubit is in |+⟩. You measure in the Z basis. What do you get?', options: ['0 every time', '1 every time', '0 or 1, 50/50', '0 with 85% probability'], answer: 2, why: '|+⟩ is on the equator, so its shadow on the z axis is 0 and P(0) = (1 + 0)/2.' },
      { q: 'Why does estimating ⟨Z⟩ need many shots?', options: ['Each shot returns only one bit', 'Gates are noisy', 'The state changes between shots on purpose', 'Measurement is deterministic'], answer: 0, why: 'Each run gives ±1. Only the average of many runs estimates the expectation value, with error shrinking like 1/√N.' }
    ],
    init(root) {
      const rng = Q.mulberry32(42);
      /* --- measure along an axis --- */
      {
        const body = C.body(root, 'm-axis');
        const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
        const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
        let th = PI / 3, ph = 3 * PI / 4, ax = 'Z', na = PI / 3, nb = 0, saved = null;
        const nvec = () => ax === 'Z' ? [0, 0, 1] : ax === 'X' ? [1, 0, 0] : ax === 'Y' ? [0, 1, 0] : [Math.sin(na) * Math.cos(nb), Math.sin(na) * Math.sin(nb), Math.cos(na)];
        const bv = new BlochView(left, { maxSize: 420, onDrag: p => { const a = Q.anglesOf(p); th = a.theta; ph = a.phi; sTh.set(th); sPh.set(ph); saved = null; draw(); } });
        const sTh = slider({ label: 'state θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; saved = null; draw(); } });
        const sPh = slider({ label: 'state φ', min: 0, max: 2 * PI, step: 0.01, value: ph, snapPi: true, fmt: angle, oninput: v => { ph = v; saved = null; draw(); } });
        const sNa = slider({ label: 'axis tilt', min: 0, max: PI, step: 0.01, value: na, snapPi: true, fmt: angle, oninput: v => { na = v; draw(); } });
        const sNb = slider({ label: 'axis turn', min: 0, max: 2 * PI, step: 0.01, value: nb, snapPi: true, fmt: angle, oninput: v => { nb = v; draw(); } });
        const custom = h('div', { class: 'stack', hidden: true }, sNa.el, sNb.el);
        const axSeg = seg({ label: 'measurement axis', value: ax, options: [{ value: 'Z', label: 'Z' }, { value: 'X', label: 'X' }, { value: 'Y', label: 'Y' }, { value: 'N', label: 'Any axis' }], onchange: v => { ax = v; custom.hidden = v !== 'N'; draw(); } });
        const read = h('div', { class: 'readout' }), how = h('div', { class: 'note' }), probs = h('div'), outc = h('div', { class: 'row' }), hist = h('div');
        right.append(h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Axis' }), axSeg.el), custom, sTh.el, sPh.el, how, read, probs,
          h('div', { class: 'row' }, button('Measure once', () => once(), 'btn primary'), button('Restore state', () => { if (saved) { [th, ph] = saved; sTh.set(th); sPh.set(ph); saved = null; draw(); } }, 'btn'), button('Run 1,000 shots', () => shots(), 'btn')), outc, hist);
        function draw() {
          const b = Q.blochOf(Q.stateFromBloch(th, ph)), n = nvec(), d = b[0] * n[0] + b[1] * n[1] + b[2] * n[2];
          bv.set({ vectors: [{ v: b, main: true, drag: true }], axis: n, points: [{ v: n.map(x => x * d), color: Theme.tokens().accent, r: 4 }] });
          read.innerHTML = `r·n̂ = <b>${num(d, 3)}</b> → P(+) = (1 + r·n̂)/2 = <b>${pct((1 + d) / 2)}</b>, P(−) = <b>${pct((1 - d) / 2)}</b>`;
          how.innerHTML = { Z: 'Circuit: just measure.', X: 'Circuit: apply H, then measure. + means |+⟩, − means |−⟩.', Y: 'Circuit: apply S†, then H, then measure. + means |+i⟩.', N: 'Circuit: rotate n̂ onto z, then measure.' }[ax];
          const T = Theme.tokens();
          bars(probs, { labels: ['+', '−'], values: [(1 + d) / 2, (1 - d) / 2], colors: [T.q2, T.q3], max: 1, fmt: v => pct(v), valueName: 'probability', height: 110, yTicks: [0, 0.5, 1] });
        }
        function once() {
          const b = Q.blochOf(Q.stateFromBloch(th, ph)), n = nvec(), d = b[0] * n[0] + b[1] * n[1] + b[2] * n[2];
          const plus = rng() < (1 + d) / 2, target = plus ? n : n.map(x => -x);
          if (!saved) saved = [th, ph];
          const a = Q.anglesOf(target), a0 = th, p0 = ph;
          let dp = a.phi - p0; if (dp > PI) dp -= 2 * PI; if (dp < -PI) dp += 2 * PI;
          outc.innerHTML = `<span class="pill acc">Outcome: <b>${plus ? '+' : '−'}</b></span> <span class="note">The state is now the ${plus ? '+' : '−'} end of the axis.</span>`;
          animate(420, k => { th = a0 + (a.theta - a0) * k; ph = (p0 + dp * k + 2 * PI) % (2 * PI); sTh.set(th); sPh.set(ph); draw(); });
        }
        function shots() {
          const b = Q.blochOf(Q.stateFromBloch(th, ph)), n = nvec(), d = b[0] * n[0] + b[1] * n[1] + b[2] * n[2], p = (1 + d) / 2;
          const k = Q.binomial(1000, p, rng), T = Theme.tokens();
          bars(hist, { labels: ['+', '−'], values: [k / 1000, 1 - k / 1000], marks: [p, 1 - p], colors: [T.q2, T.q3], max: 1, fmt: v => pct(v), valueName: 'measured', markName: 'exact', height: 110, yTicks: [0, 0.5, 1] });
          outc.innerHTML = `<span class="note">1,000 shots: ${k} × +, ${1000 - k} × −. Estimated ⟨n̂·σ⟩ = ${num(2 * k / 1000 - 1, 3)} (exact ${num(d, 3)}).</span>`;
        }
        draw();
      }
      /* --- tomography --- */
      {
        const body = C.body(root, 'm-tomo');
        const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
        const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
        const bv = new BlochView(left, { maxSize: 400, shadow: false });
        let truth = null, cloud = [], est = null, N = 100, showTrue = false;
        const newState = () => { const th = Math.acos(2 * rng() - 1), ph = 2 * PI * rng(); truth = Q.blochOf(Q.stateFromBloch(th, ph)); cloud = []; est = null; };
        const sN = slider({ label: 'Shots per axis', min: 1, max: 4, step: 0.01, value: 2, fmt: v => Math.round(10 ** v).toLocaleString(), oninput: v => { N = Math.round(10 ** v); cloud = []; est = null; draw(); } });
        const chk = h('input', { type: 'checkbox', id: 'tomo-show' });
        chk.addEventListener('change', () => { showTrue = chk.checked; draw(); });
        const read = h('div', { class: 'readout' });
        right.append(sN.el, h('div', { class: 'row' }, button('Measure X, Y and Z', () => { measure(); draw(); }, 'btn primary'), button('Repeat 20×', () => { for (let i = 0; i < 20; i++) measure(); draw(); }, 'btn'), button('New hidden state', () => { newState(); draw(); }, 'btn')),
          h('label', { class: 'chk', for: 'tomo-show' }, chk, 'Show the true state'), read);
        function measure() {
          const e = truth.map(r => { const k = Q.binomial(N, (1 + r) / 2, rng); return 2 * k / N - 1; });
          est = e; cloud.push(e); if (cloud.length > 80) cloud.shift();
        }
        function draw() {
          const T = Theme.tokens(), vecs = [];
          if (showTrue) vecs.push({ v: truth, color: T.q, main: true });
          if (est) vecs.push({ v: est, color: T.q2, main: !showTrue });
          bv.set({ vectors: vecs, points: cloud.slice(0, -1).map(p => ({ v: p, color: T.q2, r: 2.4 })) });
          if (!est) { read.innerHTML = 'Press "Measure X, Y and Z". Each axis gets its own batch of shots.'; return; }
          const err = Math.hypot(est[0] - truth[0], est[1] - truth[1], est[2] - truth[2]), len = Math.hypot(...est);
          let mean = [0, 0, 0]; cloud.forEach(p => { for (let i = 0; i < 3; i++) mean[i] += p[i] / cloud.length; });
          let spread = 0; cloud.forEach(p => { spread += (p[0] - mean[0]) ** 2 + (p[1] - mean[1]) ** 2 + (p[2] - mean[2]) ** 2; });
          spread = cloud.length > 1 ? Math.sqrt(spread / (cloud.length - 1)) : NaN;
          read.innerHTML = `estimate (x, y, z) = (<b>${num(est[0], 3)}</b>, <b>${num(est[1], 3)}</b>, <b>${num(est[2], 3)}</b>)` +
            (showTrue ? `<br>true (x, y, z) = (${num(truth[0], 3)}, ${num(truth[1], 3)}, ${num(truth[2], 3)})<br>error = <b>${num(err, 3)}</b>` : '') +
            `<br>arrow length ${num(len, 3)}${len > 1 ? ' — longer than 1, which no real state allows: that is pure shot noise' : ''}` +
            `<br>typical error for ${N.toLocaleString()} shots ≈ √(2/N) = ${num(Math.sqrt(2 / N), 3)}` + (cloud.length > 1 ? ` · spread of your ${cloud.length} estimates: ${num(spread, 3)}` : '');
        }
        newState(); measure(); draw();
      }
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });
})(window);

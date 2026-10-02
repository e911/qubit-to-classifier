/* Part V — Algorithms */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, animate, reduceMotion, bits } = G.U;
  const { BlochView, linePlot, svg } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  /* ------------------------------------------------------------------ 5.1 */
  function denseCircuit(b1, b2) {
    const b = Q.builder(2).g('H', 0).cx(0, 1), notes = ['Start: |00⟩.', 'H on q0 …', '… CNOT: Alice holds q0 and Bob holds q1 of the Bell pair (|00⟩ + |11⟩)/√2.'];
    if (b2) { b.g('X', 0); notes.push('Second bit is 1, so Alice applies X to her qubit.'); }
    if (b1) { b.g('Z', 0); notes.push('First bit is 1, so Alice applies Z. Then she sends her single qubit to Bob.'); }
    if (!b1 && !b2) { b.g('I', 0); notes.push('Message 00: Alice does nothing (identity) and sends her qubit.'); }
    b.cx(0, 1); notes.push('Bob decodes: CNOT from q0 to q1 …');
    b.g('H', 0); notes.push(`… and H on q0. He reads |${b1}${b2}⟩ with certainty: two classical bits from one qubit, because the pair was shared in advance.`);
    return { circ: { n: 2, cols: b.build().cols }, notes };
  }
  C.add({
    id: 'teleport', part: 5, num: '5.1', title: 'Teleportation and superdense coding',
    lede: 'Shared entanglement plus two classical bits moves a qubit\'s state from Alice to Bob without sending the qubit. The reverse trick sends two bits with one qubit.',
    html: `
      <h2>Teleportation</h2>
      <p>Alice has a qubit in a state ${K('ψ')} that nobody knows. Alice and Bob already share a Bell pair. Alice applies a CNOT and an H to her two qubits and measures them. Each of the four outcomes is equally likely, and in each case Bob's qubit is already ${K('ψ')} up to a known Pauli error: nothing, X, Z, or both. Alice sends Bob her two bits, and Bob undoes the error.</p>
      <p>Two things do <em>not</em> happen. Nothing travels faster than light: until Bob receives the bits his qubit on its own is a random coin. And the state is not copied: Alice's qubit ends up measured. (The <b>no-cloning theorem</b> forbids copying an unknown state.)</p>
      ${C.bench('tp', 'Teleportation, step by step', 'Grey arrow on q2 = the original message')}
      <h2>Superdense coding</h2>
      <p>Run the idea backwards. Alice and Bob share a Bell pair. By applying I, X, Z or ZX to her half, Alice can turn it into any of the four Bell states. She sends Bob her one qubit; Bob measures in the Bell basis (CNOT, then H) and reads two bits.</p>
      ${C.bench('sd', 'Superdense coding', 'Choose the two bits to send')}
      ${C.keyIdea('Teleportation: entanglement + 2 classical bits → 1 qubit state. Superdense coding: entanglement + 1 qubit → 2 classical bits. Entanglement is a resource you spend.')}
      ${C.tryThis(['Step the teleportation circuit to the end, then press "New outcomes" several times. Does q2 always match the grey arrow?', 'In the teleportation circuit, at step 7, which single-qubit arrows have length 0?', 'Send each of the four messages with superdense coding. Which Bell state does each create?'])}`,
    init(root, ctx) {
      const tp = new G.CircuitLab.Lab(C.body(root, 'tp'), { mode: 'guided', preset: 'teleport' });
      const sdBody = C.body(root, 'sd');
      const pick = seg({ label: 'message', value: '11', options: ['00', '01', '10', '11'].map(m => ({ value: m, label: m })), onchange: m => load(m) });
      sdBody.appendChild(h('div', { class: 'row', style: { marginBottom: '10px' } }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Message' }), pick.el));
      const labHost = h('div'); sdBody.appendChild(labHost);
      const sd = new G.CircuitLab.Lab(labHost, { mode: 'guided', preset: 'dense' });
      function load(m) { const d = denseCircuit(+m[0], +m[1]); sd.setCircuit(d.circ, 0, d.notes); }
      load('11');
      ctx.onLeave(() => { tp.stop(); sd.stop(); });
    }
  });

  /* ------------------------------------------------------------------ 5.2 */
  const ORACLES = {
    c0: { name: 'Constant 0', kind: 'const', cols: b => b.g('I', 3), text: ['Oracle for f(x) = 0: it does nothing.'] },
    c1: { name: 'Constant 1', kind: 'const', cols: b => b.g('X', 3), text: ['Oracle for f(x) = 1: it flips the ancilla for every x, which only multiplies the whole state by −1 (a global phase).'] },
    b0: { name: 'Balanced: f = x₀', kind: 'bal', cols: b => b.cx(0, 3), text: ['Oracle for f(x) = x₀: a CNOT from q0. Phase kickback puts −1 on every input with x₀ = 1.'] },
    b2: { name: 'Balanced: f = x₀x₁ ⊕ x₂', kind: 'bal', cols: b => b.ccx(0, 1, 3).cx(2, 3), text: ['Oracle part 1, a Toffoli: flips the sign where x₀x₁ = 1.', 'Oracle part 2, a CNOT from q2: flips the sign where x₂ = 1. Every input now carries (−1)^f(x).'] }
  };
  function oracleCircuit(key, s) {
    const b = Q.builder(4).g('X', 3).layer('H', [0, 1, 2, 3]);
    const notes = ['Inputs q0–q2 start at |000⟩; the ancilla q3 will receive f(x).', 'X on the ancilla.', 'H on all four qubits: every input x at once, and the ancilla becomes |−⟩.'];
    let result;
    if (key === 'bv') {
      const on = [0, 1, 2].filter(i => s[i] === '1');
      if (!on.length) { b.g('I', 3); notes.push('Secret s = 000: the oracle does nothing.'); }
      on.forEach((i, k) => { b.cx(i, 3); notes.push(`Oracle: CNOT from q${i} because s${i} = 1.` + (k === on.length - 1 ? ' Every input now carries the phase (−1)^(s·x).' : '')); });
      result = `The inputs read exactly s = ${s}: one query instead of three.`;
    } else {
      const o = ORACLES[key]; o.cols(b); notes.push(...o.text);
      result = o.kind === 'const' ? 'All the probability is on |000⟩ (with the ancilla at |1⟩): the function is constant.' : 'The output |000⟩ has probability exactly 0: the function is balanced.';
    }
    b.layer('H', [0, 1, 2, 3]);
    notes.push('H on all four. Each output amplitude is an average of (−1)^f(x) over all x, weighted by signs. ' + result + ' (The final H on the ancilla just turns |−⟩ into |1⟩ so the answer shows as a single bar.)');
    return { circ: { n: 4, cols: b.build().cols }, notes };
  }
  C.add({
    id: 'oracles', part: 5, num: '5.2', title: 'Oracles: Deutsch–Jozsa and Bernstein–Vazirani',
    lede: 'A quantum algorithm can learn a global property of a function from a single call, by turning its answers into phases and letting them interfere.',
    html: `
      <p>An <b>oracle</b> is a black-box circuit for a function f: <span class="m">|x⟩|y⟩ → |x⟩|y ⊕ f(x)⟩</span>. If the extra qubit starts in ${K('−')}, phase kickback turns this into
      <span class="m">|x⟩ → (−1)<sup>f(x)</sup>|x⟩</span>, and the extra qubit is left alone. The answer is now a phase.</p>
      <p>The pattern is always the same: Hadamards query every x at once, the oracle writes phases, and Hadamards again make those phases interfere. The amplitude of output ${K('y')} is
      <span class="m">(1/2ⁿ) Σ<sub>x</sub> (−1)<sup>f(x) + x·y</sup></span>.</p>
      <ul>
        <li><b>Deutsch–Jozsa.</b> Promise: f is either constant (the same for every x) or balanced (0 on exactly half the inputs). The amplitude of ${K('000')} is the average of (−1)<sup>f(x)</sup>: ±1 if constant, 0 if balanced. One query decides. A deterministic classical algorithm can need 2ⁿ⁻¹ + 1 queries.</li>
        <li><b>Bernstein–Vazirani.</b> <span class="m">f(x) = s·x mod 2</span> for a hidden bit string s. After the final Hadamards the inputs read s exactly. Classically you need n queries.</li>
      </ul>
      ${C.bench('or', 'Oracle lab', 'Pick a function, then step through')}
      <p>These speed-ups are modest in practice: a randomized classical algorithm settles Deutsch–Jozsa with high confidence in a few queries. Their value is the mechanism, which Simon's algorithm and Shor's algorithm push to an exponential advantage.</p>
      ${C.keyIdea('Phase kickback turns function values into phases; Hadamards turn global patterns in those phases into a single measurable bit string.')}`,
    init(root, ctx) {
      const body = C.body(root, 'or');
      let key = 'b2', s = '101';
      const sSeg = seg({ label: 'secret s', value: s, options: ['001', '010', '011', '100', '101', '110', '111'].map(v => ({ value: v, label: v })), onchange: v => { s = v; load(); } });
      const sRow = h('div', { class: 'row', hidden: true }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Secret s' }), sSeg.el);
      const kSeg = seg({ label: 'function', value: key, options: [...Object.entries(ORACLES).map(([k, o]) => ({ value: k, label: o.name })), { value: 'bv', label: 'Bernstein–Vazirani s·x' }], onchange: v => { key = v; sRow.hidden = v !== 'bv'; load(); } });
      body.append(h('div', { class: 'row' }, kSeg.el), sRow);
      const host = h('div', { style: { marginTop: '10px' } }); body.appendChild(host);
      const lab = new G.CircuitLab.Lab(host, { mode: 'guided', preset: 'bv' });
      function load() { const d = oracleCircuit(key, s); lab.setCircuit(d.circ, 0, d.notes); }
      load();
      ctx.onLeave(() => lab.stop());
    }
  });

  /* ------------------------------------------------------------------ 5.3 */
  C.add({
    id: 'grover', part: 5, num: '5.3', title: 'Grover\'s search',
    lede: 'Grover\'s algorithm finds one marked item among N in about (π/4)√N steps by repeatedly rotating the state toward the answer.',
    html: `
      <p>Start in the uniform superposition over N = 2ⁿ items. Then repeat two steps:</p>
      <ol>
        <li><b>Oracle:</b> flip the sign of the marked item's amplitude.</li>
        <li><b>Diffusion:</b> reflect every amplitude about the mean amplitude, <span class="m">a → 2·mean − a</span>.</li>
      </ol>
      <p>The flipped amplitude sits far below the mean, so the reflection throws it far above. Each round the marked amplitude grows.</p>
      <p><b>The geometric picture.</b> The state never leaves the plane spanned by ${K('w')} (the answer) and ${K('s′')} (the equal superposition of every other item). Each round is two reflections, and two reflections make a rotation by <span class="m">2θ</span>, where <span class="m">sin θ = 1/√N</span>. After k rounds the chance of measuring the answer is <span class="m">sin²((2k+1)θ)</span>.</p>
      ${C.bench('gr', 'Grover step by step', 'Click a bar to choose which item is marked')}
      <p>Stop at about <span class="m">(π/4)√N</span> rounds. Go further and the state rotates past the answer, and the success probability falls again. The √N speed-up is provably the best possible for unstructured search, so it is quadratic, not exponential.</p>
      ${C.keyIdea('Grover is a rotation: each oracle-plus-diffusion round turns the state by a fixed angle 2θ toward the answer. Timing matters, because you can overshoot.')}
      ${C.tryThis(['With N = 4, how many iterations reach certainty?', 'With N = 64, run past the optimum. How low does the success probability drop?', 'Press only "Oracle" twice. Why does nothing change overall?'])}`,
    init(root) {
      const body = C.body(root, 'gr');
      let n = 4, N = 16, w = 11, a = [], k = 0, half = false, trail = [];
      const nSeg = seg({ label: 'qubits', value: n, options: [2, 3, 4, 5, 6].map(v => ({ value: v, label: `n = ${v} (N = ${2 ** v})` })), onchange: v => { n = v; N = 2 ** n; w = Math.min(w, N - 1); if (w >= N) w = N - 1; reset(); } });
      const ctl = h('div', { class: 'row' },
        button('Oracle', () => oracle(), 'btn'), button('Diffuse', () => diffuse(), 'btn'), button('Full iteration', () => { if (half) diffuse(); else { oracle(); diffuse(); } }, 'btn primary'),
        button('Run to the optimum', () => runOpt(), 'btn'), button('Reset', () => reset(), 'btn'));
      const read = h('div', { class: 'readout', style: { margin: '10px 0 12px' } });
      const grid = h('div', { class: 'grid2' }), L = h('div', { class: 'stack' }), R = h('div', { class: 'stack' }); grid.append(L, R);
      const barsEl = h('div'), geo = h('div'), plot = h('div');
      L.append(h('p', { class: 'panel-label', text: 'Amplitudes (marked item in orange)' }), barsEl);
      R.append(h('p', { class: 'panel-label', text: 'The 2-D plane of |w⟩ and |s′⟩' }), geo);
      body.append(h('div', { class: 'row' }, nSeg.el), ctl, read, grid, h('p', { class: 'panel-label', text: 'Success probability after k full iterations' }), plot);
      function reset() { a = new Array(N).fill(1 / Math.sqrt(N)); k = 0; half = false; trail = [angleNow()]; draw(); }
      function angleNow() { const au = N > 1 ? a[(w + 1) % N] : 0; return Math.atan2(a[w], au * Math.sqrt(N - 1)); }
      function oracle() { a[w] = -a[w]; half = !half; trail.push(angleNow()); draw(); }
      function diffuse() { const m = a.reduce((s, v) => s + v, 0) / N; a = a.map(v => 2 * m - v); if (half) { k++; half = false; } trail.push(angleNow()); draw(); }
      async function runOpt() {
        const th = Math.asin(1 / Math.sqrt(N)), opt = Math.max(1, Math.round(PI / (4 * th) - 0.5));
        while (k < opt) { if (half) diffuse(); else { oracle(); await new Promise(r => setTimeout(r, reduceMotion() ? 0 : 250)); diffuse(); } await new Promise(r => setTimeout(r, reduceMotion() ? 0 : 350)); if (!body.isConnected) return; }
      }
      function draw() {
        const T = Theme.tokens(), th = Math.asin(1 / Math.sqrt(N)), opt = Math.max(1, Math.round(PI / (4 * th) - 0.5));
        const pw = a[w] ** 2, mean = a.reduce((s, v) => s + v, 0) / N;
        read.innerHTML = `marked item <b>${w}</b> = |${bits(w, n)}⟩ · θ = asin(1/√${N}) = ${num(th, 3)} rad · optimal iterations ≈ <b>${opt}</b> · done: <b>${k}${half ? ' + oracle' : ''}</b> · P(marked) = <b>${pct(pw)}</b>`;
        // signed bars
        const W = Math.max(240, barsEl.clientWidth || 300), H = 200, m = { l: 36, r: 8, t: 10, b: 24 }, pw2 = W - m.l - m.r, ph = H - m.t - m.b;
        const band = pw2 / N, bw = Math.min(24, Math.max(2, band * 0.72)), Y = v => m.t + ph / 2 - v * ph / 2;
        let s = `<svg class="plot" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grover amplitudes">`;
        for (const t of [-1, -0.5, 0, 0.5, 1]) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}" class="${t === 0 ? 'axis' : 'gridline'}"/><text x="${m.l - 6}" y="${Y(t) + 3.5}" text-anchor="end" class="tick-label">${t}</text>`;
        a.forEach((v, i) => {
          const x = m.l + band * i + (band - bw) / 2, y0 = Y(0), y1 = Y(v);
          s += `<rect x="${x}" y="${Math.min(y0, y1)}" width="${bw}" height="${Math.max(0.5, Math.abs(y1 - y0))}" rx="${Math.min(3, bw / 3)}" fill="${i === w ? T.q2 : T.q}"/>`;
          s += `<rect x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ph}" fill="transparent" data-i="${i}" style="cursor:pointer"><title>|${bits(i, n)}⟩: ${num(v, 3)}${i === w ? ' (marked)' : ''}</title></rect>`;
        });
        s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(mean)}" y2="${Y(mean)}" stroke="${T.ink}" stroke-width="1.5"/><text x="${W - m.r}" y="${Y(mean) - 5}" text-anchor="end" class="direct-label">mean ${num(mean, 3)}</text>`;
        const every = N <= 16 ? 1 : 4;
        a.forEach((v, i) => { if (i % every === 0 || i === w) s += `<text x="${m.l + band * i + band / 2}" y="${H - 6}" text-anchor="middle" style="font-family:${N <= 8 ? T.fontMath : T.fontBody};font-size:${N > 8 ? 9.5 : 11}px;${i === w ? 'font-weight:700;' : ''}">${N <= 8 ? bits(i, n) : i}</text>`; });
        s += '</svg>';
        barsEl.innerHTML = s;
        barsEl.querySelectorAll('rect[data-i]').forEach(r => r.addEventListener('click', () => { w = +r.dataset.i; reset(); }));
        // geometry
        const G = Math.min(300, geo.clientWidth || 280), c = G / 2, R2 = G * 0.4;
        let g = `<svg class="plot" width="${G}" height="${G}" viewBox="0 0 ${G} ${G}" role="img" aria-label="Grover rotation in the plane of w and s-prime">`;
        g += `<circle cx="${c}" cy="${c}" r="${R2}" fill="none" stroke="${T.line}"/><line x1="${c - R2 - 8}" x2="${c + R2 + 8}" y1="${c}" y2="${c}" stroke="${T.lineStrong}"/><line x1="${c}" x2="${c}" y1="${c + R2 + 8}" y2="${c - R2 - 8}" stroke="${T.lineStrong}"/>`;
        g += `<text x="${c + R2 + 6}" y="${c - 6}" text-anchor="end" style="fill:${T.ink2};font-family:${T.fontMath};font-size:13px">|s′⟩</text><text x="${c + 6}" y="${c - R2 - 2}" style="fill:${T.ink2};font-family:${T.fontMath};font-size:13px">|w⟩</text>`;
        trail.slice(0, -1).forEach(t => { g += `<line x1="${c}" y1="${c}" x2="${c + R2 * Math.cos(t)}" y2="${c - R2 * Math.sin(t)}" stroke="${T.q}" stroke-opacity="0.22" stroke-width="2"/>`; });
        const t = angleNow(), x = c + R2 * Math.cos(t), y = c - R2 * Math.sin(t);
        g += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${T.q}" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="6.5" fill="${T.surface}"/><circle cx="${x}" cy="${y}" r="4.5" fill="${T.q}"/>`;
        g += `<text x="${c}" y="${G - 4}" text-anchor="middle" style="fill:${T.muted};font-size:11px">angle from |s′⟩: ${num(t * 180 / PI, 1)}° (target 90°)</text></svg>`;
        geo.innerHTML = g;
        // success curve
        const kmax = Math.max(6, Math.ceil(2.4 * opt)), pts = [];
        for (let j = 0; j <= kmax; j++) pts.push([j, Math.sin((2 * j + 1) * th) ** 2]);
        linePlot(plot, { height: 170, x: [0, kmax], y: [0, 1], yTicks: [0, 0.5, 1], xTitle: 'iterations k', xName: 'k', series: [{ name: 'P(success)', color: T.q, points: pts, dots: kmax <= 20 }], markers: half ? [] : [{ x: k, y: Math.sin((2 * k + 1) * th) ** 2, color: T.q2, r: 6 }], vlines: [{ x: opt, label: 'optimum', color: T.accent }], xTicks: V_ticks(kmax) });
      }
      function V_ticks(kmax) { const st = kmax <= 12 ? 1 : kmax <= 30 ? 2 : 5, out = []; for (let j = 0; j <= kmax; j += st) out.push(j); return out; }
      reset();
    }
  });

  /* ------------------------------------------------------------------ 5.4 */
  C.add({
    id: 'qft', part: 5, num: '5.4', title: 'The quantum Fourier transform and phase estimation',
    lede: 'The quantum Fourier transform writes a number into the phases of qubits. Phase estimation uses it to read out an eigenvalue, which is the engine inside Shor\'s algorithm.',
    html: `
      <div class="formula">QFT|x⟩ = (1/√N) Σ<sub>k</sub> e<sup>2πi·xk/N</sup> |k⟩</div>
      <p>In the computational basis a number x is written in bits, each qubit up or down. In the <b>Fourier basis</b> the same number is written in phases. After the QFT every qubit sits on the equator, and qubit k (counting from the top, starting at 0) points at angle
      <span class="m">2πx / 2<sup>k+1</sup></span>: the top qubit turns half a revolution per unit of x, the next a quarter, the next an eighth. It is counting, in phase.</p>
      ${C.bench('qf', 'Counting in two bases', 'Top row: |x⟩ · bottom row: QFT|x⟩, viewed from above')}
      <p>The QFT circuit needs only O(n²) gates, H and controlled phases (load "QFT" in the Circuit Lab). The catch is that you cannot read the Fourier coefficients out: a measurement gives one sample. The QFT pays off when the answer is concentrated on a few outcomes, as in phase estimation.</p>
      <h2>Phase estimation</h2>
      <p>Suppose <span class="m">U|u⟩ = e<sup>2πiφ</sup>|u⟩</span>. With t counting qubits in ${K('+')}, a controlled-U<sup>2ʲ</sup> from counting qubit j kicks back the phase <span class="m">2π·2ʲφ</span>. That is exactly the Fourier-basis picture of the number 2ᵗφ. An inverse QFT turns it into a bit string: a t-bit estimate of φ.</p>
      <p>If φ has an exact t-bit binary expansion the answer is certain. Otherwise the result is one of the nearest t-bit fractions, the closest with probability at least 4/π² ≈ 0.405, and adding counting qubits sharpens the peak.</p>
      ${C.bench('qpe', 'Phase estimation outcomes', 'Vertical line = true φ')}
      ${C.keyIdea('The QFT moves information between bit values and phases. Phase estimation reads a phase by letting kickback write it and the inverse QFT convert it to bits.')}
      ${C.tryThis(['Count from 0 to 7 with n = 3 and watch how fast each Fourier qubit turns.', 'Set φ = 0.375 with t = 3 counting qubits. Why is the answer certain?', 'Set φ = 0.3 and raise t from 3 to 7. How does the peak change?'])}
      ${C.quizSection('Check yourself: Part V')}`,
    quiz: [
      { q: 'In teleportation, how many classical bits must Alice send to Bob?', options: ['None', 'One', 'Two', 'As many as needed to describe the state'], answer: 2, why: 'Her two measurement outcomes tell Bob which of the four Pauli corrections to apply.' },
      { q: 'Grover search over N = 1,024 items needs roughly how many oracle calls?', options: ['10', '25', '512', '1,024'], answer: 1, why: '(π/4)√1024 = (π/4)·32 ≈ 25.' },
      { q: 'Which effect do Deutsch–Jozsa and phase estimation both rely on?', options: ['Measurement collapse', 'Phase kickback', 'Cloning', 'Decoherence'], answer: 1, why: 'Both write information into phases of control qubits through controlled operations on an eigenstate.' }
    ],
    init(root, ctx) {
      /* counting */
      {
        const body = C.body(root, 'qf');
        let n = 3, x = 5, xv = 5, playing = false;
        const nSeg = seg({ label: 'qubits', value: n, options: [{ value: 3, label: '3 qubits' }, { value: 4, label: '4 qubits' }], onchange: v => { n = v; x = Math.min(x, 2 ** n - 1); xv = x; sx.input.max = 2 ** n - 1; sx.set(x); build(); draw(); } });
        const sx = slider({ label: 'x', min: 0, max: 2 ** n - 1, step: 1, value: x, fmt: v => `${v} = ${bits(Math.round(v), n)}`, oninput: v => { x = v; xv = v; draw(); } });
        const playBtn = button('Count up', () => { playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Count up'; if (playing) loop(); }, 'btn primary');
        body.append(h('div', { class: 'row' }, nSeg.el, playBtn), sx.el);
        const rowA = h('div', { class: 'spheres' }), rowB = h('div', { class: 'spheres' });
        body.append(h('p', { class: 'panel-label', text: 'Computational basis |x⟩' }), rowA, h('p', { class: 'panel-label', text: 'Fourier basis QFT|x⟩' }), rowB);
        let A = [], Bv = [];
        function build() {
          rowA.innerHTML = ''; rowB.innerHTML = ''; A = []; Bv = [];
          for (let q = 0; q < n; q++) {
            const a = h('div'), ca = h('div', { class: 'caption' }), b = h('div'), cb = h('div', { class: 'caption' });
            rowA.appendChild(h('div', { class: 'sphere-cell' }, a, ca)); rowB.appendChild(h('div', { class: 'sphere-cell' }, b, cb));
            A.push([new BlochView(a, { compact: true, maxSize: 150, shadow: false }), ca]);
            Bv.push([new BlochView(b, { compact: true, maxSize: 150, shadow: false, el: 1.05, az: -0.3 }), cb]);
          }
        }
        function draw() {
          const xi = Math.round(xv);
          for (let q = 0; q < n; q++) {
            const bit = (xi >> (n - 1 - q)) & 1;
            A[q][0].set({ vectors: [{ v: [0, 0, bit ? -1 : 1], main: true }] }); A[q][1].textContent = `q${q} = ${bit}`;
            const ph = 2 * PI * xv / 2 ** (q + 1);
            Bv[q][0].set({ vectors: [{ v: [Math.cos(ph), Math.sin(ph), 0], main: true }] });
            Bv[q][1].textContent = `q${q}: 2π·x/${2 ** (q + 1)} = ${angle((((ph % (2 * PI)) + 2 * PI) % (2 * PI)))}`;
          }
        }
        async function loop() {
          while (playing && body.isConnected) {
            const from = xv, to = (Math.round(xv) + 1);
            await animate(reduceMotion() ? 0 : 650, t => { xv = from + (to - from) * t; draw(); });
            xv = to % 2 ** n; x = xv; sx.set(x); draw();
            await new Promise(r => setTimeout(r, reduceMotion() ? 600 : 350));
          }
        }
        build(); draw();
        ctx.onLeave(() => { playing = false; });
      }
      /* phase estimation */
      {
        const body = C.body(root, 'qpe');
        let phi = 0.3, t = 4;
        const sp = slider({ label: 'true φ', min: 0, max: 0.999, step: 0.001, value: phi, fmt: v => num(v, 3), oninput: v => { phi = v; draw(); } });
        const st = slider({ label: 'counting qubits t', min: 2, max: 8, step: 1, value: t, fmt: v => String(v), oninput: v => { t = v; draw(); } });
        const read = h('div', { class: 'readout' }), plot = h('div');
        body.append(sp.el, st.el, read, plot);
        function draw() {
          const M = 2 ** t, T = Theme.tokens(), P = [];
          for (let k = 0; k < M; k++) {
            const d = phi - k / M, s = Math.sin(PI * d);
            P.push(Math.abs(s) < 1e-12 ? 1 : (Math.sin(PI * M * d) / (M * s)) ** 2);
          }
          let best = 0; P.forEach((p, k) => { if (p > P[best]) best = k; });
          read.innerHTML = `Most likely outcome: <b>${bits(best, t)}</b> → φ ≈ <b>${num(best / M, 4)}</b> with probability <b>${pct(P[best])}</b> · error ${num(Math.abs(phi - best / M), 4)} · resolution 1/2ᵗ = ${num(1 / M, 4)}`;
          const segs = P.map((p, k) => ({ x1: k / M, x2: k / M, y1: 0, y2: p, color: k === best ? T.q2 : T.q, width: M > 64 ? 1.5 : 2.5 }));
          linePlot(plot, { height: 210, x: [0, 1], y: [0, 1], yTicks: [0, 0.5, 1], xTitle: 'estimate k/2ᵗ', yTitle: 'probability', crosshair: false, segments: segs, markers: M <= 64 ? P.map((p, k) => ({ x: k / M, y: p, color: k === best ? T.q2 : T.q, r: 3 })) : [], vlines: [{ x: phi, label: 'true φ', color: T.accent }] });
        }
        draw();
      }
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });
})(window);

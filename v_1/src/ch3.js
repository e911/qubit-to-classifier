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
    }
  });

  /* ------------------------------------------------------------------ 3.1: a gate on one qubit acts on pairs */
  C.widget('pairs', body => {
    const n = 3, N = 8, R2 = Math.SQRT1_2;
    const GATES1 = [['H'], ['X'], ['Z'], ['S'], ['RY', PI / 3]];
    const general = () => Q.State.product([[R2, 0, R2, 0], [Math.cos(PI / 6), 0, Math.sin(PI / 6), 0], [Math.cos(PI / 6), 0, 0, Math.sin(PI / 6)]]);
    let tq = 0, gi = 0, sel = 0, st = general(), prev = null;
    const label = (g, p) => G.CircuitLab.LABEL[g] + (p !== undefined ? `(${angle(p)})` : '');
    const qSeg = seg({ label: 'target qubit', value: tq, options: [0, 1, 2].map(q => ({ value: q, label: 'q' + q })), onchange: v => { tq = v; prev = null; sel = 0; draw(); } });
    const gSeg = seg({ label: 'gate', value: gi, options: GATES1.map(([g, p], i) => ({ value: i, label: label(g, p) })), onchange: v => { gi = v; prev = null; draw(); } });
    const startRow = h('div', { class: 'row tight' },
      button('Start from |000⟩', () => { st = new Q.State(3); prev = null; draw(); }, 'btn'),
      button('Start from a general state', () => { st = general(); prev = null; draw(); }, 'btn'));
    const table = h('div', { class: 'table-wrap' }), calc = h('div', { class: 'calc' }), note = h('p', { class: 'note' });
    body.append(h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Gate' }), gSeg.el, h('span', { class: 'panel-label', style: { margin: '0 0 0 8px' }, text: 'on' }), qSeg.el),
      h('div', { class: 'row' }, button('Apply the gate', () => apply(), 'btn primary'), startRow), note, table, calc);
    const pairOf = i => { const b = 1 << (n - 1 - tq); return [i & ~b, i | b]; };
    function apply() {
      prev = st.clone(); const [g, p] = GATES1[gi]; st.gate(g, tq, p); draw();
    }
    function draw() {
      const T = Theme.tokens(), bit = 1 << (n - 1 - tq), cols = [T.q, T.q2, T.q3, T.accent];
      const pairIdx = []; let k = 0; for (let i = 0; i < N; i++) if (!(i & bit)) pairIdx[i] = pairIdx[i | bit] = k++;
      const lab = i => { const s = bits(i, n); return '|' + s.split('').map((c, q) => q === tq ? `<b style="color:${T.accent}">${c}</b>` : c).join('') + '⟩'; };
      const cell = (S, i) => S ? `<span style="display:inline-flex;align-items:center;gap:6px">${circSVG(S.re[i], S.im[i], 30)}<span>${cx(S.re[i], S.im[i], { d: 3 })}</span></span>` : '<span class="note">·</span>';
      let html = `<table class="dtable compact"><thead><tr><th>Basis state</th><th>Pair</th><th>${prev ? 'Before' : 'Amplitude'}</th>${prev ? '<th>After</th>' : ''}</tr></thead><tbody>`;
      for (let i = 0; i < N; i++) {
        const pk = pairIdx[i], mark = `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${cols[pk]};vertical-align:-1px"></span> ${pk + 1}`;
        const isSel = pairOf(i)[0] === pairOf(sel)[0];
        html += `<tr data-i="${i}" style="cursor:pointer${isSel ? `;background:${G.U.rgba(T.accent, 0.12)}` : ''}"><th scope="row" class="m">${lab(i)}</th><td>${mark}</td><td>${cell(prev || st, i)}</td>${prev ? `<td>${cell(st, i)}</td>` : ''}</tr>`;
      }
      table.innerHTML = html + '</tbody></table>';
      table.querySelectorAll('tr[data-i]').forEach(tr => tr.addEventListener('click', () => { sel = +tr.dataset.i; draw(); }));
      const [i0, i1] = pairOf(sel), [g, p] = GATES1[gi], m = Q.gateMatrix(g, p), S0 = prev || st;
      const a = [S0.re[i0], S0.im[i0]], b = [S0.re[i1], S0.im[i1]], E = (r, im) => cx(r, im, { d: 3 });
      const w = z => { const t = E(z[0], z[1]); return /[+−-]/.test(t) ? `(${t})` : t; };
      const o0 = [m[0] * a[0] - m[1] * a[1] + m[2] * b[0] - m[3] * b[1], m[0] * a[1] + m[1] * a[0] + m[2] * b[1] + m[3] * b[0]];
      const o1 = [m[4] * a[0] - m[5] * a[1] + m[6] * b[0] - m[7] * b[1], m[4] * a[1] + m[5] * a[0] + m[6] * b[1] + m[7] * b[0]];
      note.innerHTML = `${label(g, p)} on q${tq} pairs up basis states that differ only in bit q${tq} (in brass). Each colour is one pair, and the gate's 2 × 2 matrix acts on each pair separately. Click a row to see its pair worked out.`;
      calc.innerHTML = `<div><span class="lbl">pair ${pairIdx[i0] + 1}</span>${lab(i0)} and ${lab(i1)}</div>` +
        `<div><span class="lbl">new ${lab(i0)}</span>${w([m[0], m[1]])} × ${w(a)} + ${w([m[2], m[3]])} × ${w(b)} = <b>${E(o0[0], o0[1])}</b></div>` +
        `<div><span class="lbl">new ${lab(i1)}</span>${w([m[4], m[5]])} × ${w(a)} + ${w([m[6], m[7]])} × ${w(b)} = <b>${E(o1[0], o1[1])}</b></div>` +
        (prev ? '' : '<div class="note" style="font-family:var(--font-body)">Press "Apply the gate" to update all four pairs at once.</div>');
    }
    draw();
  });

  /* ------------------------------------------------------------------ 3.2: inside a controlled gate */
  C.widget('anatomy', body => {
    const US = [['X'], ['Z'], ['H'], ['S'], ['T'], ['RY', PI / 2]];
    let ui = 0, ctl = 0;
    const label = (g, p) => G.CircuitLab.LABEL[g] + (p !== undefined ? `(${angle(p)})` : '');
    const uSeg = seg({ label: 'gate U', value: ui, options: US.map(([g, p], i) => ({ value: i, label: label(g, p) })), onchange: v => { ui = v; draw(); } });
    const cSeg = seg({ label: 'which qubit controls', value: ctl, options: [{ value: 0, label: 'q0 controls q1' }, { value: 1, label: 'q1 controls q0' }], onchange: v => { ctl = v; draw(); } });
    const circHost = h('div'), table = h('div', { class: 'table-wrap' }), formula = h('div', { class: 'formula', style: { fontSize: '1.05rem' } }), note = h('p', { class: 'note' });
    body.append(h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'U' }), uSeg.el, cSeg.el), circHost, formula, table, note);
    function draw() {
      const T = Theme.tokens(), [g, p] = US[ui], t = 1 - ctl;
      const circ = { n: 2, cols: Q.builder(2).cg(g, [ctl], t, p).build().cols };
      miniCircuit(circHost, circ);
      const U = Q.unitary(circ), N = 4;
      const on = i => ((i >> (1 - ctl)) & 1) === 1; // control bit set
      let html = `<table class="dtable compact" style="width:auto"><thead><tr><th></th>${[0, 1, 2, 3].map(j => `<th class="m" style="text-align:center">in |${bits(j, 2)}⟩</th>`).join('')}</tr></thead><tbody>`;
      for (let i = 0; i < N; i++) {
        html += `<tr><th scope="row" class="m">out |${bits(i, 2)}⟩</th>`;
        for (let j = 0; j < N; j++) {
          const blk = on(i) && on(j) ? 'u' : !on(i) && !on(j) ? 'i' : 'z';
          const bg = blk === 'u' ? G.U.rgba(T.accent, 0.18) : blk === 'i' ? G.U.rgba(T.q, 0.08) : 'transparent';
          const v = cx(U.re[i * N + j], U.im[i * N + j], { d: 2 });
          html += `<td class="m" style="text-align:center;background:${bg};${v === '0' ? `color:${T.muted}` : ''}">${v}</td>`;
        }
        html += '</tr>';
      }
      table.innerHTML = html + '</tbody></table>';
      formula.innerHTML = ctl === 0 ? `C-U = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ ${label(g, p)}` : `C-U = I ⊗ |0⟩⟨0| + ${label(g, p)} ⊗ |1⟩⟨1|`;
      note.innerHTML = `Blue cells: the part of the state where the control q${ctl} is 0, left exactly alone (the identity). Brass cells: where q${ctl} is 1, ${label(g, p)} acts on q${t}. The uncoloured cells are all zero: the gate never changes the control bit. ` +
        (ctl === 0 ? 'With q0 as control the matrix is block diagonal: I in the top-left corner and U in the bottom-right.' : 'With q1 as control the same pattern is interleaved, because q1 is the right-hand bit of each label.');
    }
    draw();
  });

  /* ------------------------------------------------------------------ 3.3: measuring one qubit of a pair */
  C.widget('partial-meas', body => {
    const rng = Q.mulberry32(99), R3 = 1 / Math.sqrt(3);
    const PRE = [
      ['Bell (|00⟩ + |11⟩)/√2', () => Q.runCircuit(Q.builder(2).g('H', 0).cx(0, 1).build())],
      ['Product |+⟩|0⟩', () => Q.runCircuit(Q.builder(2).g('H', 0).build())],
      ['(|00⟩ + |01⟩ + |11⟩)/√3', () => { const s = new Q.State(2); s.re[0] = R3; s.re[1] = R3; s.re[3] = R3; return s; }],
      ['Partly entangled: Ry(π/3), CNOT', () => Q.runCircuit(Q.builder(2).g('RY', 0, PI / 3).cx(0, 1).build())]
    ];
    let pi = 0, mq = 0, picked = null;
    const pSeg = seg({ label: 'state', value: pi, options: PRE.map((d, i) => ({ value: i, label: d[0] })), onchange: v => { pi = v; picked = null; draw(); } });
    const qSeg = seg({ label: 'qubit to measure', value: mq, options: [{ value: 0, label: 'measure q0' }, { value: 1, label: 'measure q1' }], onchange: v => { mq = v; picked = null; draw(); } });
    const ketEl = h('div', { class: 'ket-line' }), cg = h('div'), before = h('div'), beforeCap = h('div', { class: 'caption' });
    const circles = new CircleGrid(cg, { maxCols: 4 });
    const bvBefore = new BlochView(before, { compact: true, maxSize: 170, shadow: false });
    const br = [0, 1].map(() => { const bh = h('div'), cap = h('div', { class: 'readout' }), box = h('div', { class: 'stack', style: { padding: '10px', borderRadius: '10px' } }); return { bh, cap, box, bv: null }; });
    br.forEach(b => { b.bv = new BlochView(b.bh, { compact: true, maxSize: 170, shadow: false }); b.box.append(b.cap, b.bh); });
    const outc = h('div', { class: 'row' });
    body.append(h('div', { class: 'row' }, pSeg.el), h('div', { class: 'row' }, qSeg.el, button('Measure it', () => { const P = probs(); picked = rng() < P[0] ? 0 : 1; draw(); }, 'btn primary'), button('Reset', () => { picked = null; draw(); }, 'btn')),
      h('div', { class: 'grid2' }, h('div', { class: 'stack' }, h('p', { class: 'panel-label', text: 'The pair before the measurement' }), ketEl, cg),
        h('div', { class: 'stack' }, h('p', { class: 'panel-label', text: 'The other qubit on its own, before' }), before, beforeCap)),
      h('p', { class: 'panel-label', text: 'The two possible outcomes' }), h('div', { class: 'grid2' }, br[0].box, br[1].box), outc);
    const state = () => PRE[pi][1]();
    function probs() { const s = state(), P = [0, 0]; for (let i = 0; i < 4; i++) P[(i >> (1 - mq)) & 1] += s.re[i] ** 2 + s.im[i] ** 2; return P; }
    function draw() {
      const T = Theme.tokens(), s = state(), other = 1 - mq, P = probs();
      circles.update(s.re, s.im, 2); ketEl.innerHTML = '|ψ⟩ = ' + ketExpr(s.re, s.im, 2);
      const bo = s.bloch(other), L = Math.hypot(...bo);
      bvBefore.set({ vectors: [{ v: bo, main: true }] });
      beforeCap.innerHTML = `q${other} alone: arrow length ${num(L, 2)}${L < 0.999 ? '. Shorter than 1, so q' + other + ' has no pure state of its own.' : '. A pure state: the pair is not entangled.'}`;
      [0, 1].forEach(m => {
        const idx = [0, 1].map(x => mq === 0 ? (m << 1) | x : (x << 1) | m); // amplitudes that survive, ordered by the other qubit's value
        const a = idx.map(i => [s.re[i], s.im[i]]), pm = P[m], b = br[m];
        const ok = pm > 1e-12;
        const v = ok ? [a[0][0], a[0][1], a[1][0], a[1][1]].map(x => x / Math.sqrt(pm)) : null;
        b.bv.set({ vectors: ok ? [{ v: Q.blochOf(v), main: true }] : [] });
        b.box.style.background = picked === m ? G.U.rgba(T.accent, 0.14) : picked === null ? T.surface2 : 'transparent';
        b.box.style.opacity = picked !== null && picked !== m ? '0.45' : '1';
        b.cap.innerHTML = `<b>q${mq} reads ${m}</b> · probability ${pct(pm)}<br>` + (ok ?
          `keep ${idx.map(i => '|' + bits(i, 2) + '⟩').join(' and ')}, divide by √${num(pm, 3)}<br>q${other} becomes ${ketExpr([v[0], v[2]], [v[1], v[3]], 1)}` : 'this outcome never happens');
      });
      outc.innerHTML = picked === null ? '<span class="note">Before you measure, both branches are possible. Press "Measure it" to pick one with the Born-rule odds.</span>'
        : `<span class="pill acc">q${mq} read ${picked}</span> <span class="note">The other branch is gone. q${other} is now in the state shown in the highlighted box, whatever happens to q${mq} afterwards.</span>`;
    }
    draw();
  });
})(window);

/* Part II — Gates and measurement */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, animate, Theme, ketExpr, cx, reduceMotion } = G.U;
  const { BlochView, bars, m2HTML, vecHTML, matHTML, linePlot } = G.V;
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
            `<br>arrow length ${num(len, 3)}${len > 1 ? '. That is longer than 1, which no real state allows: it is pure shot noise' : ''}` +
            `<br>typical error for ${N.toLocaleString()} shots ≈ √(2/N) = ${num(Math.sqrt(2 / N), 3)}` + (cloud.length > 1 ? ` · spread of your ${cloud.length} estimates: ${num(spread, 3)}` : '');
        }
        newState(); measure(); draw();
      }
    }
  });

  /* ------------------------------------------------------------------ 2.1: a gate turns the whole sphere */
  C.widget('gate-sphere', body => {
    const R2 = Math.SQRT1_2;
    const CARD = [['|0⟩', [1, 0, 0, 0]], ['|1⟩', [0, 0, 1, 0]], ['|+⟩', [R2, 0, R2, 0]], ['|−⟩', [R2, 0, -R2, 0]], ['|+i⟩', [R2, 0, 0, R2]], ['|−i⟩', [R2, 0, 0, -R2]]];
    const col = T => [T.q, T.q, T.q2, T.q2, T.q3, T.q3];
    const GATES = [['X'], ['Y'], ['Z'], ['H'], ['S'], ['SDG'], ['T'], ['SX'], ['RX', PI / 2], ['RY', PI / 2]];
    let U = [1, 0, 0, 0, 0, 0, 1, 0], hist = [], busy = false, trails = [];
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
    const bv = new BlochView(left, { maxSize: 420, shadow: false });
    const lab = (g, p) => G.CircuitLab.LABEL[g] + (p !== undefined ? `(${angle(p)})` : '');
    const btns = h('div', { class: 'row tight' }, ...GATES.map(([g, p]) => h('button', { type: 'button', class: 'gatebtn', html: lab(g, p), onclick: () => apply(g, p) })));
    const seq = h('div', { class: 'readout' }), table = h('div');
    right.append(h('p', { class: 'panel-label', text: 'Apply a gate to all six states at once' }), btns,
      h('div', { class: 'row' }, button('Reset', () => { U = [1, 0, 0, 0, 0, 0, 1, 0]; hist = []; trails = []; bv.set({ axis: null }); draw(); }, 'btn')), seq, table);
    const outs = () => CARD.map(([, v]) => Q.m2apply(U, v));
    function nameOf(o) {
      for (const [nm, c] of CARD) {
        const re = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] + c[3] * o[3], im = c[0] * o[1] - c[1] * o[0] + c[2] * o[3] - c[3] * o[2];
        if (Math.abs(Math.hypot(re, im) - 1) < 1e-7) { const f = cx(re, im); return (f === '1' ? '' : f === '−1' ? '−' : f) + nm; }
      }
      return ketExpr([o[0], o[2]], [o[1], o[3]], 1);
    }
    function draw(pos) {
      const T = Theme.tokens(), C6 = col(T), P = pos || outs().map(o => Q.blochOf(o));
      bv.set({ points: P.map((b, i) => ({ v: b, color: C6[i], r: 5, label: CARD[i][0] })), trails: trails.map((t, i) => ({ pts: t, color: C6[i] })) });
      const name = hist.length ? hist.map(e => lab(e[0], e[1])).reverse().join('') : 'I';
      seq.innerHTML = hist.length ? `circuit: <b>─${hist.map(e => lab(e[0], e[1])).join('─')}─</b> · total matrix ${name}` : 'No gates yet: every state is where it started.';
      const o = outs();
      table.innerHTML = C.table(['Input', 'Output'], CARD.map(([nm], i) => [nm, `${hist.length ? name : ''}${nm} = ${nameOf(o[i])}`]), 'compact');
    }
    async function apply(g, p) {
      if (busy) return; busy = true;
      const r = Q.gateRotation(g, p), start = outs().map(o => Q.blochOf(o));
      trails = start.map(b => [b]);
      bv.set({ axis: r.n });
      await animate(G.U.reduceMotion() ? 0 : 500 + 450 * Math.abs(r.theta) / PI, k => {
        const now = start.map((b, i) => { const q = Q.rotateVec(b, r.n, r.theta * k); trails[i].push(q); return q; });
        draw(now);
      });
      U = Q.m2mul(Q.gateMatrix(g, p), U); hist.push([g, p]);
      draw(); busy = false;
    }
    draw();
  });

  /* ------------------------------------------------------------------ 2.2: shot noise */
  C.widget('converge', body => {
    let p0 = 0.75, runs = [], seed = 7;
    const NS = []; for (let k = 0; k <= 60; k++) { const n = Math.round(10 ** (k / 15)); if (!NS.includes(n)) NS.push(n); }
    const sP = slider({ label: 'true P(0)', min: 0, max: 1, step: 0.01, value: p0, fmt: v => pct(v, 0), oninput: v => { p0 = v; runs = []; draw(); } });
    const plot = h('div'), read = h('div', { class: 'readout' });
    body.append(h('div', { class: 'row' }, h('div', { style: { flex: '1 1 260px', minWidth: 0 } }, sP.el),
      button('Run 10,000 shots', () => { run(); draw(); }, 'btn primary'), button('Run 5 more', () => { for (let i = 0; i < 5; i++) run(); draw(); }, 'btn'), button('Clear', () => { runs = []; draw(); }, 'btn')),
      plot, read);
    function run() {
      const rng = Q.mulberry32(seed++); let c = 0, j = 0; const pts = [];
      for (let n = 1; n <= 10000; n++) { if (rng() < p0) c++; if (n === NS[j]) { pts.push([n, c / n]); j++; } }
      runs.push(pts); if (runs.length > 8) runs.shift();
    }
    function draw() {
      const T = Theme.tokens(), se = n => Math.sqrt(p0 * (1 - p0) / n);
      linePlot(plot, {
        x: [1, 10000], y: [0, 1], xLog: true, height: 250, xTitle: 'number of shots N (log scale)', yTitle: 'estimate of P(0)', xName: 'N',
        xFmt: v => Math.round(v).toLocaleString(), yTicks: [0, 0.25, 0.5, 0.75, 1],
        bands: [{ points: NS.map(n => [n, Math.max(0, p0 - 2 * se(n)), Math.min(1, p0 + 2 * se(n))]), color: T.accent, alpha: 0.2 }],
        hlines: [{ y: p0, color: T.ink2, label: 'true value' }],
        series: runs.map((pts, i) => ({ points: pts, color: i === runs.length - 1 ? T.q : T.muted, width: i === runs.length - 1 ? 2 : 1.4, opacity: i === runs.length - 1 ? 1 : 0.55 }))
      });
      if (!runs.length) { read.innerHTML = 'Press "Run 10,000 shots". Each run measures the same state again and again, and the line shows the running estimate: the number of zeros so far divided by the number of shots so far. The shaded band is ±2 standard errors, ±2√(p(1 − p)/N).'; return; }
      const last = runs[runs.length - 1], at = n => last.find(p => p[0] === n)[1];
      read.innerHTML = [10, 100, 1000, 10000].map(n => `after ${n.toLocaleString()} shots: estimate ${num(at(n), 3)} (expected error ±${num(se(n), 3)})`).join('<br>') +
        '<br>Each tenfold increase in N shrinks the error by only √10 ≈ 3.2.';
    }
    draw();
    G.V.onResize(plot, draw);
  });
})(window);

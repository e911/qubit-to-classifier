/* Part VI — Noise and hardware */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, animate, reduceMotion, cx } = G.U;
  const { BlochView, linePlot } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  const CH = {
    bit: { name: 'Bit flip', map: p => ({ A: [1, 1 - 2 * p, 1 - 2 * p], c: [0, 0, 0] }), text: 'X with probability p: y and z shrink by (1 − 2p); x is untouched.' },
    phase: { name: 'Phase flip', map: p => ({ A: [1 - 2 * p, 1 - 2 * p, 1], c: [0, 0, 0] }), text: 'Z with probability p: x and y shrink by (1 − 2p). Relative phase is lost; z survives.' },
    bitphase: { name: 'Bit-phase flip', map: p => ({ A: [1 - 2 * p, 1, 1 - 2 * p], c: [0, 0, 0] }), text: 'Y with probability p: x and z shrink by (1 − 2p).' },
    depol: { name: 'Depolarizing', map: p => ({ A: [1 - p, 1 - p, 1 - p], c: [0, 0, 0] }), text: 'With probability p the state is replaced by the random state I/2: the whole ball shrinks by (1 − p).' },
    amp: { name: 'Amplitude damping', map: g => ({ A: [Math.sqrt(1 - g), Math.sqrt(1 - g), 1 - g], c: [0, 0, g] }), text: 'Energy loss (T1): z → (1 − γ)z + γ, x and y shrink by √(1 − γ). Everything is pulled toward |0⟩.' },
    pdamp: { name: 'Phase damping', map: l => ({ A: [Math.sqrt(1 - l), Math.sqrt(1 - l), 1], c: [0, 0, 0] }), text: 'Pure dephasing (T2): x and y shrink by √(1 − λ), populations stay.' }
  };
  function compose(m, k) { // apply the diagonal affine map k times
    const A = [1, 1, 1], c = [0, 0, 0];
    for (let j = 0; j < k; j++) for (let i = 0; i < 3; i++) { c[i] = m.A[i] * c[i] + m.c[i]; A[i] *= m.A[i]; }
    return { A, c };
  }

  /* ------------------------------------------------------------------ 6.1 */
  C.add({
    id: 'noise', part: 6, num: '6.1', title: 'Noise and mixed states',
    init(root) {
      const body = C.body(root, 'nz');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
      let ch = 'amp', p = 0.3, reps = 1, th = PI / 2, ph = PI / 2;
      const bv = new BlochView(left, { maxSize: 430, onDrag: v => { const a = Q.anglesOf(v); th = a.theta; ph = a.phi; sTh.set(th); sPh.set(ph); draw(); } });
      const cSeg = seg({ label: 'channel', value: ch, options: Object.entries(CH).map(([k, v]) => ({ value: k, label: v.name })), onchange: v => { ch = v; draw(); } });
      const sP = slider({ label: 'strength', min: 0, max: 1, step: 0.01, value: p, fmt: v => num(v, 2), oninput: v => { p = v; draw(); } });
      const sK = slider({ label: 'applied', min: 1, max: 20, step: 1, value: reps, fmt: v => v + '×', oninput: v => { reps = v; draw(); } });
      const sTh = slider({ label: 'state θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
      const sPh = slider({ label: 'state φ', min: 0, max: 2 * PI, step: 0.01, value: ph, snapPi: true, fmt: angle, oninput: v => { ph = v; draw(); } });
      const text = h('p', { class: 'note' }), read = h('div', { class: 'readout' });
      right.append(cSeg.el, text, sP.el, sK.el, sTh.el, sPh.el, read);
      function draw() {
        const T = Theme.tokens(), m = compose(CH[ch].map(p), reps);
        const r0 = Q.blochOf(Q.stateFromBloch(th, ph)), r1 = r0.map((v, i) => m.A[i] * v + m.c[i]);
        bv.set({
          ellipsoid: { A: [[m.A[0], 0, 0], [0, m.A[1], 0], [0, 0, m.A[2]]], c: m.c },
          vectors: [{ v: r0, color: T.q, main: false, drag: true, alpha: 0.9 }, { v: r1, color: T.q2, main: true }]
        });
        text.textContent = CH[ch].text;
        const L0 = Math.hypot(...r0), L1 = Math.hypot(...r1);
        read.innerHTML = `before (blue): length ${num(L0, 3)}, purity ${num((1 + L0 * L0) / 2, 3)}<br>after (orange): length <b>${num(L1, 3)}</b>, purity <b>${num((1 + L1 * L1) / 2, 3)}</b><br>after: (x, y, z) = (${num(r1[0], 3)}, ${num(r1[1], 3)}, ${num(r1[2], 3)})`;
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 6.2 */
  C.add({
    id: 'hardware', part: 6, num: '6.2', title: 'Decoherence and real hardware',
    init(root, ctx) {
      /* T1/T2 */
      {
        const body = C.body(root, 't12');
        const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
        const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
        let T1 = 100, T2 = 60, det = 0.03, t = 120, start = '+', playing = false;
        const bv = new BlochView(left, { maxSize: 400 });
        const s1 = slider({ label: 'T1 (μs)', min: 10, max: 200, step: 1, value: T1, fmt: v => String(v), oninput: v => { T1 = v; if (T2 > 2 * T1) { T2 = 2 * T1; s2.set(T2); } draw(); } });
        const s2 = slider({ label: 'T2 (μs)', min: 5, max: 400, step: 1, value: T2, fmt: v => String(v), oninput: v => { T2 = Math.min(v, 2 * T1); s2.set(T2); draw(); } });
        const sd = slider({ label: 'detuning (MHz)', min: 0, max: 0.1, step: 0.001, value: det, fmt: v => num(v, 3), oninput: v => { det = v; draw(); } });
        const st = slider({ label: 'time (μs)', min: 0, max: 300, step: 1, value: t, fmt: v => String(Math.round(v)), oninput: v => { t = v; draw(); } });
        const sSeg = seg({ label: 'start state', value: start, options: [{ value: '+', label: '|+⟩' }, { value: '1', label: '|1⟩' }, { value: 'mid', label: 'θ = π/3' }], onchange: v => { start = v; draw(); } });
        const play = button('Play', () => { playing = !playing; play.textContent = playing ? 'Pause' : 'Play'; if (playing) run(); }, 'btn primary');
        const plot = h('div'), read = h('div', { class: 'readout' });
        right.append(h('div', { class: 'row' }, sSeg.el, play), s1.el, s2.el, sd.el, st.el, read, plot);
        const r0 = () => start === '+' ? [1, 0, 0] : start === '1' ? [0, 0, -1] : [Math.sin(PI / 3), 0, Math.cos(PI / 3)];
        const at = tt => { const a = r0(), w = 2 * PI * det, e2 = Math.exp(-tt / T2), e1 = Math.exp(-tt / T1); return [e2 * (a[0] * Math.cos(w * tt) - a[1] * Math.sin(w * tt)), e2 * (a[0] * Math.sin(w * tt) + a[1] * Math.cos(w * tt)), 1 - (1 - a[2]) * e1]; };
        async function run() {
          if (t >= 299) t = 0;
          while (playing && body.isConnected && t < 300) {
            const from = t; await animate(reduceMotion() ? 0 : 120, k => { t = Math.min(300, from + 4 * k); st.set(t); draw(); }, { linear: true });
          }
          playing = false; play.textContent = 'Play';
        }
        function draw() {
          const T = Theme.tokens(), trail = []; for (let k = 0; k <= 200; k++) { const tt = t * k / 200; trail.push(at(tt)); }
          const r = at(t);
          bv.set({ vectors: [{ v: r, main: true }], trail });
          read.innerHTML = `⟨X⟩ = <b>${num(r[0], 3)}</b> · ⟨Y⟩ = <b>${num(r[1], 3)}</b> · ⟨Z⟩ = <b>${num(r[2], 3)}</b> · length ${num(Math.hypot(...r), 3)}`;
          const px = [], pz = []; for (let k = 0; k <= 300; k += 2) { const q = at(k); px.push([k, q[0]]); pz.push([k, q[2]]); }
          linePlot(plot, { height: 180, x: [0, 300], y: [-1, 1], yTicks: [-1, 0, 1], xTitle: 'time (μs)', xName: 't', series: [{ name: '⟨X⟩ (phase)', color: T.q, points: px }, { name: '⟨Z⟩ (population)', color: T.q2, points: pz }], vlines: [{ x: t, color: T.lineStrong }] });
        }
        draw();
        ctx.onLeave(() => { playing = false; });
      }
      /* routing */
      {
        const body = C.body(root, 'route');
        let topo = 'line', a = 0, b = 4;
        const N = 6;
        const tSeg = seg({ label: 'layout', value: topo, options: [{ value: 'line', label: 'Line' }, { value: 'ring', label: 'Ring' }], onchange: v => { topo = v; draw(); } });
        const aSeg = seg({ label: 'control', value: a, options: [...Array(N).keys()].map(i => ({ value: i, label: 'q' + i })), onchange: v => { a = v; draw(); } });
        const bSeg = seg({ label: 'target', value: b, options: [...Array(N).keys()].map(i => ({ value: i, label: 'q' + i })), onchange: v => { b = v; draw(); } });
        const pic = h('div', { style: { overflowX: 'auto' } }), read = h('div', { class: 'readout' });
        body.append(h('div', { class: 'row' }, tSeg.el), h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Control' }), aSeg.el), h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Target' }), bSeg.el), pic, read);
        function path() {
          if (topo === 'line') { const s = Math.sign(b - a) || 1, p = []; for (let i = a; i !== b + s; i += s) p.push(i); return p; }
          const fw = (b - a + N) % N, bw = (a - b + N) % N, p = [a]; let i = a;
          if (fw <= bw) while (i !== b) { i = (i + 1) % N; p.push(i); } else while (i !== b) { i = (i - 1 + N) % N; p.push(i); }
          return p;
        }
        function draw() {
          const T = Theme.tokens(), W = 520, H = topo === 'line' ? 110 : 220;
          const pos = i => topo === 'line' ? [50 + i * 84, 55] : [W / 2 + 85 * Math.cos(-PI / 2 + 2 * PI * i / N), H / 2 + 85 * Math.sin(-PI / 2 + 2 * PI * i / N)];
          const edges = []; for (let i = 0; i < N - 1; i++) edges.push([i, i + 1]); if (topo === 'ring') edges.push([N - 1, 0]);
          const pth = a === b ? [a] : path(), used = new Set(); for (let i = 0; i < pth.length - 1; i++) used.add(pth[i] + '-' + pth[i + 1]), used.add(pth[i + 1] + '-' + pth[i]);
          let s = `<svg class="plot" width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;min-width:420px" role="img" aria-label="Coupling map with a routed CNOT">`;
          edges.forEach(([i, j]) => { const [x1, y1] = pos(i), [x2, y2] = pos(j), on = used.has(i + '-' + j); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${on ? T.accent : T.lineStrong}" stroke-width="${on ? 4 : 2}" stroke-linecap="round"/>`; });
          for (let i = 0; i < N; i++) {
            const [x, y] = pos(i), role = i === a ? 'c' : i === b ? 't' : pth.includes(i) ? 'p' : '';
            s += `<circle cx="${x}" cy="${y}" r="19" fill="${role === 'c' ? T.q : role === 't' ? T.q2 : T.surface}" stroke="${T.ink}" stroke-width="1.5"/>`;
            s += `<text x="${x}" y="${y + 4.5}" text-anchor="middle" style="fill:${role === 'c' || role === 't' ? '#fff' : T.ink};font-family:${T.fontMono};font-weight:600;font-size:12px">q${i}</text>`;
          }
          s += '</svg>';
          pic.innerHTML = s;
          if (a === b) { read.innerHTML = 'Pick two different qubits.'; return; }
          const d = pth.length - 1, swaps = Math.max(0, d - 1), steps = [];
          for (let i = 0; i < swaps; i++) steps.push(`SWAP(q${pth[i]}, q${pth[i + 1]})`);
          steps.push(`CNOT(q${pth[swaps]} → q${b})`);
          read.innerHTML = `Distance ${d}. ${swaps ? `Needs <b>${swaps} SWAP${swaps > 1 ? 's' : ''}</b> first = <b>${3 * swaps} extra CNOTs</b>, so ${3 * swaps + 1} CNOTs instead of 1.` : 'Neighbours: a single CNOT, no routing needed.'}<br>Routed sequence: ${steps.join(' → ')}` + (swaps ? '<br>(The control\'s state now lives on a different physical qubit; the compiler keeps track of the new layout.)' : '');
        }
        draw();
      }
    }
  });

  /* ------------------------------------------------------------------ 6.1: mixtures versus superpositions */
  C.widget('mix', body => {
    let A = [0, 0], Bs = [PI, 0], w = 0.5;
    const grid = h('div', { class: 'g-sphere' }), left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right); body.appendChild(grid);
    const bv = new BlochView(left, { maxSize: 420, shadow: false, onDrag: (pt, i) => { const a = Q.anglesOf(pt); if (i === 0) A = [a.theta, a.phi]; else Bs = [a.theta, a.phi]; draw(); } });
    const sW = slider({ label: 'weight of ψ₁', min: 0, max: 1, step: 0.01, value: w, fmt: v => pct(v, 0), oninput: v => { w = v; draw(); } });
    const pres = h('div', { class: 'row tight' }, ...[
      ['|0⟩ or |1⟩, 50:50', [0, 0], [PI, 0], 0.5], ['|+⟩ or |−⟩, 50:50', [PI / 2, 0], [PI / 2, PI], 0.5],
      ['|0⟩ or |+⟩, 50:50', [0, 0], [PI / 2, 0], 0.5], ['always |+⟩', [PI / 2, 0], [PI / 2, PI], 1]
    ].map(([l, a, b, ww]) => button(l, () => { A = a.slice(); Bs = b.slice(); w = ww; sW.set(w); draw(); }, 'btn')));
    const rho = h('div', { class: 'eqn' }), read = h('div', { class: 'readout' });
    right.append(h('p', { class: 'caption', text: 'Prepare ψ₁ with probability w and ψ₂ otherwise. Drag either arrow tip.' }), sW.el, pres, h('p', { class: 'panel-label', text: 'Density matrix' }), rho, read);
    function draw() {
      const T = Theme.tokens(), r1 = Q.blochOf(Q.stateFromBloch(A[0], A[1])), r2 = Q.blochOf(Q.stateFromBloch(Bs[0], Bs[1]));
      const r = r1.map((v, i) => w * v + (1 - w) * r2[i]), L = Math.hypot(...r);
      const chord = []; for (let k = 0; k <= 30; k++) { const t = k / 30; chord.push(r1.map((v, i) => (1 - t) * v + t * r2[i])); }
      bv.set({ vectors: [{ v: r1, color: T.q, drag: true, label: 'ψ₁', width: 2.2 }, { v: r2, color: T.q2, drag: true, label: 'ψ₂', width: 2.2 }, { v: r, color: T.ink, main: true, label: 'ρ' }], trail: chord, trailColor: T.accent });
      const [x, y, z] = r, e = (re, im) => cx(re, im, { d: 3 });
      rho.innerHTML = `<span>ρ =</span> ${C.mat([[e((1 + z) / 2, 0), e(x / 2, -y / 2)], [e(x / 2, y / 2), e((1 - z) / 2, 0)]])}`;
      read.innerHTML = `Bloch vector of the mixture: (${num(x, 3)}, ${num(y, 3)}, ${num(z, 3)}), length <b>${num(L, 3)}</b><br>purity Tr(ρ²) = (1 + |r|²)/2 = <b>${num((1 + L * L) / 2, 3)}</b>${L > 0.999 ? ' (a pure state)' : L < 1e-3 ? ' (maximally mixed: a random bit along every axis)' : ''}<br>P(0) = ${pct((1 + z) / 2)} · P(+) = ${pct((1 + x) / 2)} · P(+i) = ${pct((1 + y) / 2)}`;
    }
    draw();
  });

  /* ------------------------------------------------------------------ 6.2: the error budget of a circuit */
  C.widget('budget', body => {
    let le = -2.5, lN = 2.5;   // log10 of the error per two-qubit gate, log10 of the number of gates
    const sE = slider({ label: 'error per gate', min: -4, max: -1, step: 0.01, value: le, fmt: v => pct(10 ** v, 10 ** v < 0.001 ? 3 : 2), oninput: v => { le = v; draw(); } });
    const sN = slider({ label: 'two-qubit gates', min: 0, max: 5, step: 0.01, value: lN, fmt: v => Math.round(10 ** v).toLocaleString(), oninput: v => { lN = v; draw(); } });
    const pres = h('div', { class: 'row tight' }, ...[['1% (early devices)', -2], ['0.3% (good devices)', Math.log10(0.003)], ['0.1% (best devices)', -3], ['0.01%', -4]].map(([l, v]) => button(l, () => { le = v; sE.set(v); draw(); }, 'btn')));
    const plot = h('div'), read = h('div', { class: 'readout' });
    body.append(h('div', { class: 'grid2' }, h('div', { class: 'stack' }, sE.el, sN.el, pres, read), plot));
    function draw() {
      const T = Theme.tokens(), eps = 10 ** le, N = Math.round(10 ** lN), F = Math.pow(1 - eps, N), lam = N * eps;
      const curve = e => { const pts = []; for (let k = 0; k <= 100; k++) { const n = 10 ** (5 * k / 100); pts.push([n, Math.pow(1 - e, n)]); } return pts; };
      linePlot(plot, { height: 230, x: [1, 1e5], y: [0, 1], xLog: true, yTicks: [0, 0.5, 1], xTitle: 'two-qubit gates in the circuit (log scale)', yTitle: 'chance of no error at all', xName: 'gates', xFmt: v => Math.round(v).toLocaleString(),
        series: [{ name: '1% per gate', color: T.q2, points: curve(0.01), width: 1.4, opacity: 0.7 }, { name: '0.01% per gate', color: T.q3, points: curve(0.0001), width: 1.4, opacity: 0.7 }, { name: `${pct(eps, eps < 0.001 ? 3 : 2)} per gate`, color: T.q, points: curve(eps) }],
        markers: [{ x: N, y: F, color: T.q }], hlines: [{ y: 0.5, color: T.lineStrong }] });
      read.innerHTML = `expected number of errors N·ε = <b>${num(lam, 2)}</b><br>chance the whole run is error-free ≈ (1 − ε)<sup>N</sup> ≈ e<sup>−Nε</sup> = <b>${pct(F)}</b><br>largest circuit with at least a 50% chance: about ln 2 / ε ≈ <b>${Math.round(Math.log(2) / eps).toLocaleString()}</b> gates`;
    }
    draw();
    G.V.onResize(plot, draw);
  });

  /* ------------------------------------------------------------------ 6.2: the repetition code */
  C.widget('repetition', body => {
    let p = 0.1, d = 3, trial = null;
    const rng = Q.mulberry32(2024);
    const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
    const pL = (pp, dd) => { let s = 0; for (let k = (dd + 1) / 2; k <= dd; k++) s += binom(dd, k) * pp ** k * (1 - pp) ** (dd - k); return s; };
    const sP = slider({ label: 'flip chance p', min: 0, max: 0.5, step: 0.005, value: p, fmt: v => pct(v, 1), oninput: v => { p = v; trial = null; draw(); } });
    const dSeg = seg({ label: 'copies', value: d, options: [1, 3, 5, 7].map(v => ({ value: v, label: v === 1 ? 'no code' : `${v} copies` })), onchange: v => { d = v; trial = null; draw(); } });
    const demo = h('div', { class: 'readout' }), plot = h('div'), read = h('div', { class: 'readout' });
    body.append(h('div', { class: 'grid2' }, h('div', { class: 'stack' }, h('div', { class: 'row' }, dSeg.el), sP.el,
      h('div', { class: 'row' }, button('Send one bit', () => { one(); draw(); }, 'btn'), button('Send 10,000 bits', () => { many(); draw(); }, 'btn primary')), demo, read), plot));
    function one() {
      const flips = []; for (let i = 0; i < d; i++) flips.push(rng() < p ? 1 : 0);
      const ones = flips.reduce((a, b) => a + b, 0);
      trial = { kind: 'one', flips, ok: ones <= (d - 1) / 2 };
    }
    function many() {
      let bad = 0; const M = 10000;
      for (let t = 0; t < M; t++) { let ones = 0; for (let i = 0; i < d; i++) if (rng() < p) ones++; if (ones > (d - 1) / 2) bad++; }
      trial = { kind: 'many', bad, M };
    }
    function draw() {
      const T = Theme.tokens(), cols = { 1: T.muted, 3: T.q, 5: T.q2, 7: T.q3 }, series = [];
      for (const dd of [1, 3, 5, 7]) { const pts = []; for (let k = 0; k <= 100; k++) { const x = 0.5 * k / 100; pts.push([x, pL(x, dd)]); } series.push({ name: dd === 1 ? 'no code' : `${dd} copies`, color: cols[dd], points: pts, width: dd === d ? 2.6 : 1.4, opacity: dd === d ? 1 : 0.55 }); }
      linePlot(plot, { height: 240, x: [0, 0.5], y: [0, 0.5], yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5], xTitle: 'chance p that each copy flips', yTitle: 'chance the decoded bit is wrong', xName: 'p', xFmt: v => pct(v, 0), yFmt: v => pct(v, 0), series, markers: [{ x: p, y: pL(p, d), color: cols[d] }] });
      const L = pL(p, d);
      read.innerHTML = d === 1 ? `Without a code, the bit is wrong with probability p = <b>${pct(p, 2)}</b>.` :
        `Majority vote of ${d} copies fails when ${(d + 1) / 2} or more flip: <b>${pct(L, 3)}</b>, compared with ${pct(p, 2)} for a single copy.` + (p < 0.5 ? (L < p ? ' The code helps.' : '') : '');
      if (!trial) demo.innerHTML = `Encode the bit 0 as ${'0'.repeat(d)}, let noise flip each copy with chance p, then decode by majority vote.`;
      else if (trial.kind === 'one') demo.innerHTML = `sent ${'0'.repeat(d)} → received <b>${trial.flips.join('')}</b> → decoded <b>${trial.ok ? 0 : 1}</b> ${trial.ok ? '(correct)' : '(wrong!)'}`;
      else demo.innerHTML = `${trial.M.toLocaleString()} bits sent: <b>${trial.bad.toLocaleString()}</b> decoded wrongly (${pct(trial.bad / trial.M, 2)}); the formula predicts ${pct(L, 2)}.`;
    }
    draw();
    G.V.onResize(plot, draw);
  });
})(window);

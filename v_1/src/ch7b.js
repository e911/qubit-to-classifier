/* Part VII (second half) — training, kernels, trainability, next steps; appendix */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, reduceMotion, mix, codeBlock } = G.U;
  const { BlochView, linePlot, dprOf } = G.V;
  const Q = G.QSim, M = G.QML, C = G.C, K = C.K, PI = Math.PI;
  const Plane = (...a) => G.QPlane(...a);
  const classColor = (y, T) => y ? T.neg : T.q;
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));

  function modelCircuit(nq, L) {
    const cols = [];
    for (let l = 0; l < L; l++) {
      cols.push(Array.from({ length: nq }, () => ({ g: 'RY', p: 0, t: 'x₁' })));
      cols.push(Array.from({ length: nq }, () => ({ g: 'RZ', p: 0, t: 'x₂' })));
      cols.push(Array.from({ length: nq }, () => ({ g: 'RY', p: 0, t: 'b' })));
      if (nq === 2 && l < L - 1) cols.push([{ g: 'CTRL' }, { g: 'Z' }]);
    }
    const m = Array(nq).fill(null); m[0] = { g: 'M' }; cols.push(m);
    return { n: nq, cols };
  }

  /* ------------------------------------------------------------------ 7.5 */
  C.add({
    id: 'train', part: 7, num: '7.5', title: 'Train a quantum classifier',
    init(root, ctx) {
      const body = C.body(root, 'tr');
      const S = { kind: 'circle', nq: 1, L: 3, lr: 0.08, shots: 0, seed: 1 };
      let MAX = 300; const rng = Q.mulberry32(5);
      let train, test, model, opt, epoch = 0, evals = 0, H = null, running = false, hover = -1, last = null, sc = null;
      const dSeg = seg({ label: 'dataset', value: S.kind, options: [{ value: 'circle', label: 'Circle' }, { value: 'xor', label: 'XOR' }, { value: 'moons', label: 'Moons' }, { value: 'wave', label: 'Wave' }], onchange: v => { S.kind = v; reset(); } });
      const qSeg = seg({ label: 'qubits', value: S.nq, options: [{ value: 1, label: '1 qubit' }, { value: 2, label: '2 qubits' }], onchange: v => { S.nq = v; reset(); } });
      const shSeg = seg({ label: 'shots', value: S.shots, options: [{ value: 0, label: 'exact' }, { value: 1000, label: '1,000 shots' }, { value: 100, label: '100 shots' }], onchange: v => { S.shots = v; } });
      const sL = slider({ label: 'layers', min: 1, max: 6, step: 1, value: S.L, fmt: v => String(v), oninput: v => { S.L = v; reset(); } });
      const sLr = slider({ label: 'learning rate', min: 0.01, max: 0.3, step: 0.01, value: S.lr, fmt: v => num(v, 2), oninput: v => { S.lr = v; } });
      const runBtn = button('Train', () => { running ? stop() : start(); }, 'btn primary');
      const stepBtn = button('One epoch', () => { stop(); stepOnce(); draw(); }, 'btn');
      const resetBtn = button('New random weights', () => { stop(); S.seed++; reset(); }, 'btn');
      body.append(h('div', { class: 'row' }, dSeg.el, qSeg.el), h('div', { class: 'grid2' }, sL.el, sLr.el), h('div', { class: 'row' }, shSeg.el, runBtn, stepBtn, resetBtn));
      const grid = h('div', { class: 'grid2', style: { marginTop: '12px' } }), Lc = h('div', { class: 'stack' }), Rc = h('div', { class: 'stack' }); grid.append(Lc, Rc); body.appendChild(grid);
      const plane = Plane(Lc, { max: 380, caption: 'Background: model output f(x). Blue predicts the blue class, red the red class; the pale band is where the model is unsure.' });
      const stats = h('div', { class: 'stats' }), pLoss = h('div'), pAcc = h('div');
      const bh = h('div'), bcap = h('div', { class: 'caption' });
      Rc.append(stats, pLoss, pAcc, h('div', { class: 'row', style: { alignItems: 'center', flexWrap: 'nowrap', gap: '12px' } }, h('div', { style: { width: '150px', flex: '0 0 150px' } }, bh), bcap));
      const bv = new BlochView(bh, { compact: true, maxSize: 150, shadow: false });
      const circHost = h('div');
      body.append(h('p', { class: 'panel-label', style: { marginTop: '14px' }, text: 'The model circuit' }), circHost);
      function reset() {
        train = M.makeData(S.kind, 80, 101); test = M.makeData(S.kind, 80, 202);
        model = M.makeModel(S.nq, S.L, S.seed); opt = M.adam(model.np, S.lr); sc = new Float64Array(model.gates.length);
        epoch = 0; evals = 0; H = { lt: [], le: [], at: [], ae: [] }; record();
        circHost.innerHTML = ''; new G.CircuitLab.CircuitView(circHost, { editable: false, showPlayhead: false }).set(modelCircuit(S.nq, S.L), 99);
        draw();
      }
      function record() {
        const a = M.evaluate(model, train.X, train.y), b = M.evaluate(model, test.X, test.y);
        H.lt.push([epoch, a.loss]); H.le.push([epoch, b.loss]); H.at.push([epoch, a.acc]); H.ae.push([epoch, b.acc]); last = { a, b };
      }
      function stepOnce() {
        if (epoch >= MAX) return;
        const g = M.gradient(model, train.X, train.y, S.shots, rng);
        opt.lr = S.lr; opt.step(model.params, g.grad); evals += g.evals; epoch++; record();
      }
      function start() { if (epoch >= MAX) MAX += 300; running = true; runBtn.textContent = 'Pause'; loop(); }
      function stop() { running = false; runBtn.textContent = epoch >= MAX ? 'Train 300 more' : 'Train'; }
      async function loop() {
        while (running && body.isConnected) {
          const t0 = performance.now();
          do { stepOnce(); } while (performance.now() - t0 < 14 && epoch < MAX);
          draw();
          if (epoch >= MAX) { stop(); break; }
          await frame();
        }
      }
      function draw() {
        const T = Theme.tokens();
        const pts = train.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(train.y[i], T), ring: hover === i }))
          .concat(test.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(test.y[i], T), hollow: true, r: 3.6, ring: hover === 80 + i })));
        plane.draw((x, y) => M.predict(model, [x, y], sc), pts, 52);
        const runs = S.shots ? `${evals.toLocaleString()} × ${S.shots.toLocaleString()} shots` : evals.toLocaleString();
        stats.innerHTML = `<div class="stat"><span class="k">epoch</span><span class="v">${epoch}</span></div><div class="stat"><span class="k">train accuracy</span><span class="v">${pct(last.a.acc, 0)}</span></div><div class="stat"><span class="k">test accuracy</span><span class="v">${pct(last.b.acc, 0)}</span></div><div class="stat"><span class="k">circuit evaluations</span><span class="v" style="font-size:1rem">${runs}</span></div><div class="stat"><span class="k">parameters</span><span class="v">${model.np}</span></div>`;
        const xmax = Math.max(10, epoch);
        linePlot(pLoss, { height: 150, x: [0, xmax], y: [0, Math.max(0.8, ...H.lt.map(p => p[1]), ...H.le.map(p => p[1]))], yTitle: 'loss', xName: 'epoch', series: [{ name: 'train', color: T.q, points: H.lt }, { name: 'test', color: T.q2, points: H.le }] });
        linePlot(pAcc, { height: 150, x: [0, xmax], y: [0.3, 1], yTicks: [0.5, 0.75, 1], yFmt: v => pct(v, 0), yFmt2: v => pct(v, 0), xTitle: 'epoch', yTitle: 'accuracy', xName: 'epoch', series: [{ name: 'train', color: T.q, points: H.at }, { name: 'test', color: T.q2, points: H.ae }] });
        const idx = hover >= 0 ? hover : 0, x = idx < 80 ? train.X[idx] : test.X[idx - 80], lab = idx < 80 ? train.y[idx] : test.y[idx - 80];
        const st = M.modelState(model, x), b = st.bloch(0), f = st.expZ(0);
        bv.set({ vectors: [{ v: b, main: true, color: classColor(lab, T) }] });
        bcap.innerHTML = `Final state of q0 for x = (${num(x[0], 2)}, ${num(x[1], 2)}), a <b>${lab ? 'red' : 'blue'}</b> point. f = ⟨Z⟩ = <b>${num(f, 3)}</b> → predicts <b>${f < 0 ? 'red' : 'blue'}</b>.${S.nq === 2 ? ' Shorter arrow = q0 entangled with q1.' : ''}`;
      }
      plane.canvas.addEventListener('pointermove', e => {
        const all = train.X.concat(test.X).map(x => ({ x: x[0], y: x[1] }));
        const i = plane.pick(e, all); if (i !== hover && i >= 0) { hover = i; if (!running) draw(); }
      });
      reset();
      setTimeout(() => { if (body.isConnected && epoch === 0 && !running) start(); }, 700);
      ctx.onLeave(() => stop());
    }
  });

  /* ------------------------------------------------------------------ 7.6 */
  C.add({
    id: 'kernels', part: 7, num: '7.6', title: 'Quantum kernels',
    init(root) {
      const body = C.body(root, 'kr');
      const S = { kind: 'circle', fm: 'zz', c: 0.25, lam: 0.05, view: 'dec', sel: 0 };
      let tr, te, states, K, alpha, order;
      const dSeg = seg({ label: 'dataset', value: S.kind, options: [{ value: 'circle', label: 'Circle' }, { value: 'xor', label: 'XOR' }, { value: 'moons', label: 'Moons' }], onchange: v => { S.kind = v; S.sel = 0; fit(); } });
      const fSeg = seg({ label: 'feature map', value: S.fm, options: [{ value: 'angle', label: 'Angle encoding' }, { value: 'zz', label: 'ZZ feature map' }], onchange: v => { S.fm = v; fit(); } });
      const sC = slider({ label: 'bandwidth c', min: 0.05, max: 2, step: 0.01, value: S.c, fmt: v => num(v, 2), oninput: v => { S.c = v; fit(); } });
      const sLam = slider({ label: 'regularization λ', min: -3, max: 0, step: 0.05, value: Math.log10(S.lam), fmt: v => num(10 ** v, 3), oninput: v => { S.lam = 10 ** v; fit(); } });
      const vSeg = seg({ label: 'right panel', value: S.view, options: [{ value: 'dec', label: 'Decision function' }, { value: 'sim', label: 'Similarity to selected point' }], onchange: v => { S.view = v; draw(); } });
      body.append(h('div', { class: 'row' }, dSeg.el, fSeg.el), h('div', { class: 'grid2' }, sC.el, sLam.el));
      const circHost = h('div'); body.appendChild(circHost);
      const grid = h('div', { class: 'grid2', style: { marginTop: '10px' } }), L = h('div', { class: 'stack' }), R = h('div', { class: 'stack' }); grid.append(L, R); body.appendChild(grid);
      const kc = h('canvas', { role: 'img', 'aria-label': 'kernel matrix, training points sorted by class' });
      const read = h('div', { class: 'readout' });
      L.append(h('p', { class: 'panel-label', text: 'Kernel matrix (training points sorted by class)' }), kc, h('div', { class: 'caption', text: 'Each pixel is k(xᵢ, xⱼ): background colour = 0, full blue = 1. A good kernel shows two strong diagonal blocks (same class) and weak off-diagonal blocks.' }), read);
      R.append(vSeg.el);
      const plane = Plane(R, { max: 340 });
      function fit() {
        tr = M.makeData(S.kind, 60, 101); te = M.makeData(S.kind, 100, 202);
        states = tr.X.map(x => M.featureState(S.fm, x, S.c));
        K = M.kernelMatrix(states);
        alpha = M.kernelRidge(K, states.length, tr.y.map(v => v ? -1 : 1), S.lam);
        order = tr.y.map((v, i) => i).sort((a, b) => tr.y[a] - tr.y[b] || a - b);
        circHost.innerHTML = '';
        const circ = S.fm === 'zz'
          ? { n: 2, cols: [[{ g: 'H' }, { g: 'H' }], [{ g: 'P', p: 0, t: '2φ₁' }, { g: 'P', p: 0, t: '2φ₂' }], [{ g: 'CTRL' }, { g: 'X' }], [null, { g: 'P', p: 0, t: 'φ₁₂' }], [{ g: 'CTRL' }, { g: 'X' }], [{ g: 'H' }, { g: 'H' }], [{ g: 'P', p: 0, t: '2φ₁' }, { g: 'P', p: 0, t: '2φ₂' }], [{ g: 'CTRL' }, { g: 'X' }], [null, { g: 'P', p: 0, t: 'φ₁₂' }], [{ g: 'CTRL' }, { g: 'X' }]] }
          : { n: 2, cols: [[{ g: 'RY', p: 0, t: 'cπx₁' }, { g: 'RY', p: 0, t: 'cπx₂' }]] };
        new G.CircuitLab.CircuitView(circHost, { editable: false, showPlayhead: false }).set(circ, 99);
        draw();
      }
      const fAt = x => { const s = M.featureState(S.fm, x, S.c); let v = 0; for (let i = 0; i < states.length; i++) v += alpha[i] * M.kernelValue(s, states[i]); return v; };
      function draw() {
        const T = Theme.tokens(), n = states.length;
        const size = Math.min(280, L.clientWidth || 260), dpr = dprOf();
        kc.width = Math.round(size * dpr); kc.height = Math.round(size * dpr); kc.style.width = size + 'px'; kc.style.height = size + 'px';
        const ctx = kc.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cell = size / n;
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
          const v = K[order[a] * n + order[b]], [r, g, bb] = mix(T.surface, T.q, v);
          ctx.fillStyle = `rgb(${r},${g},${bb})`; ctx.fillRect(b * cell, a * cell, cell + 0.6, cell + 0.6);
        }
        const nb = tr.y.filter(v => !v).length;
        ctx.strokeStyle = T.ink2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nb * cell, 0); ctx.lineTo(nb * cell, size); ctx.moveTo(0, nb * cell); ctx.lineTo(size, nb * cell); ctx.stroke();
        let same = 0, ns = 0, diff = 0, nd = 0, off = 0;
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b) { const v = K[a * n + b]; off += v; if (tr.y[a] === tr.y[b]) { same += v; ns++; } else { diff += v; nd++; } }
        const acc = D => D.X.reduce((s, x, i) => s + (((fAt(x) < 0) ? 1 : 0) === D.y[i] ? 1 : 0), 0) / D.X.length;
        const at = acc(tr), ae = acc(te);
        read.innerHTML = `train accuracy <b>${pct(at, 0)}</b> · test accuracy <b>${pct(ae, 0)}</b><br>average similarity: same class ${num(same / ns, 3)}, different class ${num(diff / nd, 3)}, all pairs ${num(off / (n * n - n), 3)}` + (at - ae > 0.15 ? '<br><span class="pill bad">memorizing: the kernel is too narrow</span>' : '');
        const pts = tr.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(tr.y[i], T), ring: S.view === 'sim' && i === S.sel })).concat(te.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(te.y[i], T), hollow: true, r: 3.2 })));
        if (S.view === 'dec') plane.draw((x, y) => Math.max(-1, Math.min(1, fAt([x, y]))), pts, 44);
        else {
          const s0 = states[S.sel];
          const cv = plane.canvas, sz = Math.min(340, R.clientWidth || 300);
          const fn = (x, y) => M.kernelValue(s0, M.featureState(S.fm, [x, y], S.c));
          G.V.field(cv, sz, sz, 48, fn, v => mix(T.surface, T.q, v));
          const c2 = cv.getContext('2d'); G.V.drawPoints(c2, pts, sz, sz, T);
        }
      }
      plane.canvas.addEventListener('click', e => {
        const i = plane.pick(e, tr.X.map(x => ({ x: x[0], y: x[1] })));
        if (i >= 0) { S.sel = i; S.view = 'sim'; vSeg.set('sim'); draw(); }
      });
      fit();
    }
  });

  /* ------------------------------------------------------------------ 7.7 */
  C.add({
    id: 'plateaus', part: 7, num: '7.7', title: 'Barren plateaus',
    init(root, ctx) {
      /* variance experiment */
      {
        const body = C.body(root, 'bp');
        let L = 6, samples = 160, token = 0, res = [];
        const lSeg = seg({ label: 'layers', value: L, options: [{ value: 2, label: '2 layers' }, { value: 6, label: '6 layers' }, { value: 20, label: '20 layers' }], onchange: v => { L = v; run(); } });
        const status = h('span', { class: 'note', 'aria-live': 'polite' });
        const plot = h('div'), read = h('div', { class: 'readout' });
        body.append(h('div', { class: 'row' }, lSeg.el, button('Run again', () => run(), 'btn'), status), plot, read);
        function draw() {
          const T = Theme.tokens();
          linePlot(plot, { height: 260, x: [2, 10], y: [1e-8, 1], yLog: true, xTicks: [2, 3, 4, 5, 6, 7, 8, 9, 10], xTitle: 'qubits n', yTitle: 'Var[∂C/∂θ₁]', xName: 'n', yFmt2: v => v.toExponential(2).replace('-', '−'),
            series: [{ name: 'global cost', color: T.q, points: res.map(r => [r.n, Math.max(r.vg, 1e-12)]), dots: true }, { name: 'local cost', color: T.q2, points: res.map(r => [r.n, Math.max(r.vl, 1e-12)]), dots: true }] });
          if (res.length >= 2) {
            const a = res[0], b = res[res.length - 1], k = b.n - a.n;
            const fg = (a.vg / b.vg) ** (1 / k), fl = (a.vl / b.vl) ** (1 / k);
            read.innerHTML = `From n = ${a.n} to n = ${b.n}: the global-cost variance shrinks by about <b>×${num(fg, 1)} per added qubit</b>, the local-cost variance by about <b>×${num(fl, 1)}</b>. A constant factor per qubit is exponential decay; ${L <= 6 ? 'at this depth the local cost decays much more slowly.' : 'at this depth both costs decay exponentially: deep random circuits plateau whatever you measure.'}`;
          }
        }
        async function run() {
          const my = ++token; res = []; draw();
          for (let n = 2; n <= 10; n++) {
            const rng = Q.mulberry32(1000 * n + L), g = [], l = [];
            let t0 = performance.now();
            for (let s = 0; s < samples; s++) {
              const [a, b] = M.heaGradBoth(n, L, rng); g.push(a); l.push(b);
              if (performance.now() - t0 > 14) { status.textContent = `Computing n = ${n}…`; await frame(); t0 = performance.now(); if (my !== token || !body.isConnected) return; }
            }
            res.push({ n, vg: M.variance(g), vl: M.variance(l) }); draw();
            await frame(); if (my !== token || !body.isConnected) return;
          }
          status.textContent = `Done: ${samples} random circuits per point.`;
        }
        run();
        ctx.onLeave(() => { token++; });
      }
      /* landscape slice */
      {
        const body = C.body(root, 'bp-slice');
        const grid = h('div', { class: 'grid2' }), P1 = h('div'), P2 = h('div'); grid.append(P1, P2); body.appendChild(grid);
        const read = h('div', { class: 'readout' }); body.appendChild(read);
        const T = Theme.tokens();
        const a = M.heaSlice(2, 6, 11), b = M.heaSlice(10, 6, 11);
        const rng2 = v => Math.max(...v.map(p => p[1])) - Math.min(...v.map(p => p[1]));
        linePlot(P1, { height: 170, x: [-PI, PI], y: [0, 1], yTicks: [0, 0.5, 1], xTicks: [-PI, 0, PI], xFmt: v => angle(v), yTitle: '2 qubits: global cost', xName: 'θ₁', series: [{ name: 'cost', color: T.q, points: a }] });
        linePlot(P2, { height: 170, x: [-PI, PI], y: [0, 1], yTicks: [0, 0.5, 1], xTicks: [-PI, 0, PI], xFmt: v => angle(v), yTitle: '10 qubits: global cost', xName: 'θ₁', yFmt2: v => v.toExponential(2), series: [{ name: 'cost', color: T.q, points: b }] });
        const pbar = b.reduce((s, p) => s + p[1], 0) / b.length, need = pbar * (1 - pbar) / Math.max(rng2(b), 1e-12) ** 2;
        read.innerHTML = `Same depth (6 layers), same y-axis. The cost swings by <b>${num(rng2(a), 3)}</b> with 2 qubits but by only <b>${rng2(b).toExponential(1).replace('-', '−')}</b> with 10, about ${Math.round(rng2(a) / rng2(b)).toLocaleString()} times less. Just resolving that swing above shot noise takes roughly ${Math.round(need).toLocaleString()} shots per evaluation, and each added qubit multiplies the requirement.`;
      }
    }
  });

  /* ------------------------------------------------------------------ 7.8 */
  const PENNY = `# pip install pennylane
import numpy as onp
import pennylane as qml
from pennylane import numpy as np

n_qubits, n_layers = 2, 3
dev = qml.device("default.qubit", wires=n_qubits)

@qml.qnode(dev, diff_method="parameter-shift")
def model(x, w):
    # w[l, q] = (w1, b1, w2, b2, b3): the same model as chapter 7.5
    for l in range(n_layers):
        for q in range(n_qubits):
            qml.RY(w[l, q, 0] * x[0] + w[l, q, 1], wires=q)
            qml.RZ(w[l, q, 2] * x[1] + w[l, q, 3], wires=q)
            qml.RY(w[l, q, 4], wires=q)
        if l < n_layers - 1:
            qml.CZ(wires=[0, 1])
    return qml.expval(qml.PauliZ(0))

def loss(w, X, y):
    total = 0.0
    for x, t in zip(X, y):
        p = np.clip((1 - model(x, w)) / 2, 1e-4, 1 - 1e-4)   # p(class 1)
        total = total - (t * np.log(p) + (1 - t) * np.log(1 - p))
    return total / len(X)

rng = onp.random.default_rng(0)
X = rng.uniform(-1, 1, size=(80, 2))
y = (onp.sum(X**2, axis=1) < 0.56).astype(float)      # the "circle" dataset

w = np.array(rng.normal(0, 1, size=(n_layers, n_qubits, 5)), requires_grad=True)
opt = qml.AdamOptimizer(stepsize=0.08)
for epoch in range(120):
    w, cost = opt.step_and_cost(lambda v: loss(v, X, y), w)
    if epoch % 20 == 0:
        print(f"epoch {epoch:3d}  loss {cost:.3f}")`;
  const REFS = [
    ['Foundations', [
      ['Nielsen & Chuang, <i>Quantum Computation and Quantum Information</i> (Cambridge University Press, 10th anniversary edition, 2010)', null, 'The standard reference for Parts I–V.'],
      ['Schuld & Petruccione, <i>Machine Learning with Quantum Computers</i> (Springer, 2nd edition, 2021)', null, 'The QML textbook; builds directly on Part VII.'],
      ['Biamonte et al., "Quantum machine learning", <i>Nature</i> (2017)', 'https://arxiv.org/abs/1611.09347', 'The broad survey that framed the field.'],
      ['Cerezo et al., "Variational quantum algorithms", <i>Nature Reviews Physics</i> (2021)', 'https://arxiv.org/abs/2012.09265', 'Review of the variational loop from chapter 7.1.']
    ]],
    ['Models, encodings and gradients', [
      ['Mitarai et al., "Quantum circuit learning" (2018)', 'https://arxiv.org/abs/1803.00745', 'Circuits as trainable models; an early parameter-shift rule.'],
      ['Schuld et al., "Evaluating analytic gradients on quantum hardware" (2019)', 'https://arxiv.org/abs/1811.11184', 'The general parameter-shift rule of chapter 7.4.'],
      ['Havlíček et al., "Supervised learning with quantum-enhanced feature spaces", <i>Nature</i> (2019)', 'https://arxiv.org/abs/1804.11326', 'The ZZ feature map and quantum kernels.'],
      ['Schuld & Killoran, "Quantum machine learning in feature Hilbert spaces", <i>Physical Review Letters</i> (2019)', 'https://arxiv.org/abs/1803.07128', 'Encodings as feature maps into Hilbert space.'],
      ['Pérez-Salinas et al., "Data re-uploading for a universal quantum classifier", <i>Quantum</i> (2020)', 'https://arxiv.org/abs/1907.02085', 'The idea behind the model in chapter 7.5.'],
      ['Schuld, Sweke & Meyer, "Effect of data encoding on the expressive power of variational quantum machine-learning models", <i>Physical Review A</i> (2021)', 'https://arxiv.org/abs/2008.08605', 'Models as Fourier series (chapter 7.2).'],
      ['Jerbi et al., "Quantum machine learning beyond kernel methods", <i>Nature Communications</i> (2023)', 'https://arxiv.org/abs/2110.13162', 'How variational models and kernels relate.']
    ]],
    ['Limits and trainability', [
      ['McClean et al., "Barren plateaus in quantum neural network training landscapes", <i>Nature Communications</i> (2018)', 'https://arxiv.org/abs/1803.11173', 'The original barren plateau result.'],
      ['Cerezo et al., "Cost function dependent barren plateaus in shallow parametrized quantum circuits", <i>Nature Communications</i> (2021)', 'https://arxiv.org/abs/2001.00550', 'Global versus local costs (chapter 7.7).'],
      ['Larocca et al., "Barren plateaus in variational quantum computing", <i>Nature Reviews Physics</i> (2025)', 'https://arxiv.org/abs/2405.00781', 'The up-to-date review.'],
      ['Cerezo et al., "Does provable absence of barren plateaus imply classical simulability?", <i>Nature Communications</i> (2025)', 'https://arxiv.org/abs/2312.09121', 'The open question at the end of chapter 7.7.'],
      ['Thanasilp et al., "Exponential concentration in quantum kernel methods", <i>Nature Communications</i> (2024)', 'https://arxiv.org/abs/2208.11060', 'The kernel version of barren plateaus.'],
      ['Shaydulin & Wild, "Importance of kernel bandwidth in quantum machine learning", <i>Physical Review A</i> (2022)', 'https://arxiv.org/abs/2111.05451', 'Why the c slider in chapter 7.6 matters.'],
      ['Huang et al., "Power of data in quantum machine learning", <i>Nature Communications</i> (2021)', 'https://arxiv.org/abs/2011.01938', 'When classical models with data can match quantum ones.'],
      ['Tang, "A quantum-inspired classical algorithm for recommendation systems", STOC (2019)', 'https://arxiv.org/abs/1807.04271', 'The first dequantization result.']
    ]],
    ['Research directions', [
      ['Jerbi et al., "Parametrized quantum policies for reinforcement learning", NeurIPS (2021)', 'https://arxiv.org/abs/2103.05577', 'Circuits as RL policies.'],
      ['Skolik et al., "Quantum agents in the Gym: a variational quantum algorithm for deep Q-learning", <i>Quantum</i> (2022)', 'https://quantum-journal.org/papers/q-2022-05-24-720/', 'Variational Q-learning on standard RL benchmarks.'],
      ['Du et al., "Quantum circuit architecture search for variational quantum algorithms", <i>npj Quantum Information</i> (2022)', 'https://arxiv.org/abs/2010.10217', 'Searching over circuit structures instead of only angles.'],
      ['Jiang, Lu & Deng, "Quantum continual learning overcoming catastrophic forgetting", <i>Chinese Physics Letters</i> (2022)', 'https://arxiv.org/abs/2108.02786', 'Elastic weight consolidation for quantum classifiers.'],
      ['"Quantum continual learning on a programmable superconducting processor" (2024)', 'https://arxiv.org/abs/2409.09729', 'An experimental demonstration on hardware.']
    ]]
  ];
  C.add({
    id: 'next', part: 7, num: '7.8', title: 'Where to go next',
    init(root) {
      root.querySelector('[data-code]').appendChild(codeBlock(PENNY));
      const refs = root.querySelector('[data-refs]');
      REFS.forEach(([title, items]) => {
        refs.appendChild(h('h3', { text: title }));
        const ul = h('ul', { class: 'refs' });
        items.forEach(([t, url, why]) => ul.appendChild(h('li', { html: (url ? `<a href="${url}" target="_blank" rel="noopener">${t}</a>` : t) + `<span class="why">${why}</span>` })));
        refs.appendChild(ul);
      });
    }
  });

  /* ------------------------------------------------------------------ Appendix */
  /* [term, definition (HTML), id of the chapter that explains it]. Shown sorted A–Z. */
  const GLOSS = [
    ['Adam', 'A popular gradient-based optimizer that adapts the step size of each parameter as training goes.', 'train'],
    ['Amplitude', 'A complex number attached to a basis state. Its squared length is the probability of that outcome.', 'qubit'],
    ['Amplitude damping', 'The noise channel for energy loss: |1⟩ decays toward |0⟩.', 'noise'],
    ['Amplitude encoding', 'Loading a normalized list of 2ⁿ numbers into the amplitudes of n qubits.', 'encoding'],
    ['Ancilla', 'An extra helper qubit, such as the one an oracle writes its answer into.', 'oracles'],
    ['Angle encoding', 'Loading each feature as a rotation angle, for example Ry(x).', 'encoding'],
    ['Ansatz', 'The trainable part of a variational circuit: a fixed layout of gates whose angles are learned.', 'pqc'],
    ['Anticommute', 'Two matrices anticommute when AB = −BA. X and Z do: XZ = −ZX.', 'eigen'],
    ['Argument (arg z)', 'The angle of a complex number, measured counterclockwise from the positive real axis.', 'complex'],
    ['Backpropagation', 'The method used for neural networks to get every derivative for about the cost of one extra pass. Simulators can use it. Hardware cannot, because the intermediate quantum states cannot be stored and read out.', 'gradients'],
    ['Balanced function', 'A function of bit strings that outputs 0 for exactly half of the inputs and 1 for the other half.', 'oracles'],
    ['Bandwidth', 'A scale factor on the encoding angles. It sets how quickly the kernel falls off as two inputs move apart.', 'kernels'],
    ['Barren plateau', 'A loss landscape whose gradients shrink exponentially as qubits are added.', 'plateaus'],
    ['Basis', 'A set of orthogonal unit vectors in which every state can be written in exactly one way.', 'linalg'],
    ['Basis state', 'One of the 2ⁿ states |00…0⟩, …, |11…1⟩ that a Z measurement can return.', 'tensor'],
    ['Bell basis', 'The four Bell states. Together they form a basis for two qubits.', 'entangle'],
    ['Bell state', 'One of four maximally entangled two-qubit states, such as (|00⟩ + |11⟩)/√2.', 'entangle'],
    ['Binary classification', 'Predicting which of two classes an input belongs to.', 'qml'],
    ['Bit flip, phase flip', 'The errors X and Z. A bit flip swaps |0⟩ and |1⟩; a phase flip changes the sign of |1⟩.', 'noise'],
    ['Bloch ball', 'The solid ball of all one-qubit states. Pure states lie on its surface and mixed states inside.', 'noise'],
    ['Bloch sphere', 'The sphere of pure single-qubit states. Mixed states fill the ball inside it.', 'bloch'],
    ['Bloch vector', 'The point (x, y, z) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩) that represents a qubit state.', 'bloch'],
    ['Born rule', 'The probability of an outcome is the squared length of its amplitude.', 'qubit'],
    ['Bra', '⟨ψ|, the conjugate transpose of the ket |ψ⟩: a row vector.', 'linalg'],
    ['Characteristic equation', 'det(A − λI) = 0. Its solutions are the eigenvalues of A.', 'eigen'],
    ['CHSH game', 'A test in which entangled qubits score 2√2, beyond the limit of 2 for any classical strategy.', 'entangle'],
    ['Circuit', 'A sequence of gates on wires, read from left to right, usually ending in measurements.', 'gates'],
    ['Clifford circuit', 'A circuit built from H, S and CNOT. It can be simulated efficiently on an ordinary computer.', 'identities'],
    ['CNOT', 'Controlled-NOT: flips the target qubit when the control is |1⟩.', 'multigates'],
    ['Coherence', 'An off-diagonal entry of a density matrix. It records relative phase.', 'noise'],
    ['Collapse', 'After a measurement, the state becomes the basis state that was observed.', 'qubit'],
    ['Complementarity', 'The trade-off between knowing which path a qubit took and seeing interference between the paths.', 'interference'],
    ['Complementary bases', 'Two bases, such as Z and X, where certainty in one means a fair coin in the other.', 'measure'],
    ['Complex conjugate', 'z* = a − bi, the mirror image of z = a + bi in the real axis.', 'complex'],
    ['Complex number', 'z = a + bi with i² = −1: a point, or an arrow, in the complex plane.', 'complex'],
    ['Complex plane', 'The plane in which a + bi is the point (a, b): real part across, imaginary part up.', 'complex'],
    ['Conjugate transpose', 'A†, read "A dagger": swap the rows and columns of A and conjugate every entry.', 'linalg'],
    ['Connectivity', 'Which pairs of qubits on a chip can act on each other directly.', 'hardware'],
    ['Constant function', 'A function that gives the same output for every input.', 'oracles'],
    ['Control and target', 'In a controlled gate, the control qubit decides whether the gate acts, and the target is the qubit it acts on.', 'multigates'],
    ['Controlled gate', 'A gate applied to the target only in the branch where the control qubit is |1⟩.', 'multigates'],
    ['Cross-entropy loss', 'The standard loss for classification: minus the log of the probability the model gave the correct class.', 'qml'],
    ['CZ', 'Controlled-Z: multiplies |11⟩ by −1. Symmetric in its two qubits.', 'multigates'],
    ['Data re-uploading', 'Encoding the same input several times between trainable layers, which adds frequencies to the model.', 'encoding'],
    ['Decision boundary', 'The line or curve in input space where a classifier switches from one class to the other.', 'qml'],
    ['Decoherence', 'The loss of quantum information to the environment, measured by T1 and T2.', 'hardware'],
    ['Density matrix', 'ρ, the description of a possibly mixed state. For one qubit ρ = (I + xX + yY + zZ)/2.', 'noise'],
    ['Depolarizing noise', 'With probability p, the state is replaced by the random state I/2.', 'noise'],
    ['Dequantization', 'A classical algorithm that matches a proposed quantum speed-up, which shows the speed-up did not need a quantum computer.', 'qml'],
    ['Determinant', 'For a 2 × 2 matrix, ad − bc. It is zero exactly when the matrix squashes some direction to nothing.', 'eigen'],
    ['Diffusion (Grover)', 'Inversion of every amplitude about the mean: a → 2 × mean − a.', 'grover'],
    ['Dirac notation', 'Writing states as kets |ψ⟩ and their conjugate transposes as bras ⟨ψ|.', 'linalg'],
    ['Eigenvector, eigenvalue', 'Av = λv: v is a direction that A only stretches, by the factor λ.', 'eigen'],
    ['Entanglement', 'Correlation between qubits that no product of single-qubit states can describe.', 'entangle'],
    ['Entanglement entropy', 'How entangled a pure two-qubit state is, in bits: 0 for a product state, 1 for a Bell state.', 'entangle'],
    ['Epoch', 'One pass of training through all of the training examples.', 'qml'],
    ['Equivalent circuits', 'Circuits whose unitaries are equal up to a global phase. No experiment can tell them apart.', 'identities'],
    ['Error correction', 'Encoding each logical qubit in many physical qubits and fixing errors while the computation runs.', 'hardware'],
    ['Error mitigation', 'Reducing the effect of noise by post-processing the results of many noisy runs. It needs no extra qubits.', 'hardware'],
    ['Euler’s formula', 'e<sup>iθ</sup> = cos θ + i sin θ, the point at angle θ on the unit circle.', 'complex'],
    ['Expectation value', 'The average result of measuring an observable many times: ⟨A⟩ = ⟨ψ|A|ψ⟩.', 'eigen'],
    ['Exponential concentration', 'Kernel values between different inputs that shrink exponentially with the number of qubits, so they carry almost no information.', 'kernels'],
    ['Expressive', 'Able to represent many different functions. Very expressive circuits tend to be hard to train.', 'pqc'],
    ['Feature', 'One number describing an input. An input x is a list of features, such as (x₁, x₂).', 'qml'],
    ['Feature map', 'The encoding circuit x → |φ(x)⟩ that loads classical data.', 'encoding'],
    ['Fidelity', 'The overlap |⟨ψ|χ⟩|² of two states: 1 if they are the same, 0 if orthogonal.', 'bloch'],
    ['Gate', 'A unitary operation on one or more qubits.', 'gates'],
    ['GHZ state', '(|000⟩ + |111⟩)/√2 and its larger versions, in which all qubits agree.', 'lab'],
    ['Global and local cost', 'A global cost depends on all the qubits at once, such as the probability of 00…0. A local cost averages one-qubit measurements and is less prone to barren plateaus.', 'plateaus'],
    ['Global phase', 'A factor e<sup>iγ</sup> multiplying the whole state. It has no observable effect.', 'phase'],
    ['Gottesman–Knill theorem', 'Clifford circuits acting on basis states can be simulated efficiently on an ordinary computer.', 'identities'],
    ['Gradient', 'The list of partial derivatives of the loss with respect to the parameters. It points uphill.', 'qml'],
    ['Gradient descent', 'Training by repeatedly moving the parameters a small step against the gradient of the loss.', 'qml'],
    ['Grover’s algorithm', 'Finds a marked item among N in about (π/4)√N oracle calls.', 'grover'],
    ['Hadamard (H)', 'The gate |0⟩ → |+⟩, |1⟩ → |−⟩: a half turn about the axis halfway between x and z.', 'gates'],
    ['Hardware-efficient ansatz', 'An ansatz that alternates layers of single-qubit rotations with layers of entangling gates such as CZ or CNOT.', 'pqc'],
    ['Hermitian', 'A matrix equal to its own conjugate transpose. Observables are Hermitian.', 'eigen'],
    ['Holevo’s limit', 'n qubits can carry at most n bits of classical information that can be read out.', 'qubit'],
    ['Identity matrix', 'I: ones on the diagonal and zeros elsewhere. It leaves every vector unchanged.', 'linalg'],
    ['Inner product', '⟨a|b⟩ = Σ a<sub>k</sub>* b<sub>k</sub>, the overlap of two states.', 'linalg'],
    ['Interference', 'Amplitudes of different paths adding up or cancelling.', 'interference'],
    ['Interference term', 'The term 2rs cos Δ in |z + w|² = r² + s² + 2rs cos Δ. It depends on the angle Δ between the two arrows.', 'complex'],
    ['Inverse', 'A⁻¹ undoes A: A⁻¹A = I. The inverse of a unitary U is U†.', 'linalg'],
    ['Kernel', 'A similarity measure between inputs. A quantum kernel is the overlap of two encoded states.', 'kernels'],
    ['Ket', '|ψ⟩, Dirac’s notation for a column vector.', 'linalg'],
    ['Kraus operators', 'Matrices K<sub>k</sub> that describe a channel: ρ → Σ K<sub>k</sub> ρ K<sub>k</sub>†.', 'noise'],
    ['Label', 'The known answer attached to a training example, such as its class.', 'qml'],
    ['Learning rate', 'The size of each gradient-descent step, written η.', 'qml'],
    ['Linear', 'A map M is linear when M(au + bv) = aMu + bMv. Matrices are exactly the linear maps.', 'linalg'],
    ['Logical qubit', 'A qubit stored in many physical qubits by an error-correcting code.', 'hardware'],
    ['Logistic regression', 'The simplest classifier: p = σ(w₁x₁ + w₂x₂ + b), with a straight-line decision boundary.', 'qml'],
    ['Loss', 'A number that measures how wrong a model is on the training data. Training makes it small.', 'qml'],
    ['Mach–Zehnder interferometer', 'An optical experiment with two beam splitters. It is the H, phase, H circuit built with light.', 'interference'],
    ['Matrix', 'A rectangular grid of numbers. A square matrix maps vectors to vectors.', 'linalg'],
    ['Maximally mixed state', 'ρ = I/2, the centre of the Bloch ball: a fair coin along every axis.', 'noise'],
    ['Measurement basis', 'The states a measurement can return. Z basis: |0⟩, |1⟩. X basis: |+⟩, |−⟩. Y basis: |+i⟩, |−i⟩.', 'measure'],
    ['Mixed state', 'A probabilistic mixture of pure states. Its Bloch vector lies inside the ball.', 'noise'],
    ['Model', 'A function f(x; θ) with adjustable parameters θ that makes predictions.', 'qml'],
    ['Modulus |z|', 'The length of a complex number, √(a² + b²).', 'complex'],
    ['Native gates', 'The gates a device performs directly. Every other gate is compiled into them.', 'hardware'],
    ['No-cloning theorem', 'No device can copy an unknown quantum state.', 'teleport'],
    ['No-signalling', 'Entanglement cannot carry a message: one side’s statistics never depend on what the other side does.', 'entangle'],
    ['Normalized', 'Having length 1. For a qubit, |α|² + |β|² = 1.', 'linalg'],
    ['Observable', 'A measurable quantity, represented by a Hermitian matrix such as Z.', 'eigen'],
    ['Oracle', 'A black-box circuit that evaluates a function, often by writing the answer into a phase.', 'oracles'],
    ['Orthogonal', 'Having inner product 0. Orthogonal states can be told apart perfectly by one measurement.', 'linalg'],
    ['Outer product', '|a⟩⟨b|, a column times a row. The result is a matrix.', 'linalg'],
    ['Overfitting', 'Fitting the training data so closely that the model does worse on new data.', 'qml'],
    ['Parameter-shift rule', 'The exact gradient of a circuit from two runs at θ ± π/2.', 'gradients'],
    ['Parameters', 'The adjustable numbers θ of a model, which training chooses.', 'qml'],
    ['Partial trace', 'Averaging over part of a system to get the state of the rest.', 'noise'],
    ['Pauli matrices', 'X, Y and Z: the half-turn gates and the three measurement axes of a qubit.', 'eigen'],
    ['Phase', 'The angle of a complex amplitude.', 'phase'],
    ['Phase estimation', 'An algorithm that writes the eigenvalue phase of a unitary into a register of qubits as bits.', 'qft'],
    ['Phase factor', 'A complex number of length 1, e<sup>iγ</sup>. Multiplying by it turns an arrow without changing its length.', 'complex'],
    ['Phase kickback', 'A controlled gate acting on an eigenvector writes the eigenvalue onto the control as a phase.', 'multigates'],
    ['Polar form', 'Writing a complex number by its length and angle: z = re<sup>iθ</sup>.', 'complex'],
    ['Product state', 'A multi-qubit state that is a tensor product of single-qubit states, so not entangled.', 'entangle'],
    ['Projector', 'A matrix |e⟩⟨e| that picks out the part of a state along |e⟩.', 'measure'],
    ['Purity', 'Tr(ρ²): 1 for pure states and 1/2 for a maximally mixed qubit.', 'noise'],
    ['Quantum channel', 'Any physical process acting on a state, noise included. On one qubit it maps the Bloch ball into itself.', 'noise'],
    ['Quantum Fourier transform', 'The Fourier transform applied to amplitudes. It writes a number into the phases of qubits.', 'qft'],
    ['Qubit', 'A two-level quantum system with state α|0⟩ + β|1⟩, where |α|² + |β|² = 1.', 'qubit'],
    ['Query', 'One call to an oracle. Algorithms are compared by how many queries they need.', 'oracles'],
    ['Radian', 'The unit of angle used throughout. A full turn is 2π radians, so π radians is 180°.', 'complex'],
    ['Readout error', 'Reading 1 when the qubit was 0, or the reverse. Corrected statistically by inverting a calibration.', 'hardware'],
    ['Real and imaginary parts', 'For z = a + bi, the real part is a and the imaginary part is b.', 'complex'],
    ['Regularization', 'A penalty on extreme parameter values, added to the loss to reduce overfitting.', 'qml'],
    ['Relative phase', 'The phase difference between amplitudes. It is physical and drives interference.', 'phase'],
    ['Repetition code', 'Error correction by copying a bit and decoding with a majority vote.', 'hardware'],
    ['Scalar', 'A single number, as opposed to a vector or a matrix.', 'linalg'],
    ['Shor’s algorithm', 'Factors integers efficiently by finding a period with phase estimation.', 'qft'],
    ['Shot', 'One run of a circuit ending in a measurement, returning one bit string.', 'qubit'],
    ['Sigmoid', 'σ(z) = 1/(1 + e<sup>−z</sup>). It squashes any number into a probability between 0 and 1.', 'qml'],
    ['Solovay–Kitaev theorem', 'Any single-qubit gate can be approximated to accuracy ε by a sequence from a universal set whose length grows only like a power of log(1/ε).', 'identities'],
    ['Standard error', 'The typical size of the statistical error in an estimate. For a probability p from N shots it is √(p(1 − p)/N).', 'qubit'],
    ['State tomography', 'Reconstructing a state from measurements along several axes.', 'measure'],
    ['Superdense coding', 'Sending two classical bits with one qubit, using a shared entangled pair.', 'teleport'],
    ['Superposition', 'A state with nonzero amplitude on more than one basis state.', 'qubit'],
    ['Supervised learning', 'Learning a function from examples whose answers, the labels, are known.', 'qml'],
    ['Surface code', 'A leading quantum error-correcting code that measures parities on a grid of qubits.', 'hardware'],
    ['SWAP', 'Exchanges the states of two qubits. Equal to three CNOTs.', 'multigates'],
    ['T count', 'The number of T gates in a circuit, the main cost measure on fault-tolerant machines.', 'identities'],
    ['T gate', 'An eighth turn about z: the expensive ingredient that makes {H, T, CNOT} universal.', 'identities'],
    ['T1, T2', 'Relaxation time (energy loss) and coherence time (phase loss) of a qubit. T2 ≤ 2T1.', 'hardware'],
    ['Teleportation', 'Moving an unknown qubit state using a shared entangled pair and two classical bits.', 'teleport'],
    ['Tensor product', 'The way the states of separate systems combine: amplitudes multiply.', 'tensor'],
    ['Test set', 'Examples held back from training and used only to measure how well the model does on new data.', 'qml'],
    ['Threshold', 'The physical error rate below which larger codes make logical errors rarer.', 'hardware'],
    ['Toffoli (CCX)', 'Flips the target when both controls are 1: a reversible AND.', 'multigates'],
    ['Trace', 'Tr A, the sum of the diagonal entries of a matrix.', 'eigen'],
    ['Trainability', 'Whether a model’s parameters can be found by training, for example whether its gradients are large enough to follow.', 'qml'],
    ['Transpiler', 'The compiler that rewrites a circuit into a device’s native gates and qubit connections.', 'hardware'],
    ['Transpose', 'Aᵀ: the matrix A with its rows and columns swapped.', 'linalg'],
    ['Uncertainty principle', 'For a qubit, certainty along one axis means a fair coin along the others: if z = ±1, then x = y = 0.', 'measure'],
    ['Underfitting', 'A model too simple for the pattern in the data. It does badly even on the training set.', 'train'],
    ['Unit circle', 'The complex numbers of length 1, which are exactly the numbers e<sup>iθ</sup>.', 'complex'],
    ['Unitary', 'A matrix with U†U = I. Every gate is unitary, and so reversible.', 'eigen'],
    ['Universal gate set', 'A finite set of gates, such as {H, T, CNOT}, that can approximate any unitary.', 'identities'],
    ['Variational algorithm', 'A loop in which a classical optimizer tunes the parameters of a quantum circuit.', 'qml'],
    ['Vector', 'An ordered list of numbers. A quantum state is a vector of complex amplitudes.', 'linalg'],
    ['ZZ feature map', 'An entangling encoding (Havlíček and colleagues, 2019) with phases set by the features and by products of features.', 'encoding']
  ];
  C.add({
    id: 'glossary', part: 8, num: 'A', title: 'Glossary and conventions',
    init(root) {
      const host = root.querySelector('[data-gloss]');
      if (!host) return;
      const items = GLOSS.slice().sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }));
      const groups = new Map();
      items.forEach(it => { const L = it[0][0].toUpperCase(); if (!groups.has(L)) groups.set(L, []); groups.get(L).push(it); });
      const search = h('input', { type: 'search', class: 'gloss-search', placeholder: `Search ${items.length} terms`, 'aria-label': 'Search the glossary', autocomplete: 'off', spellcheck: 'false' });
      const nav = h('div', { class: 'gloss-nav', role: 'navigation', 'aria-label': 'Jump to a letter' });
      const none = h('p', { class: 'note', hidden: true, text: 'No term matches. Try a shorter word.' });
      const blocks = [];
      groups.forEach((list, L) => {
        const head = h('h3', { class: 'gloss-letter', text: L });
        const dl = h('dl', { class: 'gloss' });
        const rows = list.map(([t, d, id]) => {
          const ch = C.byId(id);
          const dt = h('dt', { text: t });
          const dd = h('dd', { html: d + (ch ? ` <a href="#${id}" class="ch-tag" title="${ch.title.replace(/"/g, '&quot;')}">${ch.num}</a>` : '') });
          dl.append(dt, dd);
          return { dt, dd, text: (t + ' ' + d.replace(/<[^>]+>/g, '')).toLowerCase() };
        });
        const sec = h('section', { class: 'gloss-group', 'aria-label': `Terms starting with ${L}` }, head, dl);
        blocks.push({ sec, rows });
        nav.appendChild(h('button', { type: 'button', text: L, 'aria-label': `Jump to ${L}`, onclick: () => head.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }) }));
      });
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let shown = 0;
        blocks.forEach(b => {
          let n = 0;
          b.rows.forEach(r => { const ok = !q || r.text.includes(q); r.dt.hidden = r.dd.hidden = !ok; if (ok) n++; });
          b.sec.hidden = !n; shown += n;
        });
        none.hidden = shown > 0;
        nav.hidden = !!q;
      });
      host.append(h('div', { class: 'gloss-tools' }, search, nav), none, ...blocks.map(b => b.sec));
    }
  });
  C.add({
    id: 'formulas', part: 8, num: 'B', title: 'Formula sheet',
    init(root) {
      root.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
        const t = root.querySelector('#' + b.dataset.jump);
        if (t) t.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
      }));
    }
  });

  /* ------------------------------------------------------------------ 7.5: one training step, every number shown */
  C.widget('one-step', body => {
    const DATA = [[-1.4, 0], [-0.9, 0], [-0.4, 0], [0.1, 0], [0.6, 1], [1.0, 1], [1.4, 1]];
    let th = 0, lr = 0.6, hist = [];
    const f = (x, t) => Math.cos(x + t);                       // ⟨Z⟩ after Ry(x + θ)|0⟩
    const pOf = v => Math.min(1 - 1e-6, Math.max(1e-6, (1 - v) / 2)); // p(red)
    const lossAt = t => DATA.reduce((s, [x, y]) => { const p = pOf(f(x, t)); return s - (y * Math.log(p) + (1 - y) * Math.log(1 - p)); }, 0) / DATA.length;
    const sLr = slider({ label: 'learning rate η', min: 0.1, max: 2, step: 0.05, value: lr, fmt: v => num(v, 2), oninput: v => { lr = v; draw(); } });
    const circHost = h('div'), table = h('div', { class: 'table-wrap' }), calc = h('div', { class: 'calc' }), plot = h('div'), strip = h('div');
    body.append(circHost, h('div', { class: 'row' }, button('Take one step', () => { stepOnce(); draw(); }, 'btn primary'), button('Take 10 steps', () => { for (let i = 0; i < 10; i++) stepOnce(); draw(); }, 'btn'), button('Reset θ to 0', () => { th = 0; hist = []; draw(); }, 'btn'),
      h('div', { style: { flex: '1 1 240px', minWidth: 0 } }, sLr.el)), strip, h('div', { class: 'grid2' }, h('div', { class: 'stack' }, table), h('div', { class: 'stack' }, plot, calc)));
    new G.CircuitLab.CircuitView(circHost, { static: true, showPlayhead: false, colNums: false }).set({ n: 1, cols: [[{ g: 'RY', p: 0, t: 'x' }], [{ g: 'RY', p: 0, t: 'θ' }], [{ g: 'M' }]] });
    function grad(t) {
      let g = 0; const rows = DATA.map(([x, y]) => {
        const v = f(x, t), fp = f(x, t + PI / 2), fm = f(x, t - PI / 2), dfd = (fp - fm) / 2, p = pOf(v);
        const dLdf = (y / p - (1 - y) / (1 - p)) / 2; g += dLdf * dfd; return { x, y, v, fp, fm, dfd, dLdf };
      });
      return { g: g / DATA.length, rows };
    }
    function stepOnce() { const { g } = grad(th); hist.push([th, lossAt(th)]); th = th - lr * g; if (hist.length > 60) hist.shift(); }
    function draw() {
      const T = Theme.tokens(), { g, rows } = grad(th), L = lossAt(th);
      let html = '<table class="dtable compact"><thead><tr><th>x</th><th>label</th><th>f = ⟨Z⟩</th><th>f(θ + π/2)</th><th>f(θ − π/2)</th><th>∂f/∂θ</th><th>∂L/∂f</th></tr></thead><tbody>';
      rows.forEach(r => { html += `<tr><th scope="row">${num(r.x, 1)}</th><td><span class="swatch" style="background:${classColor(r.y, T)}"></span> ${r.y ? 'red' : 'blue'}</td><td>${num(r.v, 3)}</td><td>${num(r.fp, 3)}</td><td>${num(r.fm, 3)}</td><td>${num(r.dfd, 3)}</td><td>${num(r.dLdf, 3)}</td></tr>`; });
      table.innerHTML = html + '</tbody></table>';
      const pts = []; for (let i = 0; i <= 480; i++) { const t = -PI + 2 * PI * i / 480; pts.push([t, Math.min(4, lossAt(t))]); }
      const ymax = 3.2, tw = 0.6;
      const thw = ((th + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;
      linePlot(plot, { height: 210, x: [-PI, PI], y: [0, ymax], yTicks: [0, 1, 2, 3], xTicks: [-PI, -PI / 2, 0, PI / 2, PI], xFmt: v => angle(v), xTitle: 'θ', yTitle: 'average loss L(θ)', xName: 'θ', series: [{ name: 'L(θ)', color: T.q, points: pts }],
        segments: [{ x1: thw - tw, y1: L - g * tw, x2: thw + tw, y2: L + g * tw, color: T.q2, width: 2.2 }],
        markers: hist.map(([t, l]) => ({ x: ((t + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI, y: l, color: T.muted, r: 2.5 })).concat([{ x: thw, y: L, color: T.q2 }]) });
      calc.innerHTML = `<p class="caption" style="margin:0 0 10px;font-family:var(--font-body)">Each sharp peak is an angle where one training point is predicted wrong with complete certainty, which makes its cross-entropy infinite.</p>` +
        `<div><span class="lbl">loss</span>L(θ = ${num(th, 3)}) = <b>${num(L, 4)}</b></div>` +
        `<div><span class="lbl">gradient</span>dL/dθ = average of ∂L/∂f × ∂f/∂θ = <b>${num(g, 4)}</b></div>` +
        `<div><span class="lbl">update</span>θ ← θ − η × dL/dθ = ${num(th, 3)} − ${num(lr, 2)} × ${num(g, 3)} = <b>${num(th - lr * g, 3)}</b></div>`;
      // the data on a line, coloured by the model's current prediction
      const W = Math.min(560, body.clientWidth || 520), Hh = 64, X = x => 16 + (W - 32) * (x + 1.6) / 3.2;
      let s2 = `<svg class="plot" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="data points on a line with the model's decision regions">`;
      for (let i = 0; i < 120; i++) { const x = -1.6 + 3.2 * i / 120, v = f(x, th); s2 += `<rect x="${X(x)}" y="14" width="${(W - 32) / 120 + 0.5}" height="18" fill="${v >= 0 ? T.q : T.neg}" opacity="${0.12 + 0.3 * Math.abs(v)}"/>`; }
      DATA.forEach(([x, y]) => { s2 += `<circle cx="${X(x)}" cy="23" r="6" fill="${classColor(y, T)}" stroke="${T.surface}" stroke-width="1.5"/>`; });
      [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].forEach(x => { s2 += `<text x="${X(x)}" y="${Hh - 6}" text-anchor="middle" class="tick-label">${num(x, 1)}</text>`; });
      strip.innerHTML = s2 + '</svg>' + `<p class="caption">Input x on a line. Background: the current model predicts blue where f &gt; 0 and red where f &lt; 0. Accuracy now: ${pct(rows.filter(r => (r.v < 0 ? 1 : 0) === r.y).length / rows.length, 0)}.</p>`;
    }
    draw();
  });

  /* ------------------------------------------------------------------ 7.6: kernels in one dimension */
  C.widget('kernel-1d', body => {
    let c = 0.6, nq = 2, lam = 0.01, bumps = true;
    const rng = Q.mulberry32(17), X = [], Y = [];
    for (let i = 0; i < 14; i++) { const x = -1 + 2 * (i + 0.5) / 14 + (rng() - 0.5) * 0.08; X.push(x); Y.push(Math.abs(x) < 0.45 ? 1 : -1); }
    const sC = slider({ label: 'bandwidth c', min: 0.1, max: 3, step: 0.01, value: c, fmt: v => num(v, 2), oninput: v => { c = v; draw(); } });
    const sN = slider({ label: 'copies of x', min: 1, max: 8, step: 1, value: nq, fmt: v => `${v} qubit${v > 1 ? 's' : ''}`, oninput: v => { nq = v; draw(); } });
    const sL = slider({ label: 'regularization λ', min: -4, max: 0, step: 0.05, value: Math.log10(lam), fmt: v => num(10 ** v, 4), oninput: v => { lam = 10 ** v; draw(); } });
    const cid = G.U.nextId('bumps'), chk = h('input', { type: 'checkbox', id: cid, checked: true }); chk.addEventListener('change', () => { bumps = chk.checked; draw(); });
    const plot = h('div'), kplot = h('div'), read = h('div', { class: 'readout' });
    body.append(h('div', { class: 'grid2' }, h('div', { class: 'stack' }, sC.el, sN.el, sL.el, h('label', { class: 'chk', for: cid }, chk, h('span', { text: 'Show each training point’s contribution' })), read),
      h('div', { class: 'stack' }, h('p', { class: 'panel-label', text: 'The kernel k(x, x′) against x − x′' }), kplot)), plot);
    const k = (a, b2) => Math.cos(c * PI * (a - b2) / 2) ** (2 * nq);
    function draw() {
      const T = Theme.tokens(), n = X.length, K = new Float64Array(n * n);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) K[i * n + j] = k(X[i], X[j]);
      const a = M.kernelRidge(K, n, Y, lam), fx = x => X.reduce((s, xi, i) => s + a[i] * k(x, xi), 0);
      const pts = [], series = []; for (let i = 0; i <= 240; i++) { const x = -1 + 2 * i / 240; pts.push([x, Math.max(-50, Math.min(50, fx(x)))]); }
      if (bumps) X.forEach((xi, i) => { const b = []; for (let j = 0; j <= 120; j++) { const x = -1 + 2 * j / 120; b.push([x, Math.max(-50, Math.min(50, a[i] * k(x, xi)))]); } series.push({ points: b, color: Y[i] > 0 ? T.q : T.neg, width: 1, opacity: 0.35 }); });
      series.push({ name: 'f(x) = Σ αᵢ k(x, xᵢ)', color: T.ink, points: pts, width: 2.4 });
      linePlot(plot, { height: 240, x: [-1, 1], y: [-2, 2], yTicks: [-2, -1, 0, 1, 2], xTitle: 'input x', yTitle: 'model output f(x)', xName: 'x', legend: false, crosshair: false, series,
        hlines: [{ y: 0, color: T.lineStrong }], markers: X.map((x, i) => ({ x, y: Y[i], color: Y[i] > 0 ? T.q : T.neg, r: 4.5 })) });
      const kp = []; for (let i = 0; i <= 200; i++) { const d = -2 + 4 * i / 200; kp.push([d, Math.cos(c * PI * d / 2) ** (2 * nq)]); }
      linePlot(kplot, { height: 150, x: [-2, 2], y: [0, 1], yTicks: [0, 0.5, 1], xTicks: [-2, -1, 0, 1, 2], xTitle: 'x − x′', xName: 'x − x′', legend: false, series: [{ color: T.q, points: kp }] });
      let trainOk = 0; X.forEach((x, i) => { if (Math.sign(fx(x)) === Y[i]) trainOk++; });
      let gridOk = 0; for (let i = 0; i < 200; i++) { const x = -1 + 2 * (i + 0.5) / 200; if (Math.sign(fx(x)) === (Math.abs(x) < 0.45 ? 1 : -1)) gridOk++; }
      read.innerHTML = `training points classified correctly: <b>${trainOk} of ${n}</b><br>accuracy on all x in [−1, 1]: <b>${pct(gridOk / 200, 0)}</b><br>` +
        (c * 2 >= 2 ? `the kernel repeats every ${num(2 / c, 2)} in x, so points that far apart look identical` : c < 0.3 && nq < 3 ? 'the kernel is very wide: every point looks similar to every other, so the model is too smooth' : 'width of the kernel at half height: ' + num(4 / (c * PI) * Math.acos(Math.pow(0.5, 1 / (2 * nq))), 2));
    }
    draw();
    G.V.onResize(plot, draw);
  });

  /* ------------------------------------------------------------------ 7.8: a state-vector simulator in NumPy */
  const NPSIM = `import numpy as np

def zero_state(n):
    psi = np.zeros(2**n, dtype=complex)
    psi[0] = 1.0                                  # |00…0⟩
    return psi

def apply_1q(psi, U, q, n):
    """Apply the 2x2 gate U to qubit q (q0 is the top wire and the leftmost bit)."""
    psi = psi.reshape([2] * n)                    # one axis per qubit
    psi = np.tensordot(U, psi, axes=([1], [q]))   # U acts on axis q ...
    psi = np.moveaxis(psi, 0, q)                  # ... and the result goes back in place
    return psi.reshape(-1)

def apply_cx(psi, c, t, n):
    """CNOT: apply X to qubit t in the part of the state where qubit c is 1."""
    psi = psi.reshape([2] * n).copy()
    idx = [slice(None)] * n
    idx[c] = 1                                    # select the branch with control = 1
    t_axis = t if t < c else t - 1                # axis c is gone from that slice
    psi[tuple(idx)] = np.flip(psi[tuple(idx)], axis=t_axis)   # X swaps the target's 0 and 1
    return psi.reshape(-1)

def expect_z(psi, q, n):
    p = np.abs(psi.reshape([2] * n)) ** 2
    return 2 * p.take(0, axis=q).sum() - 1        # ⟨Z⟩ = P(0) − P(1)

H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
X = np.array([[0, 1], [1, 0]])
def RY(theta):
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.array([[c, -s], [s, c]])

# The Bell pair: H on q0, then CNOT from q0 to q1
n = 2
psi = zero_state(n)
psi = apply_1q(psi, H, 0, n)
psi = apply_cx(psi, 0, 1, n)
for k, amp in enumerate(psi):
    print(f"|{k:0{n}b}⟩  {amp.real:+.3f} {amp.imag:+.3f}i")   # |00⟩ and |11⟩ get 0.707

# 1,000 shots
rng = np.random.default_rng(0)
counts = np.bincount(rng.choice(2**n, size=1000, p=np.abs(psi) ** 2), minlength=2**n)
print(counts)                                     # about 500 for 00 and 500 for 11

print(expect_z(apply_1q(zero_state(1), RY(np.pi / 3), 0, 1), 0, 1))   # cos(π/3) = 0.5`;
  C.widget('np-sim', body => { body.appendChild(codeBlock(NPSIM)); body.appendChild(h('p', { class: 'caption', text: 'Runs with Python 3 and NumPy. The qubit order matches this course: q0 is the leftmost bit.' })); });
})(window);

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
    lede: 'Everything so far, working together: angle encoding with re-uploading, a layered circuit, Z measurements, a cross-entropy loss and parameter-shift gradients, trained live in your browser.',
    html: `
      <p><b>The model.</b> Each layer applies, on every qubit, <span class="m">Ry(w₁x₁ + b₁) · Rz(w₂x₂ + b₂) · Ry(b₃)</span>, followed by a CZ between the qubits (two-qubit model). The weights w and biases b are trainable, so every layer re-uploads the data with its own scaling. The output is <span class="m">f(x) = ⟨Z⟩</span> on q0, and <span class="m">p(red) = (1 − f)/2</span>.</p>
      <p><b>The training.</b> Binary cross-entropy loss, the Adam optimizer, full-batch gradients from the parameter-shift rule: for every data point, every gate angle is evaluated at ±π/2. The counter shows how many circuit evaluations that costs. With "shots" on, each evaluation carries realistic sampling noise.</p>
      ${C.bench('tr', 'Quantum classifier lab', 'Filled dots: training set · hollow: test set · hover a dot to see its final state')}
      ${C.keyIdea('A quantum classifier is trained exactly like a neural network, except that every forward pass is a measurement and every gradient costs two more circuits per parameter.')}
      ${C.tryThis([
        'XOR with 1 qubit and 1 layer: why does it fail? Add layers until it works.',
        'Circle with 2 qubits and 3 layers: compare train and test accuracy. Is it overfitting?',
        'Switch to 100 shots. What happens to the loss curve, and to the number of useful epochs?',
        'Moons with 1 qubit: what is the smallest number of layers that reaches 95% test accuracy?'
      ])}`,
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
    lede: 'Instead of training the circuit, use it only to compare data points. The overlap of two encoded states is a kernel, and a classical kernel method does the learning.',
    html: `
      <p>A <b>quantum kernel</b> is the similarity between two inputs measured as the overlap of their encoded states:</p>
      <div class="formula">k(x, x′) = |⟨φ(x)|φ(x′)⟩|²</div>
      <p>On hardware you estimate it by running <span class="m">U(x′)<sup>†</sup>U(x)</span> on ${K('0…0')} and counting how often all qubits come back 0. Collect k for every pair of training points and hand the kernel matrix to a support-vector machine or kernel ridge regression (used here). No circuit parameters are trained, so the optimization is convex and has no barren plateaus.</p>
      <ul>
        <li><b>Angle encoding</b> gives <span class="m">k = Π<sub>i</sub> cos²(c·π(xᵢ − xᵢ′)/2)</span>, a smooth, classically easy kernel.</li>
        <li>The <b>ZZ feature map</b> (Havlíček et al. 2019) first turns each feature into an angle <span class="m">φᵢ = cπ(xᵢ + 1)</span>. Each of its two repetitions applies H to both qubits, a phase <span class="m">P(2φᵢ)</span> to each, and an entangling phase <span class="m">φ₁₂ = 2(π − φ₁)(π − φ₂)</span> between them (CNOT, P, CNOT). For many qubits its kernel is believed to be hard to compute classically.</li>
      </ul>
      ${C.bench('kr', 'Kernel lab', 'Click a training point to see its similarity to everything else')}
      <p><b>Bandwidth matters.</b> Scaling the inputs by c changes how quickly similarity decays. Too large a c and every point looks unrelated to every other: the kernel matrix approaches the identity, and the model memorizes the training set without generalizing. For many qubits this <b>exponential concentration</b> of kernel values is the kernel counterpart of barren plateaus (Thanasilp et al. 2024), and tuning the bandwidth is the first remedy (Shaydulin and Wild 2022).</p>
      ${C.keyIdea('A quantum kernel uses the circuit only as a feature map. Training becomes convex, but the kernel must be well scaled or all points look alike.')}
      ${C.tryThis(['ZZ feature map on the circle data: raise c from 0.25 to 1.5 and watch train and test accuracy separate.', 'Compare the kernel matrices of the two feature maps at c = 0.5. Which one shows a cleaner two-block structure?', 'Click a point near the class boundary. Which points does the kernel consider similar?'])}`,
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
    lede: 'For large random circuits the loss landscape becomes exponentially flat: gradients vanish, and an optimizer working from finite shots sees only noise. This is the central obstacle to scaling variational QML.',
    html: `
      <p>McClean et al. (2018) showed that for sufficiently deep random parameterized circuits the variance of any gradient component decays exponentially with the number of qubits. The average gradient is zero, and the typical one is exponentially small, so resolving it takes exponentially many shots. This is a <b>barren plateau</b>.</p>
      <p>Below, your browser runs the experiment: it draws random circuits with RY and RZ on every qubit and a ladder of CZ gates, computes the gradient of the first angle with the parameter-shift rule, and measures its variance across draws. Two costs are compared:</p>
      <ul>
        <li><b>Global cost</b>: the probability that all n qubits read 0 (it checks every qubit at once).</li>
        <li><b>Local cost</b>: the average over qubits of the probability that each one reads 0.</li>
      </ul>
      ${C.bench('bp', 'Gradient variance versus number of qubits', 'Runs in your browser; larger depths take a few seconds')}
      <p><b>What drives plateaus.</b> Global cost functions, circuits expressive enough to look like random unitaries, entangling data encodings that scramble information, and hardware noise (noise-induced plateaus). <b>What helps:</b> local costs and shallow circuits (Cerezo et al. 2021), structured or problem-inspired ansätze, careful initialization (for example starting near the identity), layerwise training, and exploiting symmetry.</p>
      <p><b>An open question.</b> Recent work argues that the circuits we can prove are free of barren plateaus often turn out to be classically simulable (Cerezo et al., 2025). Whether trainable and classically hard variational models exist for useful problems is one of the field's central open questions. Gradient-free training, such as evolution strategies, does not escape the problem by itself: a flat landscape is flat for any optimizer that estimates the cost from shots.</p>
      ${C.bench('bp-slice', 'What a flat landscape looks like', 'The global cost along the first angle, for one random circuit')}
      ${C.keyIdea('Barren plateaus are a statement about concentration: at scale, random circuits give nearly the same cost everywhere. Trainable QML needs structure, locality and shallow depth.')}`,
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
    lede: 'You now have the visual intuition for circuits and the vocabulary of QML. Here is how to turn that into working code and research.',
    html: `
      <h2>A path from here</h2>
      <ol>
        <li><b>Consolidate.</b> Redo the "Try this" boxes without looking, and rebuild each example circuit in the Circuit Lab from memory.</li>
        <li><b>Write your own simulator.</b> Fifty lines of NumPy: a state vector of length 2ⁿ, gates applied by reshaping it to (2, 2, …, 2). Check it against the Circuit Lab and its Qiskit export.</li>
        <li><b>Re-implement the classifier</b> from chapter 7.5 in PennyLane (below). Then swap in the ZZ feature map with a precomputed-kernel SVM from scikit-learn.</li>
        <li><b>Read the limits literature</b> (barren plateaus, kernel concentration, dequantization) before choosing a problem, so you know which claims survive.</li>
        <li><b>Pick a research angle.</b> Open directions include circuits as reinforcement-learning policies, gradient-free training and architecture search for circuits, quantum continual learning, kernels designed around a problem's structure, and learning from genuinely quantum data.</li>
      </ol>
      <h2>The classifier from chapter 7.5, in PennyLane</h2>
      <p>Same circuit, same loss, same optimizer. <code>diff_method="parameter-shift"</code> makes PennyLane compute gradients the way hardware would.</p>
      <div data-code></div>
      <h2>Tools</h2>
      <ul>
        <li><a href="https://pennylane.ai" target="_blank" rel="noopener">PennyLane</a>: differentiable quantum programming, with many QML tutorials.</li>
        <li><a href="https://github.com/Qiskit/qiskit" target="_blank" rel="noopener">Qiskit</a> and <a href="https://github.com/qiskit-community/qiskit-machine-learning" target="_blank" rel="noopener">Qiskit Machine Learning</a>: circuits, transpilation, hardware access; the Circuit Lab exports Qiskit code.</li>
        <li><a href="https://www.tensorflow.org/quantum" target="_blank" rel="noopener">TensorFlow Quantum</a> and <a href="https://github.com/mit-han-lab/torchquantum" target="_blank" rel="noopener">TorchQuantum</a>: quantum layers inside classical deep-learning frameworks.</li>
        <li><a href="https://algassert.com/quirk" target="_blank" rel="noopener">Quirk</a>: a fast drag-and-drop circuit simulator for quick experiments.</li>
      </ul>
      <h2>Reading list</h2>
      <div data-refs></div>
      ${C.quizSection('Check yourself: Part VII')}`,
    quiz: [
      { q: 'For a Pauli rotation, the parameter-shift rule computes ∂f/∂θ as…', options: ['[f(θ + π/2) − f(θ − π/2)] / 2', '[f(θ + h) − f(θ)] / h for small h', 'f(θ)·cos θ', 'It requires backpropagation through the hardware'], answer: 0, why: 'The output is a sinusoid in θ, so two evaluations a quarter-turn either side give the exact slope.' },
      { q: 'A barren plateau means…', options: ['the loss has many local minima', 'gradients vanish exponentially as qubits are added', 'the circuit is too shallow to learn', 'the data was not normalized'], answer: 1, why: 'The variance of the gradient decays exponentially with n, so the landscape looks flat from any finite number of shots.' },
      { q: 'How is a quantum kernel value k(x, x′) defined?', options: ['|⟨φ(x)|φ(x′)⟩|², the overlap of the encoded states', '⟨Z⟩ of the trained ansatz', 'A classical Gaussian kernel', 'The number of CNOTs in the circuit'], answer: 0, why: 'The kernel is the fidelity between the two feature states, estimated by running U(x′)†U(x) and counting all-zero outcomes.' }
    ],
    init(root) {
      root.querySelector('[data-code]').appendChild(codeBlock(PENNY));
      const refs = root.querySelector('[data-refs]');
      REFS.forEach(([title, items]) => {
        refs.appendChild(h('h3', { text: title }));
        const ul = h('ul', { class: 'refs' });
        items.forEach(([t, url, why]) => ul.appendChild(h('li', { html: (url ? `<a href="${url}" target="_blank" rel="noopener">${t}</a>` : t) + `<span class="why">${why}</span>` })));
        refs.appendChild(ul);
      });
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });

  /* ------------------------------------------------------------------ Appendix */
  const GLOSS = [
    ['Amplitude', 'A complex number attached to a basis state. Its squared magnitude is the probability of that outcome.'],
    ['Ansatz', 'The trainable part of a variational circuit: a fixed layout of gates whose angles are learned.'],
    ['Barren plateau', 'A loss landscape whose gradients shrink exponentially with the number of qubits (7.7).'],
    ['Basis state', 'One of the 2ⁿ states |00…0⟩ … |11…1⟩ that a Z measurement can return.'],
    ['Bell state', 'One of four maximally entangled two-qubit states, e.g. (|00⟩ + |11⟩)/√2 (3.3).'],
    ['Bloch sphere', 'The sphere of pure single-qubit states; mixed states fill the ball inside (1.3, 6.1).'],
    ['Born rule', 'The probability of an outcome equals the squared magnitude of its amplitude (1.1).'],
    ['CNOT', 'Controlled-NOT: flips the target qubit when the control is |1⟩ (3.2).'],
    ['Collapse', 'After a measurement the state becomes the basis state that was observed.'],
    ['Density matrix', 'ρ, the description of a possibly mixed state; for one qubit ρ = (I + r·σ)/2.'],
    ['Decoherence', 'Loss of quantum information to the environment, characterized by T1 and T2 (6.2).'],
    ['Entanglement', 'Correlation between qubits that no product of single-qubit states can describe (3.3).'],
    ['Expectation value', 'The average of an observable over many shots, e.g. ⟨Z⟩ = P(0) − P(1) (2.2).'],
    ['Feature map', 'The encoding circuit x → |φ(x)⟩ that loads classical data (7.2).'],
    ['Global phase', 'A factor e<sup>iγ</sup> on the whole state; it has no observable effect (1.2).'],
    ['Hadamard (H)', 'The gate |0⟩ → |+⟩, |1⟩ → |−⟩; a half-turn about the axis between x and z (2.1).'],
    ['Kernel', 'A similarity measure between inputs; quantum kernels are state overlaps (7.6).'],
    ['Mixed state', 'A probabilistic mixture of pure states; inside the Bloch ball.'],
    ['Observable', 'A measurable quantity, represented by a Hermitian matrix such as Z or Z⊗Z.'],
    ['Oracle', 'A black-box circuit that evaluates a function, often as a phase (5.2).'],
    ['Parameter-shift rule', 'Exact gradient of a circuit from two evaluations at θ ± π/2 (7.4).'],
    ['Pauli matrices', 'X, Y and Z: the half-turn gates and the three measurement axes of a qubit.'],
    ['Phase kickback', 'A controlled gate acting on an eigenstate writes the eigenvalue\'s phase onto the control (3.2).'],
    ['Purity', 'Tr(ρ²): 1 for pure states, ½ for a maximally mixed qubit.'],
    ['Qubit', 'A two-level quantum system, state α|0⟩ + β|1⟩ with |α|² + |β|² = 1.'],
    ['Relative phase', 'The phase difference between amplitudes; it is physical and drives interference.'],
    ['Shot', 'One run of a circuit ending in a measurement, returning one bit string.'],
    ['Superposition', 'A state with non-zero amplitude on more than one basis state.'],
    ['T1, T2', 'Relaxation time (energy loss) and coherence time (phase loss) of a qubit; T2 ≤ 2T1.'],
    ['Tensor product', 'The way states of separate systems combine: amplitudes multiply (3.1).'],
    ['Unitary', 'A matrix with U†U = I; every gate is unitary, hence reversible.'],
    ['Universal gate set', 'A finite set of gates, such as {H, T, CNOT}, that approximates any unitary (4.3).']
  ];
  C.add({
    id: 'glossary', part: 8, num: 'A', title: 'Glossary and conventions',
    lede: 'Every term used in the course, in one place, with the chapter where it is introduced.',
    html: `
      <h2>Conventions used here</h2>
      <ul>
        <li><b>Qubit order.</b> q0 is the top wire and the leftmost character of a label: ${K('q0 q1 q2')}. Qiskit prints bit strings the other way round.</li>
        <li><b>Gates.</b> Matrices follow Nielsen & Chuang and Qiskit: <span class="m">Rx(θ) = e<sup>−iθX/2</sup></span>, <span class="m">P(λ) = diag(1, e<sup>iλ</sup>)</span>, <span class="m">U(θ, φ, λ)</span> as in Qiskit.</li>
        <li><b>Bloch sphere.</b> ${K('0')} at the north pole, ${K('+')} on +x, ${K('+i')} on +y. Rotations follow the right-hand rule.</li>
        <li><b>Colour.</b> Phase is shown on a cyclic wheel, blue = 0 and amber = π, always paired with a needle or arrow. In classifiers, blue and red mark the two classes.</li>
      </ul>
      <h2>Glossary</h2>
      <dl data-gloss style="display:grid;grid-template-columns:minmax(120px,auto) 1fr;gap:8px 18px;margin:0"></dl>`,
    init(root) {
      const dl = root.querySelector('[data-gloss]');
      GLOSS.forEach(([t, d]) => { dl.appendChild(h('dt', { style: { fontWeight: '700' }, text: t })); dl.appendChild(h('dd', { style: { margin: '0', color: 'var(--ink-2)' }, html: d })); });
    }
  });
})(window);

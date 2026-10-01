/* Part VII (first half) — QML foundations */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, animate, reduceMotion, ketExpr, divergingRGB, parseColor } = G.U;
  const { BlochView, CircleGrid, linePlot, bars, field, drawPoints, dprOf } = G.V;
  const Q = G.QSim, M = G.QML, C = G.C, K = C.K, PI = Math.PI;

  /* shared: a square input-space panel (x1, x2 in [-1, 1]) */
  function Plane(host, o = {}) {
    const wrap = h('div', { class: 'view', style: { position: 'relative' } });
    const cv = h('canvas', { role: 'img', 'aria-label': o.label || 'input space: x1 horizontal, x2 vertical' });
    cv.style.touchAction = 'pan-y'; cv.style.borderRadius = '8px'; cv.style.border = '1px solid var(--line)';
    wrap.appendChild(cv); host.appendChild(wrap);
    const cap = h('div', { class: 'caption', text: o.caption || 'Input space: x₁ runs left to right, x₂ bottom to top, both from −1 to 1.' });
    host.appendChild(cap);
    let size = 0;
    const api = {
      canvas: cv,
      size: () => size,
      draw(fn, pts, res = 56) {
        size = Math.min(o.max || 340, host.clientWidth || 300);
        const T = Theme.tokens();
        let ctx;
        if (fn) ctx = field(cv, size, size, res, fn, v => divergingRGB(v, T, 0.62));
        else {
          const dpr = dprOf(); cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); cv.style.width = size + 'px'; cv.style.height = size + 'px';
          ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = T.surface; ctx.fillRect(0, 0, size, size);
        }
        ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke();
        drawPoints(ctx, pts || [], size, size, T);
      },
      pick(e, pts) { // nearest point within 12px
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = 1 - (e.clientY - r.top) / r.height * 2;
        let best = -1, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } });
        return bd * r.width / 2 < 14 ? best : -1;
      }
    };
    return api;
  }
  G.QPlane = Plane;
  const classColor = (y, T) => y ? T.neg : T.q;

  /* ------------------------------------------------------------------ 7.1 */
  C.add({
    id: 'qml', part: 7, num: '7.1', title: 'What quantum machine learning is',
    lede: 'Quantum machine learning uses parameterized quantum circuits as trainable models, or uses quantum computers to process data. Here is the map before we dive in.',
    html: `
      <p>"Quantum machine learning" covers four different combinations of data and processing:</p>
      <div class="wide" style="overflow-x:auto;margin:6px 0 18px">
        <table style="border-collapse:collapse;min-width:520px;width:100%;font-size:0.92rem">
          <thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line-strong)"></th><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line-strong)">Classical processing</th><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line-strong)">Quantum processing</th></tr></thead>
          <tbody>
            <tr><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top">Classical data</th><td style="padding:8px;border-bottom:1px solid var(--line);vertical-align:top"><b>CC</b> · ordinary ML, plus "quantum-inspired" classical algorithms</td><td style="padding:8px;border-bottom:1px solid var(--line);vertical-align:top;background:var(--accent-soft)"><b>CQ</b> · parameterized circuits and quantum kernels on classical datasets. <b>The rest of this part.</b></td></tr>
            <tr><th style="text-align:left;padding:8px;vertical-align:top">Quantum data</th><td style="padding:8px;vertical-align:top"><b>QC</b> · classical ML on measurement records: calibrating devices, decoding error correction, learning from experiments</td><td style="padding:8px;vertical-align:top"><b>QQ</b> · quantum processing of states from quantum sensors or simulations</td></tr>
          </tbody>
        </table>
      </div>
      <p>The most studied near-term setting is <b>variational</b> (or hybrid) learning: a quantum circuit with adjustable angles plays the role of the model, and an ordinary computer trains it.</p>
      ${C.bench('loop', 'The variational loop')}
      <ol>
        <li><b>Encode</b> the input x into a quantum state |φ(x)⟩ (chapter 7.2).</li>
        <li><b>Transform</b> it with a trainable circuit U(θ), the ansatz.</li>
        <li><b>Measure</b> an observable, usually a Pauli Z, many times. The average ⟨O⟩ is the model output f(x; θ) (chapter 7.3).</li>
        <li><b>Score</b> the output against the label with a loss function, on a classical computer.</li>
        <li><b>Update</b> θ with a classical optimizer. The gradients come from running the same circuit with shifted angles (chapter 7.4).</li>
      </ol>
      <h2>Where the field stands</h2>
      <p>As of this writing there is no demonstrated practical advantage of quantum models on classical datasets. The open problems are well understood: <b>trainability</b> (gradients can vanish exponentially, chapter 7.7), the cost of <b>loading data</b> into states, noise, and <b>dequantization</b> results showing that some proposed quantum speed-ups can be matched by clever classical algorithms.
      The more promising directions involve data that is quantum to begin with, problems with built-in structure or symmetry that a circuit can exploit, and carefully designed kernels. Treat QML as an active research field, not a toolbox with guaranteed gains. That makes it a good place to do research.</p>
      ${C.keyIdea('A variational quantum model is a circuit with knobs. Classical data goes in through an encoding, a number comes out as an expectation value, and a classical optimizer turns the knobs.')}`,
    init(root) {
      const body = C.body(root, 'loop'), T = Theme.tokens();
      const W = 640, H = 250;
      const boxes = [
        { x: 20, y: 36, w: 96, t: ['Data', 'x, label y'], q: false },
        { x: 160, y: 36, w: 112, t: ['Encode', '|φ(x)⟩'], q: true },
        { x: 300, y: 36, w: 112, t: ['Ansatz', 'U(θ)'], q: true },
        { x: 440, y: 36, w: 150, t: ['Measure', 'f = ⟨Z⟩ (many shots)'], q: true },
        { x: 440, y: 170, w: 150, t: ['Loss', 'L(f, y)'], q: false },
        { x: 250, y: 170, w: 150, t: ['Optimizer', 'θ ← θ − η∇L'], q: false }
      ];
      let s = `<svg class="plot" width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;min-width:540px" role="img" aria-label="Variational loop: data, encode, ansatz, measure, loss, optimizer, back to ansatz">`;
      s += `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${T.ink2}"/></marker></defs>`;
      const pathD = 'M68,64 L215,64 L356,64 L515,64 L515,198 L325,198 L356,92';
      s += `<rect x="146" y="10" width="460" height="108" rx="14" fill="${T.accentSoft}"/><text x="596" y="27" text-anchor="end" style="fill:${T.accent};font-size:11px;font-weight:700;letter-spacing:.06em">QUANTUM COMPUTER</text>`;
      if (!reduceMotion()) s += `<circle r="6" fill="${T.q}"><animateMotion dur="5s" repeatCount="indefinite" path="${pathD}"/></circle>`;
      s += `<text x="20" y="${H - 8}" style="fill:${T.muted};font-size:11px;font-weight:700;letter-spacing:.06em">CLASSICAL COMPUTER</text>`;
      boxes.forEach(b => {
        s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="56" rx="9" fill="${T.surface}" stroke="${T.ink}" stroke-width="1.4"/>`;
        s += `<text x="${b.x + b.w / 2}" y="${b.y + 23}" text-anchor="middle" style="fill:${T.ink};font-weight:700;font-size:13px">${b.t[0]}</text><text x="${b.x + b.w / 2}" y="${b.y + 42}" text-anchor="middle" style="fill:${T.ink2};font-family:${T.fontMath};font-size:13px">${b.t[1]}</text>`;
      });
      const ar = (x1, y1, x2, y2, lab) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${T.ink2}" stroke-width="1.6" fill="none" marker-end="url(#arr)"/>` + (lab ? `<text x="${(x1 + x2) / 2 + 6}" y="${(y1 + y2) / 2}" style="fill:${T.muted};font-size:11px">${lab}</text>` : '');
      s += ar(116, 64, 158, 64) + ar(272, 64, 298, 64) + ar(412, 64, 438, 64) + ar(515, 92, 515, 168, 'f(x; θ)') + ar(440, 198, 402, 198) + `<path d="M325,170 L356,92" stroke="${T.ink2}" stroke-width="1.6" fill="none" marker-end="url(#arr)"/><text x="344" y="140" style="fill:${T.muted};font-size:11px">new θ</text>`;
      s += '</svg>';
      body.appendChild(h('div', { style: { overflowX: 'auto', display: 'flex', justifyContent: 'center' }, html: s }));
      body.appendChild(h('div', { class: 'caption', style: { textAlign: 'center' }, text: 'The blue token is one pass: x goes in, a measured number comes out, the loss updates θ, and the next pass uses the new θ.' }));
    }
  });

  /* ------------------------------------------------------------------ 7.2 */
  C.add({
    id: 'encoding', part: 7, num: '7.2', title: 'Encoding data',
    lede: 'Before a circuit can process x, x has to become a quantum state. The choice of encoding decides, more than anything else, what a quantum model can learn.',
    html: `
      <p>An encoding, or <b>feature map</b>, is a circuit <span class="m">x → |φ(x)⟩</span>. The main options:</p>
      <ul>
        <li><b>Basis encoding.</b> Bits become a basis state: x = 101 → ${K('101')}. Simple, one qubit per bit, but it only handles discrete data.</li>
        <li><b>Angle encoding.</b> Each feature sets a rotation angle, for example Ry(x₁) and Rz(x₂). The model then depends on x through sines and cosines.</li>
        <li><b>Amplitude encoding.</b> A normalized vector of length 2ⁿ becomes the amplitudes of n qubits. Exponentially compact, but preparing an arbitrary state generally takes on the order of 2ⁿ gates, which can cancel the advantage.</li>
        <li><b>Entangling feature maps.</b> Layers of H, Rz(xᵢ) and ZZ interactions with angles like (π − xᵢ)(π − xⱼ), as in Havlíček et al. (2019). They produce kernels believed to be hard to compute classically.</li>
      </ul>
      ${C.bench('enc-angle', 'Angle encoding puts data on the sphere', 'Hover a point to find it in both views')}
      <p>The scale of the angles matters. Too small and all points crowd near one pole; too large and the map wraps around, sending distant inputs to nearby states. Choosing the scale is the quantum version of choosing a kernel bandwidth (chapter 7.6).</p>
      ${C.bench('enc-amp', 'Amplitude encoding', 'Four numbers → two qubits')}
      <h2>Re-uploading and the frequency spectrum</h2>
      <p>If x enters through a gate like Rx(x), the model's output is a <b>Fourier series</b> in x. Each time the data is encoded, the available frequencies grow by one: L encodings give frequencies 0, 1, …, L (Schuld, Sweke and Meyer, 2021). This is why <b>data re-uploading</b>, encoding the same x several times between trainable layers, makes small circuits much more expressive.</p>
      ${C.bench('enc-fourier', 'A random re-uploading model and its spectrum', 'The trainable gates are random; only the structure matters here')}
      ${C.keyIdea('The encoding fixes the family of functions a quantum model can express. Angle encoding gives trigonometric features; re-uploading adds higher frequencies.')}
      ${C.tryThis(['Set the scale to 2 and watch points from opposite corners of the square land on the same spot.', 'Raise L from 1 to 4. How many non-zero bars does the spectrum have?', 'In amplitude encoding, set all four sliders equal. Which state do you get?'])}`,
    init(root) {
      /* angle encoding */
      {
        const body = C.body(root, 'enc-angle');
        let kind = 'blobs', s = 1, hi = -1;
        const kSeg = seg({ label: 'dataset', value: kind, options: [{ value: 'blobs', label: 'Two clusters' }, { value: 'circle', label: 'Circle' }, { value: 'xor', label: 'XOR' }], onchange: v => { kind = v; data = M.makeData(kind, 90, 5); draw(); } });
        const sS = slider({ label: 'scale', min: 0.2, max: 2, step: 0.01, value: s, fmt: v => num(v, 2) + '×', oninput: v => { s = v; draw(); } });
        body.append(h('div', { class: 'row' }, kSeg.el), sS.el, h('p', { class: 'note', html: 'Encoding: <span class="m">|φ(x)⟩ = Rz(s·π·x₂) Ry(s·π·(x₁+1)/2) |0⟩</span>, so x₁ sets the latitude and x₂ the longitude.' }));
        const grid = h('div', { class: 'grid2' }), L = h('div'), R = h('div'); grid.append(L, R); body.appendChild(grid);
        const plane = Plane(L, { max: 320 });
        const bv = new BlochView(R, { maxSize: 340, shadow: false });
        let data = M.makeData(kind, 90, 5);
        const enc = x => { const th = s * PI * (x[0] + 1) / 2, ph = s * PI * x[1]; return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; };
        function draw() {
          const T = Theme.tokens();
          const pts = data.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(data.y[i], T), ring: i === hi, r: i === hi ? 5.5 : 4 }));
          plane.draw(null, pts);
          bv.set({ points: data.X.map((x, i) => ({ v: enc(x), color: classColor(data.y[i], T), r: i === hi ? 6 : 3.4 })), vectors: hi >= 0 ? [{ v: enc(data.X[hi]), color: T.ink, width: 1.8, main: true }] : [] });
        }
        plane.canvas.addEventListener('pointermove', e => { const i = plane.pick(e, data.X.map(x => ({ x: x[0], y: x[1] }))); if (i !== hi) { hi = i; draw(); } });
        plane.canvas.addEventListener('pointerleave', () => { hi = -1; draw(); });
        draw();
      }
      /* amplitude encoding */
      {
        const body = C.body(root, 'enc-amp');
        const x = [0.8, -0.3, 0.5, 0.1];
        const grid = h('div', { class: 'grid2' }), L = h('div', { class: 'stack' }), R = h('div', { class: 'stack' }); grid.append(L, R); body.appendChild(grid);
        const sl = x.map((v, i) => slider({ label: `x${'₀₁₂₃'[i]}`, min: -1, max: 1, step: 0.01, value: v, fmt: w => num(w, 2), oninput: w => { x[i] = w; draw(); } }));
        L.append(...sl.map(s => s.el));
        const cg = h('div'), ket = h('div', { class: 'ket-line' }), read = h('div', { class: 'readout' });
        R.append(ket, cg, read);
        const circ = new CircleGrid(cg, { maxCols: 4 });
        function draw() {
          const nrm = Math.hypot(...x) || 1, re = x.map(v => v / nrm), im = [0, 0, 0, 0];
          circ.update(re, im, 2);
          ket.innerHTML = '|φ(x)⟩ = ' + ketExpr(re, im, 2, { d: 2 });
          read.innerHTML = `‖x‖ = ${num(nrm, 3)}. The state stores x / ‖x‖, so the norm itself is lost unless you encode it separately. Negative entries become amber (phase π).`;
        }
        draw();
      }
      /* fourier spectrum */
      {
        const body = C.body(root, 'enc-fourier');
        let L = 2, seed = 55;
        const sL = slider({ label: 'encodings L', min: 1, max: 5, step: 1, value: L, fmt: v => String(v), oninput: v => { L = v; draw(); } });
        body.append(h('div', { class: 'row' }, button('New random trainable gates', () => { seed++; draw(); }, 'btn')), sL.el,
          h('p', { class: 'note', html: 'Model: <span class="m">f(x) = ⟨Z⟩</span> for <span class="m">W<sub>L</sub> Rx(x) ⋯ W<sub>1</sub> Rx(x) W<sub>0</sub> |0⟩</span>, with random single-qubit gates W.' }));
        const grid = h('div', { class: 'grid2' }), P1 = h('div'), P2 = h('div'); grid.append(P1, P2); body.appendChild(grid);
        function draw() {
          const rng = Q.mulberry32(seed * 101 + 7), Ws = [];
          for (let j = 0; j <= 5; j++) Ws.push([Math.acos(1 - 2 * rng()), 2 * PI * rng(), 2 * PI * rng()]);
          const f = xv => { const s = new Q.State(1); s.gate('U', 0, Ws[0]); for (let j = 1; j <= L; j++) { s.gate('RX', 0, xv); s.gate('U', 0, Ws[j]); } return s.expZ(0); };
          const T = Theme.tokens(), pts = []; for (let i = 0; i <= 200; i++) { const xv = -PI + 2 * PI * i / 200; pts.push([xv, f(xv)]); }
          linePlot(P1, { height: 200, x: [-PI, PI], y: [-1, 1], yTicks: [-1, 0, 1], xTicks: [-PI, -PI / 2, 0, PI / 2, PI], xFmt: v => angle(v), xTitle: 'input x', yTitle: 'f(x)', xName: 'x', series: [{ name: 'f(x)', color: T.q, points: pts }] });
          const Mn = 64, fx = []; for (let m = 0; m < Mn; m++) fx.push(f(-PI + 2 * PI * m / Mn));
          const amps = []; for (let k = 0; k <= 6; k++) { let re = 0, im = 0; for (let m = 0; m < Mn; m++) { const xv = -PI + 2 * PI * m / Mn; re += fx[m] * Math.cos(k * xv); im -= fx[m] * Math.sin(k * xv); } amps.push(Math.hypot(re, im) / Mn); }
          bars(P2, { labels: ['0', '1', '2', '3', '4', '5', '6'], values: amps, max: Math.max(0.5, ...amps), color: T.q, fmt: v => num(v, 3), valueName: '|c_k|', height: 200, yTicks: [0, 0.25, 0.5] });
          P2.appendChild(h('div', { class: 'caption', text: `Fourier coefficient size |c_k| for frequency k. With L = ${L}, everything above k = ${L} is exactly zero.` }));
        }
        draw();
      }
    }
  });

  /* ------------------------------------------------------------------ 7.3 */
  C.add({
    id: 'pqc', part: 7, num: '7.3', title: 'Circuits as models',
    lede: 'A parameterized circuit followed by a measurement is a function f(x; θ). For one qubit you can see exactly what it computes: a plane slicing the Bloch sphere.',
    html: `
      <p>A <b>parameterized quantum circuit</b> <span class="m">U(x, θ)</span> together with an observable O defines a model</p>
      <div class="formula">f(x; θ) = ⟨φ(x, θ)| O |φ(x, θ)⟩</div>
      <p>With O = Z on one qubit, f lies between −1 and 1. For binary classification, predict class 0 when f &gt; 0 and class 1 when f &lt; 0, or turn f into a probability <span class="m">p(class 1) = (1 − f)/2</span>.</p>
      <p><b>The single-qubit picture.</b> Encode x as a point r(x) on the sphere (previous chapter). Apply a trainable rotation, then measure Z. Rotating and then measuring Z is the same as measuring along a tilted axis n̂, so</p>
      <div class="formula">f(x) = n̂ · r(x)</div>
      <p>The decision boundary f = 0 is a <b>plane through the centre of the sphere</b>, and training tilts it. That is a linear classifier on the sphere, but because the encoding is nonlinear, the boundary in the original input space is curved.</p>
      ${C.bench('pqc', 'A one-qubit classifier', 'Tilt the measurement axis by hand, or press Fit')}
      <p>Real models use several qubits, layers of rotations and entangling gates (a <b>hardware-efficient ansatz</b>), and re-upload the data. More layers make the model more expressive, but also harder to train: the tension between <b>expressibility</b> and <b>trainability</b> runs through the rest of this part.</p>
      ${C.keyIdea('One qubit, one encoding, one measurement: the classifier is a plane through the Bloch sphere. Everything bigger is a way of bending that plane.')}
      ${C.tryThis(['Press Fit on the two clusters. Where does the measurement axis end up?', 'Switch to XOR and press Fit. Why can no plane separate the classes?', 'Look at the input-space panel: why is the boundary curved even though it is a plane on the sphere?'])}`,
    init(root) {
      const body = C.body(root, 'pqc');
      let kind = 'blobs', a = PI / 2, b = PI, busy = false;
      let data = M.makeData(kind, 90, 12);
      const enc = x => { const th = PI * (x[0] + 1) / 2, ph = PI * x[1]; return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; };
      const nOf = () => [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)];
      const kSeg = seg({ label: 'dataset', value: kind, options: [{ value: 'blobs', label: 'Two clusters' }, { value: 'xor', label: 'XOR' }, { value: 'circle', label: 'Circle' }], onchange: v => { kind = v; data = M.makeData(kind, 90, 12); draw(); } });
      const sA = slider({ label: 'axis tilt α', min: 0, max: PI, step: 0.01, value: a, snapPi: true, fmt: angle, oninput: v => { a = v; draw(); } });
      const sB = slider({ label: 'axis turn β', min: 0, max: 2 * PI, step: 0.01, value: b, snapPi: true, fmt: angle, oninput: v => { b = v; draw(); } });
      const read = h('div', { class: 'readout' });
      const circHost = h('div');
      body.append(h('div', { class: 'row' }, kSeg.el, button('Fit', () => fit(), 'btn primary'), button('Random axis', () => { a = Math.acos(2 * Math.random() - 1); b = 2 * PI * Math.random(); sA.set(a); sB.set(b); draw(); }, 'btn')), sA.el, sB.el, read, circHost);
      const grid = h('div', { class: 'grid2' }), L = h('div'), R = h('div'); grid.append(L, R); body.appendChild(grid);
      const bv = new BlochView(L, { maxSize: 360, shadow: false });
      const plane = Plane(R, { max: 320 });
      const circ = { n: 1, cols: [[{ g: 'RY', p: 0, t: 'x₁' }], [{ g: 'RZ', p: 0, t: 'x₂' }], [{ g: 'RZ', p: 0, t: '−β' }], [{ g: 'RY', p: 0, t: '−α' }], [{ g: 'M' }]] };
      new G.CircuitLab.CircuitView(circHost, { editable: false, showPlayhead: false }).set(circ, 5);
      function stats() {
        const n = nOf(); let loss = 0, ok = 0;
        data.X.forEach((x, i) => { const f = n[0] * enc(x)[0] + n[1] * enc(x)[1] + n[2] * enc(x)[2]; loss += M.bce(f, data.y[i]); if ((f < 0 ? 1 : 0) === data.y[i]) ok++; });
        return { loss: loss / data.X.length, acc: ok / data.X.length };
      }
      function draw() {
        const T = Theme.tokens(), n = nOf(), st = stats();
        bv.set({ points: data.X.map((x, i) => ({ v: enc(x), color: classColor(data.y[i], T) })), plane: { n }, vectors: [{ v: n, color: T.accent, width: 2.2, label: 'n̂', main: false }] });
        plane.draw((x, y) => { const r = enc([x, y]); return n[0] * r[0] + n[1] * r[1] + n[2] * r[2]; }, data.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(data.y[i], T) })));
        read.innerHTML = `accuracy <b>${pct(st.acc, 0)}</b> · loss ${num(st.loss, 3)} · n̂ = (${num(n[0], 2)}, ${num(n[1], 2)}, ${num(n[2], 2)})<br><span class="note">Blue region: f &gt; 0, predicts the blue class. Red region: f &lt; 0. The brass circle on the sphere is the boundary f = 0.</span>`;
      }
      async function fit() {
        if (busy) return; busy = true;
        for (let it = 0; it < 120 && body.isConnected; it++) {
          let ga = 0, gb = 0; const n = nOf();
          const dA = [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), -Math.sin(a)], dB = [-Math.sin(a) * Math.sin(b), Math.sin(a) * Math.cos(b), 0];
          data.X.forEach((x, i) => {
            const r = enc(x), f = n[0] * r[0] + n[1] * r[1] + n[2] * r[2], y = data.y[i];
            const p = Math.min(1 - 1e-4, Math.max(1e-4, (1 - f) / 2)), dLdf = (-y / p + (1 - y) / (1 - p)) * -0.5;
            ga += dLdf * (dA[0] * r[0] + dA[1] * r[1] + dA[2] * r[2]); gb += dLdf * (dB[0] * r[0] + dB[1] * r[1] + dB[2] * r[2]);
          });
          a = Math.min(PI, Math.max(0, a - 0.35 * ga / data.X.length)); b = (b - 0.35 * gb / data.X.length + 2 * PI) % (2 * PI);
          sA.set(a); sB.set(b);
          if (it % 3 === 0) { draw(); await new Promise(r => requestAnimationFrame(r)); }
        }
        draw(); busy = false;
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 7.4 */
  C.add({
    id: 'gradients', part: 7, num: '7.4', title: 'Gradients: the parameter-shift rule',
    lede: 'To train a circuit you need the slope of its output with respect to each angle. Quantum hardware can measure that slope exactly with two extra runs of the same circuit.',
    html: `
      <p>Take any gate of the form <span class="m">e<sup>−iθP/2</sup></span> where P is a Pauli (Rx, Ry, Rz are all like this). As a function of that one angle, the circuit's expectation value is a pure sinusoid:
      <span class="m">f(θ) = A + B cos θ + C sin θ</span>. For a sinusoid, the slope at θ equals half the difference between the values a quarter-turn on either side:</p>
      <div class="formula">∂f/∂θ = [ f(θ + π/2) − f(θ − π/2) ] / 2</div>
      <p>This is the <b>parameter-shift rule</b> (Mitarai et al. 2018; Schuld et al. 2019). It is exact, not a finite-difference approximation, and it uses only the circuit you already have, run at two shifted angles.</p>
      ${C.bench('ps', 'The landscape along one angle', 'Circuit: |0⟩ → Ry(0.9) → Rz(0.7) → Rx(θ) → measure Z')}
      <h2>Why not finite differences?</h2>
      <p>On hardware every f is estimated from a finite number of shots and carries noise of about <span class="m">1/√shots</span>. A finite difference divides that noise by a small step h, so it explodes. The parameter-shift rule uses a large shift and divides by 2.</p>
      ${C.bench('ps-noise', 'Repeat both gradient estimates 300 times', 'Same shots for both estimators')}
      <p>The cost: two circuit evaluations per parameter per gradient, each needing many shots. A model with P parameters needs about 2P circuits per gradient step, which is why simulators use backpropagation instead and why efficient gradient estimation is an active research topic.</p>
      ${C.keyIdea('Every rotation angle traces a sinusoid, so its exact slope is half the difference of two shifted evaluations. That makes gradients measurable on real hardware, at the price of many circuit runs.')}
      ${C.tryThis(['Move θ to a peak of the curve. What does the parameter-shift rule give there?', 'Switch to 100 shots and compare the spread of the two estimators.'])}`,
    init(root) {
      const f = th => { const s = new Q.State(1); s.gate('RY', 0, 0.9).gate('RZ', 0, 0.7).gate('RX', 0, th); return s.expZ(0); };
      const df = th => (f(th + 1e-6) - f(th - 1e-6)) / 2e-6;
      const rng = Q.mulberry32(99);
      const est = (v, shots) => shots ? Math.max(-1, Math.min(1, v + Math.sqrt(Math.max(0, 1 - v * v) / shots) * Q.gaussian(rng))) : v;
      /* landscape */
      {
        const body = C.body(root, 'ps');
        let th = -1.4, shots = 0;
        const sT = slider({ label: 'θ', min: -PI, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
        const shSeg = seg({ label: 'shots', value: shots, options: [{ value: 0, label: 'exact' }, { value: 1000, label: '1,000 shots' }, { value: 100, label: '100 shots' }], onchange: v => { shots = v; draw(); } });
        const read = h('div', { class: 'readout' }), plot = h('div');
        body.append(h('div', { class: 'row' }, shSeg.el, button('Re-sample', () => draw(), 'btn')), sT.el, plot, read);
        function draw() {
          const T = Theme.tokens(), pts = []; for (let i = 0; i <= 160; i++) { const x = -PI + 2 * PI * i / 160; pts.push([x, f(x)]); }
          const fp = est(f(th + PI / 2), shots), fm = est(f(th - PI / 2), shots), g = (fp - fm) / 2, f0 = est(f(th), shots), tr = df(th);
          const L = 0.9;
          linePlot(plot, { height: 230, x: [-PI - 0.2, PI + 0.2], y: [-1.05, 1.05], yTicks: [-1, 0, 1], xTicks: [-PI, -PI / 2, 0, PI / 2, PI], xFmt: v => angle(v), xTitle: 'θ', yTitle: 'f(θ) = ⟨Z⟩', xName: 'θ',
            series: [{ name: 'f(θ)', color: T.q, points: pts }],
            segments: [{ x1: th - L, y1: f0 - g * L, x2: th + L, y2: f0 + g * L, color: T.q2, width: 2.2 }, { x1: th + PI / 2, y1: fp, x2: th - PI / 2, y2: fm, color: T.lineStrong, width: 1.2 }],
            markers: [{ x: th - PI / 2, y: fm, color: T.muted, label: 'θ − π/2' }, { x: th + PI / 2, y: fp, color: T.muted, label: 'θ + π/2' }, { x: th, y: f0, color: T.q2 }] });
          read.innerHTML = `parameter shift: [f(θ+π/2) − f(θ−π/2)]/2 = <b>${num(g, 4)}</b> · true slope f′(θ) = <b>${num(tr, 4)}</b>${shots ? ` · with ${shots} shots per evaluation` : ' · identical, as promised'}<br><span class="note">Orange: a line through f(θ) with the slope given by the rule. Grey: the chord between the two shifted points. For any sinusoid the chord is flatter than the tangent by exactly 2/π, which is why the rule divides the difference by 2 rather than by the distance π.</span>`;
        }
        draw();
      }
      /* noise comparison */
      {
        const body = C.body(root, 'ps-noise');
        let shots = 1000;
        const shSeg = seg({ label: 'shots', value: shots, options: [{ value: 10000, label: '10,000 shots' }, { value: 1000, label: '1,000 shots' }, { value: 100, label: '100 shots' }], onchange: v => { shots = v; run(); } });
        const grid = h('div', { class: 'grid2' }), P1 = h('div'), P2 = h('div'); grid.append(P1, P2);
        const read = h('div', { class: 'readout' });
        body.append(h('div', { class: 'row' }, shSeg.el, button('Run again', () => run(), 'btn primary')), grid, read);
        function hist(host, vals, truth, title) {
          const T = Theme.tokens(), mean = vals.reduce((s, v) => s + v, 0) / vals.length, sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1));
          const lo = truth - 4 * sd, hi = truth + 4 * sd, nb = 24, cnt = new Array(nb).fill(0);
          vals.forEach(v => { const k = Math.floor((v - lo) / (hi - lo) * nb); if (k >= 0 && k < nb) cnt[k]++; });
          const pts = cnt.map((c, k) => ({ x1: lo + (k + 0.5) * (hi - lo) / nb, x2: lo + (k + 0.5) * (hi - lo) / nb, y1: 0, y2: c / vals.length, color: T.q, width: 6 }));
          const ymax = Math.max(...cnt) / vals.length * 1.15;
          linePlot(host, { height: 170, x: [lo, hi], y: [0, ymax], yTicks: [0], xTicks: [lo, truth, hi], xFmt: v => num(v, 2), yTitle: title, crosshair: false, segments: pts, vlines: [{ x: truth, color: T.accent, label: 'true' }] });
          return sd;
        }
        function run() {
          const th = -1.4, tr = df(th), h0 = 0.01, ps = [], fd = [];
          for (let i = 0; i < 300; i++) {
            ps.push((est(f(th + PI / 2), shots) - est(f(th - PI / 2), shots)) / 2);
            fd.push((est(f(th + h0), shots) - est(f(th - h0), shots)) / (2 * h0));
          }
          const s1 = hist(P1, ps, tr, 'parameter shift'), s2 = hist(P2, fd, tr, 'finite difference, h = 0.01');
          read.innerHTML = `true gradient ${num(tr, 3)} · spread (standard deviation): parameter shift <b>${num(s1, 3)}</b>, finite difference <b>${num(s2, 3)}</b>, about <b>${Math.round(s2 / s1)}×</b> larger. Note the very different x-axis ranges.`;
        }
        run();
      }
    }
  });
})(window);

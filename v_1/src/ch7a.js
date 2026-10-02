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

  /* ------------------------------------------------------------------ 7.1: classical machine learning in one panel */
  C.widget('ml-basics', body => {
    const S = { kind: 'blobs', feat: 'lin', lr: 0.5 };
    let tr, te, w, b, H, epoch, last, running = false;
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    const phi = x => S.feat === 'lin' ? [x[0], x[1]] : [x[0], x[1], x[0] * x[0], x[1] * x[1]];
    const sig = z => 1 / (1 + Math.exp(-z));
    const prob = x => { const f = phi(x); let z = b; for (let i = 0; i < f.length; i++) z += w[i] * f[i]; return sig(z); }; // p(red)
    const dSeg = seg({ label: 'dataset', value: S.kind, options: [{ value: 'blobs', label: 'Two clusters' }, { value: 'circle', label: 'Circle' }], onchange: v => { S.kind = v; stop(); reset(); } });
    const fSeg = seg({ label: 'features', value: S.feat, options: [{ value: 'lin', label: 'x₁, x₂' }, { value: 'quad', label: 'x₁, x₂, x₁², x₂²' }], onchange: v => { S.feat = v; stop(); reset(); } });
    const sLr = slider({ label: 'learning rate', min: 0.05, max: 3, step: 0.05, value: S.lr, fmt: v => num(v, 2), oninput: v => { S.lr = v; } });
    const runBtn = button('Train', () => running ? stop() : start(), 'btn primary');
    body.append(h('div', { class: 'row' }, dSeg.el, fSeg.el), h('div', { class: 'row' }, h('div', { style: { flex: '1 1 260px', minWidth: 0 } }, sLr.el), runBtn,
      button('One step', () => { stop(); step(); draw(); }, 'btn'), button('Reset', () => { stop(); reset(); }, 'btn')));
    const grid = h('div', { class: 'grid2', style: { marginTop: '10px' } }), Lc = h('div', { class: 'stack' }), Rc = h('div', { class: 'stack' }); grid.append(Lc, Rc); body.appendChild(grid);
    const plane = Plane(Lc, { max: 340, caption: 'Background: the model’s prediction. Blue predicts the blue class, red the red class. Filled dots train the model; hollow dots are held back to test it.' });
    const formula = h('div', { class: 'calc' }), stats = h('div', { class: 'stats' }), pLoss = h('div');
    Rc.append(formula, stats, pLoss);
    function evalSet(D) {
      let loss = 0, ok = 0;
      D.X.forEach((x, i) => { const p = Math.min(1 - 1e-6, Math.max(1e-6, prob(x))), y = D.y[i]; loss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p)); if ((p > 0.5 ? 1 : 0) === y) ok++; });
      return { loss: loss / D.X.length, acc: ok / D.X.length };
    }
    function record() { const a = evalSet(tr), c = evalSet(te); H.lt.push([epoch, a.loss]); H.le.push([epoch, c.loss]); last = { a, c }; }
    function reset() { tr = M.makeData(S.kind, 80, 101); te = M.makeData(S.kind, 80, 202); w = phi([0, 0]).map(() => 0); b = 0; epoch = 0; H = { lt: [], le: [] }; record(); draw(); }
    function step() {
      const g = w.map(() => 0); let gb = 0;
      tr.X.forEach((x, i) => { const e = prob(x) - tr.y[i], f = phi(x); f.forEach((v, k) => { g[k] += e * v; }); gb += e; });
      const n = tr.X.length; w = w.map((v, k) => v - S.lr * g[k] / n); b -= S.lr * gb / n; epoch++; record();
    }
    function start() { running = true; runBtn.textContent = 'Pause'; loop(); }
    function stop() { running = false; runBtn.textContent = 'Train'; }
    async function loop() {
      while (running && body.isConnected && epoch < 400) { for (let k = 0; k < 4; k++) step(); draw(); await frame(); }
      stop();
    }
    function draw() {
      const T = Theme.tokens();
      const pts = tr.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(tr.y[i], T) })).concat(te.X.map((x, i) => ({ x: x[0], y: x[1], color: classColor(te.y[i], T), hollow: true, r: 3.4 })));
      plane.draw((x, y) => 1 - 2 * prob([x, y]), pts, 48);
      const terms = (S.feat === 'lin' ? ['x₁', 'x₂'] : ['x₁', 'x₂', 'x₁²', 'x₂²']).map((t, k) => `${num(w[k], 2)}·${t}`).join(' + ').replace(/\+ −/g, '− ');
      formula.innerHTML = `<div><span class="lbl">model</span>p(red) = σ(${terms} ${b < 0 ? '−' : '+'} ${num(Math.abs(b), 2)})</div><div class="note" style="font-family:var(--font-body)">σ(z) = 1/(1 + e<sup>−z</sup>) squashes any number into a probability between 0 and 1.</div>`;
      stats.innerHTML = `<div class="stat"><span class="k">step</span><span class="v">${epoch}</span></div><div class="stat"><span class="k">train accuracy</span><span class="v">${pct(last.a.acc, 0)}</span></div><div class="stat"><span class="k">test accuracy</span><span class="v">${pct(last.c.acc, 0)}</span></div><div class="stat"><span class="k">train loss</span><span class="v">${num(last.a.loss, 3)}</span></div>`;
      linePlot(pLoss, { height: 160, x: [0, Math.max(20, epoch)], y: [0, Math.max(0.8, ...H.lt.map(p => p[1]))], xTitle: 'gradient-descent steps', yTitle: 'cross-entropy loss', xName: 'step', series: [{ name: 'train', color: T.q, points: H.lt }, { name: 'test', color: T.q2, points: H.le }] });
    }
    reset();
  });
})(window);

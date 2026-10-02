/* Part I — One qubit */
(function (G) {
  'use strict';
  const { h, num, angle, pct, deg, slider, seg, button, animate, Theme, ketExpr, cx, phaseColor } = G.U;
  const { BlochView, bars, phasorSVG, phaseWheel, svg } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  /* ------------------------------------------------------------------ 1.1 */
  C.add({
    id: 'qubit', part: 1, num: '1.1', title: 'Bits and qubits',
    init(root) {
      const body = C.body(root, 'q-real');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' });
      grid.append(left, right);
      let t = PI / 4, collapsed = null, saved = null, mirror = false, busy = false;
      const sl = slider({ label: 'Angle', min: 0, max: 2 * PI, step: 0.01, value: t, fmt: v => deg(v), oninput: v => { t = v; collapsed = null; mirror = false; draw(); } });
      const presets = h('div', { class: 'row tight' },
        ...[['|0⟩', 0], ['|1⟩', PI / 2], ['(|0⟩+|1⟩)/√2', PI / 4], ['(|0⟩−|1⟩)/√2', -PI / 4], ['P(1)=¼', PI / 6]].map(([l, v]) => button(l, () => { t = (v + 2 * PI) % (2 * PI); sl.set(t); collapsed = null; mirror = false; draw(); }, 'btn')));
      const hNote = h('p', { class: 'caption' });
      const hRow = h('div', { class: 'row' }, button('Apply H', () => applyH(), 'btn'), hNote);
      const readout = h('div', { class: 'readout' });
      const probHost = h('div');
      const measRow = h('div', { class: 'row' });
      const outcome = h('span', { class: 'pill' });
      const restore = button('Restore state', () => { if (saved !== null) { t = saved; sl.set(t); } collapsed = null; draw(); }, 'btn');
      const log = h('div', { class: 'readout', style: { wordBreak: 'break-all' } });
      const histHost = h('div');
      measRow.append(button('Measure once', () => measureOnce(), 'btn primary'), button('Run 100 shots', () => shots(100), 'btn'), button('Run 1,000 shots', () => shots(1000), 'btn'), outcome, restore);
      right.append(sl.el, presets, h('p', { class: 'panel-label', text: 'Measurement probabilities' }), probHost, readout, h('p', { class: 'panel-label', text: 'Apply a gate' }), hRow, h('p', { class: 'panel-label', text: 'Measure' }), measRow, log, histHost);
      const rng = Q.mulberry32(20260929);

      function draw() {
        const T = Theme.tokens(), a = Math.cos(t), b = Math.sin(t);
        const S = Math.min(340, left.clientWidth || 320), c = S / 2, R = S * 0.36;
        left.innerHTML = '';
        const s = svg('svg', { class: 'plot', width: S, height: S, viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': `state arrow with alpha ${num(a, 3)} and beta ${num(b, 3)}` }, left);
        svg('circle', { cx: c, cy: c, r: R, fill: 'none', stroke: T.lineStrong }, s);
        svg('line', { x1: c - R - 18, x2: c + R + 18, y1: c, y2: c, stroke: T.lineStrong }, s);
        svg('line', { y1: c - R - 18, y2: c + R + 18, x1: c, x2: c, stroke: T.lineStrong }, s);
        const tx = (x, y, str, anchor = 'middle', cls = '') => { const e = svg('text', { x, y, 'text-anchor': anchor, style: `fill:${T.ink2};font-family:${T.fontMath};font-size:14px`, class: cls }, s); e.textContent = str; return e; };
        tx(c + R + 16, c - 8, '|0⟩', 'end'); tx(c + 8, c - R - 8, '|1⟩', 'start');
        if (mirror) {
          const m = PI / 8, L = R + 14;
          svg('line', { x1: c - L * Math.cos(m), y1: c + L * Math.sin(m), x2: c + L * Math.cos(m), y2: c - L * Math.sin(m), stroke: T.accent, 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, s);
          const ml = tx(c + (L + 2) * Math.cos(m), c - (L + 2) * Math.sin(m) - 8, 'H mirror', 'end'); ml.style.fontSize = '12px'; ml.style.fill = T.accent;
        }
        const X = c + R * a, Y = c - R * b;
        svg('line', { x1: X, y1: Y, x2: X, y2: c, stroke: T.muted, 'stroke-width': 1 }, s);
        svg('line', { x1: X, y1: Y, x2: c, y2: Y, stroke: T.muted, 'stroke-width': 1 }, s);
        svg('line', { x1: c, y1: c + 0.5, x2: X, y2: c + 0.5, stroke: T.q2, 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
        svg('line', { x1: c - 0.5, y1: c, x2: c - 0.5, y2: Y, stroke: T.q3, 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
        svg('line', { x1: c, y1: c, x2: X, y2: Y, stroke: T.q, 'stroke-width': 3, 'stroke-linecap': 'round' }, s);
        svg('circle', { cx: X, cy: Y, r: 7, fill: T.surface }, s); svg('circle', { cx: X, cy: Y, r: 5, fill: T.q }, s);
        const la = tx(c + R * a / 2, c + (b >= 0 ? 18 : -10), 'α = ' + num(a, 2)); la.style.fontSize = '12px';
        const lb = tx(c + (a >= 0 ? -10 : 10), c - R * b / 2 + 4, 'β = ' + num(b, 2), a >= 0 ? 'end' : 'start'); lb.style.fontSize = '12px';
        bars(probHost, { labels: ['0', '1'], values: [a * a, b * b], colors: [T.q2, T.q3], max: 1, fmt: v => pct(v), valueName: 'probability', height: 120, yTicks: [0, 0.5, 1] });
        readout.innerHTML = `α = <b>${num(a, 3)}</b>, β = <b>${num(b, 3)}</b><br>P(0) = α² = <b>${pct(a * a)}</b>, P(1) = β² = <b>${pct(b * b)}</b>, sum = ${num(a * a + b * b, 3)}`;
        outcome.hidden = collapsed === null; restore.hidden = collapsed === null;
        if (collapsed !== null) outcome.innerHTML = `Read <b>${collapsed}</b>: the state is now |${collapsed}⟩`;
      }
      /* On real amplitudes H is a mirror: cos t|0⟩ + sin t|1⟩ goes to the state at angle π/4 − t,
         the reflection in the line at π/8. Animate along the short way, which crosses the mirror. */
      function applyH() {
        if (busy) return; busy = true;
        let d = (PI / 4 - 2 * t) % (2 * PI); if (d > PI) d -= 2 * PI; if (d <= -PI) d += 2 * PI;
        const from = t, before = [Math.cos(t), Math.sin(t)];
        collapsed = null; mirror = true;
        animate(600, k => { t = from + d * k; draw(); }).then(() => {
          t = ((from + d) % (2 * PI) + 2 * PI) % (2 * PI); sl.set(t); draw(); busy = false;
          const after = [Math.cos(t), Math.sin(t)];
          hNote.innerHTML = `H reflected the arrow in the brass line: P(1) went from ${pct(before[1] ** 2)} to ${pct(after[1] ** 2)}.`;
        });
      }
      function measureOnce() {
        const p1 = Math.sin(t) ** 2, o = rng() < p1 ? 1 : 0;
        if (collapsed === null) saved = t;
        const from = t, target = o ? (Math.sin(t) >= 0 ? PI / 2 : 3 * PI / 2) : (Math.cos(t) >= 0 ? 0 : PI);
        let d = target - from; if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI;
        collapsed = o;
        animate(350, k => { t = from + d * k; draw(); }).then(() => { t = (target + 2 * PI) % (2 * PI); sl.set(t); draw(); });
      }
      function shots(N) {
        const p1 = Math.sin(t) ** 2; let ones = 0; const seq = [];
        for (let i = 0; i < N; i++) { const o = rng() < p1 ? 1 : 0; ones += o; if (i < 60) seq.push(o); }
        const est = ones / N, se = Math.sqrt(Math.max(est * (1 - est), 1e-12) / N);
        log.innerHTML = `First outcomes: ${seq.join(' ')}${N > 60 ? ' …' : ''}<br>${N.toLocaleString()} shots: ${(N - ones).toLocaleString()} zeros, ${ones.toLocaleString()} ones. Estimated P(1) = <b>${num(est, 3)} ± ${num(se, 3)}</b> (true ${num(p1, 3)})`;
        const T = Theme.tokens();
        bars(histHost, { labels: ['0', '1'], values: [1 - est, est], marks: [1 - p1, p1], colors: [T.q2, T.q3], max: 1, fmt: v => pct(v), valueName: 'measured', markName: 'exact', height: 120, yTicks: [0, 0.5, 1] });
      }
      draw();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => draw()).observe(left);
    }
  });

  /* ------------------------------------------------------------------ 1.2 */
  C.add({
    id: 'phase', part: 1, num: '1.2', title: 'Phase',
    init(root) {
      root.querySelector('[data-wheel]').innerHTML = phaseWheel(92);
      const body = C.body(root, 'q-phase');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div', { class: 'stack' }), right = h('div', { class: 'stack' }); grid.append(left, right);
      let th = PI / 2, ga = 0, gb = 0;
      const dials = h('div', { class: 'row', style: { gap: '18px', justifyContent: 'center' } });
      const sTh = slider({ label: 'Split θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
      const sGa = slider({ label: 'arg α', min: -PI, max: PI, step: 0.01, value: ga, snapPi: true, fmt: angle, oninput: v => { ga = v; draw(); } });
      const sGb = slider({ label: 'arg β', min: -PI, max: PI, step: 0.01, value: gb, snapPi: true, fmt: angle, oninput: v => { gb = v; draw(); } });
      const wrapA = v => { let x = v; while (x > PI) x -= 2 * PI; while (x < -PI) x += 2 * PI; return x; };
      const turn = (both) => {
        const a0 = ga, b0 = gb;
        animate(500, k => { gb = wrapA(b0 + k * PI / 4); if (both) ga = wrapA(a0 + k * PI / 4); sGa.set(ga); sGb.set(gb); draw(); });
      };
      left.append(dials, sTh.el, sGa.el, sGb.el, h('div', { class: 'row' }, button('Turn both by 45° (global)', () => turn(true), 'btn'), button('Turn β only by 45° (relative)', () => turn(false), 'btn primary')));
      const sph = h('div'); const bv = new BlochView(sph, { maxSize: 300 });
      const read = h('div', { class: 'readout' });
      right.append(h('p', { class: 'panel-label', text: 'What you could measure' }), sph, read);
      function draw() {
        const ma = Math.cos(th / 2), mb = Math.sin(th / 2);
        const are = ma * Math.cos(ga), aim = ma * Math.sin(ga), bre = mb * Math.cos(gb), bim = mb * Math.sin(gb);
        dials.innerHTML = `<div style="text-align:center">${phasorSVG(are, aim, 132, { label: 'α = ' + cx(are, aim, { d: 2 }).replace(/<[^>]+>/g, '') })}</div><div style="text-align:center">${phasorSVG(bre, bim, 132, { label: 'β = ' + cx(bre, bim, { d: 2 }).replace(/<[^>]+>/g, '') })}</div>`;
        const b = Q.blochOf([are, aim, bre, bim]);
        bv.set({ vectors: [{ v: b, main: true }] });
        const rel = wrapA(gb - ga);
        read.innerHTML = `P(0) = <b>${pct(ma * ma)}</b> · P(1) = <b>${pct(mb * mb)}</b><br>relative phase φ = <b>${angle(rel)}</b><br>P(+) in the X basis = (1 + ⟨X⟩)/2 = <b>${pct((1 + b[0]) / 2)}</b>`;
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 1.3 */
  C.add({
    id: 'bloch', part: 1, num: '1.3', title: 'The Bloch sphere',
    init(root) {
      const body = C.body(root, 'q-bloch');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
      let th = PI / 3, ph = PI / 2;
      const bv = new BlochView(left, {
        maxSize: 440, angles: true,
        onDrag: v => { const a = Q.anglesOf(v); th = a.theta; ph = a.phi; sTh.set(th); sPh.set(ph); draw(); }
      });
      const sTh = slider({ label: 'θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
      const sPh = slider({ label: 'φ', min: 0, max: 2 * PI, step: 0.01, value: ph, snapPi: true, fmt: angle, oninput: v => { ph = v; draw(); } });
      const pres = h('div', { class: 'row tight' }, ...[['|0⟩', 0, 0], ['|1⟩', PI, 0], ['|+⟩', PI / 2, 0], ['|−⟩', PI / 2, PI], ['|+i⟩', PI / 2, PI / 2], ['|−i⟩', PI / 2, 3 * PI / 2]].map(([l, a, b]) => button(l, () => {
        const a0 = th, b0 = ph; let db = b - b0; if (db > PI) db -= 2 * PI; if (db < -PI) db += 2 * PI;
        animate(450, k => { th = a0 + (a - a0) * k; ph = (b0 + db * k + 2 * PI) % (2 * PI); sTh.set(th); sPh.set(ph); draw(); });
      }, 'btn')));
      const ket = h('div', { class: 'ket-line' }), read = h('div', { class: 'readout' }), probs = h('div');
      right.append(sTh.el, sPh.el, pres, h('p', { class: 'panel-label', text: 'The state' }), ket, read, probs);
      function draw() {
        const v = Q.stateFromBloch(th, ph), b = Q.blochOf(v);
        bv.set({ vectors: [{ v: b, main: true, drag: true }] });
        ket.innerHTML = '|ψ⟩ = ' + ketExpr([v[0], v[2]], [v[1], v[3]], 1);
        read.innerHTML = `x = ⟨X⟩ = <b>${num(b[0], 3)}</b> · y = ⟨Y⟩ = <b>${num(b[1], 3)}</b> · z = ⟨Z⟩ = <b>${num(b[2], 3)}</b>`;
        const T = Theme.tokens();
        bars(probs, { labels: ['0', '1'], values: [(1 + b[2]) / 2, (1 - b[2]) / 2], colors: [T.q2, T.q3], max: 1, fmt: v2 => pct(v2), valueName: 'probability', height: 110, yTicks: [0, 0.5, 1] });
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 1.2: adding amplitudes */
  /* In the X basis the amplitudes are (α + β)/√2 and (α − β)/√2, so P(±) = |α ± β|²/2.
     Draw α, then β added tip to tail (and subtracted), so the phase visibly decides the lengths. */
  C.widget('add-amps', body => {
    const { plane2d, arrow, onResize } = G.V, TK = G.Toolkit;
    let th = PI / 2, phi = PI / 2;
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' }); grid.append(left, right);
    const sTh = slider({ label: 'split θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
    const sPh = slider({ label: 'phase φ', min: -PI, max: PI, step: 0.01, value: phi, snapPi: true, fmt: angle, oninput: v => { phi = v; draw(); } });
    const pres = h('div', { class: 'row tight' }, ...[['|+⟩', PI / 2, 0], ['|−⟩', PI / 2, PI], ['|+i⟩', PI / 2, PI / 2], ['|0⟩', 0, 0], ['θ = π/3', PI / 3, 0]].map(([l, a, b]) =>
      button(l, () => { th = a; phi = b; sTh.set(a); sPh.set(b); draw(); }, 'btn')));
    const read = h('div', { class: 'calc' }), probs = h('div');
    right.append(sTh.el, sPh.el, pres, read, h('p', { class: 'panel-label', text: 'Measured in the X basis' }), probs,
      h('p', { class: 'caption', html: 'The state is cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩. Blue is α and orange is β. The dark arrow is α + β, and the green arrow is α − β.' }));
    let P = null, key = '';
    function draw() {
      const k = left.clientWidth; if (!P || k !== key) { key = k; P = plane2d(left, { range: 1.5, grid: 0.5, tickStep: 1, max: 420, label: 'the amplitudes alpha and beta, their sum and difference' }); }
      const T = Theme.tokens(), { fg, X, Y } = P; fg.innerHTML = '';
      const a = [Math.cos(th / 2), 0], b = [Math.sin(th / 2) * Math.cos(phi), Math.sin(th / 2) * Math.sin(phi)];
      const sum = [a[0] + b[0], a[1] + b[1]], dif = [a[0] - b[0], a[1] - b[1]];
      const sp = (sum[0] ** 2 + sum[1] ** 2) / 2, dp = (dif[0] ** 2 + dif[1] ** 2) / 2;
      // β added at the tip of α, and subtracted
      arrow(fg, X(a[0]), Y(a[1]), X(sum[0]), Y(sum[1]), { color: T.q2, width: 2, opacity: 0.5 });
      arrow(fg, X(a[0]), Y(a[1]), X(dif[0]), Y(dif[1]), { color: T.q2, width: 2, opacity: 0.25 });
      arrow(fg, X(0), Y(0), X(dif[0]), Y(dif[1]), { color: T.q3, width: 2.6 });
      arrow(fg, X(0), Y(0), X(sum[0]), Y(sum[1]), { color: T.ink, width: 2.6 });
      arrow(fg, X(0), Y(0), X(b[0]), Y(b[1]), { color: T.q2, width: 2.6 });
      arrow(fg, X(0), Y(0), X(a[0]), Y(a[1]), { color: T.q, width: 2.6 });
      const L = (p, str, col, dx = 8, dy = -8) => { if (Math.hypot(p[0], p[1]) > 0.08) TK.label(P, p[0], p[1], str, { dx, dy, color: col, weight: 700 }); };
      L(a, 'α', T.q, 6, 18); L(b, 'β', T.q2); L(sum, 'α + β', T.ink); L(dif, 'α − β', T.q3, 8, 16);
      const f = (z) => TK.fmtC(z[0], z[1]);
      read.innerHTML = `<div><span class="lbl">α</span>${f(a)} &nbsp; <span class="lbl">β</span>${f(b)}</div>` +
        `<div><span class="lbl">Z basis</span>P(0) = |α|² = ${pct(a[0] ** 2)}, P(1) = |β|² = ${pct(b[0] ** 2 + b[1] ** 2)}: the phase φ plays no part</div>` +
        `<div><span class="lbl">P(+)</span>|α + β|²/2 = <b>${pct(sp)}</b></div><div><span class="lbl">P(−)</span>|α − β|²/2 = <b>${pct(dp)}</b></div>`;
      bars(probs, { labels: ['+', '−'], values: [sp, dp], colors: [T.ink2, T.q3], max: 1, fmt: v => pct(v), valueName: 'probability', height: 110, yTicks: [0, 0.5, 1] });
    }
    draw();
    onResize(left, draw);
  });

  /* ------------------------------------------------------------------ 1.3: two states on the sphere */
  C.widget('bloch-pair', body => {
    const T0 = () => Theme.tokens();
    let A = [0, 0], Bs = [PI / 2, 0]; // [θ, φ] of ψ and χ
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
    const bv = new BlochView(left, { maxSize: 420, shadow: false, onDrag: (p, i) => { const a = Q.anglesOf(p); if (i === 0) A = [a.theta, a.phi]; else Bs = [a.theta, a.phi]; draw(); } });
    const pres = h('div', { class: 'row tight' }, ...[['|0⟩ and |1⟩', [0, 0], [PI, 0]], ['|0⟩ and |+⟩', [0, 0], [PI / 2, 0]], ['|+⟩ and |+i⟩', [PI / 2, 0], [PI / 2, PI / 2]], ['|+⟩ and |−⟩', [PI / 2, 0], [PI / 2, PI]], ['the same state', [PI / 3, PI / 4], [PI / 3, PI / 4]]].map(([l, a, b]) =>
      button(l, () => { A = a.slice(); Bs = b.slice(); draw(); }, 'btn')));
    const kets = h('div', { class: 'readout' }), read = h('div', { class: 'calc' }), meter = h('div');
    right.append(h('p', { class: 'caption', text: 'Drag either arrow tip. Drag elsewhere to turn the sphere.' }), pres, kets, read, meter);
    function slerp(r, s, n = 48) {
      const d = Math.max(-1, Math.min(1, r[0] * s[0] + r[1] * s[1] + r[2] * s[2])), g = Math.acos(d);
      if (g < 1e-3) return [];
      let u = s;
      if (Math.PI - g < 1e-3) { // antipodal: go through any perpendicular direction
        const t = Math.abs(r[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], k = t[0] * r[0] + t[1] * r[1] + t[2] * r[2];
        const w = [t[0] - k * r[0], t[1] - k * r[1], t[2] - k * r[2]], L = Math.hypot(...w);
        const pts = []; for (let i = 0; i <= n; i++) { const a = PI * i / n; pts.push([0, 1, 2].map(j => Math.cos(a) * r[j] + Math.sin(a) * w[j] / L)); } return pts;
      }
      const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; const c0 = Math.sin((1 - t) * g) / Math.sin(g), c1 = Math.sin(t * g) / Math.sin(g); pts.push([0, 1, 2].map(j => c0 * r[j] + c1 * u[j])); }
      return pts;
    }
    function draw() {
      const T = T0(), v = Q.stateFromBloch(A[0], A[1]), w = Q.stateFromBloch(Bs[0], Bs[1]);
      const r = Q.blochOf(v), s = Q.blochOf(w);
      const dot = Math.max(-1, Math.min(1, r[0] * s[0] + r[1] * s[1] + r[2] * s[2])), g = Math.acos(dot);
      bv.set({ vectors: [{ v: r, main: true, drag: true, color: T.q, label: 'ψ' }, { v: s, drag: true, color: T.q2, label: 'χ' }], trail: slerp(r, s), trailColor: T.accent });
      // ⟨ψ|χ⟩ from the amplitudes
      const re = v[0] * w[0] + v[1] * w[1] + v[2] * w[2] + v[3] * w[3], im = v[0] * w[1] - v[1] * w[0] + v[2] * w[3] - v[3] * w[2];
      const ov = re * re + im * im;
      kets.innerHTML = `<div style="color:${T.q}">|ψ⟩ = ${ketExpr([v[0], v[2]], [v[1], v[3]], 1)}</div><div style="color:${T.q2}">|χ⟩ = ${ketExpr([w[0], w[2]], [w[1], w[3]], 1)}</div>`;
      read.innerHTML = `<div><span class="lbl">angle on the sphere</span>γ = <b>${deg(g)}</b></div>` +
        `<div><span class="lbl">angle between the state vectors</span>γ/2 = <b>${deg(g / 2)}</b></div>` +
        `<div><span class="lbl">from the amplitudes</span>|⟨ψ|χ⟩|² = <b>${num(ov, 3)}</b></div>` +
        `<div><span class="lbl">from the sphere</span>(1 + r·s)/2 = (1 + ${num(dot, 3)})/2 = <b>${num((1 + dot) / 2, 3)}</b> = cos²(γ/2)</div>`;
      const W = Math.min(320, right.clientWidth || 300);
      meter.innerHTML = `<svg class="plot" width="${W}" height="30" viewBox="0 0 ${W} 30" role="img" aria-label="overlap ${pct(ov)}"><rect x="0" y="6" width="${W}" height="10" rx="5" fill="${T.surface3}"/><rect x="0" y="6" width="${W * ov}" height="10" rx="5" fill="${T.accent}"/><text x="0" y="29" font-size="10" style="fill:${T.muted}">orthogonal</text><text x="${W}" y="29" text-anchor="end" font-size="10" style="fill:${T.muted}">identical</text></svg>` +
        `<p class="note" style="margin:4px 0 0">${ov < 1e-6 ? 'Opposite points: the states are orthogonal, and one measurement can tell them apart every time.' : ov > 1 - 1e-6 ? 'The same point: the same physical state.' : `Prepare χ and measure in a basis containing ψ: you get ψ with probability ${pct(ov)}.`}</p>`;
    }
    draw();
  });
})(window);

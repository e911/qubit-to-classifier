/* Part 0 — The math toolkit: chapter registrations and interactive benches.
   The words for these chapters live in src/text/p0.js. */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, cx, nextId } = G.U;
  const { plane2d, arrow, dragPoints, onResize, svg } = G.V;
  const Q = G.QSim, C = G.C, PI = Math.PI, R2 = Math.SQRT1_2;

  C.add({ id: 'complex', part: 0, num: '0.1', title: 'Complex numbers' });
  C.add({ id: 'linalg', part: 0, num: '0.2', title: 'Vectors, matrices and Dirac notation' });
  C.add({ id: 'eigen', part: 0, num: '0.3', title: 'Eigenvectors, unitary and Hermitian matrices' });

  /* ---------- small helpers ---------- */
  const t2 = (x, d = 2) => {
    let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
  };
  const par = (x, d = 2) => x < -0.5 * 10 ** -d ? `(${t2(x, d)})` : t2(x, d);
  function fmtC(a, b, d = 2) {
    const A = Math.abs(a) < 0.5 * 10 ** -d ? 0 : a, Bv = Math.abs(b) < 0.5 * 10 ** -d ? 0 : b;
    if (Bv === 0) return t2(A, d);
    const im = (Math.abs(Math.abs(Bv) - 1) < 1e-9 ? '' : t2(Math.abs(Bv), d)) + 'i';
    if (A === 0) return (Bv < 0 ? '−' : '') + im;
    return `${t2(A, d)} ${Bv < 0 ? '−' : '+'} ${im}`;
  }
  /* parse "1+2i", "3 - i", "-0.5i", "2" (also accepts j and the minus sign −) */
  function parseC(str) {
    const s = String(str).replace(/\s+/g, '').replace(/−/g, '-').replace(/[jJ]/g, 'i').replace(/\*/g, '');
    if (!s) return null;
    const terms = s.match(/[+-]?[^+-]+/g); if (!terms) return null;
    let re = 0, im = 0;
    for (const t of terms) {
      if (/i$/.test(t)) {
        const c = t.slice(0, -1), v = c === '' || c === '+' ? 1 : c === '-' ? -1 : Number(c);
        if (!isFinite(v)) return null; im += v;
      } else { const v = Number(t); if (!isFinite(v)) return null; re += v; }
    }
    return [re, im];
  }
  const mag = z => Math.hypot(z[0], z[1]);
  const argOf = z => Math.atan2(z[1], z[0]);
  const mul = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
  const degs = a => `${t2(a * 180 / PI, 0)}°`;
  function arcPath(P, r, a0, a1) {
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.08)); let d = '';
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; d += (i ? 'L' : 'M') + P.X(r * Math.cos(t)).toFixed(1) + ',' + P.Y(r * Math.sin(t)).toFixed(1); }
    return d;
  }
  function label(P, x, y, text, o = {}) {
    const T = Theme.tokens();
    const e = svg('text', { x: P.X(x) + (o.dx || 0), y: P.Y(y) + (o.dy || 0), 'text-anchor': o.anchor || 'start', style: `fill:${o.color || T.ink2};font-family:${o.font || T.fontMath};font-size:${o.size || 14}px;font-weight:${o.weight || 400}` }, P.fg);
    if (o.html) e.innerHTML = text; else e.textContent = text; return e;
  }
  function handle(P, p, color) {
    const T = Theme.tokens();
    svg('circle', { cx: P.X(p[0]), cy: P.Y(p[1]), r: 8, fill: T.surface }, P.fg);
    svg('circle', { cx: P.X(p[0]), cy: P.Y(p[1]), r: 5.5, fill: color }, P.fg);
  }

  /* ===================================================================== 0.1 */
  C.widget('cx-plane', body => {
    let z = [1, 1], w = [0.5, 1.5], mode = 'add', range = 3;
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' }); grid.append(left, right);
    const mSeg = seg({ label: 'operation', value: mode, options: [{ value: 'add', label: 'z + w' }, { value: 'mul', label: 'z × w' }, { value: 'conj', label: 'z* and |z|²' }], onchange: v => { mode = v; draw(); } });
    const rSeg = seg({ label: 'view range', value: range, options: [{ value: 2, label: '±2' }, { value: 3, label: '±3' }, { value: 6, label: '±6' }], onchange: v => { range = v; draw(); } });
    const mkIn = (lab, set) => {
      const id = nextId('cx'), inp = h('input', { type: 'text', class: 'cx-in', id, autocomplete: 'off', spellcheck: 'false', inputmode: 'text' });
      const apply = () => { const v = parseC(inp.value); if (v) { inp.classList.remove('bad'); set(v); draw(false); } else inp.classList.add('bad'); };
      inp.addEventListener('change', apply);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
      return { el: h('label', { class: 'cx-field', for: id }, h('span', { text: lab }), inp), inp };
    };
    const zIn = mkIn('z =', v => { z = v; }), wIn = mkIn('w =', v => { w = v; });
    const read = h('div', { class: 'calc' }), note = h('p', { class: 'caption' });
    right.append(h('div', { class: 'row' }, mSeg.el), h('div', { class: 'row' }, zIn.el, wIn.el),
      h('p', { class: 'caption', text: 'Type numbers such as 1+2i, -i or 0.5, then press Enter. Or drag the points.' }), read, note,
      h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'View' }), rSeg.el));
    let P = null, key = '';
    function plane() {
      const k = range + ':' + left.clientWidth; if (P && k === key) return; key = k;
      P = plane2d(left, { range, max: 430, label: 'complex plane with z and w' });
      dragPoints(P, () => [z, mode === 'conj' ? null : w], (i, p) => {
        const st = range <= 2 ? 0.05 : range <= 3 ? 0.1 : 0.25;
        const q = p.map(v => Math.max(-range, Math.min(range, Math.round(v / st) * st)));
        if (i === 0) z = q; else w = q; draw();
      });
    }
    function draw(sync = true) {
      plane();
      const T = Theme.tokens(), { fg, X, Y } = P; fg.innerHTML = '';
      const o = [X(0), Y(0)];
      let r = null, rl = '';
      if (mode === 'add') {
        r = [z[0] + w[0], z[1] + w[1]]; rl = 'z + w';
        arrow(fg, X(z[0]), Y(z[1]), X(r[0]), Y(r[1]), { color: T.q2, width: 2, opacity: 0.45 });
      } else if (mode === 'mul') {
        r = mul(z, w); rl = 'zw';
        const az = argOf(z), aw = argOf(w);
        if (mag(z) > 0.05) svg('path', { d: arcPath(P, 0.11 * range, 0, az), fill: 'none', stroke: T.q, 'stroke-width': 2 }, fg);
        if (mag(w) > 0.05) svg('path', { d: arcPath(P, 0.17 * range, 0, aw), fill: 'none', stroke: T.q2, 'stroke-width': 2 }, fg);
        if (mag(r) > 0.05) svg('path', { d: arcPath(P, 0.23 * range, 0, az + aw), fill: 'none', stroke: T.ink, 'stroke-width': 1.5 }, fg);
      } else {
        const zc = [z[0], -z[1]], m2 = z[0] ** 2 + z[1] ** 2;
        svg('line', { x1: X(z[0]), y1: Y(z[1]), x2: X(zc[0]), y2: Y(zc[1]), stroke: T.muted, 'stroke-width': 1 }, fg);
        arrow(fg, o[0], o[1], X(zc[0]), Y(zc[1]), { color: T.q, width: 2, opacity: 0.5 });
        label(P, zc[0], zc[1], 'z*', { dx: 8, dy: 14, color: T.q });
        if (m2 <= range) {
          svg('circle', { cx: X(m2), cy: Y(0), r: 7, fill: T.surface }, fg);
          svg('circle', { cx: X(m2), cy: Y(0), r: 5, fill: T.ink }, fg);
          label(P, m2, 0, '|z|²', { dx: 0, dy: -12, anchor: 'middle', color: T.ink });
        }
      }
      arrow(fg, o[0], o[1], X(z[0]), Y(z[1]), { color: T.q, width: 2.6 });
      if (mode !== 'conj') arrow(fg, o[0], o[1], X(w[0]), Y(w[1]), { color: T.q2, width: 2.6 });
      const inView = r && Math.abs(r[0]) <= range && Math.abs(r[1]) <= range;
      if (r && inView) {
        arrow(fg, o[0], o[1], X(r[0]), Y(r[1]), { color: T.ink, width: 2.6 });
        label(P, r[0], r[1], rl, { dx: 8, dy: -8, color: T.ink, weight: 600 });
      }
      handle(P, z, T.q); label(P, z[0], z[1], 'z', { dx: 9, dy: -9, color: T.q, weight: 600 });
      if (mode !== 'conj') { handle(P, w, T.q2); label(P, w[0], w[1], 'w', { dx: 9, dy: -9, color: T.q2, weight: 600 }); }
      // the arithmetic, with the actual numbers
      const [a, b] = z, [c, d] = w, lines = [];
      lines.push(`<span class="lbl">z</span>${fmtC(a, b)} &nbsp; <span class="lbl">|z|</span>${t2(mag(z))} &nbsp; <span class="lbl">arg z</span>${degs(argOf(z))}`);
      if (mode !== 'conj') lines.push(`<span class="lbl">w</span>${fmtC(c, d)} &nbsp; <span class="lbl">|w|</span>${t2(mag(w))} &nbsp; <span class="lbl">arg w</span>${degs(argOf(w))}`);
      if (mode === 'add') lines.push(`<span class="lbl">sum</span>(${t2(a)} + ${par(c)}) + (${t2(b)} + ${par(d)})i = <b>${fmtC(r[0], r[1])}</b>`);
      if (mode === 'mul') {
        lines.push(`<span class="lbl">product</span>(${par(a)} × ${par(c)} − ${par(b)} × ${par(d)}) + (${par(a)} × ${par(d)} + ${par(b)} × ${par(c)})i = <b>${fmtC(r[0], r[1])}</b>`);
        lines.push(`<span class="lbl">lengths multiply</span>${t2(mag(z))} × ${t2(mag(w))} = <b>${t2(mag(z) * mag(w))}</b> = |zw|`);
        const s = argOf(z) + argOf(w), sr = argOf(r);
        lines.push(`<span class="lbl">angles add</span>${degs(argOf(z))} + ${degs(argOf(w))} = <b>${degs(s)}</b>${mag(r) > 1e-6 && Math.abs(s - sr) > 1e-6 ? ` (the same direction as ${degs(sr)})` : ''}`);
      }
      if (mode === 'conj') {
        lines.push(`<span class="lbl">conjugate</span>z* = <b>${fmtC(a, -b)}</b>`);
        lines.push(`<span class="lbl">z z*</span>${par(a)}² + ${par(b)}² = <b>${t2(a * a + b * b)}</b> = |z|²`);
      }
      read.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
      note.textContent = r && !inView ? `The result ${fmtC(r[0], r[1])} is outside this view. Choose a wider view below.` : '';
      if (sync) { zIn.inp.value = fmtC(a, b); wIn.inp.value = fmtC(c, d); zIn.inp.classList.remove('bad'); wIn.inp.classList.remove('bad'); }
    }
    draw();
    onResize(left, () => draw(false));
  });

  C.widget('cx-euler', body => {
    let th = PI / 4, rot = false; const z0 = [1.25, 0.5];
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' }); grid.append(left, right);
    const sT = slider({ label: 'θ', min: 0, max: 2 * PI, step: 0.01, value: th, snapPi: true, fmt: v => `${angle(v)} = ${degs(v)}`, oninput: v => { th = v; draw(); } });
    const chkId = nextId('rot'), chk = h('input', { type: 'checkbox', id: chkId });
    chk.addEventListener('change', () => { rot = chk.checked; draw(); });
    const pres = h('div', { class: 'row tight' }, ...[[0, '0'], [PI / 4, 'π/4'], [PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2']].map(([v, l]) => button(`θ = ${l}`, () => { th = v; sT.set(v); draw(); }, 'btn')));
    const read = h('div', { class: 'calc' });
    right.append(sT.el, pres, h('label', { class: 'chk', for: chkId }, chk, h('span', { html: 'Also multiply z = 1.25 + 0.5i by e<sup>iθ</sup>' })), read);
    let P = null, key = '';
    const named = { '0': '1', '1': '(1 + i)/√2', '2': 'i', '4': '−1', '6': '−i', '3': '(−1 + i)/√2', '5': '(−1 − i)/√2', '7': '(1 − i)/√2' };
    function draw() {
      const k = left.clientWidth; if (!P || k !== key) { key = k; P = plane2d(left, { range: 1.6, grid: 0.5, tickStep: 1, max: 420, label: 'unit circle with e^{iθ}' }); }
      const T = Theme.tokens(), { fg, X, Y } = P; fg.innerHTML = '';
      const c = Math.cos(th), s = Math.sin(th);
      svg('path', { d: arcPath(P, 0.28, 0, th), fill: 'none', stroke: T.accent, 'stroke-width': 2 }, fg);
      label(P, 0.4 * Math.cos(th / 2), 0.4 * Math.sin(th / 2), 'θ', { anchor: 'middle', dy: 5, color: T.accent, weight: 600 });
      svg('line', { x1: X(c), y1: Y(s), x2: X(c), y2: Y(0), stroke: T.muted, 'stroke-width': 1 }, fg);
      svg('line', { x1: X(c), y1: Y(s), x2: X(0), y2: Y(s), stroke: T.muted, 'stroke-width': 1 }, fg);
      svg('line', { x1: X(0), y1: Y(0), x2: X(c), y2: Y(0), stroke: T.q2, 'stroke-width': 5, 'stroke-linecap': 'round' }, fg);
      svg('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(s), stroke: T.q3, 'stroke-width': 5, 'stroke-linecap': 'round' }, fg);
      label(P, c / 2, 0, 'cos θ', { anchor: 'middle', dy: s >= 0 ? 18 : -9, size: 12, font: T.fontBody });
      label(P, 0, s / 2, 'sin θ', { anchor: c >= 0 ? 'end' : 'start', dx: c >= 0 ? -8 : 8, dy: 4, size: 12, font: T.fontBody });
      if (rot) {
        const zr = mul(z0, [c, s]), r0 = mag(z0);
        svg('path', { d: arcPath(P, r0, argOf(z0), argOf(z0) + th), fill: 'none', stroke: T.accent, 'stroke-width': 1.2 }, fg);
        arrow(fg, X(0), Y(0), X(z0[0]), Y(z0[1]), { color: T.muted, width: 2 });
        label(P, z0[0], z0[1], 'z', { dx: 8, dy: 4, color: T.muted });
        arrow(fg, X(0), Y(0), X(zr[0]), Y(zr[1]), { color: T.ink, width: 2.4 });
        label(P, zr[0], zr[1], 'e<tspan dy="-6" font-size="10">iθ</tspan><tspan dy="6">z</tspan>', { dx: 8, dy: -6, color: T.ink, weight: 600, html: true });
      }
      arrow(fg, X(0), Y(0), X(c), Y(s), { color: T.q, width: 2.6 });
      handle(P, [c, s], T.q);
      const k8 = th / (PI / 4), kr = Math.round(k8), exact = Math.abs(k8 - kr) < 1e-6 ? named[String(((kr % 8) + 8) % 8)] : null;
      const lines = [`<div><span class="lbl">e<sup>iθ</sup></span>cos θ + i sin θ = ${t2(c, 3)} ${s < 0 ? '−' : '+'} ${t2(Math.abs(s), 3)}i${exact ? ` = <b>${exact}</b>` : ''}</div>`,
        `<div><span class="lbl">length</span>√(cos²θ + sin²θ) = <b>1</b> for every θ</div>`];
      if (rot) {
        const zr = mul(z0, [c, s]);
        lines.push(`<div><span class="lbl">e<sup>iθ</sup>·z</span><b>${fmtC(zr[0], zr[1])}</b>, turned by ${degs(th)}</div>`);
        lines.push(`<div><span class="lbl">|e<sup>iθ</sup>z|</span>${t2(mag(zr))} = |z|: a phase never changes a length</div>`);
      }
      read.innerHTML = lines.join('');
    }
    draw();
    onResize(left, draw);
  });

  /* ===================================================================== 0.2 */
  const STATES = { '|0⟩': [1, 0, 0, 0], '|1⟩': [0, 0, 1, 0], '|+⟩': [R2, 0, R2, 0], '|−⟩': [R2, 0, -R2, 0], '|+i⟩': [R2, 0, 0, R2], '|−i⟩': [R2, 0, 0, -R2] };
  function nameState(v) { // v = [ar, ai, br, bi] -> "i|1⟩", "−|+⟩", or null
    for (const [nm, s] of Object.entries(STATES)) {
      const re = s[0] * v[0] + s[1] * v[1] + s[2] * v[2] + s[3] * v[3], im = s[0] * v[1] - s[1] * v[0] + s[2] * v[3] - s[3] * v[2];
      if (Math.abs(Math.hypot(re, im) - 1) < 1e-9) { const p = cx(re, im); return (p === '1' ? '' : p === '−1' ? '−' : p) + nm; }
    }
    return null;
  }
  const wrapP = s => (/[+−-]/.test(s.replace(/^−/, '')) || s.startsWith('−')) && s !== '0' ? `(${s})` : s;

  C.widget('mv-step', body => {
    let g = 'H', inp = '|0⟩', theta = PI / 3, step = 0;
    const gSeg = seg({ label: 'gate', value: g, options: ['X', 'Y', 'Z', 'H', 'S', 'T', 'RY'].map(k => ({ value: k, label: k === 'RY' ? 'Ry(θ)' : k })), onchange: v => { g = v; step = 0; thRow.hidden = v !== 'RY'; draw(); } });
    const iSeg = seg({ label: 'input state', value: inp, options: Object.keys(STATES).map(k => ({ value: k, label: k })), onchange: v => { inp = v; step = 0; draw(); } });
    const sTh = slider({ label: 'θ', min: -2 * PI, max: 2 * PI, step: 0.01, value: theta, snapPi: true, fmt: angle, oninput: v => { theta = v; draw(); } });
    const thRow = h('div', { hidden: true }, sTh.el);
    const eqn = h('div', { class: 'big-eqn', 'aria-live': 'polite' }), calc = h('div', { class: 'calc' }), res = h('div', { class: 'readout' });
    const bStep = button('Next step', () => { step = Math.min(2, step + 1); draw(); }, 'btn primary');
    body.append(h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Gate' }), gSeg.el), thRow,
      h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Input' }), iSeg.el),
      eqn, h('div', { class: 'row' }, bStep, button('Show all', () => { step = 2; draw(); }, 'btn'), button('Start over', () => { step = 0; draw(); }, 'btn')), calc, res);
    function draw() {
      const m = Q.gateMatrix(g, g === 'RY' ? theta : undefined), v = STATES[inp], r = Q.m2apply(m, v);
      const E = (re, im) => cx(re, im);
      const ent = (i, j) => E(m[(i * 2 + j) * 2], m[(i * 2 + j) * 2 + 1]);
      const row = step === 0 ? -1 : step - 1;
      let M = '<span class="mat" style="grid-template-columns:repeat(2,auto)">';
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) M += `<span class="${i === row ? 'hl' : ''}">${ent(i, j)}</span>`;
      M += '</span>';
      const V = `<span class="mat" style="grid-template-columns:auto"><span class="${row >= 0 ? 'hl' : ''}">${E(v[0], v[1])}</span><span class="${row >= 0 ? 'hl' : ''}">${E(v[2], v[3])}</span></span>`;
      const out = [0, 1].map(i => i < step ? `<span class="${i === row ? 'hl' : ''}">${E(r[2 * i], r[2 * i + 1])}</span>` : '<span style="color:var(--muted)">?</span>').join('');
      const nm = g === 'RY' ? `Ry(${angle(theta)})` : g;
      eqn.innerHTML = `<span>${nm}${inp} =</span> ${M} ${V} <span>=</span> <span class="mat" style="grid-template-columns:auto">${out}</span>`;
      const lines = [];
      for (let i = 0; i < step; i++) {
        const terms = [0, 1].map(j => `${wrapP(ent(i, j))} × ${wrapP(E(v[2 * j], v[2 * j + 1]))}`).join(' + ');
        lines.push(`<div><span class="lbl">row ${i + 1} × column</span>${terms} = <b>${E(r[2 * i], r[2 * i + 1])}</b></div>`);
      }
      if (step === 0) lines.push('<div class="note" style="font-family:var(--font-body)">Press "Next step": each entry of the answer is one row of the matrix times the column vector.</div>');
      calc.innerHTML = lines.join('');
      bStep.disabled = step >= 2;
      if (step >= 2) {
        const named = nameState(r);
        res.innerHTML = `${nm}${inp} = <b>${named || G.U.ketExpr([r[0], r[2]], [r[1], r[3]], 1)}</b> · P(0) = ${pct(r[0] ** 2 + r[1] ** 2)}, P(1) = ${pct(r[2] ** 2 + r[3] ** 2)}` +
          (named && named !== inp && named.endsWith(inp) ? ' · the input came back multiplied by a phase, so it is an eigenvector of this gate (chapter 0.3)' : named === inp ? ' · the gate left this state unchanged: an eigenvector with eigenvalue 1' : '');
      } else res.innerHTML = '';
    }
    draw();
  });

  C.widget('overlap', body => {
    let a = 0, b = PI / 4;
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' }); grid.append(left, right);
    const fmtA = v => `${degs(v)}`;
    const sA = slider({ label: 'state a', min: -PI, max: PI, step: 0.01, value: a, fmt: fmtA, oninput: v => { a = v; draw(); } });
    const sB = slider({ label: 'state b', min: -PI, max: PI, step: 0.01, value: b, fmt: fmtA, oninput: v => { b = v; draw(); } });
    const pres = h('div', { class: 'row tight' }, ...[['|0⟩ and |+⟩', 0, PI / 4], ['|0⟩ and |1⟩', 0, PI / 2], ['|+⟩ and |−⟩', PI / 4, -PI / 4], ['same state', PI / 6, PI / 6], ['opposite signs', PI / 6, PI / 6 - PI]].map(([l, x, y]) => button(l, () => { a = x; b = y; sA.set(a); sB.set(b); draw(); }, 'btn')));
    const read = h('div', { class: 'calc' }), meter = h('div');
    right.append(sA.el, sB.el, pres, read, meter, h('p', { class: 'caption', text: 'Real amplitudes only: the state at angle t is cos t |0⟩ + sin t |1⟩. Drag either arrow tip.' }));
    const nm = t => { const k = Math.round(t / (PI / 4)); if (Math.abs(t - k * PI / 4) > 1e-6) return null; return { 0: '|0⟩', 1: '|+⟩', 2: '|1⟩', '-1': '|−⟩', 4: '−|0⟩', '-4': '−|0⟩', '-2': '−|1⟩', 3: '−|−⟩', '-3': '−|+⟩' }[k] || null; };
    let P = null, key = '';
    function draw() {
      const k = left.clientWidth;
      if (!P || k !== key) {
        key = k; P = plane2d(left, { range: 1.35, grid: 0.5, ticks: false, imag: false, xLabel: '|0⟩', yLabel: '|1⟩', max: 400, label: 'two real state vectors' });
        dragPoints(P, () => [[Math.cos(a), Math.sin(a)], [Math.cos(b), Math.sin(b)]], (i, p) => { const t = Math.atan2(p[1], p[0]); if (i === 0) { a = t; sA.set(a); } else { b = t; sB.set(b); } draw(); });
      }
      const T = Theme.tokens(), { fg, X, Y } = P; fg.innerHTML = '';
      const ua = [Math.cos(a), Math.sin(a)], ub = [Math.cos(b), Math.sin(b)], ov = ua[0] * ub[0] + ua[1] * ub[1];
      svg('line', { x1: X(-1.3 * ua[0]), y1: Y(-1.3 * ua[1]), x2: X(1.3 * ua[0]), y2: Y(1.3 * ua[1]), stroke: T.lineStrong, 'stroke-width': 1 }, fg);
      const foot = [ov * ua[0], ov * ua[1]];
      svg('line', { x1: X(ub[0]), y1: Y(ub[1]), x2: X(foot[0]), y2: Y(foot[1]), stroke: T.muted, 'stroke-width': 1 }, fg);
      svg('line', { x1: X(0), y1: Y(0), x2: X(foot[0]), y2: Y(foot[1]), stroke: T.ink, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.75 }, fg);
      arrow(fg, X(0), Y(0), X(ua[0]), Y(ua[1]), { color: T.q, width: 2.6 });
      arrow(fg, X(0), Y(0), X(ub[0]), Y(ub[1]), { color: T.q2, width: 2.6 });
      handle(P, ua, T.q); handle(P, ub, T.q2);
      label(P, ua[0], ua[1], 'a', { dx: 9, dy: -8, color: T.q, weight: 700 });
      label(P, ub[0], ub[1], 'b', { dx: 9, dy: -8, color: T.q2, weight: 700 });
      const na = nm(a), nb = nm(b);
      read.innerHTML = `<div><span class="lbl">a</span>${t2(ua[0])}|0⟩ ${ua[1] < 0 ? '−' : '+'} ${t2(Math.abs(ua[1]))}|1⟩${na ? ` = ${na}` : ''}</div>` +
        `<div><span class="lbl">b</span>${t2(ub[0])}|0⟩ ${ub[1] < 0 ? '−' : '+'} ${t2(Math.abs(ub[1]))}|1⟩${nb ? ` = ${nb}` : ''}</div>` +
        `<div><span class="lbl">⟨a|b⟩</span>${par(ua[0])} × ${par(ub[0])} + ${par(ua[1])} × ${par(ub[1])} = <b>${t2(ov, 3)}</b> (the dark segment)</div>` +
        `<div><span class="lbl">|⟨a|b⟩|²</span><b>${t2(ov * ov, 3)}</b>: prepare b, measure in a basis that contains a, and you get a with probability ${pct(ov * ov)}</div>`;
      const W = Math.min(320, right.clientWidth || 300);
      meter.innerHTML = `<svg class="plot" width="${W}" height="30" viewBox="0 0 ${W} 30" role="img" aria-label="probability ${pct(ov * ov)}"><rect x="0" y="6" width="${W}" height="10" rx="5" fill="${T.surface3}"/><rect x="0" y="6" width="${W * ov * ov}" height="10" rx="5" fill="${T.q}"/><text x="0" y="29" font-size="10" style="fill:${T.muted}">0</text><text x="${W}" y="29" text-anchor="end" font-size="10" style="fill:${T.muted}">probability 1</text></svg>`;
    }
    draw();
    onResize(left, draw);
  });

  /* ===================================================================== 0.3 */
  C.widget('eigen', body => {
    const MATS = { X: [[0, 1], [1, 0]], Z: [[1, 0], [0, -1]], H: [[R2, R2], [R2, -R2]], rot: [[R2, -R2], [R2, R2]] };
    let which = 'X', t = PI / 6, ring = true; const cu = { a: 1, b: 0.5, d: -0.5 };
    const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
    const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' }); grid.append(left, right);
    const mSeg = seg({ label: 'matrix', value: which, options: [{ value: 'X', label: 'X' }, { value: 'Z', label: 'Z' }, { value: 'H', label: 'H' }, { value: 'custom', label: 'Your own' }, { value: 'rot', label: 'Rotate 45°' }], onchange: v => { which = v; custom.hidden = v !== 'custom'; draw(); } });
    const mk = (k, lab) => slider({ label: lab, min: -2, max: 2, step: 0.05, value: cu[k], fmt: v => t2(v), oninput: v => { cu[k] = v; draw(); } }).el;
    const custom = h('div', { class: 'stack', hidden: true }, mk('a', 'top-left a'), mk('b', 'off-diagonal b'), mk('d', 'bottom-right d'));
    const sT = slider({ label: 'input angle', min: -PI, max: PI, step: 0.005, value: t, fmt: v => degs(v), oninput: v => { t = v; snap(); if (t !== v) sT.set(t); draw(); } });
    const rid = nextId('ring'), chk = h('input', { type: 'checkbox', id: rid, checked: true });
    chk.addEventListener('change', () => { ring = chk.checked; draw(); });
    const matEl = h('div', { class: 'big-eqn' }), read = h('div', { class: 'calc' }), verdict = h('div', { class: 'row' });
    right.append(mSeg.el, custom, matEl, sT.el, h('label', { class: 'chk', for: rid }, chk, 'Show what the matrix does to 24 arrows around the circle'), read, verdict);
    const matOf = () => which === 'custom' ? [[cu.a, cu.b], [cu.b, cu.d]] : MATS[which];
    function eig(A) { // real symmetric only
      const [[a, b], [, d]] = A, tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      if (Math.abs(b) < 1e-9) return a >= d ? [[a, [1, 0]], [d, [0, 1]]] : [[d, [0, 1]], [a, [1, 0]]];
      const n = v => { const L = Math.hypot(v[0], v[1]); return [v[0] / L, v[1] / L]; };
      return [[l1, n([l1 - d, b])], [l2, n([l2 - d, b])]];
    }
    let P = null, key = '';
    function draw() {
      const A = matOf(), sym = which !== 'rot', E = sym ? eig(A) : [];
      const maxL = sym ? Math.max(1, ...E.map(e => Math.abs(e[0]))) : 1;
      const range = Math.max(1.5, Math.ceil(maxL * 1.15 * 2) / 2);
      const k = left.clientWidth + ':' + range;
      if (!P || k !== key) {
        key = k; P = plane2d(left, { range, grid: 0.5, tickStep: 1, imag: false, xLabel: 'x', yLabel: 'y', max: 420, label: 'a matrix acting on arrows in the plane' });
        dragPoints(P, () => [[Math.cos(t), Math.sin(t)]], (i, p) => { t = Math.atan2(p[1], p[0]); snap(); sT.set(t); draw(); });
      }
      const T = Theme.tokens(), { fg, X, Y } = P; fg.innerHTML = '';
      const ap = v => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
      E.forEach(([lam, v]) => {
        const L = range * 0.98;
        svg('line', { x1: X(-L * v[0]), y1: Y(-L * v[1]), x2: X(L * v[0]), y2: Y(L * v[1]), stroke: T.accent, 'stroke-width': 1.5 }, fg);
        const s = v[1] < -1e-9 || (Math.abs(v[1]) < 1e-9 && v[0] < 0) ? -1 : 1;
        label(P, s * 0.82 * L * v[0], s * 0.82 * L * v[1], `λ = ${t2(lam)}`, { dx: 6, dy: -6, color: T.accent, size: 12, font: T.fontBody, weight: 700 });
      });
      if (ring) for (let i = 0; i < 24; i++) {
        const u = [Math.cos(i * PI / 12), Math.sin(i * PI / 12)], w = ap(u);
        svg('line', { x1: X(u[0]), y1: Y(u[1]), x2: X(w[0]), y2: Y(w[1]), stroke: T.muted, 'stroke-width': 1, opacity: 0.6 }, fg);
        svg('circle', { cx: X(w[0]), cy: Y(w[1]), r: 2.6, fill: T.q2, opacity: 0.8 }, fg);
        svg('circle', { cx: X(u[0]), cy: Y(u[1]), r: 2, fill: T.q, opacity: 0.6 }, fg);
      }
      const v = [Math.cos(t), Math.sin(t)], w = ap(v);
      arrow(fg, X(0), Y(0), X(w[0]), Y(w[1]), { color: T.q2, width: 2.6 });
      arrow(fg, X(0), Y(0), X(v[0]), Y(v[1]), { color: T.q, width: 2.6 });
      handle(P, v, T.q);
      label(P, v[0], v[1], 'v', { dx: 9, dy: -8, color: T.q, weight: 700 });
      label(P, w[0], w[1], 'Av', { dx: 9, dy: 14, color: T.q2, weight: 700 });
      matEl.innerHTML = `<span>A =</span> ${C.mat(A.map(r => r.map(x => t2(x))))}`;
      const cross = v[0] * w[1] - v[1] * w[0], dot = v[0] * w[0] + v[1] * w[1], Lw = Math.hypot(w[0], w[1]);
      const ang = Math.atan2(cross, dot);
      const lines = [`<div><span class="lbl">input v</span>(${t2(v[0])}, ${t2(v[1])})</div>`, `<div><span class="lbl">output Av</span>(${t2(w[0])}, ${t2(w[1])})</div>`,
        Lw > 1e-6 ? `<div><span class="lbl">turned by</span>${degs(ang)}</div>` : '<div>Av is the zero vector: v is an eigenvector with eigenvalue 0.</div>'];
      if (sym) {
        const [[a, b], [, d]] = A;
        lines.push(`<div><span class="lbl">eigenvalues</span>λ² − (${t2(a)} + ${par(d)})λ + (${par(a)} × ${par(d)} − ${par(b)}²) = 0 gives λ = <b>${t2(E[0][0])}</b> and <b>${t2(E[1][0])}</b></div>`);
      }
      read.innerHTML = lines.join('');
      const parallel = Lw > 1e-6 && Math.abs(Math.sin(ang)) < 0.004;
      verdict.innerHTML = which === 'rot'
        ? '<span class="pill">No real eigenvectors</span> <span class="note">Every arrow turns by 45°. The eigenvectors exist, but they are complex: (1, −i)/√2 with eigenvalue e<sup>iπ/4</sup> and (1, i)/√2 with e<sup>−iπ/4</sup>.</span>'
        : parallel ? `<span class="pill good">Eigenvector</span> <span class="note">Av = ${t2(dot)}·v. The matrix only ${dot < 0 ? 'flips' : 'scales'} this arrow.</span>`
          : '<span class="pill">Not an eigenvector</span> <span class="note">Turn v until it lies on a brass line.</span>';
    }
    function snap() {
      if (which === 'rot') return;
      for (const [, v] of eig(matOf())) {
        const a0 = Math.atan2(v[1], v[0]);
        for (const cand of [a0, a0 + PI, a0 - PI]) if (Math.abs(t - cand) < 0.03) t = cand;
      }
    }
    draw();
    onResize(left, draw);
  });

  G.Toolkit = { fmtC, parseC, t2, par, mag, argOf, mul, degs, arcPath, label, handle };
})(window);

/* ==========================================================================
   QSim: a small, exact state-vector simulator used by every widget.
   Conventions
   - Qubit 0 is the top wire and the LEFTMOST character of a basis label:
     |q0 q1 ... q(n-1)>.  Qubit q lives in bit (n-1-q) of the index.
   - 2x2 matrices are flat arrays [a_r,a_i,b_r,b_i,c_r,c_i,d_r,d_i] for [[a,b],[c,d]].
   - Gate definitions follow Nielsen & Chuang / Qiskit.
   ========================================================================== */
(function (root) {
  'use strict';
  const PI = Math.PI, TAU = 2 * Math.PI, R2 = Math.SQRT1_2;

  /* ---------- randomness ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rng) {
    let u = 0;
    while (u === 0) u = rng();
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }
  function binomial(n, p, rng) {
    if (n <= 60) { let k = 0; for (let i = 0; i < n; i++) if (rng() < p) k++; return k; }
    const mu = n * p, sd = Math.sqrt(n * p * (1 - p));
    return Math.max(0, Math.min(n, Math.round(mu + sd * gaussian(rng))));
  }

  /* ---------- 2x2 complex matrices ---------- */
  const m2 = (ar, ai, br, bi, cr, ci, dr, di) => [ar, ai, br, bi, cr, ci, dr, di];
  function m2mul(A, B) {
    const r = new Array(8);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      let re = 0, im = 0;
      for (let k = 0; k < 2; k++) {
        const ar = A[(i * 2 + k) * 2], ai = A[(i * 2 + k) * 2 + 1];
        const br = B[(k * 2 + j) * 2], bi = B[(k * 2 + j) * 2 + 1];
        re += ar * br - ai * bi; im += ar * bi + ai * br;
      }
      r[(i * 2 + j) * 2] = re; r[(i * 2 + j) * 2 + 1] = im;
    }
    return r;
  }
  const m2dag = A => [A[0], -A[1], A[4], -A[5], A[2], -A[3], A[6], -A[7]];
  function m2phase(A, t) { // multiply by e^{it}
    const c = Math.cos(t), s = Math.sin(t), r = new Array(8);
    for (let k = 0; k < 8; k += 2) { r[k] = A[k] * c - A[k + 1] * s; r[k + 1] = A[k] * s + A[k + 1] * c; }
    return r;
  }
  function m2apply(A, v) { // v = [ar, ai, br, bi]
    return [
      A[0] * v[0] - A[1] * v[1] + A[2] * v[2] - A[3] * v[3],
      A[0] * v[1] + A[1] * v[0] + A[2] * v[3] + A[3] * v[2],
      A[4] * v[0] - A[5] * v[1] + A[6] * v[2] - A[7] * v[3],
      A[4] * v[1] + A[5] * v[0] + A[6] * v[3] + A[7] * v[2]
    ];
  }
  // Rotation exp(-i phi n.sigma/2)
  function rotN(n, phi) {
    const c = Math.cos(phi / 2), s = Math.sin(phi / 2);
    return m2(c, -s * n[2], -s * n[1], -s * n[0], s * n[1], -s * n[0], c, s * n[2]);
  }

  /* ---------- gate library ---------- */
  const GATES = {
    I: { label: 'I', name: 'Identity', m: () => m2(1, 0, 0, 0, 0, 0, 1, 0), axis: [0, 0, 1], angle: 0 },
    X: { label: 'X', name: 'Pauli-X (NOT)', m: () => m2(0, 0, 1, 0, 1, 0, 0, 0), axis: [1, 0, 0], angle: PI },
    Y: { label: 'Y', name: 'Pauli-Y', m: () => m2(0, 0, 0, -1, 0, 1, 0, 0), axis: [0, 1, 0], angle: PI },
    Z: { label: 'Z', name: 'Pauli-Z', m: () => m2(1, 0, 0, 0, 0, 0, -1, 0), axis: [0, 0, 1], angle: PI },
    H: { label: 'H', name: 'Hadamard', m: () => m2(R2, 0, R2, 0, R2, 0, -R2, 0), axis: [R2, 0, R2], angle: PI },
    S: { label: 'S', name: 'S (√Z)', m: () => m2(1, 0, 0, 0, 0, 0, 0, 1), axis: [0, 0, 1], angle: PI / 2 },
    SDG: { label: 'S†', name: 'S-dagger', m: () => m2(1, 0, 0, 0, 0, 0, 0, -1), axis: [0, 0, 1], angle: -PI / 2 },
    T: { label: 'T', name: 'T (√S)', m: () => m2(1, 0, 0, 0, 0, 0, R2, R2), axis: [0, 0, 1], angle: PI / 4 },
    TDG: { label: 'T†', name: 'T-dagger', m: () => m2(1, 0, 0, 0, 0, 0, R2, -R2), axis: [0, 0, 1], angle: -PI / 4 },
    SX: { label: '√X', name: '√X', m: () => m2(0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5), axis: [1, 0, 0], angle: PI / 2 },
    SXDG: { label: '√X†', name: '√X-dagger', m: () => m2(0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5), axis: [1, 0, 0], angle: -PI / 2 },
    RX: { label: 'Rx', name: 'X rotation', params: 1, m: t => rotN([1, 0, 0], t), axisOf: () => [1, 0, 0], angleOf: t => t },
    RY: { label: 'Ry', name: 'Y rotation', params: 1, m: t => rotN([0, 1, 0], t), axisOf: () => [0, 1, 0], angleOf: t => t },
    RZ: { label: 'Rz', name: 'Z rotation', params: 1, m: t => rotN([0, 0, 1], t), axisOf: () => [0, 0, 1], angleOf: t => t },
    P: {
      label: 'P', name: 'Phase', params: 1,
      m: l => m2(1, 0, 0, 0, 0, 0, Math.cos(l), Math.sin(l)), axisOf: () => [0, 0, 1], angleOf: l => l
    },
    U: {
      label: 'U', name: 'General rotation U(θ,φ,λ)', params: 3,
      m: (t, p, l) => {
        const c = Math.cos(t / 2), s = Math.sin(t / 2);
        return m2(c, 0, -Math.cos(l) * s, -Math.sin(l) * s,
          Math.cos(p) * s, Math.sin(p) * s, Math.cos(p + l) * c, Math.sin(p + l) * c);
      }
    }
  };
  function gateMatrix(g, p) {
    const d = GATES[g];
    if (!d) throw new Error('Unknown gate ' + g);
    if (!d.params) return d.m();
    if (d.params === 1) return d.m(Array.isArray(p) ? p[0] : (p ?? 0));
    return d.m(...(p || [0, 0, 0]));
  }

  /* Decompose a 2x2 unitary as e^{i alpha} R_n(theta), theta in [0, pi]. */
  function axisAngle(m) {
    const detR = m[0] * m[6] - m[1] * m[7] - (m[2] * m[4] - m[3] * m[5]);
    const detI = m[0] * m[7] + m[1] * m[6] - (m[2] * m[5] + m[3] * m[4]);
    let alpha = Math.atan2(detI, detR) / 2;
    let s = m2phase(m, -alpha);
    if (s[0] < 0) { s = m2phase(s, PI); alpha += PI; }
    const ca = Math.max(-1, Math.min(1, s[0]));
    const theta = 2 * Math.acos(ca);
    const sh = Math.sin(theta / 2);
    let n = [0, 0, 1];
    if (sh > 1e-9) {
      n = [-s[3] / sh, -s[2] / sh, -s[1] / sh];
      const L = Math.hypot(n[0], n[1], n[2]) || 1;
      n = [n[0] / L, n[1] / L, n[2] / L];
    }
    return { alpha, n, theta };
  }
  function fracPower(m, t) {
    if (t >= 1) return m;
    const { alpha, n, theta } = axisAngle(m);
    return m2phase(rotN(n, theta * t), alpha * t);
  }
  /* Axis and angle used to animate a gate on the Bloch sphere. */
  function gateRotation(g, p) {
    const d = GATES[g];
    if (d.axisOf) return { n: d.axisOf(p), theta: d.angleOf(Array.isArray(p) ? p[0] : p) };
    if (d.axis) {
      const n = d.axis, th = d.angle;
      return th < 0 ? { n: [-n[0], -n[1], -n[2]], theta: -th } : { n, theta: th };
    }
    const r = axisAngle(gateMatrix(g, p));
    return { n: r.n, theta: r.theta };
  }

  /* ---------- Bloch-vector helpers ---------- */
  function blochOf(v) { // v = [ar, ai, br, bi]
    const [ar, ai, br, bi] = v;
    const r01r = ar * br + ai * bi, r01i = ai * br - ar * bi; // alpha * conj(beta)
    return [2 * r01r, -2 * r01i, ar * ar + ai * ai - br * br - bi * bi];
  }
  function stateFromBloch(theta, phi) {
    return [Math.cos(theta / 2), 0, Math.cos(phi) * Math.sin(theta / 2), Math.sin(phi) * Math.sin(theta / 2)];
  }
  function anglesOf(b) {
    const r = Math.hypot(b[0], b[1], b[2]) || 1;
    const theta = Math.acos(Math.max(-1, Math.min(1, b[2] / r)));
    let phi = Math.atan2(b[1], b[0]);
    if (phi < 0) phi += TAU;
    return { theta, phi, r };
  }
  function rotateVec(v, n, a) { // Rodrigues
    const c = Math.cos(a), s = Math.sin(a), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
    const cx = n[1] * v[2] - n[2] * v[1], cy = n[2] * v[0] - n[0] * v[2], cz = n[0] * v[1] - n[1] * v[0];
    return [v[0] * c + cx * s + n[0] * d * (1 - c), v[1] * c + cy * s + n[1] * d * (1 - c), v[2] * c + cz * s + n[2] * d * (1 - c)];
  }

  /* ---------- the state vector ---------- */
  class State {
    constructor(n) {
      this.n = n; this.N = 1 << n;
      this.re = new Float64Array(this.N); this.im = new Float64Array(this.N);
      this.re[0] = 1;
    }
    static basis(n, k) { const s = new State(n); s.re[0] = 0; s.re[k] = 1; return s; }
    static product(list) { // list of per-qubit [ar, ai, br, bi], qubit 0 first
      const n = list.length, s = new State(n);
      for (let i = 0; i < s.N; i++) {
        let re = 1, im = 0;
        for (let q = 0; q < n; q++) {
          const b = (i >> (n - 1 - q)) & 1, v = list[q];
          const xr = b ? v[2] : v[0], xi = b ? v[3] : v[1];
          const nr = re * xr - im * xi; im = re * xi + im * xr; re = nr;
        }
        s.re[i] = re; s.im[i] = im;
      }
      return s;
    }
    clone() { const s = new State(this.n); s.re.set(this.re); s.im.set(this.im); return s; }
    copyFrom(o) { this.re.set(o.re); this.im.set(o.im); return this; }
    bit(q) { return 1 << (this.n - 1 - q); }
    apply1(q, m, cmask = 0, cval = 0) {
      const bit = this.bit(q), N = this.N, re = this.re, im = this.im;
      const ar = m[0], ai = m[1], br = m[2], bi = m[3], cr = m[4], ci = m[5], dr = m[6], di = m[7];
      for (let i = 0; i < N; i++) {
        if (i & bit) continue;
        if ((i & cmask) !== cval) continue;
        const j = i | bit;
        const xr = re[i], xi = im[i], yr = re[j], yi = im[j];
        re[i] = ar * xr - ai * xi + br * yr - bi * yi;
        im[i] = ar * xi + ai * xr + br * yi + bi * yr;
        re[j] = cr * xr - ci * xi + dr * yr - di * yi;
        im[j] = cr * xi + ci * xr + dr * yi + di * yr;
      }
      return this;
    }
    gate(g, q, p, cmask = 0, cval = 0) { return this.apply1(q, gateMatrix(g, p), cmask, cval); }
    cx(c, t) { const b = this.bit(c); return this.apply1(t, GATES.X.m(), b, b); }
    cz(c, t) { const b = this.bit(c); return this.apply1(t, GATES.Z.m(), b, b); }
    swap(a, b, cmask = 0, cval = 0, t = 1) {
      const ba = this.bit(a), bb = this.bit(b), N = this.N, re = this.re, im = this.im;
      const er = Math.cos(PI * t), ei = Math.sin(PI * t);
      const pr = (1 + er) / 2, pi = ei / 2, qr = (1 - er) / 2, qi = -ei / 2; // (1+e)/2, (1-e)/2
      for (let i = 0; i < N; i++) {
        if (!(i & ba) || (i & bb)) continue;
        if ((i & cmask) !== cval) continue;
        const j = (i ^ ba) | bb;
        if (t >= 1) {
          const tr = re[i], ti = im[i]; re[i] = re[j]; im[i] = im[j]; re[j] = tr; im[j] = ti;
        } else {
          const xr = re[i], xi = im[i], yr = re[j], yi = im[j];
          re[i] = pr * xr - pi * xi + qr * yr - qi * yi; im[i] = pr * xi + pi * xr + qr * yi + qi * yr;
          re[j] = qr * xr - qi * xi + pr * yr - pi * yi; im[j] = qr * xi + qi * xr + pr * yi + pi * yr;
        }
      }
      return this;
    }
    probs() {
      const p = new Float64Array(this.N);
      for (let i = 0; i < this.N; i++) p[i] = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      return p;
    }
    prob1(q) {
      const bit = this.bit(q); let p = 0;
      for (let i = 0; i < this.N; i++) if (i & bit) p += this.re[i] * this.re[i] + this.im[i] * this.im[i];
      return p;
    }
    measure(q, r) {
      const p1 = this.prob1(q), out = r < p1 ? 1 : 0, bit = this.bit(q);
      const norm = Math.sqrt(out ? p1 : 1 - p1) || 1;
      for (let i = 0; i < this.N; i++) {
        if (((i & bit) ? 1 : 0) !== out) { this.re[i] = 0; this.im[i] = 0; }
        else { this.re[i] /= norm; this.im[i] /= norm; }
      }
      return out;
    }
    /* reduced density matrix of qubit q -> Bloch vector [x,y,z] */
    bloch(q) {
      const bit = this.bit(q); let r01r = 0, r01i = 0, p0 = 0, p1 = 0;
      for (let i = 0; i < this.N; i++) {
        if (i & bit) continue;
        const j = i | bit;
        const ar = this.re[i], ai = this.im[i], br = this.re[j], bi = this.im[j];
        p0 += ar * ar + ai * ai; p1 += br * br + bi * bi;
        r01r += ar * br + ai * bi; r01i += ai * br - ar * bi;
      }
      return [2 * r01r, -2 * r01i, p0 - p1];
    }
    expZ(q) { return 1 - 2 * this.prob1(q); }
    expZall() { // <Z x Z x ... x Z>
      let s = 0;
      for (let i = 0; i < this.N; i++) {
        let b = i, par = 0; while (b) { par ^= 1; b &= b - 1; }
        const p = this.re[i] * this.re[i] + this.im[i] * this.im[i];
        s += par ? -p : p;
      }
      return s;
    }
    norm() { let s = 0; for (let i = 0; i < this.N; i++) s += this.re[i] * this.re[i] + this.im[i] * this.im[i]; return s; }
    inner(o) { // <this|o>
      let re = 0, im = 0;
      for (let i = 0; i < this.N; i++) {
        re += this.re[i] * o.re[i] + this.im[i] * o.im[i];
        im += this.re[i] * o.im[i] - this.im[i] * o.re[i];
      }
      return [re, im];
    }
  }

  /* ---------- sampling ---------- */
  function sampleCounts(probs, shots, rng) {
    const N = probs.length, cdf = new Float64Array(N);
    let acc = 0; for (let i = 0; i < N; i++) { acc += probs[i]; cdf[i] = acc; }
    const counts = new Array(N).fill(0);
    for (let s = 0; s < shots; s++) {
      const r = rng() * acc;
      let lo = 0, hi = N - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
      counts[lo]++;
    }
    return counts;
  }

  /* ---------- circuits ----------
     A circuit is {n, cols}. cols[c][q] is null or a cell:
       {g:'H'} fixed gate | {g:'RX', p:θ} | {g:'U', p:[θ,φ,λ]}
       {g:'CTRL'} control (|1>) | {g:'ACTRL'} anti-control (|0>)
       {g:'SWAP'} (pairs within a column) | {g:'M'} measurement              */
  function columnInfo(col) {
    const info = { controls: [], gates: [], swaps: [], meas: [] };
    if (!col) return info;
    col.forEach((cell, q) => {
      if (!cell) return;
      if (cell.g === 'CTRL') info.controls.push({ q, v: 1 });
      else if (cell.g === 'ACTRL') info.controls.push({ q, v: 0 });
      else if (cell.g === 'SWAP') info.swaps.push(q);
      else if (cell.g === 'M') info.meas.push(q);
      else info.gates.push({ q, g: cell.g, p: cell.p, t: cell.t });
    });
    return info;
  }
  function applyColumn(state, col, t = 1, rng = Math.random, outcomes = null) {
    const info = columnInfo(col);
    let cmask = 0, cval = 0;
    for (const c of info.controls) { const b = state.bit(c.q); cmask |= b; if (c.v) cval |= b; }
    for (const gt of info.gates) {
      let m = gateMatrix(gt.g, gt.p);
      if (t < 1) m = fracPower(m, t);
      state.apply1(gt.q, m, cmask, cval);
    }
    if (info.swaps.length === 2) state.swap(info.swaps[0], info.swaps[1], cmask, cval, t);
    if (t >= 1) for (const q of info.meas) {
      const o = state.measure(q, rng());
      if (outcomes) outcomes.push({ q, o });
    }
    return state;
  }
  function hasMeasurement(circ) { return circ.cols.some(col => col && col.some(c => c && c.g === 'M')); }
  function runCircuit(circ, rng = Math.random, init = null) {
    const s = init ? init.clone() : new State(circ.n);
    for (const col of circ.cols) applyColumn(s, col, 1, rng);
    return s;
  }
  /* all intermediate states: states[k] = after k columns */
  function trace(circ, rng = Math.random, init = null) {
    const s = init ? init.clone() : new State(circ.n);
    const states = [s.clone()], outcomes = [];
    for (const col of circ.cols) {
      const o = []; applyColumn(s, col, 1, rng, o); outcomes.push(o); states.push(s.clone());
    }
    return { states, outcomes };
  }
  function unitary(circ) { // column-major complex matrix (null if measurements)
    if (hasMeasurement(circ)) return null;
    const N = 1 << circ.n, re = new Float64Array(N * N), im = new Float64Array(N * N);
    for (let j = 0; j < N; j++) {
      const s = State.basis(circ.n, j);
      for (const col of circ.cols) applyColumn(s, col, 1);
      for (let i = 0; i < N; i++) { re[i * N + j] = s.re[i]; im[i * N + j] = s.im[i]; }
    }
    return { N, re, im };
  }
  /* Is B = e^{i g} A ?  returns {equal, phase} */
  function equalUpToPhase(A, B, tol = 1e-9) {
    if (A.N !== B.N) return { equal: false };
    let best = -1, k = 0;
    for (let i = 0; i < A.re.length; i++) { const m = A.re[i] ** 2 + A.im[i] ** 2; if (m > best) { best = m; k = i; } }
    const ar = A.re[k], ai = A.im[k], br = B.re[k], bi = B.im[k];
    const den = ar * ar + ai * ai;
    let pr = (br * ar + bi * ai) / den, pi = (bi * ar - br * ai) / den;
    const L = Math.hypot(pr, pi); if (L < 1e-12) return { equal: false };
    pr /= L; pi /= L;
    for (let i = 0; i < A.re.length; i++) {
      const er = A.re[i] * pr - A.im[i] * pi - B.re[i], ei = A.re[i] * pi + A.im[i] * pr - B.im[i];
      if (Math.hypot(er, ei) > 1e-6) return { equal: false, phase: Math.atan2(pi, pr) };
    }
    return { equal: true, phase: Math.atan2(pi, pr) };
  }

  /* ---------- tiny circuit builder for tests / presets ---------- */
  function builder(n) {
    const cols = [];
    const api = {
      n, cols,
      col(cells) { const c = new Array(n).fill(null); for (const [q, cell] of cells) c[q] = cell; cols.push(c); return api; },
      g(name, q, p) { return api.col([[q, p === undefined ? { g: name } : { g: name, p }]]); },
      cg(name, ctrls, t, p) {
        const cells = ctrls.map(c => [c, { g: 'CTRL' }]);
        cells.push([t, p === undefined ? { g: name } : { g: name, p }]);
        return api.col(cells);
      },
      cx(c, t) { return api.cg('X', [c], t); },
      cz(c, t) { return api.cg('Z', [c], t); },
      ccx(a, b, t) { return api.cg('X', [a, b], t); },
      swap(a, b) { return api.col([[a, { g: 'SWAP' }], [b, { g: 'SWAP' }]]); },
      m(q) { return api.col([[q, { g: 'M' }]]); },
      layer(name, qs, p) { return api.col(qs.map(q => [q, p === undefined ? { g: name } : { g: name, p }])); },
      build() { return { n, cols }; }
    };
    return api;
  }

  const QSim = {
    PI, TAU, R2, mulberry32, gaussian, binomial,
    m2, m2mul, m2dag, m2phase, m2apply, rotN, GATES, gateMatrix, axisAngle, fracPower, gateRotation,
    blochOf, stateFromBloch, anglesOf, rotateVec,
    State, sampleCounts, columnInfo, applyColumn, hasMeasurement, runCircuit, trace, unitary, equalUpToPhase, builder
  };
  root.QSim = QSim;
  if (typeof module !== 'undefined' && module.exports) module.exports = QSim;
})(typeof window !== 'undefined' ? window : globalThis);

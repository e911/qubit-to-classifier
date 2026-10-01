/* ==========================================================================
   QML toolkit: datasets, a data re-uploading classifier trained with the
   parameter-shift rule, quantum kernels, and the barren-plateau experiment.
   Pure math; no DOM.  Depends on QSim.
   ========================================================================== */
(function (root) {
  'use strict';
  const Q = root.QSim || (typeof require !== 'undefined' ? require('./sim.js') : null);
  const PI = Math.PI, HALF_PI = Math.PI / 2;

  /* ---------- datasets in [-1,1]^2, labels 0/1 ---------- */
  function makeData(kind, count, seed) {
    const rng = Q.mulberry32(seed), X = [], y = [];
    const clamp = v => Math.max(-1, Math.min(1, v));
    for (let i = 0; i < count; i++) {
      let a, b, lab;
      if (kind === 'moons') {
        lab = i % 2; const t = PI * rng();
        let px = lab ? 1 - Math.cos(t) : Math.cos(t), py = lab ? 0.5 - Math.sin(t) : Math.sin(t);
        px += 0.12 * Q.gaussian(rng); py += 0.12 * Q.gaussian(rng);
        a = clamp((px - 0.5) / 1.6); b = clamp((py - 0.25) / 0.95);
      } else {
        a = 2 * rng() - 1; b = 2 * rng() - 1;
        if (kind === 'circle') lab = (a * a + b * b < 0.56) ? 1 : 0;
        else if (kind === 'xor') lab = (a * b > 0) ? 1 : 0;
        else if (kind === 'wave') lab = (b > 0.55 * Math.sin(PI * a)) ? 1 : 0;
        else if (kind === 'blobs') { // two clusters: separable by a plane on the Bloch sphere
          lab = i % 2;
          a = clamp((lab ? 0.45 : -0.4) + 0.28 * Q.gaussian(rng));
          b = clamp((lab ? -0.35 : 0.4) + 0.28 * Q.gaussian(rng));
        } else lab = a > 0 ? 1 : 0;
      }
      X.push([a, b]); y.push(lab);
    }
    return { X, y };
  }

  /* ---------- data re-uploading classifier ----------
     Each layer, on every qubit:  RY(w1*x1 + b1) . RZ(w2*x2 + b2) . RY(b3)
     then CZ between the qubits (2-qubit model, not after the last layer).
     Output f(x) = <Z> on qubit 0;  P(class 1) = (1 - f)/2.                  */
  function makeModel(nq, L, seed) {
    const gates = []; let np = 0;
    for (let l = 0; l < L; l++) for (let q = 0; q < nq; q++) {
      gates.push({ l, q, g: 'RY', feat: 0, wi: np, bi: np + 1 }); np += 2;
      gates.push({ l, q, g: 'RZ', feat: 1, wi: np, bi: np + 1 }); np += 2;
      gates.push({ l, q, g: 'RY', feat: -1, wi: -1, bi: np }); np += 1;
    }
    const model = { nq, L, gates, np, params: new Float64Array(np) };
    initModel(model, seed);
    return model;
  }
  function initModel(model, seed) {
    const rng = Q.mulberry32(seed);
    for (const g of model.gates) {
      if (g.wi >= 0) model.params[g.wi] = (0.6 + 0.8 * rng()) * (rng() < 0.5 ? -1 : 1) * 1.5;
      model.params[g.bi] = (2 * rng() - 1) * PI;
    }
  }
  function anglesFor(model, x, out) {
    const a = out || new Float64Array(model.gates.length), p = model.params;
    for (let k = 0; k < model.gates.length; k++) {
      const g = model.gates[k];
      a[k] = (g.wi >= 0 ? p[g.wi] * x[g.feat] : 0) + p[g.bi];
    }
    return a;
  }
  // specialised simulator for 1-2 qubits
  function forwardAngles(model, ang) {
    const nq = model.nq, N = 1 << nq;
    const re = new Float64Array(N), im = new Float64Array(N); re[0] = 1;
    const perLayer = 3 * nq;
    for (let k = 0; k < model.gates.length; k++) {
      const g = model.gates[k], t = ang[k], c = Math.cos(t / 2), s = Math.sin(t / 2);
      const bit = 1 << (nq - 1 - g.q);
      for (let i = 0; i < N; i++) {
        if (i & bit) continue;
        const j = i | bit, xr = re[i], xi = im[i], yr = re[j], yi = im[j];
        if (g.g === 'RY') {
          re[i] = c * xr - s * yr; im[i] = c * xi - s * yi;
          re[j] = s * xr + c * yr; im[j] = s * xi + c * yi;
        } else { // RZ: diag(e^{-it/2}, e^{it/2})
          re[i] = c * xr + s * xi; im[i] = c * xi - s * xr;
          re[j] = c * yr - s * yi; im[j] = c * yi + s * yr;
        }
      }
      if (nq === 2 && (k + 1) % perLayer === 0 && g.l < model.L - 1) { re[3] = -re[3]; im[3] = -im[3]; }
    }
    let f = 0; const bit0 = 1 << (nq - 1);
    for (let i = 0; i < N; i++) { const p = re[i] * re[i] + im[i] * im[i]; f += (i & bit0) ? -p : p; }
    return f;
  }
  function predict(model, x, scratch) { return forwardAngles(model, anglesFor(model, x, scratch)); }
  function noisy(f, shots, rng) {
    if (!shots) return f;
    const sd = Math.sqrt(Math.max(0, 1 - f * f) / shots);
    return Math.max(-1, Math.min(1, f + sd * Q.gaussian(rng)));
  }
  const EPS = 1e-4;
  function bce(f, y) { const p = Math.min(1 - EPS, Math.max(EPS, (1 - f) / 2)); return -(y * Math.log(p) + (1 - y) * Math.log(1 - p)); }
  /* one full-batch gradient via the parameter-shift rule */
  function gradient(model, X, y, shots, rng) {
    const G = model.gates.length, grad = new Float64Array(model.np), ang = new Float64Array(G);
    let loss = 0, correct = 0, evals = 0;
    for (let s = 0; s < X.length; s++) {
      anglesFor(model, X[s], ang);
      const f = noisy(forwardAngles(model, ang), shots, rng); evals++;
      loss += bce(f, y[s]);
      if ((f < 0 ? 1 : 0) === y[s]) correct++;
      const p = Math.min(1 - EPS, Math.max(EPS, (1 - f) / 2));
      const dLdf = (-y[s] / p + (1 - y[s]) / (1 - p)) * (-0.5);
      for (let k = 0; k < G; k++) {
        const a = ang[k];
        ang[k] = a + HALF_PI; const fp = noisy(forwardAngles(model, ang), shots, rng);
        ang[k] = a - HALF_PI; const fm = noisy(forwardAngles(model, ang), shots, rng);
        ang[k] = a; evals += 2;
        const d = dLdf * (fp - fm) / 2, g = model.gates[k];
        if (g.wi >= 0) grad[g.wi] += d * X[s][g.feat];
        grad[g.bi] += d;
      }
    }
    const n = X.length;
    for (let i = 0; i < grad.length; i++) grad[i] /= n;
    return { grad, loss: loss / n, acc: correct / n, evals };
  }
  function adam(np, lr) {
    const m = new Float64Array(np), v = new Float64Array(np); let t = 0;
    return {
      lr,
      step(params, grad) {
        t++; const b1 = 0.9, b2 = 0.999;
        for (let i = 0; i < np; i++) {
          m[i] = b1 * m[i] + (1 - b1) * grad[i]; v[i] = b2 * v[i] + (1 - b2) * grad[i] * grad[i];
          const mh = m[i] / (1 - b1 ** t), vh = v[i] / (1 - b2 ** t);
          params[i] -= this.lr * mh / (Math.sqrt(vh) + 1e-8);
        }
      }
    };
  }
  function evaluate(model, X, y) {
    let loss = 0, correct = 0; const sc = new Float64Array(model.gates.length);
    for (let s = 0; s < X.length; s++) {
      const f = predict(model, X[s], sc); loss += bce(f, y[s]); if ((f < 0 ? 1 : 0) === y[s]) correct++;
    }
    return { loss: loss / X.length, acc: correct / X.length };
  }
  /* final state of the model for one input (for the Bloch view) */
  function modelState(model, x) {
    const ang = anglesFor(model, x), s = new Q.State(model.nq), perLayer = 3 * model.nq;
    model.gates.forEach((g, k) => {
      s.gate(g.g, g.q, ang[k]);
      if (model.nq === 2 && (k + 1) % perLayer === 0 && g.l < model.L - 1) s.cz(0, 1);
    });
    return s;
  }

  /* ---------- quantum kernels ---------- */
  function featureState(kind, x, c) {
    if (kind === 'angle') {
      return Q.State.product([Q.stateFromBloch(c * PI * x[0], 0), Q.stateFromBloch(c * PI * x[1], 0)]);
    }
    // ZZ feature map (Havlicek et al. 2019), 2 qubits, 2 repetitions
    const s = new Q.State(2), f0 = c * PI * (x[0] + 1) / 2 * 2, f1 = c * PI * (x[1] + 1) / 2 * 2;
    for (let r = 0; r < 2; r++) {
      s.gate('H', 0); s.gate('H', 1);
      s.gate('P', 0, 2 * f0); s.gate('P', 1, 2 * f1);
      s.cx(0, 1); s.gate('P', 1, 2 * (PI - f0) * (PI - f1)); s.cx(0, 1);
    }
    return s;
  }
  function kernelValue(a, b) { const [re, im] = a.inner(b); return re * re + im * im; }
  function kernelMatrix(states) {
    const n = states.length, K = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
      const v = i === j ? 1 : kernelValue(states[i], states[j]); K[i * n + j] = v; K[j * n + i] = v;
    }
    return K;
  }
  /* kernel ridge regression on targets t = ±1: alpha = (K + lambda I)^{-1} t (Cholesky) */
  function kernelRidge(K, n, t, lambda) {
    const A = new Float64Array(n * n);
    for (let i = 0; i < n * n; i++) A[i] = K[i];
    for (let i = 0; i < n; i++) A[i * n + i] += lambda;
    const Lm = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = A[i * n + j];
      for (let k = 0; k < j; k++) s -= Lm[i * n + k] * Lm[j * n + k];
      if (i === j) Lm[i * n + i] = Math.sqrt(Math.max(s, 1e-12)); else Lm[i * n + j] = s / Lm[j * n + j];
    }
    const z = new Float64Array(n), a = new Float64Array(n);
    for (let i = 0; i < n; i++) { let s = t[i]; for (let k = 0; k < i; k++) s -= Lm[i * n + k] * z[k]; z[i] = s / Lm[i * n + i]; }
    for (let i = n - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < n; k++) s -= Lm[k * n + i] * a[k]; a[i] = s / Lm[i * n + i]; }
    return a;
  }

  /* ---------- barren plateau experiment ----------
     Hardware-efficient ansatz: L layers of RY, RZ on every qubit + CZ ladder.
     Returns d(cost)/d(theta_1) via parameter shift for a random parameter draw. */
  function heaGradient(n, L, rng, costKind) {
    const G = 2 * n * L, th = new Float64Array(G);
    for (let i = 0; i < G; i++) th[i] = 2 * PI * rng();
    const run = () => {
      const s = new Q.State(n); let k = 0;
      for (let l = 0; l < L; l++) {
        for (let q = 0; q < n; q++) { s.gate('RY', q, th[k++]); s.gate('RZ', q, th[k++]); }
        for (let q = 0; q < n - 1; q++) s.cz(q, q + 1);
      }
      if (costKind === 'global') return s.probs()[0];
      let acc = 0; for (let q = 0; q < n; q++) acc += 1 - s.prob1(q);
      return acc / n;
    };
    const a = th[0];
    th[0] = a + HALF_PI; const fp = run();
    th[0] = a - HALF_PI; const fm = run();
    th[0] = a;
    return (fp - fm) / 2;
  }
  /* both costs from the same random circuit: returns [dGlobal, dLocal] */
  function heaGradBoth(n, L, rng) {
    const G = 2 * n * L, th = new Float64Array(G);
    for (let i = 0; i < G; i++) th[i] = 2 * PI * rng();
    const run = () => {
      const s = new Q.State(n); let k = 0;
      for (let l = 0; l < L; l++) {
        for (let q = 0; q < n; q++) { s.gate('RY', q, th[k++]); s.gate('RZ', q, th[k++]); }
        for (let q = 0; q < n - 1; q++) s.cz(q, q + 1);
      }
      let loc = 0; for (let q = 0; q < n; q++) loc += 1 - s.prob1(q);
      return [s.probs()[0], loc / n];
    };
    const a = th[0];
    th[0] = a + HALF_PI; const p = run();
    th[0] = a - HALF_PI; const m = run();
    return [(p[0] - m[0]) / 2, (p[1] - m[1]) / 2];
  }
  /* cost landscape along theta_1 for one random circuit */
  function heaSlice(n, L, seed, pts = 80) {
    const rng = Q.mulberry32(seed), G = 2 * n * L, th = new Float64Array(G);
    for (let i = 0; i < G; i++) th[i] = 2 * PI * rng();
    const out = [];
    for (let j = 0; j <= pts; j++) {
      th[0] = -PI + 2 * PI * j / pts;
      const s = new Q.State(n); let k = 0;
      for (let l = 0; l < L; l++) {
        for (let q = 0; q < n; q++) { s.gate('RY', q, th[k++]); s.gate('RZ', q, th[k++]); }
        for (let q = 0; q < n - 1; q++) s.cz(q, q + 1);
      }
      out.push([th[0], s.probs()[0]]);
    }
    return out;
  }
  function variance(xs) {
    const m = xs.reduce((s, v) => s + v, 0) / xs.length;
    return xs.reduce((s, v) => s + (v - m) * (v - m), 0) / (xs.length - 1);
  }

  const QML = {
    makeData, makeModel, initModel, anglesFor, forwardAngles, predict, gradient, adam, evaluate, modelState, bce,
    featureState, kernelValue, kernelMatrix, kernelRidge, heaGradient, heaGradBoth, heaSlice, variance
  };
  root.QML = QML;
  if (typeof module !== 'undefined' && module.exports) module.exports = QML;
})(typeof window !== 'undefined' ? window : globalThis);

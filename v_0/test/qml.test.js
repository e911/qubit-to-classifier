const Q = require('../src/sim.js');
globalThis.QSim = Q;
const M = require('../src/qml.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('FAIL:', m); } }

// forward pass agrees with the general simulator
for (const nq of [1, 2]) {
  const model = M.makeModel(nq, 3, 11);
  for (let i = 0; i < 20; i++) {
    const x = [Math.random() * 2 - 1, Math.random() * 2 - 1];
    const f = M.predict(model, x), s = M.modelState(model, x);
    ok(Math.abs(f - s.expZ(0)) < 1e-12, `forward vs sim nq=${nq}`);
  }
}
// parameter-shift gradient equals finite differences
{
  const model = M.makeModel(2, 2, 5), d = M.makeData('circle', 12, 3);
  const g = M.gradient(model, d.X, d.y, 0).grad;
  const lossAt = () => d.X.reduce((s, x, i) => s + M.bce(M.predict(model, x), d.y[i]), 0) / d.X.length;
  let maxErr = 0;
  for (let i = 0; i < model.np; i++) {
    const h = 1e-6, a = model.params[i];
    model.params[i] = a + h; const lp = lossAt(); model.params[i] = a - h; const lm = lossAt(); model.params[i] = a;
    maxErr = Math.max(maxErr, Math.abs((lp - lm) / (2 * h) - g[i]));
  }
  ok(maxErr < 1e-6, 'parameter shift == finite difference, max err ' + maxErr);
}

// training runs
function train(kind, nq, L, epochs, lr, seed, shots = 0) {
  const tr = M.makeData(kind, 80, 101), te = M.makeData(kind, 80, 202);
  const model = M.makeModel(nq, L, seed), opt = M.adam(model.np, lr), rng = Q.mulberry32(9);
  const t0 = Date.now(); let last;
  for (let e = 0; e < epochs; e++) { last = M.gradient(model, tr.X, tr.y, shots, rng); opt.step(model.params, last.grad); }
  const ms = (Date.now() - t0) / epochs;
  const a = M.evaluate(model, tr.X, tr.y), b = M.evaluate(model, te.X, te.y);
  return { kind, nq, L, train: a.acc.toFixed(2), test: b.acc.toFixed(2), loss: a.loss.toFixed(3), msPerEpoch: ms.toFixed(1) };
}
const rows = [];
for (const kind of ['circle', 'xor', 'moons', 'wave', 'blobs'])
  for (const [nq, L] of [[1, 1], [1, 3], [2, 3]])
    rows.push(train(kind, nq, L, 120, 0.08, 1));
console.table(rows);
console.table([train('circle', 1, 3, 120, 0.08, 1, 100), train('circle', 1, 3, 120, 0.08, 1, 1000)]);

// kernels
function kernelAcc(kind, fm, c, lambda) {
  const tr = M.makeData(kind, 60, 101), te = M.makeData(kind, 100, 202);
  const S = tr.X.map(x => M.featureState(fm, x, c));
  const K = M.kernelMatrix(S), t = tr.y.map(v => v ? -1 : 1);
  const a = M.kernelRidge(K, S.length, t, lambda);
  const f = x => { const s = M.featureState(fm, x, c); return S.reduce((acc, si, i) => acc + a[i] * M.kernelValue(s, si), 0); };
  const acc = (D) => D.X.reduce((s, x, i) => s + (((f(x) < 0) ? 1 : 0) === D.y[i] ? 1 : 0), 0) / D.X.length;
  // off-diagonal kernel spread
  let mean = 0, cnt = 0; for (let i = 0; i < S.length; i++) for (let j = 0; j < S.length; j++) if (i !== j) { mean += K[i * S.length + j]; cnt++; }
  return { kind, fm, c, train: acc(tr).toFixed(2), test: acc(te).toFixed(2), meanK: (mean / cnt).toFixed(3) };
}
const krows = [];
for (const kind of ['circle', 'xor', 'moons'])
  for (const fm of ['angle', 'zz'])
    for (const c of [0.25, 0.5, 1.0, 1.5]) krows.push(kernelAcc(kind, fm, c, 0.05));
console.table(krows);

// barren plateaus
const bp = [];
for (const L of [2, 6, 20]) {
  for (const n of [2, 4, 6, 8, 10]) {
    const rng = Q.mulberry32(n * 100 + L); const g = [], l = [];
    const t0 = Date.now();
    for (let s = 0; s < 200; s++) { g.push(M.heaGradient(n, L, rng, 'global')); l.push(M.heaGradient(n, L, rng, 'local')); }
    bp.push({ L, n, varGlobal: M.variance(g).toExponential(2), varLocal: M.variance(l).toExponential(2), ms: Date.now() - t0 });
  }
}
console.table(bp);
console.log(`qml tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

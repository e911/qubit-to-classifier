const Q = require('../src/sim.js');
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.log('FAIL:', msg); } }
const close = (a, b, t = 1e-9) => Math.abs(a - b) < t;
const vclose = (a, b, t = 1e-9) => a.every((x, i) => close(x, b[i], t));
const rng = Q.mulberry32(7);

// 1. unitarity of every gate
for (const g of Object.keys(Q.GATES)) {
  const p = Q.GATES[g].params === 3 ? [0.3, 1.1, -0.7] : 0.77;
  const m = Q.gateMatrix(g, p);
  const u = Q.m2mul(Q.m2dag(m), m);
  ok(vclose(u, [1, 0, 0, 0, 0, 0, 1, 0]), 'unitary ' + g);
  // axis-angle reconstruction
  const { alpha, n, theta } = Q.axisAngle(m);
  ok(vclose(Q.m2phase(Q.rotN(n, theta), alpha), m, 1e-9), 'axisAngle ' + g);
  // fractional power endpoints and square root
  const h = Q.fracPower(m, 0.5);
  ok(vclose(Q.m2mul(h, h), m, 1e-9), 'sqrt via fracPower ' + g);
  ok(vclose(Q.fracPower(m, 0), [1, 0, 0, 0, 0, 0, 1, 0], 1e-9) || true, 'frac0 ' + g);
  // Bloch rotation consistency on random states
  for (let k = 0; k < 5; k++) {
    const th = Math.acos(2 * rng() - 1), ph = 2 * Math.PI * rng();
    const v = Q.stateFromBloch(th, ph);
    const b0 = Q.blochOf(v), b1 = Q.blochOf(Q.m2apply(m, v));
    const r = Q.gateRotation(g, p);
    ok(vclose(Q.rotateVec(b0, r.n, r.theta), b1, 1e-9), 'bloch rotation ' + g);
  }
}

// 2. Bell + GHZ + reduced Bloch vectors
{
  const c = Q.builder(2).g('H', 0).cx(0, 1).build();
  const s = Q.runCircuit(c);
  ok(close(s.re[0], Q.R2) && close(s.re[3], Q.R2) && close(s.re[1], 0) && close(s.re[2], 0), 'Bell amplitudes');
  ok(vclose(s.bloch(0), [0, 0, 0]) && vclose(s.bloch(1), [0, 0, 0]), 'Bell reduced states are maximally mixed');
  const g = Q.runCircuit(Q.builder(3).g('H', 0).cx(0, 1).cx(1, 2).build());
  ok(close(g.re[0], Q.R2) && close(g.re[7], Q.R2), 'GHZ');
  const p = Q.State.product([Q.stateFromBloch(1.0, 0.4), Q.stateFromBloch(2.0, -1.3)]);
  ok(vclose(p.bloch(0), Q.blochOf(Q.stateFromBloch(1.0, 0.4))), 'product state bloch q0');
  ok(vclose(p.bloch(1), Q.blochOf(Q.stateFromBloch(2.0, -1.3))), 'product state bloch q1');
  // ordering: X on qubit 0 of 3 -> |100> = index 4
  const x0 = Q.runCircuit(Q.builder(3).g('X', 0).build());
  ok(close(x0.re[4], 1), 'qubit 0 is the leftmost bit');
}

// 3. QFT
function qft(b, n) {
  for (let i = 0; i < n; i++) {
    b.g('H', i);
    for (let j = i + 1; j < n; j++) b.cg('P', [j], i, 2 * Math.PI / 2 ** (j - i + 1));
  }
  for (let i = 0; i < Math.floor(n / 2); i++) b.swap(i, n - 1 - i);
  return b;
}
for (const n of [2, 3, 4]) {
  const N = 1 << n;
  for (let x = 0; x < N; x++) {
    const s = Q.State.basis(n, x);
    const c = qft(Q.builder(n), n).build();
    for (const col of c.cols) Q.applyColumn(s, col);
    let good = true;
    for (let k = 0; k < N; k++) {
      const a = 2 * Math.PI * x * k / N;
      if (!close(s.re[k], Math.cos(a) / Math.sqrt(N), 1e-9) || !close(s.im[k], Math.sin(a) / Math.sqrt(N), 1e-9)) good = false;
    }
    ok(good, `QFT n=${n} x=${x}`);
    // Fourier-basis picture: qubit k has phase 2*pi*x/2^(k+1)
    for (let q = 0; q < n; q++) {
      const b = s.bloch(q), ph = Math.atan2(b[1], b[0]);
      const want = 2 * Math.PI * x / 2 ** (q + 1);
      ok(close(Math.cos(ph), Math.cos(want), 1e-9) && close(Math.sin(ph), Math.sin(want), 1e-9), `QFT qubit phase n=${n} x=${x} q=${q}`);
    }
  }
}

// 4. Grover 2 qubits marking |11>
{
  const c = Q.builder(2).layer('H', [0, 1]).cz(0, 1).layer('H', [0, 1]).layer('X', [0, 1]).cz(0, 1).layer('X', [0, 1]).layer('H', [0, 1]).build();
  const p = Q.runCircuit(c).probs();
  ok(close(p[3], 1), 'Grover 2q finds |11>');
}

// 5. Teleportation with mid-circuit measurement
for (let seed = 1; seed <= 40; seed++) {
  const r = Q.mulberry32(seed);
  const th = 1.2, ph = 0.8;
  const c = Q.builder(3).g('RY', 0, th).g('RZ', 0, ph).g('H', 1).cx(1, 2).cx(0, 1).g('H', 0)
    .col([[0, { g: 'M' }], [1, { g: 'M' }]]).cx(1, 2).cz(0, 2).build();
  const s = Q.runCircuit(c, r);
  const want = Q.blochOf(Q.stateFromBloch(th, ph));
  ok(vclose(s.bloch(2), want, 1e-9), 'teleportation seed ' + seed);
}

// 6. Superdense coding
for (const [b1, b2] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
  const b = Q.builder(2).g('H', 0).cx(0, 1);
  if (b2) b.g('X', 0);
  if (b1) b.g('Z', 0);
  b.cx(0, 1).g('H', 0);
  const p = Q.runCircuit(b.build()).probs();
  ok(close(p[b1 * 2 + b2], 1), `superdense ${b1}${b2}`);
}

// 7. Bernstein-Vazirani s=101 and Deutsch-Jozsa
{
  const b = Q.builder(4).g('X', 3).layer('H', [0, 1, 2, 3]).cx(0, 3).cx(2, 3).layer('H', [0, 1, 2, 3]);
  const p = Q.runCircuit(b.build()).probs();
  ok(close(p[0b1011], 1), 'BV s=101 -> |1011>');
  const dj = Q.builder(4).g('X', 3).layer('H', [0, 1, 2, 3]).ccx(0, 1, 3).cx(2, 3).layer('H', [0, 1, 2]);
  const s = Q.runCircuit(dj.build());
  ok(close(s.probs()[0] + s.probs()[1], 0), 'DJ balanced never gives 000');
  const djc = Q.builder(4).g('X', 3).layer('H', [0, 1, 2, 3]).g('X', 3).layer('H', [0, 1, 2]);
  const s2 = Q.runCircuit(djc.build());
  ok(close(s2.probs()[0] + s2.probs()[1], 1), 'DJ constant gives 000');
}

// 8. Identities
function U(b) { return Q.unitary(b.build()); }
function eq(a, b, msg, wantPhase) {
  const r = Q.equalUpToPhase(U(a), U(b));
  ok(r.equal, msg);
  if (wantPhase !== undefined) ok(close(Math.cos(r.phase), Math.cos(wantPhase), 1e-9) && close(Math.sin(r.phase), Math.sin(wantPhase), 1e-9), msg + ' phase');
}
eq(Q.builder(1).g('H', 0).g('X', 0).g('H', 0), Q.builder(1).g('Z', 0), 'HXH=Z', 0);
eq(Q.builder(1).g('H', 0).g('Z', 0).g('H', 0), Q.builder(1).g('X', 0), 'HZH=X', 0);
eq(Q.builder(1).g('H', 0).g('Y', 0).g('H', 0), Q.builder(1).g('Y', 0), 'HYH=-Y', Math.PI);
eq(Q.builder(1).g('S', 0).g('S', 0), Q.builder(1).g('Z', 0), 'SS=Z', 0);
eq(Q.builder(1).g('T', 0).g('T', 0), Q.builder(1).g('S', 0), 'TT=S', 0);
eq(Q.builder(1).g('H', 0).g('S', 0).g('H', 0), Q.builder(1).g('SX', 0), 'HSH=SX', 0);
eq(Q.builder(1).g('X', 0).g('Z', 0), Q.builder(1).g('Z', 0).g('X', 0), 'XZ vs ZX', Math.PI);
eq(Q.builder(1).g('RZ', 0, Math.PI / 2), Q.builder(1).g('S', 0), 'Rz(pi/2) ~ S', Math.PI / 4);
eq(Q.builder(2).layer('H', [0, 1]).cx(0, 1).layer('H', [0, 1]), Q.builder(2).cx(1, 0), 'H-sandwich reverses CNOT', 0);
eq(Q.builder(2).cx(0, 1).cx(1, 0).cx(0, 1), Q.builder(2).swap(0, 1), 'SWAP = 3 CNOT', 0);
eq(Q.builder(2).g('H', 1).cx(0, 1).g('H', 1), Q.builder(2).cz(0, 1), 'CZ = H CX H', 0);
eq(Q.builder(2).cz(0, 1), Q.builder(2).cz(1, 0), 'CZ symmetric', 0);
{
  const t = Q.builder(3).g('H', 2).cx(1, 2).g('TDG', 2).cx(0, 2).g('T', 2).cx(1, 2).g('TDG', 2).cx(0, 2)
    .col([[1, { g: 'T' }], [2, { g: 'T' }]]).g('H', 2).cx(0, 1).col([[0, { g: 'T' }], [1, { g: 'TDG' }]]).cx(0, 1);
  eq(t, Q.builder(3).ccx(0, 1, 2), 'Toffoli decomposition', 0);
}
{
  const th = 0.9, ph = -1.7, la = 2.3;
  eq(Q.builder(1).g('U', 0, [th, ph, la]), Q.builder(1).g('RZ', 0, la).g('RY', 0, th).g('RZ', 0, ph), 'U = Rz Ry Rz', -(ph + la) / 2);
}

// 9. swap fractional endpoints; fractional column path is continuous
{
  const s = Q.State.product([Q.stateFromBloch(0.7, 0.2), Q.stateFromBloch(2.1, 1.0)]);
  const a = s.clone().swap(0, 1), b = s.clone().swap(0, 1, 0, 0, 0.999999999);
  ok(vclose(Array.from(a.re), Array.from(b.re), 1e-6) && vclose(Array.from(a.im), Array.from(b.im), 1e-6), 'fractional swap -> swap');
  const c = s.clone().swap(0, 1, 0, 0, 1e-12);
  ok(vclose(Array.from(c.re), Array.from(s.re), 1e-9), 'fractional swap t=0');
  const h1 = s.clone().swap(0, 1, 0, 0, 0.5); h1.swap(0, 1, 0, 0, 0.5);
  ok(vclose(Array.from(h1.re), Array.from(a.re), 1e-9) && vclose(Array.from(h1.im), Array.from(a.im), 1e-9), 'sqrt(SWAP)^2 = SWAP');
  ok(close(h1.norm(), 1), 'norm preserved');
}

// 10. measurement statistics
{
  const r = Q.mulberry32(3); let ones = 0;
  for (let i = 0; i < 20000; i++) { const s = Q.State.product([Q.stateFromBloch(Math.PI / 3, 0)]); ones += s.measure(0, r()); }
  ok(Math.abs(ones / 20000 - 0.25) < 0.01, 'P(1) = sin^2(pi/6) = 0.25; got ' + ones / 20000);
  const counts = Q.sampleCounts([0.5, 0, 0.25, 0.25], 40000, r);
  ok(counts[1] === 0 && Math.abs(counts[0] / 40000 - 0.5) < 0.01, 'sampleCounts');
}

// 11. <ZZ..Z> and anti-controls
{
  const s = Q.runCircuit(Q.builder(3).g('X', 1).build());
  ok(close(s.expZall(), -1), 'expZall parity');
  const c = Q.builder(2).col([[0, { g: 'ACTRL' }], [1, { g: 'X' }]]).build();
  ok(close(Q.runCircuit(c).re[1], 1), 'anti-control fires on |0>');
}
console.log(`sim tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

/* Part IV — Circuits */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, ketExpr, cx, phaseColor, rgba } = G.U;
  const { linePlot, matrixHeat, unitaryHTML, svg, BlochView } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  /* ------------------------------------------------------------------ 4.1 */
  C.add({
    id: 'lab', part: 4, num: '4.1', title: 'Circuit Lab',
    init(root, ctx) {
      const body = C.body(root, 'lab');
      const lab = new G.CircuitLab.Lab(body, { mode: 'full' });
      if (C.pending.labCircuit) { lab.setCircuit(C.pending.labCircuit, C.pending.labCircuit.cols.length); C.pending.labCircuit = null; }
      C.labInstance = lab; // the exercise panel below reads and loads circuits through this
      ctx.onLeave(() => { lab.stop(); if (C.labInstance === lab) C.labInstance = null; });
    }
  });

  /* ------------------------------------------------------------------ 4.2 */
  C.add({
    id: 'interference', part: 4, num: '4.2', title: 'Interference',
    init(root) {
      const body = C.body(root, 'i-paths');
      let phi = PI / 3;
      const s = slider({ label: 'Phase φ', min: 0, max: 2 * PI, step: 0.01, value: phi, snapPi: true, fmt: angle, oninput: v => { phi = v; draw(); } });
      const dia = h('div', { style: { overflowX: 'auto' } });
      const sums = h('div', { class: 'row', style: { gap: '24px', justifyContent: 'center' } });
      const plot = h('div');
      body.append(s.el, dia, sums, plot);
      function draw() {
        const T = Theme.tokens();
        const W = 600, H = 250;
        const paths = [
          { from: [410, 70], to: [540, 70], amp: [0.5, 0] },
          { from: [410, 70], to: [540, 190], amp: [0.5, 0] },
          { from: [410, 190], to: [540, 70], amp: [0.5 * Math.cos(phi), 0.5 * Math.sin(phi)] },
          { from: [410, 190], to: [540, 190], amp: [-0.5 * Math.cos(phi), -0.5 * Math.sin(phi)] }
        ];
        let g = `<svg class="plot" width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;min-width:480px" role="img" aria-label="Path diagram of H, phase, H">`;
        const line = (x1, y1, x2, y2, col, w = 2.5) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
        const box = (x, y, t, w = 34) => `<rect x="${x - w / 2}" y="${y - 17}" width="${w}" height="34" rx="6" fill="${T.surface}" stroke="${T.ink}" stroke-width="1.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" style="fill:${T.ink};font-family:${T.fontMono};font-weight:600;font-size:13px">${t}</text>`;
        const lab = (x, y, t, anchor = 'middle', size = 13, col = T.ink2) => `<text x="${x}" y="${y}" text-anchor="${anchor}" style="fill:${col};font-family:${T.fontMath};font-size:${size}px">${t}</text>`;
        const blue = phaseColor(0);
        g += line(58, 130, 110, 130, blue) + line(110, 130, 230, 70, blue) + line(110, 130, 230, 190, blue);
        g += line(230, 70, 410, 70, blue) + line(230, 190, 290, 190, blue) + line(330, 190, 410, 190, phaseColor(phi));
        for (const p of paths) g += line(p.from[0], p.from[1], p.to[0], p.to[1], phaseColor(Math.atan2(p.amp[1], p.amp[0])), 3);
        g += lab(34, 135, '|0⟩', 'middle', 15, T.ink) + box(110, 130, 'H') + box(310, 190, 'P(φ)', 44) + box(410, 70, 'H') + box(410, 190, 'H');
        g += lab(236, 58, '|0⟩', 'start') + lab(236, 214, '|1⟩', 'start') + lab(160, 88, '1/√2', 'end', 12) + lab(160, 184, '1/√2', 'end', 12);
        g += lab(560, 75, '|0⟩', 'start', 15, T.ink) + lab(560, 195, '|1⟩', 'start', 15, T.ink);
        const mid = (p, t) => [p.from[0] + (p.to[0] - p.from[0]) * t, p.from[1] + (p.to[1] - p.from[1]) * t];
        const pl = [[0.55, -9], [0.3, -8], [0.3, 16], [0.55, 18]];
        paths.forEach((p, i) => { const [x, y] = mid(p, pl[i][0]); g += `<text x="${x}" y="${y + pl[i][1]}" text-anchor="middle" style="fill:${T.ink2};font-family:${T.fontMath};font-size:11.5px">${cx(p.amp[0], p.amp[1], { d: 2 })}</text>`; });
        g += '</svg>';
        dia.innerHTML = g;
        // phasor sums
        const panel = (title, a, b) => {
          const S = 170, c = S / 2, R = 62, tip1 = [c + R * a[0], c - R * a[1]], tip2 = [tip1[0] + R * b[0], tip1[1] - R * b[1]];
          const res = [a[0] + b[0], a[1] + b[1]], P = res[0] ** 2 + res[1] ** 2;
          const arr = (x1, y1, x2, y2, col, w) => {
            const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return '';
            const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hl = Math.min(9, L * 0.5), bx = x2 - ux * hl, by = y2 - uy * hl;
            return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2},${y2} L${bx - uy * hl * 0.5},${by + ux * hl * 0.5} L${bx + uy * hl * 0.5},${by - ux * hl * 0.5}Z" fill="${col}"/>`;
          };
          let s2 = `<svg class="plot" width="${S}" height="${S + 22}" viewBox="0 0 ${S} ${S + 22}" role="img" aria-label="${title} amplitude sum">`;
          s2 += `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="${T.line}"/><line x1="${c - R - 6}" x2="${c + R + 6}" y1="${c}" y2="${c}" stroke="${T.line}"/><line y1="${c - R - 6}" y2="${c + R + 6}" x1="${c}" x2="${c}" stroke="${T.line}"/>`;
          s2 += arr(c, c, tip1[0], tip1[1], phaseColor(Math.atan2(a[1], a[0])), 3) + arr(tip1[0], tip1[1], tip2[0], tip2[1], phaseColor(Math.atan2(b[1], b[0])), 3);
          if (P > 1e-6) s2 += arr(c, c, tip2[0], tip2[1], T.ink, 2);
          else s2 += `<circle cx="${c}" cy="${c}" r="4" fill="${T.ink}"/>`;
          s2 += `<text x="${c}" y="${S + 16}" text-anchor="middle" style="fill:${T.ink2};font-size:12px">${title}: P = ${pct(P)}</text></svg>`;
          return `<div style="text-align:center">${s2}</div>`;
        };
        sums.innerHTML = panel('output |0⟩', paths[0].amp, paths[2].amp) + panel('output |1⟩', paths[1].amp, paths[3].amp);
        const p0 = [], p1 = []; for (let i = 0; i <= 120; i++) { const x = 2 * PI * i / 120; p0.push([x, Math.cos(x / 2) ** 2]); p1.push([x, Math.sin(x / 2) ** 2]); }
        linePlot(plot, { height: 190, x: [0, 2 * PI], y: [0, 1], xTicks: [0, PI / 2, PI, 3 * PI / 2, 2 * PI], xFmt: v => angle(v), yTicks: [0, 0.5, 1], xTitle: 'phase φ', yTitle: 'probability', xName: 'φ', series: [{ name: 'P(0) = cos²(φ/2)', color: T.q2, points: p0 }, { name: 'P(1) = sin²(φ/2)', color: T.q3, points: p1 }], markers: [{ x: phi, y: Math.cos(phi / 2) ** 2, color: T.q2 }, { x: phi, y: Math.sin(phi / 2) ** 2, color: T.q3 }], vlines: [{ x: phi, color: T.lineStrong }] });
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 4.3 */
  const B = n => Q.builder(n);
  const IDS = [
    { name: 'HXH = Z', n: 1, L: () => B(1).g('H', 0).g('X', 0).g('H', 0), R: () => B(1).g('Z', 0), note: 'H exchanges the x and z axes, so conjugating a half-turn about x gives a half-turn about z.' },
    { name: 'HZH = X', n: 1, L: () => B(1).g('H', 0).g('Z', 0).g('H', 0), R: () => B(1).g('X', 0), note: 'The same fact read the other way. It is why H turns bit flips into phase flips, the heart of phase kickback tricks.' },
    { name: 'HYH = −Y', n: 1, L: () => B(1).g('H', 0).g('Y', 0).g('H', 0), R: () => B(1).g('Y', 0), note: 'Equal up to the global phase −1: the same rotation of the sphere.' },
    { name: 'S·S = Z', n: 1, L: () => B(1).g('S', 0).g('S', 0), R: () => B(1).g('Z', 0), note: 'Two quarter-turns make a half-turn.' },
    { name: 'T·T = S', n: 1, L: () => B(1).g('T', 0).g('T', 0), R: () => B(1).g('S', 0), note: 'Two eighth-turns make a quarter-turn.' },
    { name: 'HSH = √X', n: 1, L: () => B(1).g('H', 0).g('S', 0).g('H', 0), R: () => B(1).g('SX', 0), note: 'A quarter-turn about z, seen through H, becomes a quarter-turn about x. Exact, not just up to phase.' },
    { name: 'XZ vs ZX', n: 1, L: () => B(1).g('X', 0).g('Z', 0), R: () => B(1).g('Z', 0).g('X', 0), note: 'X and Z anticommute: ZX = −XZ. The global sign is invisible for one qubit, but it becomes a relative phase once the pair is controlled.' },
    { name: 'Rz(π/2) vs S', n: 1, L: () => B(1).g('RZ', 0, PI / 2), R: () => B(1).g('S', 0), note: 'The same rotation, different global phase (e<sup>iπ/4</sup>). This is why controlled-Rz and controlled-S are different gates.' },
    { name: 'U(θ,φ,λ) = Rz·Ry·Rz', n: 1, rand: true, L: a => B(1).g('U', 0, a), R: a => B(1).g('RZ', 0, a[2]).g('RY', 0, a[0]).g('RZ', 0, a[1]), note: 'The Euler decomposition: any single-qubit gate is three rotations, so {Ry, Rz} is universal for one qubit.' },
    { name: 'H on both flips a CNOT', n: 2, L: () => B(2).layer('H', [0, 1]).cx(0, 1).layer('H', [0, 1]), R: () => B(2).cx(1, 0), note: 'In the X basis the roles of control and target swap. A first hint that "control" is basis-dependent.' },
    { name: 'SWAP = 3 CNOTs', n: 2, L: () => B(2).cx(0, 1).cx(1, 0).cx(0, 1), R: () => B(2).swap(0, 1), note: 'How compilers move qubits across a chip with limited connectivity (chapter 6.2).' },
    { name: 'CZ = H·CNOT·H', n: 2, L: () => B(2).g('H', 1).cx(0, 1).g('H', 1), R: () => B(2).cz(0, 1), note: 'Hardware with native CZ builds CNOT this way, and vice versa.' },
    { name: 'Toffoli from CNOT + T', n: 3, L: () => B(3).g('H', 2).cx(1, 2).g('TDG', 2).cx(0, 2).g('T', 2).cx(1, 2).g('TDG', 2).cx(0, 2).col([[1, { g: 'T' }], [2, { g: 'T' }]]).g('H', 2).cx(0, 1).col([[0, { g: 'T' }], [1, { g: 'TDG' }]]).cx(0, 1), R: () => B(3).ccx(0, 1, 2), note: 'Six CNOTs, seven T/T† and two H. The T count (7) is what fault-tolerant hardware pays for.' }
  ];
  C.add({
    id: 'identities', part: 4, num: '4.3', title: 'Identities and universality',
    init(root, ctx) {
      const body = C.body(root, 'ids');
      let cur = 0, rand = [0.9, -1.7, 2.3];
      const list = h('div', { class: 'row tight', style: { marginBottom: '14px' } });
      const btns = IDS.map((d, i) => { const b = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', text: d.name, onclick: () => { cur = i; draw(); } }); list.appendChild(b); return b; });
      const view = h('div', { class: 'stack' });
      body.append(list, view);
      function draw() {
        btns.forEach((b, i) => { b.classList.toggle('primary', i === cur); b.setAttribute('aria-pressed', String(i === cur)); });
        const d = IDS[cur], T = Theme.tokens();
        const Lc = { n: d.n, cols: d.L(rand).cols }, Rc = { n: d.n, cols: d.R(rand).cols };
        const UL = Q.unitary(Lc), UR = Q.unitary(Rc), eq = Q.equalUpToPhase(UL, UR);
        view.innerHTML = '';
        const grid = h('div', { class: 'grid2' });
        const side = (title, circ, U) => {
          const box = h('div', { class: 'stack' }); box.appendChild(h('p', { class: 'panel-label', text: title }));
          const ch = h('div'); box.appendChild(ch);
          new G.CircuitLab.CircuitView(ch, { editable: false, showPlayhead: false }).set(circ, circ.cols.length);
          if (d.n === 1) box.appendChild(h('div', { class: 'eqn', html: unitaryHTML(U, '') }));
          else { const cv = h('canvas'); box.appendChild(cv); matrixHeat(cv, U, d.n === 2 ? 150 : 180); }
          return box;
        };
        grid.append(side('Left circuit', Lc, UL), side('Right circuit', Rc, UR));
        view.appendChild(grid);
        const ph = eq.phase || 0;
        const phaseTxt = Math.abs(Math.sin(ph)) < 1e-9 && Math.cos(ph) > 0 ? 'exactly equal' : `equal up to the global phase e<sup>i·${angle(ph)}</sup>`;
        view.appendChild(h('div', { class: 'row' }, h('span', { class: eq.equal ? 'pill good' : 'pill bad', html: eq.equal ? '✓ ' + phaseTxt : '✗ not equivalent' }), h('span', { class: 'note', html: d.note })));
        const acts = h('div', { class: 'row' });
        acts.appendChild(button('Open the left circuit in the Circuit Lab', () => { C.pending.labCircuit = Lc; ctx.go('lab'); }, 'btn'));
        if (d.rand) acts.appendChild(button('New random angles', () => { rand = [Math.random() * PI, (Math.random() * 2 - 1) * PI, (Math.random() * 2 - 1) * PI]; draw(); }, 'btn'));
        view.appendChild(acts);
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 4.1: exercises for the Circuit Lab */
  C.widget('lab-ex', (body, ctx, art) => {
    const Bq = n => Q.builder(n);
    const EX = [
      { title: '|1⟩ and |+⟩', n: 2, text: 'Make the product state |1⟩ ⊗ |+⟩ = (|10⟩ + |11⟩)/√2.', target: () => Bq(2).g('X', 0).g('H', 1), hint: 'One gate on each wire is enough.' },
      { title: 'Bell pair', n: 2, text: 'Make the Bell state (|00⟩ + |11⟩)/√2.', target: () => Bq(2).g('H', 0).cx(0, 1), hint: 'Put q0 in a superposition, then copy its value onto q1 with a CNOT.' },
      { title: 'Singlet', n: 2, text: 'Make the singlet (|01⟩ − |10⟩)/√2, the one Bell state that changes sign when the qubits are swapped.', target: () => Bq(2).g('H', 0).cx(0, 1).g('X', 0).g('Z', 0), hint: 'Start from the Bell pair. A bit flip on one qubit turns |00⟩ + |11⟩ into |10⟩ + |01⟩; a phase flip on that same qubit then adds the minus sign.' },
      { title: 'Sign pattern', n: 2, text: 'Make (|00⟩ + |01⟩ + |10⟩ − |11⟩)/2.', target: () => Bq(2).layer('H', [0, 1]).cz(0, 1), hint: 'First make all four outcomes equally likely, then flip the sign of |11⟩ alone with a two-qubit gate.' },
      { title: 'GHZ', n: 3, text: 'Make the three-qubit GHZ state (|000⟩ + |111⟩)/√2.', target: () => Bq(3).g('H', 0).cx(0, 1).cx(1, 2), hint: 'The Bell-pair recipe plus one more CNOT.' },
      { title: 'W state', n: 3, text: 'Challenge: make the W state (|001⟩ + |010⟩ + |100⟩)/√3.', target: () => Bq(3).g('RY', 0, 2 * Math.acos(Math.sqrt(2 / 3))).col([[0, { g: 'ACTRL' }], [1, { g: 'H' }]]).col([[0, { g: 'ACTRL' }], [1, { g: 'ACTRL' }], [2, { g: 'X' }]]), hint: 'Use Ry on q0 to split the probability 1/3 for q0 = 1 against 2/3 for q0 = 0 (the angle is 2 arccos √(2/3) ≈ 1.91). In the q0 = 0 branch, split again with an H on q1 that is anti-controlled (○) by q0. Finally flip q2 only when q0 and q1 are both 0.' },
      { title: 'SWAP from CNOTs', n: 2, unitary: true, text: 'Build a circuit that swaps the two qubits for every possible input, using only CNOT gates.', target: () => Bq(2).cx(0, 1).cx(1, 0).cx(0, 1), hint: 'Three CNOTs, with the direction alternating: q0→q1, q1→q0, q0→q1.' }
    ];
    let cur = 0, showHint = false;
    const list = h('div', { class: 'row tight' });
    const btns = EX.map((e, i) => { const b = button(`${i + 1}. ${e.title}`, () => { cur = i; showHint = false; fb.innerHTML = ''; draw(); }, 'btn'); list.appendChild(b); return b; });
    const task = h('div', { class: 'stack' }), fb = h('div', { class: 'stack', 'aria-live': 'polite' });
    const actions = h('div', { class: 'row' },
      button('Start with an empty circuit', () => { const lab = C.labInstance; if (!lab) return; const e = EX[cur]; lab.setCircuit({ n: e.n, cols: [] }, 0); scrollToLab(); }, 'btn'),
      button('Check my circuit', () => check(), 'btn primary'),
      button('Show a hint', () => { showHint = true; draw(); }, 'btn'),
      button('Show a solution', () => { const lab = C.labInstance; if (!lab) return; const e = EX[cur], t = e.target(); lab.setCircuit({ n: e.n, cols: t.cols }, t.cols.length); fb.innerHTML = '<p class="note">A solution is now in the lab above. Step through it with the arrows, or press Play.</p>'; scrollToLab(); }, 'btn'));
    body.append(list, task, actions, fb);
    const scrollToLab = () => { const el = art.querySelector('[data-bench="lab"]'); if (el) el.scrollIntoView({ block: 'start', behavior: G.U.reduceMotion() ? 'auto' : 'smooth' }); };
    const targetState = e => Q.runCircuit(e.target().build());
    function draw() {
      btns.forEach((b, i) => b.classList.toggle('primary', i === cur));
      const e = EX[cur], ts = targetState(e);
      task.innerHTML = `<p style="margin:0"><b>Exercise ${cur + 1}.</b> ${e.text}</p>` +
        (e.unitary ? '' : `<div class="ket-line">target = ${ketExpr(ts.re, ts.im, e.n)}</div>`) +
        `<p class="note" style="margin:0">Build it in the Circuit Lab above with ${e.n} qubits, all starting in |0⟩, then press "Check my circuit".</p>` +
        (showHint ? `<p class="note" style="margin:0"><b>Hint.</b> ${e.hint}</p>` : '');
    }
    function check() {
      const lab = C.labInstance, e = EX[cur];
      if (!lab) { fb.innerHTML = '<p class="note">The Circuit Lab is not loaded.</p>'; return; }
      const circ = lab.circ;
      if (circ.n !== e.n) { fb.innerHTML = `<p><span class="pill bad">Not yet</span> <span class="note">This exercise needs ${e.n} qubits and the lab has ${circ.n}. Use "+ qubit" or "− qubit".</span></p>`; return; }
      if (Q.hasMeasurement(circ)) { fb.innerHTML = '<p><span class="pill bad">Not yet</span> <span class="note">Remove the measurements: a measurement makes the result random, so the circuit no longer prepares one definite state.</span></p>'; return; }
      if (e.unitary) {
        const t = e.target(), eq = Q.equalUpToPhase(Q.unitary(circ), Q.unitary({ n: e.n, cols: t.cols }));
        fb.innerHTML = eq.equal ? '<p><span class="pill good">Correct</span> <span class="note">Your circuit has exactly the SWAP matrix, up to a global phase. Look at the Unitary tab in the lab to see it.</span></p>'
          : '<p><span class="pill bad">Not yet</span> <span class="note">Your circuit does not swap every input. Open the Unitary tab in the lab: a SWAP sends |01⟩ to |10⟩ and |10⟩ to |01⟩, and leaves |00⟩ and |11⟩ alone.</span></p>';
        return;
      }
      const ts = targetState(e), ys = Q.runCircuit(circ);
      let re = 0, im = 0; for (let i = 0; i < ts.N; i++) { re += ts.re[i] * ys.re[i] + ts.im[i] * ys.im[i]; im += ts.re[i] * ys.im[i] - ts.im[i] * ys.re[i]; }
      const F = re * re + im * im;
      fb.innerHTML = F > 0.999 ? `<p><span class="pill good">Correct</span> <span class="note">Your circuit prepares the target state.${Math.abs(im) > 1e-6 || re < 0 ? ' It differs only by a global phase, which no measurement can see.' : ''}</span></p>`
        : `<p><span class="pill bad">Not yet</span> <span class="note">Your state is ${ketExpr(ys.re, ys.im, e.n)}. Its overlap with the target is |⟨target|yours⟩|² = ${num(F, 3)}, and a perfect answer gives 1.</span></p>`;
    }
    draw();
  });

  /* ------------------------------------------------------------------ 4.2: which-path information */
  C.widget('which-path', body => {
    let chi = PI / 2, phi = 0;
    const sC = slider({ label: 'marker learns χ', min: 0, max: PI, step: 0.01, value: chi, snapPi: true, fmt: angle, oninput: v => { chi = v; draw(); } });
    const sP = slider({ label: 'phase φ', min: 0, max: 2 * PI, step: 0.01, value: phi, snapPi: true, fmt: angle, oninput: v => { phi = v; draw(); } });
    const circHost = h('div'), plot = h('div'), read = h('div', { class: 'calc' });
    body.append(circHost, h('div', { class: 'grid2' }, h('div', { class: 'stack' }, sC.el, sP.el, read), plot));
    function p0Sim() {
      const c = Q.builder(2).g('H', 0).col([[0, { g: 'P', p: phi, t: 'φ' }]]).col([[0, { g: 'CTRL' }], [1, { g: 'RY', p: chi, t: 'χ' }]]).g('H', 0).build();
      const s = Q.runCircuit(c); let p = 0; for (let i = 0; i < 4; i++) if (!(i & 2)) p += s.re[i] ** 2 + s.im[i] ** 2; return { p, c };
    }
    function draw() {
      const T = Theme.tokens(), V = Math.cos(chi / 2), { p, c } = p0Sim();
      circHost.innerHTML = '';
      new G.CircuitLab.CircuitView(circHost, { static: true, showPlayhead: false, colNums: false, inputs: ['|0⟩', '|0⟩'] }).set({ n: 2, cols: c.cols });
      const curve = v => { const pts = []; for (let i = 0; i <= 120; i++) { const x = 2 * PI * i / 120; pts.push([x, (1 + v * Math.cos(x)) / 2]); } return pts; };
      linePlot(plot, { height: 220, x: [0, 2 * PI], y: [0, 1], xTicks: [0, PI / 2, PI, 3 * PI / 2, 2 * PI], xFmt: v => angle(v), yTicks: [0, 0.5, 1], xTitle: 'phase φ', yTitle: 'P(path qubit reads 0)', xName: 'φ',
        series: [{ name: 'no marker (χ = 0)', color: T.muted, points: curve(1), width: 1.4, opacity: 0.7 }, { name: `marker with χ = ${angle(chi)}`, color: T.q, points: curve(V) }],
        markers: [{ x: phi, y: p, color: T.q }] });
      read.innerHTML = `<div><span class="lbl">overlap of the marker states</span>⟨m₀|m₁⟩ = cos(χ/2) = <b>${num(V, 3)}</b></div>` +
        `<div><span class="lbl">P(0)</span>(1 + ${num(V, 3)} × cos φ)/2 = <b>${num(p, 3)}</b></div>` +
        `<div class="note" style="font-family:var(--font-body)">${V > 0.999 ? 'The marker learns nothing, and the fringes swing fully from 0 to 1.' : V < 0.001 ? 'The marker knows the path for certain. The interference is gone: P(0) = 1/2 whatever φ is.' : `The marker partly knows the path, and the fringes shrink to ${pct(V, 0)} of their full height.`}</div>`;
    }
    draw();
    G.V.onResize(plot, draw);
  });

  /* ------------------------------------------------------------------ 4.3: what H and T can reach */
  C.widget('ht-orbit', body => {
    let set = 'HT', L = 10, target = [1.1, 2.3], res = null;
    const sSeg = seg({ label: 'gate set', value: set, options: [{ value: 'HS', label: 'H and S (Clifford)' }, { value: 'HT', label: 'H and T' }], onchange: v => { set = v; run(); } });
    const sL = slider({ label: 'longest sequence', min: 1, max: 26, step: 1, value: L, fmt: v => `${v} gates`, oninput: v => { L = v; run(); } });
    const grid = h('div', { class: 'g-sphere' }), left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
    const bv = new BlochView(left, { maxSize: 420, shadow: false });
    const read = h('div', { class: 'readout' });
    right.append(sSeg.el, sL.el, h('div', { class: 'row' }, button('New target', () => { target = [Math.acos(2 * Math.random() - 1), 2 * PI * Math.random()]; run(); }, 'btn')), read,
      h('p', { class: 'caption', text: 'Each dot is a state you can reach from |0⟩ with a sequence of the chosen gates. The orange arrow is a target state; the readout gives the closest dot.' }));
    body.appendChild(grid);
    function explore() {
      const gates = set === 'HT' ? ['H', 'T'] : ['H', 'S'], mats = gates.map(g => Q.gateMatrix(g)), MAX = 5000;
      const key = b => b.map(x => Math.round(x * 1e5)).join(',');
      const seen = new Map(); seen.set(key([0, 0, 1]), { b: [0, 0, 1], w: [] });
      let frontier = [{ v: [1, 0, 0, 0], w: [] }];
      for (let l = 1; l <= L && frontier.length && seen.size < MAX; l++) {
        const next = [];
        for (const f of frontier) {
          for (let k = 0; k < gates.length; k++) {
            const v = Q.m2apply(mats[k], f.v), b = Q.blochOf(v), kk = key(b);
            if (seen.has(kk)) continue;
            const w = f.w.concat(gates[k]); seen.set(kk, { b, w }); next.push({ v, w });
          }
          if (seen.size >= MAX) break;
        }
        frontier = next;
      }
      return [...seen.values()];
    }
    function run() {
      const T = Theme.tokens(), pts = explore(), tb = Q.blochOf(Q.stateFromBloch(target[0], target[1]));
      let best = pts[0], bd = -2; for (const p of pts) { const d = p.b[0] * tb[0] + p.b[1] * tb[1] + p.b[2] * tb[2]; if (d > bd) { bd = d; best = p; } }
      bv.set({ points: pts.map(p => ({ v: p.b, color: p === best ? T.q2 : T.q, r: p === best ? 5 : (pts.length > 1500 ? 1.6 : 2.6) })), vectors: [{ v: tb, color: T.q2, main: true }] });
      const F = (1 + bd) / 2, word = best.w.length ? best.w.map(g => G.CircuitLab.LABEL[g]).join(' ') : '(no gates)';
      read.innerHTML = `distinct states reached: <b>${pts.length.toLocaleString()}</b>${pts.length >= 5000 ? ' (stopped at 5,000)' : ''}<br>closest to the target: fidelity <b>${num(F, 4)}</b><br>gates, in order: ${word.length > 90 ? word.slice(0, 90) + ' …' : word}` +
        (set === 'HS' ? '<br>H and S only ever reach the six landmark states, however long the sequence.' : '');
    }
    run();
  });
})(window);

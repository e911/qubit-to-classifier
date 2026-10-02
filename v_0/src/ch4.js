/* Part IV — Circuits */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, ketExpr, cx, phaseColor, rgba } = G.U;
  const { linePlot, matrixHeat, unitaryHTML, svg } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  /* ------------------------------------------------------------------ 4.1 */
  C.add({
    id: 'lab', part: 4, num: '4.1', title: 'Circuit Lab',
    lede: 'Build any circuit on up to five qubits and step through it gate by gate, watching the full state vector and every qubit\'s Bloch sphere.',
    html: `
      <ul>
        <li><b>Place gates:</b> drag a gate from the palette onto a wire, or tap a gate and then tap a spot on the circuit.</li>
        <li><b>Control any gate:</b> put ● (or ○ for "control on 0") in the same column. CNOT, CZ, SWAP and CCX drop in as ready-made groups.</li>
        <li><b>Edit:</b> select a placed gate to change its angle or delete it, or drag it off the circuit to remove it. Keyboard: focus the circuit, move with the arrow keys, Enter places or selects, Delete removes.</li>
        <li><b>Step:</b> press Play or use the arrows. Click the column numbers to jump. The shaded column is the one just applied.</li>
        <li><b>Examples:</b> each one in the menu comes with step-by-step notes.</li>
      </ul>
      ${C.bench('lab', 'Circuit Lab', 'Load a worked example from the Examples menu')}
      ${C.tryThis([
        'Build a GHZ state on 4 qubits: (|0000⟩ + |1111⟩)/√2.',
        'Make the Bell state (|01⟩ − |10⟩)/√2. Start from the Bell pair and add single-qubit gates.',
        'Load "Phase kickback" and delete the H on q1, so the target is |1⟩ instead of |−⟩. Does the control still flip?',
        'Load "Teleportation", step to the end and press "New outcomes" several times. Does q2 always match the ghost arrow?',
        'Load "Toffoli from CNOT + T", add X gates on q0 and q1 at the start, and check the output.'
      ])}`,
    init(root, ctx) {
      const body = C.body(root, 'lab');
      const lab = new G.CircuitLab.Lab(body, { mode: 'full' });
      if (C.pending.labCircuit) { lab.setCircuit(C.pending.labCircuit, C.pending.labCircuit.cols.length); C.pending.labCircuit = null; }
      ctx.onLeave(() => lab.stop());
    }
  });

  /* ------------------------------------------------------------------ 4.2 */
  C.add({
    id: 'interference', part: 4, num: '4.2', title: 'Interference',
    lede: 'Quantum algorithms arrange for the paths to wrong answers to cancel and the paths to right answers to add up. Here is the smallest example.',
    html: `
      <p>Flip a fair coin twice and it is still random. Apply H twice to ${K('0')} and you get ${K('0')} back with certainty, because H·H = I. Trace the paths to see why.</p>
      <p>The first H sends ${K('0')} to ${K('0')} and ${K('1')}, each with amplitude 1/√2. The second H sends each of those to both outputs. There are four paths, and each path's amplitude is the product of the amplitudes along it.
      The two paths into ${K('1')} carry +½ and −½ and cancel. The two paths into ${K('0')} carry +½ and +½ and add up to 1.</p>
      <p>Now put a phase gate P(φ) between the two H gates. Only the ${K('1')} branch picks up <span class="m">e<sup>iφ</sup></span>, and the outputs become</p>
      <div class="formula">|0⟩: ½(1 + e<sup>iφ</sup>) &nbsp;&nbsp;&nbsp; |1⟩: ½(1 − e<sup>iφ</sup>) &nbsp;&nbsp;&nbsp; P(0) = cos²(φ/2)</div>
      ${C.bench('i-paths', 'Every path, and how they add', 'Colour and arrow direction = phase of each path')}
      <p>This circuit is a Mach–Zehnder interferometer. The phase φ steers all the probability from one output to the other without anything being measured in between. Every quantum algorithm in Part V is a larger, cleverer version of this choreography.</p>
      ${C.keyIdea('Probabilities never cancel, but amplitudes can. Interference is the only way a quantum computer does better than guessing.')}
      ${C.tryThis(['Set φ = π. Which output is now certain?', 'Find the values of φ that give a 50/50 split.', 'Why does φ have no effect if you measure between the two H gates? (Hint: measurement picks one path.)'])}`,
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
    lede: 'Different circuits can do exactly the same thing. A handful of identities lets you read, simplify and compile circuits.',
    html: `
      <p>Two circuits are equivalent when their unitaries are equal up to a global phase. The checker builds both matrices and compares them entry by entry.</p>
      ${C.bench('ids', 'Identity checker', 'Colour = phase, opacity = magnitude')}
      <h2>Universality</h2>
      <p>A small, fixed set of gates can approximate any unitary as closely as you like.</p>
      <ul>
        <li>Any single-qubit gate is <span class="m">e<sup>iα</sup> Rz(β) Ry(γ) Rz(δ)</span>: three angles, like Euler angles for a rigid body.</li>
        <li>H and T together generate a dense set of single-qubit rotations. Add CNOT and you can approximate every multi-qubit unitary.</li>
        <li>The <b>Solovay–Kitaev theorem</b> says the approximation is efficient: reaching accuracy ε costs a number of gates that grows only polylogarithmically in 1/ε.</li>
      </ul>
      <p><b>Clifford circuits</b>, built only from H, S and CNOT, can be simulated efficiently on an ordinary computer (the <b>Gottesman–Knill theorem</b>), even when they create lots of entanglement.
      The T gate is what takes a circuit beyond that. On fault-tolerant hardware Clifford gates are cheap and T gates are expensive, so the <b>T count</b> is a standard cost measure.</p>
      ${C.keyIdea('Circuits are programs with many equivalent forms. Identities let you move between them; universality guarantees that H, T and CNOT are enough for everything.')}
      ${C.quizSection('Check yourself: Part IV')}`,
    quiz: [
      { q: 'The circuit ─H─S─ (H first) corresponds to which matrix?', options: ['H·S', 'S·H', 'H + S', 'It depends on the input'], answer: 1, why: 'Later gates multiply from the left, so the first gate sits on the right.' },
      { q: 'For H·P(φ)·H acting on |0⟩, what is P(0)?', options: ['cos²(φ/2)', 'sin²(φ/2)', 'Always 1/2', 'cos φ'], answer: 0, why: 'The amplitude of |0⟩ is (1 + e<sup>iφ</sup>)/2, whose squared magnitude is cos²(φ/2).' },
      { q: 'Which gate set is universal?', options: ['{H, S, CNOT}', '{H, T, CNOT}', '{X, Z}', '{CNOT}'], answer: 1, why: '{H, S, CNOT} generates only Clifford circuits, which are classically simulable. Adding T makes the set universal.' }
    ],
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
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });
})(window);

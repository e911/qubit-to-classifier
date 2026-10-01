/* Part VI — Noise and hardware */
(function (G) {
  'use strict';
  const { h, num, angle, pct, slider, seg, button, Theme, animate, reduceMotion } = G.U;
  const { BlochView, linePlot } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  const CH = {
    bit: { name: 'Bit flip', map: p => ({ A: [1, 1 - 2 * p, 1 - 2 * p], c: [0, 0, 0] }), text: 'X with probability p: y and z shrink by (1 − 2p); x is untouched.' },
    phase: { name: 'Phase flip', map: p => ({ A: [1 - 2 * p, 1 - 2 * p, 1], c: [0, 0, 0] }), text: 'Z with probability p: x and y shrink by (1 − 2p). Relative phase is lost; z survives.' },
    bitphase: { name: 'Bit-phase flip', map: p => ({ A: [1 - 2 * p, 1, 1 - 2 * p], c: [0, 0, 0] }), text: 'Y with probability p: x and z shrink by (1 − 2p).' },
    depol: { name: 'Depolarizing', map: p => ({ A: [1 - p, 1 - p, 1 - p], c: [0, 0, 0] }), text: 'With probability p the state is replaced by the random state I/2: the whole ball shrinks by (1 − p).' },
    amp: { name: 'Amplitude damping', map: g => ({ A: [Math.sqrt(1 - g), Math.sqrt(1 - g), 1 - g], c: [0, 0, g] }), text: 'Energy loss (T1): z → (1 − γ)z + γ, x and y shrink by √(1 − γ). Everything is pulled toward |0⟩.' },
    pdamp: { name: 'Phase damping', map: l => ({ A: [Math.sqrt(1 - l), Math.sqrt(1 - l), 1], c: [0, 0, 0] }), text: 'Pure dephasing (T2): x and y shrink by √(1 − λ), populations stay.' }
  };
  function compose(m, k) { // apply the diagonal affine map k times
    const A = [1, 1, 1], c = [0, 0, 0];
    for (let j = 0; j < k; j++) for (let i = 0; i < 3; i++) { c[i] = m.A[i] * c[i] + m.c[i]; A[i] *= m.A[i]; }
    return { A, c };
  }

  /* ------------------------------------------------------------------ 6.1 */
  C.add({
    id: 'noise', part: 6, num: '6.1', title: 'Noise and mixed states',
    lede: 'Real qubits leak information into their surroundings. Their states become mixtures, and the Bloch sphere of possible states shrinks and deforms into an ellipsoid.',
    html: `
      <p>A <b>mixed state</b> is a probabilistic mixture of pure states, for example "|0⟩ or |1⟩, 50/50". That is not the same as the superposition ${K('+')}: measure along X and ${K('+')} always gives +, while the mixture gives a coin flip.
      Mixed states are described by a <b>density matrix</b></p>
      <div class="formula">ρ = ½(I + xX + yY + zZ)</div>
      <p>Pure states have <span class="m">|r| = 1</span> and sit on the surface. Mixed states lie inside the ball, and the centre <span class="m">r = 0</span> is the maximally mixed state I/2, a perfectly random bit.
      The <b>purity</b> <span class="m">Tr(ρ²) = (1 + |r|²)/2</span> runs from ½ at the centre to 1 on the surface. You already met mixed states: a qubit that is entangled with another looks exactly like this.</p>
      <p>A <b>noise channel</b> maps the whole ball into itself. The standard single-qubit channels squeeze, shrink or shift it:</p>
      ${C.bench('nz', 'Noise channels on the Bloch ball', 'Orange wireframe = where every pure state ends up')}
      <p>Why this matters: interference needs well-defined relative phases, and dephasing destroys exactly those. A heavily dephased quantum computer is an expensive random-number generator. Noise also sets how deep a useful circuit can be, and for machine learning it flattens cost landscapes (chapter 7.7).</p>
      ${C.keyIdea('Noise turns pure states into mixtures: the arrow shrinks inside the ball. Each channel has its own shape — dephasing flattens the ball onto the z axis, energy loss drags it toward |0⟩.')}
      ${C.tryThis(['Pick "Phase flip" with p = 0.5. What is left of |+⟩?', 'Apply amplitude damping 20 times. Where does every state end up?', 'Which channel leaves |0⟩ untouched but damages |+⟩?'])}`,
    init(root) {
      const body = C.body(root, 'nz');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
      let ch = 'amp', p = 0.3, reps = 1, th = PI / 2, ph = PI / 2;
      const bv = new BlochView(left, { maxSize: 430, onDrag: v => { const a = Q.anglesOf(v); th = a.theta; ph = a.phi; sTh.set(th); sPh.set(ph); draw(); } });
      const cSeg = seg({ label: 'channel', value: ch, options: Object.entries(CH).map(([k, v]) => ({ value: k, label: v.name })), onchange: v => { ch = v; draw(); } });
      const sP = slider({ label: 'strength', min: 0, max: 1, step: 0.01, value: p, fmt: v => num(v, 2), oninput: v => { p = v; draw(); } });
      const sK = slider({ label: 'applied', min: 1, max: 20, step: 1, value: reps, fmt: v => v + '×', oninput: v => { reps = v; draw(); } });
      const sTh = slider({ label: 'state θ', min: 0, max: PI, step: 0.01, value: th, snapPi: true, fmt: angle, oninput: v => { th = v; draw(); } });
      const sPh = slider({ label: 'state φ', min: 0, max: 2 * PI, step: 0.01, value: ph, snapPi: true, fmt: angle, oninput: v => { ph = v; draw(); } });
      const text = h('p', { class: 'note' }), read = h('div', { class: 'readout' });
      right.append(cSeg.el, text, sP.el, sK.el, sTh.el, sPh.el, read);
      function draw() {
        const T = Theme.tokens(), m = compose(CH[ch].map(p), reps);
        const r0 = Q.blochOf(Q.stateFromBloch(th, ph)), r1 = r0.map((v, i) => m.A[i] * v + m.c[i]);
        bv.set({
          ellipsoid: { A: [[m.A[0], 0, 0], [0, m.A[1], 0], [0, 0, m.A[2]]], c: m.c },
          vectors: [{ v: r0, color: T.q, main: false, drag: true, alpha: 0.9 }, { v: r1, color: T.q2, main: true }]
        });
        text.textContent = CH[ch].text;
        const L0 = Math.hypot(...r0), L1 = Math.hypot(...r1);
        read.innerHTML = `before (blue): length ${num(L0, 3)}, purity ${num((1 + L0 * L0) / 2, 3)}<br>after (orange): length <b>${num(L1, 3)}</b>, purity <b>${num((1 + L1 * L1) / 2, 3)}</b><br>after: (x, y, z) = (${num(r1[0], 3)}, ${num(r1[1], 3)}, ${num(r1[2], 3)})`;
      }
      draw();
    }
  });

  /* ------------------------------------------------------------------ 6.2 */
  C.add({
    id: 'hardware', part: 6, num: '6.2', title: 'Decoherence and real hardware',
    lede: 'Two time constants, T1 and T2, put a clock on every computation. Native gates, limited connectivity and imperfect readout decide how circuits are compiled and why error mitigation and correction exist.',
    html: `
      <p><b>T1</b>, the relaxation time, is how long it takes an excited qubit to decay from ${K('1')} to ${K('0')}: amplitude damping in time. <b>T2</b>, the coherence time, is how long relative phase survives. Any energy loss also destroys phase, so always <span class="m">T2 ≤ 2·T1</span>.</p>
      <p>Leave a superposition idle and its arrow traces a spiral: the equatorial part shrinks on the T2 clock while the arrow relaxes toward ${K('0')} on the T1 clock. If the qubit's frequency is slightly off the reference (a detuning), the arrow also precesses. The resulting oscillation is the Ramsey experiment that labs use to measure coherence.</p>
      ${C.bench('t12', 'T1 and T2 decay', 'Press Play to let the qubit sit idle')}
      <h2>From circuit to chip</h2>
      <ul>
        <li><b>Native gates.</b> Each device implements a small set of operations directly, typically a few single-qubit rotations plus one entangling gate such as CZ. A compiler (the <b>transpiler</b>) rewrites your circuit into them, using identities like those in chapter 4.3.</li>
        <li><b>Connectivity.</b> Two-qubit gates usually work only between physically coupled qubits. A CNOT between distant qubits needs SWAPs, and every SWAP costs three CNOTs.</li>
        <li><b>Depth and error.</b> Two-qubit gates are usually the noisiest operation, so compilers minimise their count and the circuit's depth, which also keeps the run well inside T2.</li>
        <li><b>Readout error.</b> Measurements themselves sometimes report the wrong bit; calibrating a confusion matrix and inverting it corrects the statistics.</li>
      </ul>
      ${C.bench('route', 'Routing a CNOT on a line of qubits', 'Pick two qubits that are not neighbours')}
      <h2>Mitigation versus correction</h2>
      <p><b>Error mitigation</b> accepts noisy runs and post-processes the statistics, for example by running at several noise levels and extrapolating to zero noise. It needs no extra qubits, but the number of shots grows quickly with circuit size.
      <b>Error correction</b> encodes one logical qubit in many physical qubits (for example the surface code), detects errors with repeated measurements, and fixes them on the fly. Once physical error rates are below a threshold, adding qubits makes logical errors exponentially rarer. Fault-tolerant machines need this; today's devices mostly rely on mitigation, which is why near-term quantum machine learning uses shallow circuits.</p>
      ${C.keyIdea('Hardware turns the ideal circuit into a race against T1 and T2, fought with compilation (fewer, cheaper gates), mitigation (smarter statistics) and eventually correction (redundant encoding).')}
      ${C.quizSection('Check yourself: Part VI')}`,
    quiz: [
      { q: 'Where does the maximally mixed state sit?', options: ['North pole', 'At the centre of the ball', 'On the equator', 'South pole'], answer: 1, why: 'ρ = I/2 has Bloch vector r = 0: a random bit along every axis.' },
      { q: 'Which channel pulls every state toward |0⟩?', options: ['Bit flip', 'Phase flip', 'Depolarizing', 'Amplitude damping'], answer: 3, why: 'Amplitude damping models energy loss: |1⟩ decays to |0⟩, so z → (1 − γ)z + γ.' },
      { q: 'Dephasing (the T2 process) destroys…', options: ['the population of |1⟩', 'the relative phase: the x and y components', 'only the z component', 'nothing measurable'], answer: 1, why: 'Dephasing shrinks the equatorial components while leaving P(0) and P(1) alone.' }
    ],
    init(root, ctx) {
      /* T1/T2 */
      {
        const body = C.body(root, 't12');
        const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
        const left = h('div'), right = h('div', { class: 'stack' }); grid.append(left, right);
        let T1 = 100, T2 = 60, det = 0.03, t = 120, start = '+', playing = false;
        const bv = new BlochView(left, { maxSize: 400 });
        const s1 = slider({ label: 'T1 (μs)', min: 10, max: 200, step: 1, value: T1, fmt: v => String(v), oninput: v => { T1 = v; if (T2 > 2 * T1) { T2 = 2 * T1; s2.set(T2); } draw(); } });
        const s2 = slider({ label: 'T2 (μs)', min: 5, max: 400, step: 1, value: T2, fmt: v => String(v), oninput: v => { T2 = Math.min(v, 2 * T1); s2.set(T2); draw(); } });
        const sd = slider({ label: 'detuning (MHz)', min: 0, max: 0.1, step: 0.001, value: det, fmt: v => num(v, 3), oninput: v => { det = v; draw(); } });
        const st = slider({ label: 'time (μs)', min: 0, max: 300, step: 1, value: t, fmt: v => String(Math.round(v)), oninput: v => { t = v; draw(); } });
        const sSeg = seg({ label: 'start state', value: start, options: [{ value: '+', label: '|+⟩' }, { value: '1', label: '|1⟩' }, { value: 'mid', label: 'θ = π/3' }], onchange: v => { start = v; draw(); } });
        const play = button('Play', () => { playing = !playing; play.textContent = playing ? 'Pause' : 'Play'; if (playing) run(); }, 'btn primary');
        const plot = h('div'), read = h('div', { class: 'readout' });
        right.append(h('div', { class: 'row' }, sSeg.el, play), s1.el, s2.el, sd.el, st.el, read, plot);
        const r0 = () => start === '+' ? [1, 0, 0] : start === '1' ? [0, 0, -1] : [Math.sin(PI / 3), 0, Math.cos(PI / 3)];
        const at = tt => { const a = r0(), w = 2 * PI * det, e2 = Math.exp(-tt / T2), e1 = Math.exp(-tt / T1); return [e2 * (a[0] * Math.cos(w * tt) - a[1] * Math.sin(w * tt)), e2 * (a[0] * Math.sin(w * tt) + a[1] * Math.cos(w * tt)), 1 - (1 - a[2]) * e1]; };
        async function run() {
          if (t >= 299) t = 0;
          while (playing && body.isConnected && t < 300) {
            const from = t; await animate(reduceMotion() ? 0 : 120, k => { t = Math.min(300, from + 4 * k); st.set(t); draw(); }, { linear: true });
          }
          playing = false; play.textContent = 'Play';
        }
        function draw() {
          const T = Theme.tokens(), trail = []; for (let k = 0; k <= 200; k++) { const tt = t * k / 200; trail.push(at(tt)); }
          const r = at(t);
          bv.set({ vectors: [{ v: r, main: true }], trail });
          read.innerHTML = `⟨X⟩ = <b>${num(r[0], 3)}</b> · ⟨Y⟩ = <b>${num(r[1], 3)}</b> · ⟨Z⟩ = <b>${num(r[2], 3)}</b> · length ${num(Math.hypot(...r), 3)}`;
          const px = [], pz = []; for (let k = 0; k <= 300; k += 2) { const q = at(k); px.push([k, q[0]]); pz.push([k, q[2]]); }
          linePlot(plot, { height: 180, x: [0, 300], y: [-1, 1], yTicks: [-1, 0, 1], xTitle: 'time (μs)', xName: 't', series: [{ name: '⟨X⟩ (phase)', color: T.q, points: px }, { name: '⟨Z⟩ (population)', color: T.q2, points: pz }], vlines: [{ x: t, color: T.lineStrong }] });
        }
        draw();
        ctx.onLeave(() => { playing = false; });
      }
      /* routing */
      {
        const body = C.body(root, 'route');
        let topo = 'line', a = 0, b = 4;
        const N = 6;
        const tSeg = seg({ label: 'layout', value: topo, options: [{ value: 'line', label: 'Line' }, { value: 'ring', label: 'Ring' }], onchange: v => { topo = v; draw(); } });
        const aSeg = seg({ label: 'control', value: a, options: [...Array(N).keys()].map(i => ({ value: i, label: 'q' + i })), onchange: v => { a = v; draw(); } });
        const bSeg = seg({ label: 'target', value: b, options: [...Array(N).keys()].map(i => ({ value: i, label: 'q' + i })), onchange: v => { b = v; draw(); } });
        const pic = h('div', { style: { overflowX: 'auto' } }), read = h('div', { class: 'readout' });
        body.append(h('div', { class: 'row' }, tSeg.el), h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Control' }), aSeg.el), h('div', { class: 'row' }, h('span', { class: 'panel-label', style: { margin: 0 }, text: 'Target' }), bSeg.el), pic, read);
        function path() {
          if (topo === 'line') { const s = Math.sign(b - a) || 1, p = []; for (let i = a; i !== b + s; i += s) p.push(i); return p; }
          const fw = (b - a + N) % N, bw = (a - b + N) % N, p = [a]; let i = a;
          if (fw <= bw) while (i !== b) { i = (i + 1) % N; p.push(i); } else while (i !== b) { i = (i - 1 + N) % N; p.push(i); }
          return p;
        }
        function draw() {
          const T = Theme.tokens(), W = 520, H = topo === 'line' ? 110 : 220;
          const pos = i => topo === 'line' ? [50 + i * 84, 55] : [W / 2 + 85 * Math.cos(-PI / 2 + 2 * PI * i / N), H / 2 + 85 * Math.sin(-PI / 2 + 2 * PI * i / N)];
          const edges = []; for (let i = 0; i < N - 1; i++) edges.push([i, i + 1]); if (topo === 'ring') edges.push([N - 1, 0]);
          const pth = a === b ? [a] : path(), used = new Set(); for (let i = 0; i < pth.length - 1; i++) used.add(pth[i] + '-' + pth[i + 1]), used.add(pth[i + 1] + '-' + pth[i]);
          let s = `<svg class="plot" width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px;min-width:420px" role="img" aria-label="Coupling map with a routed CNOT">`;
          edges.forEach(([i, j]) => { const [x1, y1] = pos(i), [x2, y2] = pos(j), on = used.has(i + '-' + j); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${on ? T.accent : T.lineStrong}" stroke-width="${on ? 4 : 2}" stroke-linecap="round"/>`; });
          for (let i = 0; i < N; i++) {
            const [x, y] = pos(i), role = i === a ? 'c' : i === b ? 't' : pth.includes(i) ? 'p' : '';
            s += `<circle cx="${x}" cy="${y}" r="19" fill="${role === 'c' ? T.q : role === 't' ? T.q2 : T.surface}" stroke="${T.ink}" stroke-width="1.5"/>`;
            s += `<text x="${x}" y="${y + 4.5}" text-anchor="middle" style="fill:${role === 'c' || role === 't' ? '#fff' : T.ink};font-family:${T.fontMono};font-weight:600;font-size:12px">q${i}</text>`;
          }
          s += '</svg>';
          pic.innerHTML = s;
          if (a === b) { read.innerHTML = 'Pick two different qubits.'; return; }
          const d = pth.length - 1, swaps = Math.max(0, d - 1), steps = [];
          for (let i = 0; i < swaps; i++) steps.push(`SWAP(q${pth[i]}, q${pth[i + 1]})`);
          steps.push(`CNOT(q${pth[swaps]} → q${b})`);
          read.innerHTML = `Distance ${d}. ${swaps ? `Needs <b>${swaps} SWAP${swaps > 1 ? 's' : ''}</b> first = <b>${3 * swaps} extra CNOTs</b>, so ${3 * swaps + 1} CNOTs instead of 1.` : 'Neighbours: a single CNOT, no routing needed.'}<br>Routed sequence: ${steps.join(' → ')}` + (swaps ? '<br>(The control\'s state now lives on a different physical qubit; the compiler keeps track of the new layout.)' : '');
        }
        draw();
      }
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });
})(window);

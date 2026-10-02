/* Part I — One qubit */
(function (G) {
  'use strict';
  const { h, num, angle, pct, deg, slider, seg, button, animate, Theme, ketExpr, cx, phaseColor } = G.U;
  const { BlochView, bars, phasorSVG, phaseWheel, svg } = G.V;
  const Q = G.QSim, C = G.C, K = C.K, PI = Math.PI;

  /* ------------------------------------------------------------------ 1.1 */
  C.add({
    id: 'qubit', part: 1, num: '1.1', title: 'Bits and qubits',
    lede: 'A bit is 0 or 1. A qubit is described by two amplitudes, and measuring it gives 0 or 1 with odds set by those amplitudes.',
    html: `
      <p>A classical bit is always in one definite state: 0 or 1. A qubit's state is written
      <span class="m">|ψ⟩ = α|0⟩ + β|1⟩</span>. The numbers α and β are called <b>amplitudes</b>, and
      ${K('0')} and ${K('1')} (read "ket zero" and "ket one") are the two basis states, the qubit's version of 0 and 1.</p>
      <p>You never see the amplitudes directly. Measuring the qubit returns a single bit: 0 with probability
      <span class="m">|α|²</span> or 1 with probability <span class="m">|β|²</span>. This is the <b>Born rule</b>. Since one of the two outcomes must happen,
      <span class="m">|α|² + |β|² = 1</span>.</p>
      <p>Measuring also changes the qubit. After you read 0 the state <em>is</em> ${K('0')}, and measuring again gives 0 every time. This is called <b>collapse</b>.</p>
      <p>For now, let α and β be ordinary real numbers. The state is then an arrow of length 1, and each probability is the squared shadow of the arrow on one axis.</p>
      ${C.bench('q-real', 'A qubit with real amplitudes', 'Drag the slider or tap a preset')}
      ${C.keyIdea('Amplitudes set the probabilities, but one measurement returns one bit. To learn anything about the amplitudes you prepare and measure the same state many times.')}
      <p>A superposition is not "secretly 0 or 1 and we don't know which". The arrow at 45° and the arrow at 135° give identical measurement statistics here,
      yet they are different states. The difference shows up when amplitudes add and cancel, which is the subject of chapter 4.2.</p>
      ${C.tryThis([
        'Set the state so that P(1) = 25%. Which angle did you need?',
        'Run 100 shots five times in a row. How far does the estimate of P(1) wander? Now try 1,000 shots.',
        'Measure once, then press "Measure once" again several times. Why does the answer never change?',
        'Compare the presets (|0⟩ + |1⟩)/√2 and (|0⟩ − |1⟩)/√2. Can any experiment on this page tell them apart?'
      ])}`,
    init(root) {
      const body = C.body(root, 'q-real');
      const grid = h('div', { class: 'g-sphere' }); body.appendChild(grid);
      const left = h('div', { class: 'view' }), right = h('div', { class: 'stack' });
      grid.append(left, right);
      let t = PI / 4, collapsed = null, saved = null;
      const sl = slider({ label: 'Angle', min: 0, max: 2 * PI, step: 0.01, value: t, fmt: v => deg(v), oninput: v => { t = v; collapsed = null; draw(); } });
      const presets = h('div', { class: 'row tight' },
        ...[['|0⟩', 0], ['|1⟩', PI / 2], ['(|0⟩+|1⟩)/√2', PI / 4], ['(|0⟩−|1⟩)/√2', -PI / 4], ['P(1)=¼', PI / 6]].map(([l, v]) => button(l, () => { t = (v + 2 * PI) % (2 * PI); sl.set(t); collapsed = null; draw(); }, 'btn')));
      const readout = h('div', { class: 'readout' });
      const probHost = h('div');
      const measRow = h('div', { class: 'row' });
      const outcome = h('span', { class: 'pill' });
      const restore = button('Restore state', () => { if (saved !== null) { t = saved; sl.set(t); } collapsed = null; draw(); }, 'btn');
      const log = h('div', { class: 'readout', style: { wordBreak: 'break-all' } });
      const histHost = h('div');
      measRow.append(button('Measure once', () => measureOnce(), 'btn primary'), button('Run 100 shots', () => shots(100), 'btn'), button('Run 1,000 shots', () => shots(1000), 'btn'), outcome, restore);
      right.append(sl.el, presets, h('p', { class: 'panel-label', text: 'Measurement probabilities' }), probHost, readout, h('p', { class: 'panel-label', text: 'Measure' }), measRow, log, histHost);
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
    lede: 'Amplitudes are complex numbers. Their lengths set the probabilities; their angles, called phases, decide how they interfere.',
    html: `
      <p>In general α and β are complex numbers. Draw each one as an arrow in the complex plane: the arrow's length is the magnitude and its angle is the <b>phase</b>.
      A probability is the squared length, <span class="m">|α|²</span>, so the phase never affects the odds of reading 0 or 1.</p>
      <p>There are two kinds of phase, and only one of them is physical.</p>
      <ul>
        <li><b>Global phase.</b> Multiply the whole state by <span class="m">e<sup>iγ</sup></span> and both arrows turn together. No experiment can ever detect this, so
        ${K('ψ')} and <span class="m">e<sup>iγ</sup>|ψ⟩</span> are the same physical state.</li>
        <li><b>Relative phase.</b> The angle between the two arrows, <span class="m">φ = arg β − arg α</span>. This is real: it changes the outcome of measurements along other axes and it steers interference.</li>
      </ul>
      <p>Throughout the course, colour encodes phase using this wheel. Blue is a positive real amplitude, amber a negative one. Wherever colour carries phase, a needle or an arrow carries it too.</p>
      <div class="formula" data-wheel></div>
      ${C.bench('q-phase', 'Two amplitudes as arrows', 'Rotate both together, or only β')}
      ${C.keyIdea('Only the relative phase is physical. It is invisible to a plain 0/1 measurement, but it shows up as soon as you measure along another axis or let amplitudes interfere.')}
      <p>So a qubit has exactly two numbers that matter: how the probability splits between ${K('0')} and ${K('1')}, and the relative phase. Two angles describe a point on a sphere, which is where the next chapter goes.</p>
      ${C.tryThis([
        'Press "Turn both by 45°" a few times. Does anything in the right-hand panel change?',
        'Set the split to 90° and turn β by 180° in total. You have made |−⟩ from |+⟩: P(0) stayed at 50%, but P(+) went from 100% to 0%.',
        'Find a state with P(0) = 50% and P(+) = 50%. Where is it on the sphere?'
      ])}`,
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
    lede: 'Drop the global phase and every qubit state becomes a point on a sphere. It is the most useful picture in quantum computing.',
    html: `
      <div class="formula">|ψ⟩ = cos(<i>θ</i>/2)|0⟩ + e<sup><i>iφ</i></sup> sin(<i>θ</i>/2)|1⟩</div>
      <p><i>θ</i> runs from 0 to π and measures how far the arrow tips down from the north pole. <i>φ</i> runs around the equator and is the relative phase from the last chapter.</p>
      <ul>
        <li>North pole: ${K('0')}. South pole: ${K('1')}.</li>
        <li>The equator holds the equal superpositions: ${K('+')} = (|0⟩ + |1⟩)/√2 on +x, ${K('−')} on −x, ${K('+i')} = (|0⟩ + i|1⟩)/√2 on +y and ${K('−i')} on −y.</li>
      </ul>
      <p><b>Why θ/2?</b> Opposite points on the sphere are orthogonal states, the pairs a measurement can tell apart perfectly. ${K('0')} and ${K('1')} are at right angles as vectors, but 180° apart on the sphere.</p>
      <p><b>The coordinates are measurable averages.</b> The height of the arrow is <span class="m">z = ⟨Z⟩ = P(0) − P(1)</span>, so <span class="m">P(0) = (1 + z)/2</span>. The other two coordinates are <span class="m">x = ⟨X⟩</span> and <span class="m">y = ⟨Y⟩</span>, the averages you would get measuring along those axes.</p>
      ${C.bench('q-bloch', 'Explore the sphere', 'Drag the arrow tip to move the state · drag elsewhere to turn the view · double-click to reset')}
      ${C.keyIdea('A pure qubit state is a point on the sphere. Latitude sets the odds of 0 versus 1; longitude is the relative phase.')}
      <p>Everything a single qubit can do has a picture here. Gates rotate the sphere (Part II), measurement projects the arrow onto an axis, and noise shrinks it inside the ball (Part VI).</p>
      ${C.tryThis([
        'Drag the arrow anywhere on the equator. What is P(0) there?',
        'Find a state with P(0) = 85%, ⟨X⟩ = 0 and ⟨Y⟩ > 0.',
        'Move the arrow to |−i⟩ and read the amplitudes. Which one carries the phase?'
      ])}
      ${C.quizSection('Check yourself: Part I')}`,
    quiz: [
      { q: 'A qubit is in the state (√3/2)|0⟩ + (1/2)|1⟩. What is the probability of measuring 1?', options: ['1/2', '1/4', '√3/2', '3/4'], answer: 1, why: 'P(1) = |β|² = (1/2)² = 1/4.' },
      { q: 'Which change to a state can no measurement ever detect?', options: ['Changing the relative phase', 'Multiplying the whole state by e<sup>iγ</sup>', 'Moving from |+⟩ to |−⟩', 'Changing θ on the Bloch sphere'], answer: 1, why: 'A global phase multiplies every amplitude by the same unit complex number; all probabilities for every measurement stay the same.' },
      { q: 'Where on the Bloch sphere is |−i⟩ = (|0⟩ − i|1⟩)/√2?', options: ['North pole', 'South pole', 'On the equator, along −y', 'On the equator, along −x'], answer: 2, why: 'Equal magnitudes put it on the equator, and the relative phase −π/2 (i.e. 3π/2) points along −y.' }
    ],
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
      C.quiz(root.querySelector('[data-quiz]'), this.quiz);
    }
  });
})(window);

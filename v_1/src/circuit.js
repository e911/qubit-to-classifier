/* ==========================================================================
   Circuit rendering + the Circuit Lab (composer, step-through, displays).
   ========================================================================== */
(function (root) {
  'use strict';
  const Q = root.QSim, { h, $, clamp, Theme, num, angle, Tip, bits, ket, pct, ketExpr, animate, reduceMotion, slider, seg, button, select, codeBlock, esc } = root.U;
  const { svg, BlochView, CircleGrid, bars, matrixHeat, unitaryHTML } = root.V;
  const PI = Math.PI;

  const INFO = {
    H: 'Hadamard. Sends |0⟩ to |+⟩ and |1⟩ to |−⟩: a half-turn about the axis halfway between x and z.',
    X: 'Pauli-X, the quantum NOT. Swaps |0⟩ and |1⟩: a half-turn about x.',
    Y: 'Pauli-Y. A half-turn about y: |0⟩ → i|1⟩, |1⟩ → −i|0⟩.',
    Z: 'Pauli-Z, the phase flip. |1⟩ → −|1⟩: a half-turn about z. With a control it is drawn as a second dot (CZ).',
    S: 'S = √Z. Quarter-turn about z: |1⟩ → i|1⟩.',
    SDG: 'S† undoes S: |1⟩ → −i|1⟩.',
    T: 'T = √S. Eighth-turn about z: |1⟩ → e<sup>iπ/4</sup>|1⟩. The "magic" gate that makes Clifford circuits universal.',
    TDG: 'T† undoes T.',
    SX: '√X. Two in a row make X. A native gate on many superconducting devices.',
    SXDG: '√X† undoes √X.',
    RX: 'Rotate the Bloch vector by θ about x.',
    RY: 'Rotate the Bloch vector by θ about y. Keeps amplitudes real.',
    RZ: 'Rotate the Bloch vector by θ about z. Changes only the relative phase.',
    P: 'Phase gate P(λ): |1⟩ → e<sup>iλ</sup>|1⟩. Same rotation as Rz(λ), different global phase, which matters once it is controlled.',
    U: 'The general single-qubit gate U(θ, φ, λ) = e<sup>i(φ+λ)/2</sup> Rz(φ)·Ry(θ)·Rz(λ).',
    CTRL: 'Control ●. Every other gate in this column acts only on the part of the state where this qubit is |1⟩.',
    ACTRL: 'Anti-control ○. Every other gate in this column acts only where this qubit is |0⟩.',
    SWAP: 'SWAP ×. Two × marks in one column exchange those two qubits.',
    M: 'Measure in the Z basis. The qubit collapses to |0⟩ or |1⟩ with the Born-rule probabilities; the outcome is shown on the gate. Press "New outcomes" to re-run the randomness.'
  };
  const LABEL = { H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S', SDG: 'S†', T: 'T', TDG: 'T†', SX: '√X', SXDG: '√X†', RX: 'Rx', RY: 'Ry', RZ: 'Rz', P: 'P', U: 'U', M: 'M' };
  const DEFAULT_P = { RX: PI / 2, RY: PI / 2, RZ: PI / 2, P: PI / 2, U: [PI / 2, 0, PI] };
  const cell = (g, p) => p === undefined ? { g } : { g, p: Array.isArray(p) ? p.slice() : p };
  const clone = c => ({ n: c.n, cols: c.cols.map(col => col.map(x => x ? cell(x.g, x.p) : null)) });

  /* =====================================================================
     SVG circuit view
     ===================================================================== */
  class CircuitView {
    constructor(host, o = {}) {
      this.o = Object.assign({ editable: false, extraCols: 2, minCols: 1 }, o);
      this.G = { padL: 58, colW: 52, gap: 50, padT: 26, padR: 18 };
      this.circ = { n: 1, cols: [] }; this.p = 0; this.sel = null; this.cursor = { q: 0, c: 0 }; this.hover = null; this.outcomes = [];
      this.scroll = h('div', { class: 'circuit-scroll' }); host.appendChild(this.scroll);
      this.svg = svg('svg', { class: 'circuit-svg', tabindex: this.o.static ? null : 0, role: this.o.static ? 'img' : 'group', 'aria-label': this.o.static ? (this.o.label || 'Circuit diagram') : this.o.editable ? 'Circuit editor. Arrow keys move the cursor, Enter places the selected palette gate or selects a gate, Delete removes it.' : 'Circuit diagram. Click a column to step to it.' });
      this.scroll.appendChild(this.svg);
      this._bind();
      Theme.onChange(() => this.render(), this.svg);
    }
    set(circ, p) { this.circ = circ; if (p !== undefined) this.p = p; this.render(); }
    get nCols() { return Math.max(this.o.minCols, this.circ.cols.length + (this.o.editable ? this.o.extraCols : 0)); }
    xOf(c) { return this.G.padL + this.G.colW * (c + 0.5); }
    yOf(q) { return this.G.padT + this.G.gap * (q + 0.5); }
    cellAt(clientX, clientY, allowOutside = false) {
      const r = this.svg.getBoundingClientRect();
      const x = clientX - r.left, y = clientY - r.top;
      if (!allowOutside && (x < 0 || y < 0 || x > r.width || y > r.height)) return null;
      const c = Math.floor((x - this.G.padL) / this.G.colW), q = Math.floor((y - this.G.padT) / this.G.gap);
      if (q < 0 || q >= this.circ.n || c < 0 || c >= this.nCols) return null;
      return { q, c };
    }
    render() {
      const T = Theme.tokens(), G = this.G, n = this.circ.n, C = this.nCols;
      const W = G.padL + G.colW * C + G.padR, H = G.padT + G.gap * n + 8;
      const s = this.svg; s.innerHTML = '';
      s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const cols = this.circ.cols, p = this.p;
      const cur = Math.abs(p - Math.round(p)) < 1e-9 ? Math.round(p) - 1 : Math.floor(p);
      // current column band
      if (cur >= 0 && cur < cols.length && this.o.showPlayhead !== false) svg('rect', { x: this.xOf(cur) - G.colW / 2 + 2, y: 4, width: G.colW - 4, height: H - 8, rx: 8, class: 'colband' }, s);
      // column numbers
      if (this.o.colNums !== false) for (let c = 0; c < C; c++) {
        const t = svg('text', { x: this.xOf(c), y: 14, class: 'colnum' }, s); t.textContent = c < cols.length ? String(c + 1) : '';
      }
      // wires + labels
      for (let q = 0; q < n; q++) {
        const y = this.yOf(q);
        svg('line', { x1: G.padL - 6, x2: W - 8, y1: y, y2: y, class: 'wire' }, s);
        const t1 = svg('text', { x: 6, y: y + 4, class: 'qlabel' }, s); t1.textContent = 'q' + q;
        const t2 = svg('text', { x: 28, y: y + 4.5, class: 'qlabel', style: `font-family:${T.fontMath};font-size:14px` }, s); t2.textContent = (this.o.inputs && this.o.inputs[q]) || '|0⟩';
      }
      // hover / cursor
      if (this.o.editable && this.hover) svg('rect', { x: this.xOf(this.hover.c) - 22, y: this.yOf(this.hover.q) - 22, width: 44, height: 44, rx: 8, class: 'cell-hover' }, s);
      if (this.o.editable && this._focused) svg('rect', { x: this.xOf(this.cursor.c) - 23, y: this.yOf(this.cursor.q) - 23, width: 46, height: 46, rx: 8, class: 'cursor' }, s);
      // gates
      cols.forEach((col, c) => {
        const gcol = svg('g', { class: (this.o.showPlayhead !== false && c > cur) ? 'future' : '' }, s);
        const info = Q.columnInfo(col), x = this.xOf(c);
        const involved = [...info.controls.map(k => k.q), ...info.gates.map(k => k.q), ...(info.controls.length || info.swaps.length === 2 ? info.swaps : [])];
        if (involved.length >= 2 && (info.controls.length || info.swaps.length === 2)) {
          const ys = involved.map(q => this.yOf(q));
          svg('line', { x1: x, x2: x, y1: Math.min(...ys), y2: Math.max(...ys), class: 'vline' }, gcol);
        }
        const isSel = q => this.sel && this.sel.c === c && this.sel.q === q;
        for (const k of info.controls) {
          const g = svg('g', { class: isSel(k.q) ? 'sel' : '' }, gcol);
          svg('circle', { cx: x, cy: this.yOf(k.q), r: 5.5, class: k.v ? 'dot' : 'odot' }, g);
        }
        for (const gt of info.gates) {
          const g = svg('g', { class: isSel(gt.q) ? 'sel' : '' }, gcol), y = this.yOf(gt.q);
          if (info.controls.length && gt.g === 'X') {
            svg('circle', { cx: x, cy: y, r: 13, class: 'target' }, g);
            svg('line', { x1: x - 13, x2: x + 13, y1: y, y2: y, class: 'vline' }, g);
            svg('line', { x1: x, x2: x, y1: y - 13, y2: y + 13, class: 'vline' }, g);
          } else if (info.controls.length && gt.g === 'Z') {
            svg('circle', { cx: x, cy: y, r: 5.5, class: 'dot' }, g);
          } else {
            svg('rect', { x: x - 19, y: y - 19, width: 38, height: 38, rx: 6, class: 'gbox' }, g);
            const hasP = Q.GATES[gt.g] && Q.GATES[gt.g].params;
            const t = svg('text', { x, y: hasP ? y - 6 : y, class: 'gtext', style: hasP ? 'font-size:12.5px' : '' }, g); t.textContent = LABEL[gt.g] || gt.g;
            if (hasP) {
              const pt = svg('text', { x, y: y + 9, class: 'gparam' }, g);
              pt.textContent = gt.t || (gt.g === 'U' ? 'θφλ' : angle(Array.isArray(gt.p) ? gt.p[0] : gt.p, 1));
            }
          }
        }
        for (const q of info.swaps) {
          const g = svg('g', { class: (isSel(q) ? 'sel ' : '') + (info.swaps.length !== 2 ? 'warn' : '') }, gcol), y = this.yOf(q);
          svg('line', { x1: x - 7, y1: y - 7, x2: x + 7, y2: y + 7, class: 'swapx' }, g);
          svg('line', { x1: x - 7, y1: y + 7, x2: x + 7, y2: y - 7, class: 'swapx' }, g);
          if (info.swaps.length !== 2) svg('rect', { x: x - 12, y: y - 12, width: 24, height: 24, fill: 'transparent', stroke: T.bad, 'stroke-width': 1, rx: 4 }, g);
        }
        for (const q of info.meas) {
          const g = svg('g', { class: isSel(q) ? 'sel' : '' }, gcol), y = this.yOf(q);
          svg('rect', { x: x - 19, y: y - 19, width: 38, height: 38, rx: 6, class: 'gbox' }, g);
          svg('path', { d: `M${x - 11},${y + 6} A12,12 0 0 1 ${x + 11},${y + 6}`, fill: 'none', stroke: T.ink, 'stroke-width': 1.5 }, g);
          svg('line', { x1: x, y1: y + 7, x2: x + 8, y2: y - 8, stroke: T.ink, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
          const oc = (this.outcomes[c] || []).find(o => o.q === q);
          if (oc && c <= cur) {
            svg('circle', { cx: x + 19, cy: y - 19, r: 8, fill: T.accent }, g);
            const t = svg('text', { x: x + 19, y: y - 19, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: `fill:${T.accentInk || T.surface};font-size:10px;font-weight:700` }, g); t.textContent = oc.o;
          }
        }
      });
      // playhead
      if (this.o.showPlayhead !== false) {
        const px = G.padL + G.colW * clamp(p, 0, cols.length);
        svg('line', { x1: px, x2: px, y1: 20, y2: H - 4, class: 'playhead' }, s);
        svg('path', { d: `M${px - 6},18 L${px + 6},18 L${px},26 Z`, class: 'playhead-handle' }, s);
      }
    }
    _bind() {
      const s = this.svg; let down = null;
      s.addEventListener('pointerdown', e => {
        const r = s.getBoundingClientRect(), y = e.clientY - r.top;
        const hit = this.cellAt(e.clientX, e.clientY);
        if (y < this.G.padT - 2 || !this.o.editable) {
          // scrub / step to column
          down = { scrub: true };
          this._scrubTo(e);
          try { s.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
          return;
        }
        down = { x: e.clientX, y: e.clientY, hit, dragging: false, id: e.pointerId };
      });
      s.addEventListener('pointermove', e => {
        if (down && down.scrub) { this._scrubTo(e); return; }
        if (this.o.editable) {
          const hit = this.cellAt(e.clientX, e.clientY);
          const same = (a, b) => (!a && !b) || (a && b && a.q === b.q && a.c === b.c);
          if (!same(hit, this.hover)) { this.hover = hit; this.render(); }
        }
        if (!down || !this.o.editable) return;
        if (!down.dragging && down.hit && this.circ.cols[down.hit.c] && this.circ.cols[down.hit.c][down.hit.q] && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
          down.dragging = true;
          const cl = this.circ.cols[down.hit.c][down.hit.q];
          this.o.onDragStart && this.o.onDragStart(cl, e);
          try { s.setPointerCapture(down.id); } catch (err) { /* noop */ }
        }
        if (down.dragging) this.o.onDragMove && this.o.onDragMove(e);
      });
      s.addEventListener('pointerup', e => {
        if (!down) return;
        const d = down; down = null;
        if (d.scrub) return;
        if (d.dragging) { this.o.onMove && this.o.onMove(d.hit, this.cellAt(e.clientX, e.clientY), e); return; }
        if (d.hit) this.o.onTap && this.o.onTap(d.hit);
      });
      s.addEventListener('pointercancel', () => { down = null; });
      s.addEventListener('pointerleave', () => { if (this.hover) { this.hover = null; this.render(); } });
      s.addEventListener('focus', () => { this._focused = true; this.render(); });
      s.addEventListener('blur', () => { this._focused = false; this.render(); });
      s.addEventListener('keydown', e => {
        if (!this.o.editable) {
          if (e.key === 'ArrowRight') { this.o.onScrub && this.o.onScrub(Math.min(this.circ.cols.length, Math.round(this.p) + 1)); e.preventDefault(); }
          if (e.key === 'ArrowLeft') { this.o.onScrub && this.o.onScrub(Math.max(0, Math.round(this.p) - 1)); e.preventDefault(); }
          return;
        }
        const c = this.cursor; let handled = true;
        if (e.key === 'ArrowRight') c.c = Math.min(this.nCols - 1, c.c + 1);
        else if (e.key === 'ArrowLeft') c.c = Math.max(0, c.c - 1);
        else if (e.key === 'ArrowDown') c.q = Math.min(this.circ.n - 1, c.q + 1);
        else if (e.key === 'ArrowUp') c.q = Math.max(0, c.q - 1);
        else if (e.key === 'Enter' || e.key === ' ') this.o.onTap && this.o.onTap({ q: c.q, c: c.c });
        else if (e.key === 'Delete' || e.key === 'Backspace') this.o.onDelete && this.o.onDelete({ q: c.q, c: c.c });
        else if (e.key === 'Escape') this.o.onEscape && this.o.onEscape();
        else handled = false;
        if (handled) { e.preventDefault(); this.render(); }
      });
    }
    _scrubTo(e) {
      const r = this.svg.getBoundingClientRect();
      const p = clamp(Math.round((e.clientX - r.left - this.G.padL) / this.G.colW), 0, this.circ.cols.length);
      this.o.onScrub && this.o.onScrub(p);
    }
  }

  /* =====================================================================
     Presets
     ===================================================================== */
  function B(n) { return Q.builder(n); }
  const PRESETS = [
    {
      id: 'bell', name: 'Bell pair', n: 2, build: () => B(2).g('H', 0).cx(0, 1),
      notes: [
        'Both qubits start in |0⟩, so the state is |00⟩: one full circle.',
        '<b>H on q0</b> gives (|00⟩ + |10⟩)/√2. Two half-full circles. This is still a product state: q0 sits on the equator, q1 at the north pole.',
        '<b>CNOT</b> flips q1 only in the branch where q0 is 1, giving (|00⟩ + |11⟩)/√2. Both Bloch arrows have shrunk to zero: each qubit alone is a fair coin, yet the two always agree. That is entanglement.'
      ]
    },
    {
      id: 'ghz', name: 'GHZ state (3 qubits)', n: 3, build: () => B(3).g('H', 0).cx(0, 1).cx(1, 2),
      notes: ['Start: |000⟩.', 'H on q0: (|000⟩ + |100⟩)/√2.', 'CNOT q0→q1: (|000⟩ + |110⟩)/√2. q0 and q1 are entangled; q2 is untouched.', 'CNOT q1→q2: (|000⟩ + |111⟩)/√2. All three qubits agree, and every single-qubit arrow has length 0.']
    },
    {
      id: 'uniform', name: 'Uniform superposition', n: 3, build: () => B(3).layer('H', [0, 1, 2]),
      notes: ['Start: |000⟩.', 'H on every qubit: all 8 basis states with amplitude 1/(2√2), probability 1/8 each. Most algorithms begin here. It is still a product state: every arrow points along +x.']
    },
    {
      id: 'kickback', name: 'Phase kickback', n: 2, build: () => B(2).col([[0, { g: 'H' }], [1, { g: 'X' }]]).g('H', 1).cx(0, 1),
      notes: ['Start: |00⟩.', 'H on q0 makes |+⟩; X on q1 makes |1⟩.', 'H on q1 turns it into |−⟩. The state is |+⟩|−⟩: four circles, two of them with a minus sign (amber).', '<b>CNOT q0→q1.</b> The target q1 is unchanged (|−⟩ is an eigenstate of X with eigenvalue −1), but the control q0 flipped from |+⟩ to |−⟩. The −1 was "kicked back" onto the control. Deutsch–Jozsa, Bernstein–Vazirani and phase estimation all run on this trick.']
    },
    {
      id: 'interf', name: 'Interference: H then H', n: 1, build: () => B(1).g('H', 0).g('H', 0),
      notes: ['Start: |0⟩.', 'H: (|0⟩ + |1⟩)/√2. A measurement now would be a coin flip.', 'H again: back to |0⟩ with certainty. The two paths into |1⟩ carried +1/2 and −1/2 and cancelled; the two paths into |0⟩ added. Insert a Z between the two H gates to make the |0⟩ paths cancel instead.']
    },
    {
      id: 'teleport', name: 'Teleportation', n: 3,
      build: () => B(3).g('RY', 0, 1.2).g('RZ', 0, 0.8).g('H', 1).cx(1, 2).cx(0, 1).g('H', 0).col([[0, { g: 'M' }], [1, { g: 'M' }]]).cx(1, 2).cz(0, 2),
      ghost: { q: 2, v: Q.blochOf(Q.stateFromBloch(1.2, 0.8)) },
      notes: [
        'q0 will carry the message. q1 (Alice) and q2 (Bob) will share an entangled pair.',
        'Ry(1.2) starts preparing an arbitrary message state on q0.',
        'Rz(0.8) finishes it. Note where q0\'s arrow points: that is the state to teleport (shown as a grey ghost arrow on q2).',
        'H on q1 …',
        '… and CNOT q1→q2: Alice and Bob now share the Bell pair (|00⟩ + |11⟩)/√2 on q1, q2.',
        'Alice entangles the message with her half: CNOT q0→q1.',
        'H on q0. In every one of the four branches, Bob\'s qubit already holds the message up to an X and/or a Z.',
        'Alice <b>measures</b> q0 and q1 (outcomes on the gates) and sends Bob those two classical bits. Bob\'s q2 is now XᵐZᵐ|ψ⟩ for her outcomes.',
        'Bob applies X if q1 read 1 (a CNOT from the collapsed q1 does exactly that).',
        'Bob applies Z if q0 read 1. q2 now matches the ghost arrow for every outcome: press "New outcomes" to check. q0 no longer holds the message, so nothing was copied.'
      ]
    },
    {
      id: 'dense', name: 'Superdense coding (sends 11)', n: 2, build: () => B(2).g('H', 0).cx(0, 1).g('X', 0).g('Z', 0).cx(0, 1).g('H', 0),
      notes: ['Start: |00⟩.', 'H on q0 …', '… CNOT: Alice holds q0, Bob holds q1 of a Bell pair.', 'To send the second bit = 1, Alice applies X to her qubit only: (|01⟩ + |10⟩)/√2.', 'To send the first bit = 1, she applies Z: (|01⟩ − |10⟩)/√2. She now mails her one qubit to Bob.', 'Bob decodes with CNOT q0→q1 …', '… and H on q0. He reads |11⟩ with certainty: two classical bits from one transmitted qubit.']
    },
    {
      id: 'dj', name: 'Deutsch–Jozsa (balanced f)', n: 4,
      build: () => B(4).g('X', 3).layer('H', [0, 1, 2, 3]).ccx(0, 1, 3).cx(2, 3).layer('H', [0, 1, 2]),
      notes: ['Inputs q0–q2, ancilla q3.', 'X on the ancilla: |0001⟩.', 'H on all four: every input at once, ancilla in |−⟩.', 'Oracle, part 1 (Toffoli): computes x0·x1 into the ancilla. Because the ancilla is |−⟩, this only flips signs of inputs where x0·x1 = 1.', 'Oracle, part 2 (CNOT from q2): adds x2. Now each input |x⟩ carries (−1)^f(x) with f(x) = x0·x1 ⊕ x2, which is balanced.', 'H on the inputs. The amplitude of |000⟩ is the average of (−1)^f(x): zero for a balanced f. One oracle call told us "balanced" with certainty.']
    },
    {
      id: 'bv', name: 'Bernstein–Vazirani (s = 101)', n: 4,
      build: () => B(4).g('X', 3).layer('H', [0, 1, 2, 3]).cx(0, 3).cx(2, 3).layer('H', [0, 1, 2, 3]),
      notes: ['Inputs q0–q2, ancilla q3. The oracle computes f(x) = s·x mod 2 for a hidden s.', 'X on the ancilla.', 'H on all: uniform superposition, ancilla in |−⟩.', 'Oracle CNOT from q0 (s0 = 1).', 'Oracle CNOT from q2 (s2 = 1). Phase kickback leaves (−1)^(s·x) on every input.', 'H on all four. The inputs read exactly s = 101 (and the ancilla returns to |1⟩). Classically this needs 3 queries; here one.']
    },
    {
      id: 'grover2', name: 'Grover search, 2 qubits', n: 2,
      build: () => B(2).layer('H', [0, 1]).cz(0, 1).layer('H', [0, 1]).layer('X', [0, 1]).cz(0, 1).layer('X', [0, 1]).layer('H', [0, 1]),
      notes: ['Start: |00⟩. We search for the marked item |11⟩ among 4.', 'H on both: all four items with amplitude 1/2.', 'Oracle (CZ): flips the sign of the marked item |11⟩ only.', 'Diffusion begins: H on both …', '… X on both …', '… CZ (reflects about |11⟩ in this basis) …', '… X on both …', '… H on both. The marked item |11⟩ now has probability 1. For N = 4, a single Grover iteration is exact.']
    },
    {
      id: 'qft', name: 'QFT of |101⟩ (x = 5)', n: 3,
      build: () => B(3).col([[0, { g: 'X' }], [2, { g: 'X' }]]).g('H', 0).cg('P', [1], 0, PI / 2).cg('P', [2], 0, PI / 4).g('H', 1).cg('P', [2], 1, PI / 2).g('H', 2).swap(0, 2),
      notes: ['Start: |000⟩.', 'X on q0 and q2 prepares |101⟩, the number 5.', 'H on q0.', 'Controlled phase π/2 from q1 (does nothing here: q1 is 0).', 'Controlled phase π/4 from q2 adds a phase on q0\'s |1⟩ branch.', 'H on q1.', 'Controlled phase π/2 from q2 onto q1.', 'H on q2.', 'SWAP q0 ↔ q2 puts the bits in standard order. Every qubit is on the equator: q0 at phase 2π·5/2 ≡ π, q1 at 2π·5/4 ≡ π/2, q2 at 2π·5/8 = 5π/4. All 8 amplitudes have size 1/(2√2), with phases 2π·5k/8.']
    },
    {
      id: 'toffoli', name: 'Toffoli from CNOT + T', n: 3,
      build: () => B(3).g('H', 2).cx(1, 2).g('TDG', 2).cx(0, 2).g('T', 2).cx(1, 2).g('TDG', 2).cx(0, 2).col([[1, { g: 'T' }], [2, { g: 'T' }]]).g('H', 2).cx(0, 1).col([[0, { g: 'T' }], [1, { g: 'TDG' }]]).cx(0, 1),
      notes: ['The standard decomposition of the Toffoli (CCX) gate into 6 CNOTs, 7 T/T† and 2 H. Open the Unitary tab: it is exactly the CCX matrix. Add X gates at the start to test the truth table.']
    },
    {
      id: 'swap3', name: 'SWAP from 3 CNOTs', n: 2, build: () => B(2).g('X', 0).cx(0, 1).cx(1, 0).cx(0, 1),
      notes: ['Start: |00⟩.', 'X on q0: |10⟩.', 'CNOT q0→q1: |11⟩.', 'CNOT q1→q0: |01⟩.', 'CNOT q0→q1: |01⟩. The 1 moved from q0 to q1. Three CNOTs make a SWAP, which is how a compiler moves qubits around on hardware with limited connectivity.']
    }
  ];
  function presetCirc(p) { const b = p.build(); return { n: p.n, cols: b.cols }; }

  /* =====================================================================
     Qiskit export
     ===================================================================== */
  function toQiskit(circ) {
    const L = ['from math import pi', 'from qiskit import QuantumCircuit'];
    const imports = new Set(), body = [];
    const hasM = Q.hasMeasurement(circ);
    const fmtA = v => { const s = angle(v, 4); return s.replace('−', '-').replace(/(\d)π/, '$1*pi').replace('π', 'pi'); };
    const P1 = { RX: 'rx', RY: 'ry', RZ: 'rz', P: 'p' }, F1 = { H: 'h', X: 'x', Y: 'y', Z: 'z', S: 's', SDG: 'sdg', T: 't', TDG: 'tdg', SX: 'sx', SXDG: 'sxdg' };
    const CLS = { H: 'HGate', X: 'XGate', Y: 'YGate', Z: 'ZGate', S: 'SGate', SDG: 'SdgGate', T: 'TGate', TDG: 'TdgGate', SX: 'SXGate', SXDG: 'SXdgGate', RX: 'RXGate', RY: 'RYGate', RZ: 'RZGate', P: 'PhaseGate', U: 'UGate' };
    const PHASE = { Z: 'pi', S: 'pi/2', SDG: '-pi/2', T: 'pi/4', TDG: '-pi/4' };
    for (const col of circ.cols) {
      const info = Q.columnInfo(col);
      const anti = info.controls.filter(c => !c.v).map(c => c.q);
      anti.forEach(q => body.push(`qc.x(${q})  # anti-control`));
      const cs = info.controls.map(c => c.q), k = cs.length;
      for (const gt of info.gates) {
        const p = gt.p, t = gt.q;
        if (k === 0) {
          if (F1[gt.g]) body.push(`qc.${F1[gt.g]}(${t})`);
          else if (P1[gt.g]) body.push(`qc.${P1[gt.g]}(${fmtA(p)}, ${t})`);
          else if (gt.g === 'U') body.push(`qc.u(${p.map(fmtA).join(', ')}, ${t})`);
        } else if (gt.g === 'X') body.push(k === 1 ? `qc.cx(${cs[0]}, ${t})` : k === 2 ? `qc.ccx(${cs[0]}, ${cs[1]}, ${t})` : `qc.mcx([${cs.join(', ')}], ${t})`);
        else if (gt.g === 'Z' && k === 1) body.push(`qc.cz(${cs[0]}, ${t})`);
        else if (PHASE[gt.g] || gt.g === 'P') {
          const lam = gt.g === 'P' ? fmtA(p) : PHASE[gt.g];
          body.push(k === 1 ? `qc.cp(${lam}, ${cs[0]}, ${t})` : `qc.mcp(${lam}, [${cs.join(', ')}], ${t})`);
        } else if (k === 1 && ['H', 'Y'].includes(gt.g)) body.push(`qc.c${gt.g.toLowerCase()}(${cs[0]}, ${t})`);
        else if (k === 1 && P1[gt.g] && gt.g !== 'P') body.push(`qc.c${P1[gt.g]}(${fmtA(p)}, ${cs[0]}, ${t})`);
        else {
          imports.add(CLS[gt.g]);
          const args = gt.g === 'U' ? p.map(fmtA).join(', ') : (Q.GATES[gt.g].params ? fmtA(p) : '');
          body.push(`qc.append(${CLS[gt.g]}(${args}).control(${k}), [${[...cs, t].join(', ')}])`);
        }
      }
      if (info.swaps.length === 2) {
        const [a, b] = info.swaps;
        if (k === 0) body.push(`qc.swap(${a}, ${b})`);
        else if (k === 1) body.push(`qc.cswap(${cs[0]}, ${a}, ${b})`);
        else { imports.add('SwapGate'); body.push(`qc.append(SwapGate().control(${k}), [${[...cs, a, b].join(', ')}])`); }
      }
      anti.forEach(q => body.push(`qc.x(${q})`));
      info.meas.forEach(q => body.push(`qc.measure(${q}, ${q})`));
    }
    if (imports.size) L.push(`from qiskit.circuit.library import ${[...imports].sort().join(', ')}`);
    L.push('', `qc = QuantumCircuit(${circ.n}${hasM ? ', ' + circ.n : ''})`, ...body);
    L.push('', '# Final state (Qiskit writes qubit 0 as the RIGHTMOST bit,', '# so the label |q0 q1 ...> used in this course appears reversed):');
    if (hasM) L.push('# mid-circuit measurements: run on a simulator, e.g.', '# from qiskit_aer import AerSimulator; AerSimulator().run(qc, shots=1000).result().get_counts()');
    else L.push('from qiskit.quantum_info import Statevector', 'print(Statevector(qc).probabilities_dict())');
    return L.join('\n');
  }

  /* =====================================================================
     The Lab controller
     ===================================================================== */
  const PALETTE = [
    { title: 'Common', items: [['H'], ['X'], ['Y'], ['Z'], ['S'], ['SDG'], ['T'], ['TDG'], ['SX']] },
    { title: 'Rotations', items: [['RX'], ['RY'], ['RZ'], ['P'], ['U']] },
    { title: 'Multi-qubit', items: [['CTRL', '●'], ['ACTRL', '○'], ['CNOT', 'CNOT'], ['CZ', 'CZ'], ['SWAP2', 'SWAP'], ['CCX', 'CCX']] },
    { title: 'Measure', items: [['M', 'M']] }
  ];
  const MACROS = {
    CNOT: [{ g: 'CTRL' }, { g: 'X' }], CZ: [{ g: 'CTRL' }, { g: 'Z' }], SWAP2: [{ g: 'SWAP' }, { g: 'SWAP' }], CCX: [{ g: 'CTRL' }, { g: 'CTRL' }, { g: 'X' }]
  };
  const itemLabel = id => ({ CTRL: '●', ACTRL: '○', CNOT: 'CNOT', CZ: 'CZ', SWAP2: 'SWAP', CCX: 'CCX', M: 'M' }[id] || LABEL[id] || id);

  class Lab {
    /* o: {mode:'full'|'guided', preset, circ, displays:['state','spheres','probs','shots','unitary','code'], showNotes, compactSpheres} */
    constructor(host, o = {}) {
      this.o = Object.assign({ mode: 'full', displays: ['state', 'spheres', 'tabs'] }, o);
      this.host = host; this.editable = this.o.mode === 'full';
      this.seed = 1; this.p = 0; this.playing = false; this.armed = null; this.history = []; this.future = [];
      this.preset = null; this.circ = { n: 2, cols: [] };
      this._build();
      if (this.o.preset) this.loadPreset(this.o.preset, false);
      else if (this.o.circ) this.setCircuit(this.o.circ, this.o.circ.cols.length);
      else this.loadPreset('bell', false);
    }
    _build() {
      const host = this.host; host.innerHTML = '';
      const wrap = h('div', { class: 'lab-layout' }); host.appendChild(wrap);
      if (this.editable) {
        const pal = h('div', { class: 'palette', role: 'toolbar', 'aria-label': 'Gate palette' });
        for (const grp of PALETTE) {
          const items = h('div', { class: 'pal-items' });
          for (const [id, lab] of grp.items) {
            const b = h('button', { type: 'button', class: 'pal-item', 'aria-pressed': 'false', title: (INFO[id] || { CNOT: 'Control on this wire, X (⊕) on the wire below.', CZ: 'Control + Z on the wire below.', SWAP2: 'SWAP this wire with the one below.', CCX: 'Toffoli: two controls and a target on the next wires.' }[id] || '').replace(/<[^>]+>/g, ''), 'data-id': id, html: lab || LABEL[id] });
            this._bindPaletteItem(b, id);
            items.appendChild(b);
          }
          pal.appendChild(h('div', { class: 'pal-group' }, h('p', { class: 'panel-label', text: grp.title }), items));
        }
        wrap.appendChild(pal);
        this.palEl = pal;
      }
      const cwrap = h('div'); wrap.appendChild(cwrap);
      this.view = new CircuitView(cwrap, {
        editable: this.editable, minCols: this.editable ? 6 : 1,
        onScrub: p => { this.stop(); this.setP(p); },
        onTap: hit => this._tap(hit),
        onDelete: hit => { this._edit(c => { if (c.cols[hit.c]) c.cols[hit.c][hit.q] = null; }); this.sel = null; },
        onEscape: () => { this.arm(null); this.select(null); },
        onDragStart: (cl, e) => this._ghost(itemLabel(cl.g === 'X' ? 'X' : cl.g), e),
        onDragMove: e => this._moveGhost(e),
        onMove: (from, to) => { this._killGhost(); this._moveCell(from, to); }
      });
      // transport row
      const tr = h('div', { class: 'transport' });
      const icon = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
      this.btnStart = button(icon('M3 2h2v12H3zM13 2v12L6 8z'), () => { this.stop(); this.setP(0); }, 'btn', { 'aria-label': 'Go to start', title: 'Start' });
      this.btnBack = button(icon('M11 2v12L4 8zM3 2h1v12H3z'), () => { this.stop(); this.setP(Math.max(0, Math.ceil(this.p - 1e-9) - 1)); }, 'btn', { 'aria-label': 'Step back', title: 'Step back' });
      this.btnPlay = button(icon('M4 2l10 6-10 6z') + ' Play', () => this.togglePlay(), 'btn primary', { 'aria-label': 'Play' });
      this.btnFwd = button(icon('M5 2v12l7-6zM12 2h1v12h-1z'), () => this.stepForward(), 'btn', { 'aria-label': 'Step forward', title: 'Step forward' });
      this.btnEnd = button(icon('M3 2v12l7-6zM11 2h2v12h-2z'), () => { this.stop(); this.setP(this.circ.cols.length); }, 'btn', { 'aria-label': 'Go to end', title: 'End' });
      this.stepInfo = h('span', { class: 'stepinfo', 'aria-live': 'polite' });
      tr.append(this.btnStart, this.btnBack, this.btnPlay, this.btnFwd, this.btnEnd, this.stepInfo, h('span', { class: 'spacer' }));
      this.btnReroll = button('New outcomes', () => { this.seed++; this.recompute(); this.render(); }, 'btn', { title: 'Re-run the random measurement outcomes' });
      this.btnReroll.hidden = true;
      tr.appendChild(this.btnReroll);
      if (this.editable) {
        this.presetSel = select({ label: 'Load an example circuit', options: [{ value: '', label: 'Examples…' }, ...PRESETS.map(p => ({ value: p.id, label: p.name }))], value: '', onchange: v => { if (v) this.loadPreset(v); } });
        this.btnMinus = button('− qubit', () => this.setQubits(this.circ.n - 1), 'btn', { title: 'Remove the bottom qubit' });
        this.btnPlus = button('+ qubit', () => this.setQubits(this.circ.n + 1), 'btn', { title: 'Add a qubit (max 5)' });
        this.btnUndo = button('Undo', () => this.undo(), 'btn');
        this.btnClear = button('Clear', () => { this._edit(c => { c.cols = []; }); this.setP(0); }, 'btn');
        tr.append(this.presetSel, this.btnMinus, this.btnPlus, this.btnUndo, this.btnClear);
      }
      wrap.appendChild(tr);
      this.inspector = h('div', { class: 'inspector', hidden: true }); if (this.editable) wrap.appendChild(this.inspector);
      this.noteEl = h('div', { class: 'stepnote', 'aria-live': 'polite', hidden: true }); wrap.appendChild(this.noteEl);
      // displays
      const views = h('div', { class: 'lab-views' }); wrap.appendChild(views);
      const left = h('div', { class: 'stack' }), right = h('div', { class: 'stack' });
      views.append(left, right);
      left.appendChild(h('p', { class: 'panel-label', text: 'State vector' }));
      this.ketEl = h('div', { class: 'ket-line', 'aria-live': 'polite' }); left.appendChild(this.ketEl);
      const cg = h('div'); left.appendChild(cg);
      this.circles = new CircleGrid(cg, { maxCols: 8 });
      left.appendChild(h('div', { class: 'caption', html: 'Circle area = probability. Fill colour and needle = phase ' + root.V.phaseSwatch() + ' (blue 0, amber π). Hover a circle for exact values.' }));
      right.appendChild(h('p', { class: 'panel-label', text: 'Each qubit on its own' }));
      this.sphWrap = h('div', { class: 'spheres' }); right.appendChild(this.sphWrap);
      right.appendChild(h('div', { class: 'caption', text: 'Reduced Bloch vectors. A shorter arrow means the qubit is entangled with the others (or measured into a mixture).' }));
      this.spheres = [];
      // tabs
      const tabs = h('div', { class: 'tabs', role: 'tablist' }), panes = h('div');
      const tabDefs = [['probs', 'Probabilities'], ['shots', 'Run shots'], ['unitary', 'Unitary'], ['code', 'Qiskit code']];
      this.tab = 'probs'; this.tabBtns = {};
      for (const [id, lab] of tabDefs) {
        const b = h('button', { role: 'tab', type: 'button', 'aria-selected': String(id === this.tab), text: lab });
        b.addEventListener('click', () => { this.tab = id; Object.entries(this.tabBtns).forEach(([k, bb]) => bb.setAttribute('aria-selected', String(k === id))); this.renderTab(); });
        this.tabBtns[id] = b; tabs.appendChild(b);
      }
      this.pane = h('div', { class: 'stack' }); panes.appendChild(this.pane);
      const tabWrap = h('div', {}, tabs, panes); wrap.appendChild(tabWrap);
      if (!this.o.displays.includes('tabs')) tabWrap.hidden = true;
      this.shots = null;
      if (typeof ResizeObserver !== 'undefined') { let lw = 0; new ResizeObserver(() => { const w = this.pane.clientWidth; if (Math.abs(w - lw) > 4) { lw = w; this.renderTab(); } }).observe(this.pane); }
    }
    /* ---------- palette interactions ---------- */
    _bindPaletteItem(b, id) {
      let down = null;
      b.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, drag: false, id: e.pointerId }; try { b.setPointerCapture(e.pointerId); } catch (err) { /* noop */ } });
      b.addEventListener('pointermove', e => {
        if (!down) return;
        if (!down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down.drag = true; this._ghost(itemLabel(id), e); }
        if (down.drag) { this._moveGhost(e); const hit = this.view.cellAt(e.clientX, e.clientY); this.view.hover = hit; this.view.render(); }
      });
      b.addEventListener('pointerup', e => {
        if (!down) return; const d = down; down = null;
        if (d.drag) {
          this._killGhost(); const hit = this.view.cellAt(e.clientX, e.clientY);
          this.view.hover = null;
          if (hit) this.place(id, hit.q, hit.c); else this.view.render();
        } else this.arm(this.armed === id ? null : id);
      });
      b.addEventListener('pointercancel', () => { if (down && down.drag) this._killGhost(); down = null; });
      b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.arm(this.armed === id ? null : id); this.view.svg.focus(); } });
    }
    arm(id) {
      this.armed = id;
      if (this.palEl) this.palEl.querySelectorAll('.pal-item').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    }
    _ghost(label, e) { this._killGhost(); this.ghost = h('div', { class: 'drag-ghost', html: label }); document.body.appendChild(this.ghost); this._moveGhost(e); }
    _moveGhost(e) { if (this.ghost) { this.ghost.style.left = e.clientX + 'px'; this.ghost.style.top = e.clientY + 'px'; } }
    _killGhost() { if (this.ghost) { this.ghost.remove(); this.ghost = null; } }
    _tap(hit) {
      const cl = this.circ.cols[hit.c] && this.circ.cols[hit.c][hit.q];
      if (this.armed) { this.place(this.armed, hit.q, hit.c); return; }
      this.select(cl ? hit : null);
    }
    /* ---------- editing ---------- */
    _edit(fn, keepPreset = false) {
      this.history.push(JSON.stringify(this.circ)); if (this.history.length > 60) this.history.shift();
      const c = clone(this.circ); fn(c);
      c.cols = c.cols.filter(col => col.some(x => x));
      if (!keepPreset) this.preset = null;
      this.circ = c; this.recompute();
      this.p = Math.min(this.p, this.circ.cols.length);
      if (!keepPreset && this.editable) this.p = this.circ.cols.length;
      this.render();
    }
    undo() { const s = this.history.pop(); if (!s) return; this.circ = JSON.parse(s); this.preset = null; this.sel = null; this.recompute(); this.p = this.circ.cols.length; this.render(); }
    place(id, q, c) {
      const n = this.circ.n;
      this._edit(C => {
        while (C.cols.length <= c) C.cols.push(new Array(n).fill(null));
        if (MACROS[id]) {
          const m = MACROS[id]; if (m.length > n) return;
          const q0 = Math.min(q, n - m.length);
          const free = m.every((_, k) => !C.cols[c][q0 + k]);
          if (!free) C.cols.splice(c, 0, new Array(n).fill(null));
          m.forEach((x, k) => { C.cols[c][q0 + k] = cell(x.g); });
          C.cols[c][q0 + m.length - 1]._mv = true;
        } else {
          C.cols[c][q] = cell(id, DEFAULT_P[id]);
          C.cols[c][q]._mv = true;
        }
      });
      this.sel = this._takeMarked();
      this.p = this.circ.cols.length; this.render();
    }
    _takeMarked() {
      let f = null;
      this.circ.cols.forEach((col, c) => col.forEach((x, q) => { if (x && x._mv) { delete x._mv; f = { q, c }; } }));
      return f;
    }
    _moveCell(from, to) {
      const cl = this.circ.cols[from.c] && this.circ.cols[from.c][from.q];
      if (!cl) return;
      if (to && to.c === from.c && to.q === from.q) { this.select(from); return; }
      let target = null;
      this._edit(C => {
        const moving = C.cols[from.c][from.q]; C.cols[from.c][from.q] = null;
        if (to) {
          while (C.cols.length <= to.c) C.cols.push(new Array(C.n).fill(null));
          C.cols[to.c][to.q] = moving; target = to;
          // mark the moved cell so we can find it after empty columns are removed
          moving._mv = true;
        }
      });
      this.sel = target ? this._takeMarked() : null;
      this.render();
    }
    setQubits(n) {
      n = clamp(n, 1, 5); if (n === this.circ.n) return;
      this._edit(C => { C.cols = C.cols.map(col => { const r = col.slice(0, n); while (r.length < n) r.push(null); return r; }); C.n = n; });
      this.sel = null; this.buildSpheres(); this.render();
    }
    select(hit) { this.sel = hit; this.renderInspector(); this.view.sel = hit; this.view.render(); }
    renderInspector() {
      const ins = this.inspector; if (!this.editable) return;
      const hit = this.sel, cl = hit && this.circ.cols[hit.c] && this.circ.cols[hit.c][hit.q];
      if (!cl) { ins.hidden = true; return; }
      ins.hidden = false; ins.innerHTML = '';
      const name = { CTRL: 'Control', ACTRL: 'Anti-control', SWAP: 'SWAP', M: 'Measurement' }[cl.g] || (Q.GATES[cl.g] ? Q.GATES[cl.g].name : cl.g);
      ins.appendChild(h('div', { class: 'row' }, h('b', { text: `${name} on q${hit.q}, column ${hit.c + 1}` }), h('span', { class: 'spacer' }),
        cl.g === 'CTRL' || cl.g === 'ACTRL' ? button(cl.g === 'CTRL' ? 'Make ○' : 'Make ●', () => { this._edit(C => { C.cols[hit.c][hit.q].g = cl.g === 'CTRL' ? 'ACTRL' : 'CTRL'; }); this.renderInspector(); }, 'btn') : null,
        button('Delete', () => { this._edit(C => { C.cols[hit.c][hit.q] = null; }); this.sel = null; this.renderInspector(); }, 'btn')));
      ins.appendChild(h('div', { class: 'note', html: INFO[cl.g] || '' }));
      const setParam = (k, v) => {
        const col = this.circ.cols[hit.c], x = col[hit.q];
        if (Array.isArray(x.p)) x.p[k] = v; else x.p = v;
        this.preset = null; this.recompute(); this.render(false);
      };
      if (cl.g === 'U') {
        ['θ', 'φ', 'λ'].forEach((nm, k) => ins.appendChild(slider({ label: nm, min: -2 * PI, max: 2 * PI, step: 0.01, value: cl.p[k], snapPi: true, fmt: angle, oninput: v => setParam(k, v) }).el));
      } else if (Q.GATES[cl.g] && Q.GATES[cl.g].params) {
        ins.appendChild(slider({ label: cl.g === 'P' ? 'λ' : 'θ', min: -2 * PI, max: 2 * PI, step: 0.01, value: cl.p, snapPi: true, fmt: angle, oninput: v => setParam(0, v) }).el);
      }
    }
    /* ---------- simulation ---------- */
    loadPreset(id, animateIn = true) {
      const p = PRESETS.find(x => x.id === id); if (!p) return;
      if (this.editable && this.circ.cols.length) { this.history.push(JSON.stringify(this.circ)); }
      this.preset = p; this.circ = presetCirc(p); this.sel = null; this.arm(null);
      this.recompute(); this.buildSpheres();
      this.p = 0; this.render();
      if (this.presetSel) this.presetSel.value = '';
      if (animateIn && !reduceMotion()) this.play();
      else if (!animateIn && this.o.startAtEnd) this.setP(this.circ.cols.length);
    }
    setCircuit(circ, p = 0, notes = null) {
      this.circ = clone(circ); this.preset = notes ? { notes, ghost: this.o.ghost || null } : null;
      this.recompute(); this.buildSpheres(); this.p = p; this.render();
    }
    recompute() {
      const rng = Q.mulberry32(this.seed * 7919 + 13);
      const tr = Q.trace(this.circ, rng);
      this.states = tr.states; this.outcomes = tr.outcomes;
      this.hasM = Q.hasMeasurement(this.circ);
      this.shots = null;
    }
    stateAt(p) {
      const C = this.circ.cols.length; p = clamp(p, 0, C);
      const k = Math.floor(p + 1e-9), t = p - k;
      if (t < 1e-6 || k >= C) return this.states[Math.min(k, C)];
      const col = this.circ.cols[k];
      if (col.some(x => x && x.g === 'M')) return t < 0.5 ? this.states[k] : this.states[k + 1];
      return Q.applyColumn(this.states[k].clone(), col, t);
    }
    setP(p) { this.p = p; this.render(false); }
    stepForward() { this.stop(); const C = this.circ.cols.length; const target = Math.min(C, Math.floor(this.p + 1e-9) + 1); this._animateTo(target); }
    async _animateTo(target) {
      const from = this.p, token = (this._tok = (this._tok || 0) + 1);
      await animate(Math.abs(target - from) * 520, t => { if (this._tok === token) this.setP(from + (target - from) * t); }, { cancelled: () => this._tok !== token });
    }
    togglePlay() { if (this.playing) this.stop(); else this.play(); }
    async play() {
      const C = this.circ.cols.length; if (!C) return;
      if (this.p >= C - 1e-9) this.p = 0;
      this.playing = true; this._updatePlayBtn();
      const token = (this._tok = (this._tok || 0) + 1);
      while (this.playing && this._tok === token && this.p < C - 1e-9) {
        const from = Math.floor(this.p + 1e-9), to = from + 1;
        const start = this.p;
        await animate((to - start) * 650, t => { if (this._tok === token) this.setP(start + (to - start) * t); }, { cancelled: () => this._tok !== token, linear: false });
        if (this._tok !== token) break;
        await new Promise(r => setTimeout(r, reduceMotion() ? 0 : 260));
      }
      if (this._tok === token) { this.playing = false; this._updatePlayBtn(); }
    }
    stop() { this.playing = false; this._tok = (this._tok || 0) + 1; this._updatePlayBtn(); }
    _updatePlayBtn() {
      const icon = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
      this.btnPlay.innerHTML = this.playing ? icon('M4 2h3v12H4zM9 2h3v12H9z') + ' Pause' : icon('M4 2l10 6-10 6z') + ' Play';
      this.btnPlay.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
    }
    buildSpheres() {
      const n = this.circ.n;
      if (this.spheres.length === n) return;
      this.sphWrap.innerHTML = ''; this.spheres = [];
      for (let q = 0; q < n; q++) {
        const box = h('div', { class: 'view' });
        const capt = h('div', { class: 'caption' });
        this.sphWrap.appendChild(h('div', { class: 'sphere-cell' }, box, capt));
        const bv = new BlochView(box, { compact: true, maxSize: n <= 2 ? 190 : 150, shadow: false });
        this.spheres.push({ bv, capt });
      }
    }
    /* ---------- rendering ---------- */
    render(full = true) {
      const C = this.circ.cols.length, s = this.stateAt(this.p);
      this.view.circ = this.circ; this.view.p = this.p; this.view.sel = this.sel; this.view.outcomes = this.outcomes;
      this.view.render();
      const k = Math.round(this.p);
      this.stepInfo.textContent = `Step ${Math.min(C, Math.max(0, Math.round(this.p * 10) / 10)).toString().replace(/\.0$/, '')} / ${C}`;
      this.btnReroll.hidden = !this.hasM;
      // state
      this.ketEl.innerHTML = '|ψ⟩ = ' + ketExpr(s.re, s.im, s.n, { maxTerms: 8 });
      this.circles.update(s.re, s.im, s.n);
      if (this.spheres.length !== s.n) this.buildSpheres();
      this.spheres.forEach(({ bv, capt }, q) => {
        const b = s.bloch(q), len = Math.hypot(...b);
        const vecs = [{ v: b, main: true }];
        if (this.preset && this.preset.ghost && this.preset.ghost.q === q) vecs.unshift({ v: this.preset.ghost.v, color: Theme.tokens().muted, alpha: 0.8, dot: false, width: 2 });
        bv.set({ vectors: vecs });
        capt.innerHTML = `q${q} · P(1) = ${num(s.prob1(q), 2)} · length ${num(len, 2)}`;
      });
      // notes
      const notes = this.preset && this.preset.notes;
      if (notes && notes.length) {
        this.noteEl.hidden = false;
        const idx = notes.length === 1 ? 0 : Math.min(notes.length - 1, Math.max(0, Math.round(this.p)));
        this.noteEl.innerHTML = `<span class="note">${notes.length > 1 ? 'Step ' + idx + ' · ' : ''}</span>` + notes[idx];
      } else this.noteEl.hidden = true;
      if (this.editable) {
        this.btnMinus.disabled = this.circ.n <= 1; this.btnPlus.disabled = this.circ.n >= 5; this.btnUndo.disabled = !this.history.length;
        if (full) this.renderInspector();
      }
      if (full || this.tab === 'probs') this.renderTab(s);
      void k;
    }
    renderTab(s) {
      s = s || this.stateAt(this.p);
      const pane = this.pane, n = s.n, N = 1 << n, labels = Array.from({ length: N }, (_, i) => ket(bits(i, n)));
      if (this.tab === 'probs') {
        pane.innerHTML = '';
        const host = h('div'); pane.appendChild(host);
        pane.appendChild(h('div', { class: 'caption', text: 'Probability of each outcome if you measured every qubit at this step.' }));
        bars(host, { labels, values: Array.from(s.probs()), max: 1, fmt: v => pct(v), valueName: 'probability', height: 170 });
      } else if (this.tab === 'shots') {
        pane.innerHTML = '';
        const row = h('div', { class: 'row' });
        const run = shots => {
          const rng = Q.mulberry32((Date.now() % 1e9) | 0), counts = new Array(N).fill(0);
          const final = this.states[this.circ.cols.length];
          if (!this.hasM) { const c = Q.sampleCounts(final.probs(), shots, rng); c.forEach((v, i) => counts[i] = v); }
          else for (let k = 0; k < shots; k++) { const st = Q.runCircuit(this.circ, rng); const c = Q.sampleCounts(st.probs(), 1, rng); counts[c.indexOf(1)]++; }
          this.shots = { counts, shots }; this.renderTab();
        };
        row.append(button('Run 100 shots', () => run(100), 'btn'), button('Run 1,000 shots', () => run(1000), 'btn primary'), button('Run 10,000', () => run(10000), 'btn'));
        pane.appendChild(row);
        const host = h('div'); pane.appendChild(host);
        if (this.shots) {
          const final = this.states[this.circ.cols.length];
          bars(host, { labels, values: this.shots.counts.map(v => v / this.shots.shots), marks: this.hasM ? null : Array.from(final.probs()), max: 1, fmt: v => pct(v), valueName: 'measured', markName: 'exact', height: 170 });
          pane.appendChild(h('div', { class: 'caption', html: `${this.shots.shots.toLocaleString()} runs of the whole circuit, measuring every qubit at the end. ` + (this.hasM ? 'Each run re-rolls the mid-circuit measurements.' : 'Bars are observed frequencies; the dark ticks are the exact probabilities. The gap shrinks like 1/√shots.') }));
        } else pane.appendChild(h('div', { class: 'caption', text: 'A real quantum computer only gives you samples. Run the circuit many times to estimate the probabilities.' }));
      } else if (this.tab === 'unitary') {
        pane.innerHTML = '';
        if (this.hasM) { pane.appendChild(h('p', { class: 'note', text: 'This circuit contains a measurement, which is not unitary, so it has no single matrix.' })); return; }
        if (n > 4) { pane.appendChild(h('p', { class: 'note', text: 'The unitary view is limited to 4 qubits (a 16 × 16 matrix).' })); return; }
        const U = Q.unitary(this.circ);
        const size = Math.min(340, Math.max(160, pane.clientWidth - 10));
        const cv = h('canvas', { role: 'img', 'aria-label': 'unitary matrix heatmap' });
        pane.appendChild(h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '18px' } }, cv, n <= 2 ? h('div', { class: 'eqn', html: 'U = ' + unitaryHTML(U, n === 2 ? 'small' : '') }) : null));
        matrixHeat(cv, U, size);
        pane.appendChild(h('div', { class: 'caption', text: `The whole circuit as one ${U.N}×${U.N} matrix. Column j is where the input |j⟩ goes. Colour = phase, opacity = magnitude. Circuits read left to right, but the matrices multiply right to left.` }));
      } else if (this.tab === 'code') {
        pane.innerHTML = '';
        pane.appendChild(codeBlock(toQiskit(this.circ)));
        pane.appendChild(h('div', { class: 'caption', text: 'Paste into Python with Qiskit installed (pip install qiskit). Useful for checking your intuition against a real toolkit.' }));
      }
    }
  }

  root.CircuitLab = { CircuitView, Lab, PRESETS, presetCirc, toQiskit, INFO, LABEL };
})(window);

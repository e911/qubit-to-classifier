/* ==========================================================================
   Visual instruments: Bloch sphere, circle notation, bar charts, line plots,
   fields/heatmaps, matrices, phasors, phase wheel.
   ========================================================================== */
(function (root) {
  'use strict';
  const { h, clamp, Theme, rgba, phaseColor, phaseRGB, num, angle, Tip, bits, ket, cx, pct, parseColor } = root.U;
  const PI = Math.PI;
  const dprOf = () => Math.min(window.devicePixelRatio || 1, 2.5);

  /* =====================================================================
     Bloch sphere
     ===================================================================== */
  class BlochView {
    constructor(host, o = {}) {
      this.o = Object.assign({ labels: true, compact: false, az: -0.62, el: 0.36, interactive: true, maxSize: 440, angles: false, shadow: true, axisLetters: true }, o);
      this.host = host; host.classList.add('view');
      this.canvas = h('canvas', { role: 'img', 'aria-label': o.ariaLabel || 'Bloch sphere' });
      this.canvas.style.margin = '0 auto';
      this.canvas.style.touchAction = o.onDrag ? 'none' : 'pan-y';
      host.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.az = this.o.az; this.el = this.o.el;
      this.vectors = []; this.trail = []; this.points = []; this.axis = null; this.ellipsoid = null; this.plane = null; this.arcs = null;
      this._raf = 0; this.W = 0;
      this.resize();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(host);
      this._unsub = Theme.onChange(() => this.draw(), this.canvas);
      if (this.o.interactive) this._bind();
    }
    resize() {
      const avail = this.host.clientWidth;
      if (!avail) return;
      const w = Math.min(avail, this.o.maxSize);
      if (w === this.W) return;
      const dpr = dprOf();
      this.W = w; this.H = w;
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(w * dpr);
      this.canvas.style.width = w + 'px'; this.canvas.style.height = w + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.R = w * (this.o.compact ? 0.38 : 0.34); this.cx = w / 2; this.cy = w / 2 + (this.o.compact ? 0 : 2);
      this.draw();
    }
    set(p) { Object.assign(this, p); this.request(); return this; }
    request() { if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this.draw(); }); }
    proj(p) {
      const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
      const x1 = p[0] * ca - p[1] * sa, y1 = p[0] * sa + p[1] * ca, z1 = p[2];
      return [this.cx + this.R * y1, this.cy - this.R * (z1 * ce - x1 * se), x1 * ce + z1 * se];
    }
    unproj(px, py) {
      const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
      let sx = (px - this.cx) / this.R, sy = (this.cy - py) / this.R, r2 = sx * sx + sy * sy;
      if (r2 > 1) { const r = Math.sqrt(r2); sx /= r; sy /= r; r2 = 1; }
      const d = Math.sqrt(Math.max(0, 1 - r2));
      const z1 = ce * sy + se * d, x1 = -se * sy + ce * d, y1 = sx;
      return [ca * x1 + sa * y1, -sa * x1 + ca * y1, z1];
    }
    _bind() {
      const c = this.canvas; let mode = null, sx = 0, sy = 0, az0 = 0, el0 = 0;
      const local = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const nearTip = (x, y) => {
        const v = this.vectors.find(v => v.drag);
        if (!v) return false;
        const p = this.proj(v.v); return Math.hypot(p[0] - x, p[1] - y) < 22;
      };
      c.addEventListener('pointerdown', e => {
        const [x, y] = local(e);
        mode = (this.o.onDrag && (nearTip(x, y) || this.o.dragAnywhere)) ? 'state' : 'view';
        sx = e.clientX; sy = e.clientY; az0 = this.az; el0 = this.el;
        try { c.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        if (mode === 'state') { this.o.onDrag(this.unproj(x, y)); e.preventDefault(); }
        c.style.cursor = 'grabbing';
      });
      c.addEventListener('pointermove', e => {
        const [x, y] = local(e);
        if (!mode) { c.style.cursor = (this.o.onDrag && nearTip(x, y)) ? 'move' : 'grab'; return; }
        if (mode === 'view') {
          this.az = az0 + (e.clientX - sx) * 0.011;
          this.el = clamp(el0 + (e.clientY - sy) * 0.011, -1.25, 1.25);
          this.request();
          if (this.o.onView) this.o.onView(this.az, this.el);
        } else this.o.onDrag(this.unproj(x, y));
      });
      const end = () => { mode = null; c.style.cursor = 'grab'; };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
      c.addEventListener('dblclick', () => { this.az = this.o.az; this.el = this.o.el; this.request(); if (this.o.onView) this.o.onView(this.az, this.el); });
    }
    _circle(u, w, n = 120) { const pts = []; for (let i = 0; i <= n; i++) { const t = 2 * PI * i / n; pts.push([u[0] * Math.cos(t) + w[0] * Math.sin(t), u[1] * Math.cos(t) + w[1] * Math.sin(t), u[2] * Math.cos(t) + w[2] * Math.sin(t)]); } return pts; }
    _strokePoly(pts, pass, color, width, alphaBack = 0.28, map = null) {
      const ctx = this.ctx; ctx.beginPath();
      let prev = null, drawing = false;
      for (const p0 of pts) {
        const q = this.proj(map ? map(p0) : p0);
        if (prev) {
          const isFront = (prev[2] + q[2]) / 2 >= 0;
          if ((pass === 'front') === isFront) {
            if (!drawing) { ctx.moveTo(prev[0], prev[1]); drawing = true; }
            ctx.lineTo(q[0], q[1]);
          } else drawing = false;
        }
        prev = q;
      }
      ctx.strokeStyle = pass === 'front' ? color : rgba(color, alphaBack);
      ctx.lineWidth = width; ctx.stroke();
    }
    draw() {
      if (!this.W) return;
      const ctx = this.ctx, T = Theme.tokens(), R = this.R, cxp = this.cx, cyp = this.cy, W = this.W;
      ctx.clearRect(0, 0, W, W);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // body
      const g = ctx.createRadialGradient(cxp - R * 0.38, cyp - R * 0.42, R * 0.05, cxp, cyp, R * 1.02);
      g.addColorStop(0, T.surface); g.addColorStop(1, T.surface2);
      ctx.beginPath(); ctx.arc(cxp, cyp, R, 0, 2 * PI); ctx.fillStyle = g; ctx.fill();
      const circles = [this._circle([1, 0, 0], [0, 1, 0]), this._circle([1, 0, 0], [0, 0, 1]), this._circle([0, 1, 0], [0, 0, 1])];
      const axes = [[[-1, 0, 0], [1, 0, 0]], [[0, -1, 0], [0, 1, 0]], [[0, 0, -1], [0, 0, 1]]].map(([a, b]) => {
        const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } return pts;
      });
      const structure = pass => {
        circles.forEach((c, i) => this._strokePoly(c, pass, i === 0 ? T.ink2 : T.lineStrong, i === 0 ? 1.1 : 1, 0.35));
        axes.forEach(a => this._strokePoly(a, pass, T.lineStrong, 1, 0.45));
        if (this.plane) {
          const m = this.plane.n; let u = Math.abs(m[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
          const d = u[0] * m[0] + u[1] * m[1] + u[2] * m[2]; u = [u[0] - d * m[0], u[1] - d * m[1], u[2] - d * m[2]];
          const L = Math.hypot(...u); u = u.map(v => v / L);
          const w = [m[1] * u[2] - m[2] * u[1], m[2] * u[0] - m[0] * u[2], m[0] * u[1] - m[1] * u[0]];
          this._strokePoly(this._circle(u, w), pass, T.accent, 2.2, 0.4);
        }
        if (this.ellipsoid) {
          const { A, c } = this.ellipsoid, map = p => [A[0][0] * p[0] + A[0][1] * p[1] + A[0][2] * p[2] + c[0], A[1][0] * p[0] + A[1][1] * p[1] + A[1][2] * p[2] + c[1], A[2][0] * p[0] + A[2][1] * p[1] + A[2][2] * p[2] + c[2]];
          const rings = [this._circle([1, 0, 0], [0, 1, 0]), this._circle([1, 0, 0], [0, 0, 1]), this._circle([0, 1, 0], [0, 0, 1])];
          for (const z of [-0.6, 0.6]) { const r = Math.sqrt(1 - z * z); rings.push(this._circle([r, 0, 0], [0, r, 0]).map(p => [p[0], p[1], z])); }
          rings.forEach(rg => this._strokePoly(rg, pass, T.q2, 1.6, 0.35, map));
        }
      };
      structure('back');
      // θ/φ helper arcs and shadow
      const main = this.vectors.find(v => v.main) || this.vectors[0];
      if (main && this.o.shadow && Math.hypot(main.v[0], main.v[1]) > 0.02) {
        const v = main.v, foot = [v[0], v[1], 0];
        ctx.setLineDash([]);
        ctx.strokeStyle = rgba(T.muted, 0.7); ctx.lineWidth = 1;
        const o = this.proj([0, 0, 0]), f = this.proj(foot), t = this.proj(v);
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(f[0], f[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
      }
      if (main && this.o.angles) {
        const b = main.v, r = Math.hypot(...b);
        if (r > 0.05) {
          const th = Math.acos(clamp(b[2] / r, -1, 1)), ph = Math.atan2(b[1], b[0]);
          const arcR = 0.32;
          ctx.strokeStyle = T.accent; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let i = 0; i <= 30; i++) { const t = th * i / 30; const q = this.proj([arcR * Math.sin(t) * Math.cos(ph), arcR * Math.sin(t) * Math.sin(ph), arcR * Math.cos(t)]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
          ctx.stroke();
          const lq = this.proj([0.42 * Math.sin(th / 2) * Math.cos(ph), 0.42 * Math.sin(th / 2) * Math.sin(ph), 0.42 * Math.cos(th / 2)]);
          ctx.fillStyle = T.accent; ctx.font = `italic 600 ${this.o.compact ? 11 : 14}px ${T.fontMath}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('θ', lq[0], lq[1]);
          if (Math.hypot(b[0], b[1]) > 0.05) {
            let phn = ph; if (phn < 0) phn += 2 * PI;
            ctx.beginPath();
            for (let i = 0; i <= 30; i++) { const t = phn * i / 30; const q = this.proj([arcR * Math.cos(t), arcR * Math.sin(t), 0]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
            ctx.stroke();
            const pq = this.proj([0.44 * Math.cos(phn / 2), 0.44 * Math.sin(phn / 2), 0]);
            ctx.fillText('φ', pq[0], pq[1]);
          }
        }
      }
      // data points
      if (this.points.length) {
        const pts = this.points.map(p => ({ p, q: this.proj(p.v) })).sort((a, b) => a.q[2] - b.q[2]);
        const rr = this.o.compact ? 2.6 : 3.6;
        for (const { p, q } of pts) {
          const a = q[2] < 0 ? 0.35 : 1;
          ctx.beginPath(); ctx.arc(q[0], q[1], (p.r || rr) + 1.5, 0, 2 * PI); ctx.fillStyle = rgba(T.surface, a); ctx.fill();
          ctx.beginPath(); ctx.arc(q[0], q[1], p.r || rr, 0, 2 * PI);
          if (p.hollow) { ctx.strokeStyle = rgba(p.color, a); ctx.lineWidth = 1.6; ctx.stroke(); } else { ctx.fillStyle = rgba(p.color, a); ctx.fill(); }
        }
      }
      // trail
      if (this.trail && this.trail.length > 1) {
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(this.trailColor || T.q, 0.55); ctx.beginPath();
        this.trail.forEach((p, i) => { const q = this.proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.stroke();
      }
      // rotation axis
      if (this.axis) {
        const n = this.axis, a = this.proj(n.map(v => -1.28 * v)), b = this.proj(n.map(v => 1.28 * v));
        ctx.strokeStyle = T.accent; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.beginPath(); ctx.arc(b[0], b[1], 3.2, 0, 2 * PI); ctx.fillStyle = T.accent; ctx.fill();
      }
      // vectors
      const vecs = this.vectors.slice().sort((a, b) => this.proj(a.v)[2] - this.proj(b.v)[2]);
      for (const v of vecs) this._arrow(v, T);
      structure('front');
      // outline
      ctx.beginPath(); ctx.arc(cxp, cyp, R, 0, 2 * PI); ctx.strokeStyle = T.lineStrong; ctx.lineWidth = 1; ctx.stroke();
      if (this.o.labels) this._labels(T);
    }
    _arrow(v, T) {
      const ctx = this.ctx, o = this.proj([0, 0, 0]), t = this.proj(v.v), color = v.color || T.q;
      const len = Math.hypot(...v.v), alpha = v.alpha ?? (t[2] < -0.05 && len > 0.2 ? 0.75 : 1);
      if (len < 0.015) {
        ctx.beginPath(); ctx.arc(o[0], o[1], 4.5, 0, 2 * PI); ctx.fillStyle = rgba(color, alpha); ctx.fill();
        return;
      }
      const w = v.width || (this.o.compact ? 2.2 : 2.8);
      ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = w;
      const dx = t[0] - o[0], dy = t[1] - o[1], L = Math.hypot(dx, dy);
      const head = this.o.compact ? 7 : 10;
      if (L > head * 1.4 && v.head !== false) {
        const ux = dx / L, uy = dy / L, bx = t[0] - ux * head, by = t[1] - uy * head;
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(bx, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(bx - uy * head * 0.45, by + ux * head * 0.45); ctx.lineTo(bx + uy * head * 0.45, by - ux * head * 0.45); ctx.closePath();
        ctx.fillStyle = rgba(color, alpha); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
      }
      if (v.dot !== false) {
        const r = this.o.compact ? 3.2 : 4.6;
        ctx.beginPath(); ctx.arc(t[0], t[1], r + 2, 0, 2 * PI); ctx.fillStyle = T.surface; ctx.fill();
        ctx.beginPath(); ctx.arc(t[0], t[1], r, 0, 2 * PI); ctx.fillStyle = rgba(color, alpha); ctx.fill();
      }
      if (v.label) {
        ctx.fillStyle = T.ink2; ctx.font = `italic 600 ${this.o.compact ? 11 : 13}px ${T.fontMath}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(v.label, t[0] + 7, t[1] - 4);
      }
    }
    _labels(T) {
      const ctx = this.ctx, small = this.o.compact;
      ctx.font = `${small ? 11 : 13.5}px ${T.fontMath}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const L = [[[0, 0, 1.17], '|0⟩'], [[0, 0, -1.17], '|1⟩']];
      if (!small) L.push([[1.24, 0, 0], '|+⟩'], [[-1.22, 0, 0], '|−⟩'], [[0, 1.22, 0], '|+i⟩'], [[0, -1.22, 0], '|−i⟩']);
      for (const [p, s] of L) {
        const q = this.proj(p);
        ctx.fillStyle = q[2] < -0.3 ? rgba(T.ink2, 0.55) : T.ink2;
        ctx.fillText(s, q[0], q[1]);
      }
      if (!small && this.o.axisLetters) {
        ctx.font = `600 10px ${T.fontBody}`;
        for (const [p, s] of [[[1.02, 0, 0], 'x'], [[0, 1.03, 0], 'y'], [[0, 0, 1.03], 'z']]) {
          const q = this.proj(p); ctx.fillStyle = rgba(T.muted, q[2] < 0 ? 0.5 : 0.95);
          ctx.fillText(s, q[0] + 9, q[1] - 7);
        }
      }
    }
  }

  /* =====================================================================
     Circle notation: one circle per basis state.
     filled radius ∝ |amplitude| (area ∝ probability), colour & needle = phase
     ===================================================================== */
  class CircleGrid {
    constructor(host, o = {}) {
      this.o = Object.assign({ maxCols: 8, maxCell: 78, minCell: 50 }, o);
      this.host = host; host.classList.add('view');
      this.canvas = h('canvas', { role: 'img', 'aria-label': 'Amplitudes in circle notation' }); host.appendChild(this.canvas);
      this.canvas.style.touchAction = 'pan-y';
      this.ctx = this.canvas.getContext('2d');
      this.n = o.n || 1; this.re = [1]; this.im = [0]; this.labels = null; this.W = 0;
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(host);
      Theme.onChange(() => this.draw(), this.canvas);
      this.canvas.addEventListener('pointermove', e => this._hover(e));
      this.canvas.addEventListener('pointerleave', () => Tip.hide());
      this.resize();
    }
    update(re, im, n) { this.re = re; this.im = im; if (n) this.n = n; this.resize(true); }
    layout() {
      const N = this.re.length, W = this.host.clientWidth || 300;
      let cols = Math.min(N, this.o.maxCols, Math.max(1, Math.floor(W / this.o.minCell)));
      const cell = Math.min(this.o.maxCell, W / cols);
      const rows = Math.ceil(N / cols);
      return { N, cols, rows, cell, W: Math.min(W, cell * cols), H: rows * (cell + 16) };
    }
    resize(force) {
      if (!this.host.clientWidth) return;
      const L = this.layout(); this.L = L;
      const dpr = dprOf();
      if (force || L.W !== this.W || L.H !== this.Hh) {
        this.W = L.W; this.Hh = L.H;
        this.canvas.width = Math.round(L.W * dpr); this.canvas.height = Math.round(L.H * dpr);
        this.canvas.style.width = L.W + 'px'; this.canvas.style.height = L.H + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this.draw();
    }
    draw() {
      const L = this.L; if (!L) return;
      const ctx = this.ctx, T = Theme.tokens(), n = Math.round(Math.log2(L.N));
      ctx.clearRect(0, 0, L.W, L.H);
      for (let i = 0; i < L.N; i++) {
        const c = i % L.cols, r = Math.floor(i / L.cols);
        const x = c * L.cell + L.cell / 2, y = r * (L.cell + 16) + L.cell / 2, R = L.cell * 0.38;
        const re = this.re[i], im = this.im[i], m = Math.hypot(re, im), ph = Math.atan2(im, re);
        ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * PI); ctx.fillStyle = T.surface; ctx.fill();
        ctx.strokeStyle = T.lineStrong; ctx.lineWidth = 1; ctx.stroke();
        if (m > 1e-4) {
          ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, R * m), 0, 2 * PI); ctx.fillStyle = phaseColor(ph); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + R * Math.cos(ph), y - R * Math.sin(ph));
          ctx.strokeStyle = T.ink; ctx.lineWidth = 1.6; ctx.stroke();
        }
        ctx.fillStyle = m > 1e-4 ? T.ink2 : T.muted; ctx.font = `${L.cell < 60 ? 10.5 : 12}px ${T.fontMath}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(this.labels ? this.labels[i] : ket(bits(i, n)), x, y + R + 4);
      }
    }
    _hover(e) {
      const L = this.L; if (!L) return;
      const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const c = Math.floor(x / L.cell), rr = Math.floor(y / (L.cell + 16)), i = rr * L.cols + c;
      if (c < 0 || c >= L.cols || i < 0 || i >= L.N) { Tip.hide(); return; }
      const re = this.re[i], im = this.im[i], p = re * re + im * im, n = Math.round(Math.log2(L.N));
      Tip.show(`<b>${ket(bits(i, n))}</b><br>amplitude ${cx(re, im)}<br>probability <b>${pct(p)}</b>` + (p > 1e-8 ? `<br>phase ${angle(Math.atan2(im, re))}` : ''), e.clientX, e.clientY);
    }
  }

  /* =====================================================================
     SVG helpers + bar chart + line plot
     ===================================================================== */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, parent) {
    const el = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  }
  function niceTicks(a, b, count = 5) {
    const span = b - a; if (span <= 0) return [a];
    const step0 = span / count, mag = 10 ** Math.floor(Math.log10(step0)), r = step0 / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function roundedBar(x, y, w, hgt, r) {
    if (hgt <= 0) return '';
    r = Math.min(r, w / 2, hgt);
    return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`;
  }
  /* bars: {labels, values, marks?, max?, color?, colors?, height, fmt, title, valueName, markName} */
  function bars(host, o) {
    host.classList.add('view'); host.innerHTML = '';
    const T = Theme.tokens(), W = Math.max(200, host.clientWidth || 300), H = o.height || 170;
    const N = o.values.length, m = { l: 34, r: 8, t: 12, b: N > 16 ? 44 : 30 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b, band = pw / N, bw = Math.min(24, Math.max(3, band * 0.7));
    const max = o.max ?? 1;
    const s = svg('svg', { class: 'plot', width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.title || 'bar chart' }, host);
    const yt = o.yTicks || [0, max / 2, max];
    for (const t of yt) {
      const y = m.t + ph - t / max * ph;
      svg('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: t === 0 ? 'axis' : 'gridline' }, s);
      const tx = svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end', class: 'tick-label' }, s); tx.textContent = o.yFmt ? o.yFmt(t) : (Math.round(t * 100) / 100).toString();
    }
    const every = o.labelEvery || (N > 16 ? Math.ceil(N / 16) : 1);
    for (let i = 0; i < N; i++) {
      const v = Math.max(0, Math.min(max, o.values[i])), x = m.l + band * i + (band - bw) / 2, bh = v / max * ph;
      const color = (o.colors && o.colors[i]) || o.color || T.q;
      if (bh > 0.2) svg('path', { d: roundedBar(x, m.t + ph - bh, bw, bh, Math.min(4, bw / 3)), fill: color }, s);
      if (o.marks) {
        const mv = Math.min(max, o.marks[i]), my = m.t + ph - mv / max * ph;
        svg('line', { x1: x - 3, x2: x + bw + 3, y1: my, y2: my, stroke: T.ink, 'stroke-width': 2, 'stroke-linecap': 'round' }, s);
      }
      if (i % every === 0) {
        const lx = m.l + band * i + band / 2, ly = H - m.b + 14;
        const tx = svg('text', { x: lx, y: ly, 'text-anchor': N > 16 ? 'end' : 'middle', transform: N > 16 ? `rotate(-55 ${lx} ${ly})` : null, style: `font-family:${T.fontMath};font-size:${N > 8 ? 10.5 : 12}px` }, s);
        tx.textContent = o.labels[i];
      }
      const hit = svg('rect', { x: m.l + band * i, y: m.t, width: band, height: ph, class: 'hit', tabindex: N <= 16 ? 0 : null }, s);
      const tip = () => `<b>${o.labels[i]}</b><br>${o.valueName || 'value'} <b>${o.fmt ? o.fmt(o.values[i]) : num(o.values[i], 3)}</b>` + (o.marks ? `<br>${o.markName || 'exact'} ${o.fmt ? o.fmt(o.marks[i]) : num(o.marks[i], 3)}` : '');
      hit.addEventListener('pointermove', e => Tip.show(tip(), e.clientX, e.clientY));
      hit.addEventListener('pointerleave', () => Tip.hide());
      hit.addEventListener('focus', () => { const r = hit.getBoundingClientRect(); Tip.show(tip(), r.left + r.width / 2, r.top); });
      hit.addEventListener('blur', () => Tip.hide());
    }
    return s;
  }
  /* line plot. o: {height, x:[min,max], y:[min,max], yLog, xTicks, yTicks, xFmt, yFmt, xTitle, yTitle,
     series:[{name,color,points,width,area}], markers:[{x,y,color,r}], vlines:[{x,color,label}], hlines:[{y,color,label}], legend:true} */
  function linePlot(host, o) {
    host.classList.add('view'); host.innerHTML = '';
    const T = Theme.tokens();
    const series = o.series || [];
    if (o.legend !== false && series.filter(s => s.name).length >= 2) {
      const lg = h('div', { class: 'legend', style: { marginBottom: '6px' } });
      for (const s of series) if (s.name) lg.appendChild(h('span', { class: 'key' }, h('span', { class: 'line', style: { background: s.color } }), s.name));
      host.appendChild(lg);
    }
    const W = Math.max(220, host.clientWidth || 320), H = o.height || 200;
    const m = { l: o.ml ?? 44, r: o.mr ?? 14, t: o.yTitle ? 22 : 10, b: o.xTitle ? 40 : 26 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const ly = v => Math.log10(Math.max(v, 1e-300));
    const X = v => m.l + (v - x0) / (x1 - x0) * pw;
    const Y = o.yLog ? (v => m.t + ph - (ly(v) - ly(y0)) / (ly(y1) - ly(y0)) * ph) : (v => m.t + ph - (v - y0) / (y1 - y0) * ph);
    const s = svg('svg', { class: 'plot', width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.title || o.yTitle || 'line chart' }, host);
    const yt = o.yTicks || (o.yLog ? (() => { const a = [], e0 = Math.ceil(ly(y0)), e1 = Math.floor(ly(y1)), st = Math.max(1, Math.ceil((e1 - e0) / 5)); for (let e = e1; e >= e0; e -= st) a.push(10 ** e); return a; })() : niceTicks(y0, y1, 4));
    for (const t of yt) {
      const y = Y(t);
      svg('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'gridline' }, s);
      const tx = svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end', class: 'tick-label' }, s);
      tx.innerHTML = o.yFmt ? o.yFmt(t) : (o.yLog ? '10<tspan dy="-5" font-size="8">' + Math.round(ly(t)) + '</tspan>' : trimTick(t));
    }
    svg('line', { x1: m.l, x2: W - m.r, y1: m.t + ph, y2: m.t + ph, class: 'axis' }, s);
    const xt = o.xTicks || niceTicks(x0, x1, Math.max(3, Math.floor(pw / 70)));
    for (const t of xt) {
      const x = X(t);
      svg('line', { x1: x, x2: x, y1: m.t + ph, y2: m.t + ph + 4, class: 'axis' }, s);
      const tx = svg('text', { x, y: m.t + ph + 16, 'text-anchor': 'middle', class: 'tick-label' }, s); tx.textContent = o.xFmt ? o.xFmt(t) : trimTick(t);
    }
    if (o.xTitle) { const t = svg('text', { x: m.l + pw / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis-title' }, s); t.textContent = o.xTitle; }
    if (o.yTitle) { const t = svg('text', { x: m.l - 2, y: 12, 'text-anchor': 'start', class: 'axis-title' }, s); t.textContent = o.yTitle; }
    for (const hl of (o.hlines || [])) {
      svg('line', { x1: m.l, x2: W - m.r, y1: Y(hl.y), y2: Y(hl.y), stroke: hl.color || T.muted, 'stroke-width': 1.2 }, s);
      if (hl.label) { const t = svg('text', { x: W - m.r - 2, y: Y(hl.y) - 5, 'text-anchor': 'end', class: 'direct-label' }, s); t.textContent = hl.label; }
    }
    for (const vl of (o.vlines || [])) {
      svg('line', { x1: X(vl.x), x2: X(vl.x), y1: m.t, y2: m.t + ph, stroke: vl.color || T.accent, 'stroke-width': 1.5 }, s);
      if (vl.label) { const t = svg('text', { x: X(vl.x) + 4, y: m.t + 10, 'text-anchor': 'start', class: 'direct-label' }, s); t.textContent = vl.label; }
    }
    const clipId = 'clip' + Math.random().toString(36).slice(2, 8);
    const cp = svg('clipPath', { id: clipId }, svg('defs', {}, s)); svg('rect', { x: m.l, y: m.t - 2, width: pw, height: ph + 4 }, cp);
    const g = svg('g', { 'clip-path': `url(#${clipId})` }, s);
    for (const se of series) {
      if (!se.points || !se.points.length) continue;
      const d = se.points.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(2) + ',' + Y(p[1]).toFixed(2)).join('');
      if (se.area) svg('path', { d: d + `L${X(se.points[se.points.length - 1][0])},${Y(o.yLog ? y0 : Math.max(y0, 0))}L${X(se.points[0][0])},${Y(o.yLog ? y0 : Math.max(y0, 0))}Z`, fill: rgba(se.color, 0.1) }, g);
      svg('path', { d, fill: 'none', stroke: se.color, 'stroke-width': se.width || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: se.opacity ?? 1 }, g);
      if (se.dots) for (const p of se.points) { svg('circle', { cx: X(p[0]), cy: Y(p[1]), r: 5.5, fill: T.surface }, g); svg('circle', { cx: X(p[0]), cy: Y(p[1]), r: 3.8, fill: se.color }, g); }
    }
    for (const mk of (o.markers || [])) {
      svg('circle', { cx: X(mk.x), cy: Y(mk.y), r: (mk.r || 4.5) + 2, fill: T.surface }, s);
      svg('circle', { cx: X(mk.x), cy: Y(mk.y), r: mk.r || 4.5, fill: mk.color || T.ink }, s);
      if (mk.label) { const t = svg('text', { x: X(mk.x) + 8, y: Y(mk.y) - 8, class: 'direct-label' }, s); t.textContent = mk.label; }
    }
    for (const ln of (o.segments || [])) {
      svg('line', { x1: X(ln.x1), y1: Y(ln.y1), x2: X(ln.x2), y2: Y(ln.y2), stroke: ln.color || T.ink, 'stroke-width': ln.width || 1.5, 'stroke-linecap': 'round' }, g);
    }
    // crosshair
    if (o.crosshair !== false && series.some(se => se.points && se.points.length > 1)) {
      const cross = svg('line', { y1: m.t, y2: m.t + ph, stroke: T.ink2, 'stroke-width': 1, visibility: 'hidden' }, s);
      const hit = svg('rect', { x: m.l, y: m.t, width: pw, height: ph, class: 'hit' }, s);
      hit.addEventListener('pointermove', e => {
        const r = s.getBoundingClientRect(), xv = x0 + (e.clientX - r.left - m.l) / pw * (x1 - x0);
        let html = ''; let xs = null;
        for (const se of series) {
          if (!se.points || !se.points.length) continue;
          let best = se.points[0]; for (const p of se.points) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p;
          if (xs === null) xs = best[0];
          html += `<div><span class="tk" style="background:${se.color}"></span><b>${o.yFmt2 ? o.yFmt2(best[1]) : fmtVal(best[1])}</b> ${se.name ? root.U.esc(se.name) : ''}</div>`;
        }
        if (xs === null) return;
        cross.setAttribute('x1', X(xs)); cross.setAttribute('x2', X(xs)); cross.setAttribute('visibility', 'visible');
        Tip.show(`<div>${o.xName || 'x'} = ${o.xFmt ? o.xFmt(xs) : trimTick(xs)}</div>` + html, e.clientX, e.clientY);
      });
      hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); Tip.hide(); });
    }
    return { svg: s, X, Y, m, pw, ph };
  }
  function fmtVal(v) { const a = Math.abs(v); if (a !== 0 && (a < 1e-3 || a >= 1e4)) return v.toExponential(2).replace('-', '−'); return num(v, 3); }
  function trimTick(t) { const s = (Math.abs(t) < 1e-12 ? 0 : t).toString(); return s.length > 7 ? (+t).toPrecision(3) : s.replace('-', '−'); }

  /* =====================================================================
     Scalar fields & heatmaps on canvas
     ===================================================================== */
  function field(canvas, cssW, cssH, res, fn, colorFn) {
    const dpr = dprOf();
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    const off = document.createElement('canvas'); off.width = res; off.height = res;
    const octx = off.getContext('2d'), img = octx.createImageData(res, res);
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const x = -1 + 2 * (i + 0.5) / res, y = 1 - 2 * (j + 0.5) / res;
      const [r, g, b] = colorFn(fn(x, y)); const k = (j * res + i) * 4;
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, cssW, cssH);
    return ctx;
  }
  function drawPoints(ctx, pts, W, H, T) {
    for (const p of pts) {
      const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H, r = p.r || 4.2;
      ctx.beginPath(); ctx.arc(x, y, r + 1.8, 0, 2 * PI); ctx.fillStyle = T.surface; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI);
      if (p.hollow) { ctx.fillStyle = T.surface; ctx.fill(); ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke(); }
      else { ctx.fillStyle = p.color; ctx.fill(); }
      if (p.ring) { ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 2 * PI); ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
  }
  /* complex matrix heatmap: colour = phase, opacity = magnitude */
  function matrixHeat(canvas, U, size, opts = {}) {
    const N = U.N, T = Theme.tokens(), dpr = dprOf(), cell = size / N;
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = T.surface; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const re = U.re[i * N + j], im = U.im[i * N + j], m = Math.hypot(re, im);
      if (m > 1e-6) {
        ctx.fillStyle = phaseColor(Math.atan2(im, re), Math.min(1, 0.15 + 0.85 * m));
        const g = cell > 14 ? 1 : 0;
        ctx.fillRect(j * cell + g, i * cell + g, cell - 2 * g, cell - 2 * g);
      }
    }
    ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    if (!canvas._bound) {
      canvas._bound = true;
      canvas.addEventListener('pointermove', e => {
        const Uc = canvas._U; if (!Uc) return;
        const r = canvas.getBoundingClientRect(), c2 = r.width / Uc.N;
        const j = Math.floor((e.clientX - r.left) / c2), i = Math.floor((e.clientY - r.top) / c2);
        if (i < 0 || j < 0 || i >= Uc.N || j >= Uc.N) return;
        const n = Math.round(Math.log2(Uc.N));
        Tip.show(`row ${ket(bits(i, n))}, column ${ket(bits(j, n))}<br><b>${cx(Uc.re[i * Uc.N + j], Uc.im[i * Uc.N + j])}</b>`, e.clientX, e.clientY);
      });
      canvas.addEventListener('pointerleave', () => Tip.hide());
    }
    canvas._U = U;
  }
  /* matrix as HTML with exact entries */
  function matHTML(get, rows, cols, cls = '') {
    let s = `<span class="mat ${cls}" style="grid-template-columns:repeat(${cols},auto)">`;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const [re, im] = get(i, j); s += `<span>${cx(re, im)}</span>`; }
    return s + '</span>';
  }
  const m2HTML = (m, cls) => matHTML((i, j) => [m[(i * 2 + j) * 2], m[(i * 2 + j) * 2 + 1]], 2, 2, cls);
  const vecHTML = (v, cls) => matHTML(i => [v[2 * i], v[2 * i + 1]], 2, 1, cls);
  function unitaryHTML(U, cls = 'small') { return matHTML((i, j) => [U.re[i * U.N + j], U.im[i * U.N + j]], U.N, U.N, cls); }

  /* complex-plane dial for one amplitude */
  function phasorSVG(re, im, size = 110, o = {}) {
    const T = Theme.tokens(), c = size / 2, R = size * 0.38, m = Math.hypot(re, im), ph = Math.atan2(im, re);
    const x = c + R * re, y = c - R * im;
    const col = m > 1e-6 ? phaseColor(ph) : T.muted;
    let s = `<svg class="plot" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="amplitude ${root.U.esc(cx(re, im).replace(/<[^>]+>/g, ''))}">`;
    s += `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="${T.lineStrong}" stroke-width="1"/>`;
    s += `<line x1="${c - R - 6}" x2="${c + R + 6}" y1="${c}" y2="${c}" stroke="${T.line}" /><line y1="${c - R - 6}" y2="${c + R + 6}" x1="${c}" x2="${c}" stroke="${T.line}"/>`;
    s += `<text x="${c + R + 4}" y="${c - 4}" font-size="9" style="fill:${T.muted}">Re</text><text x="${c + 4}" y="${c - R - 2}" font-size="9" style="fill:${T.muted}">Im</text>`;
    if (m > 1e-6) {
      s += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
      s += `<circle cx="${x}" cy="${y}" r="6" fill="${T.surface}"/><circle cx="${x}" cy="${y}" r="4.3" fill="${col}"/>`;
    }
    if (o.label) s += `<text x="${c}" y="${size - 3}" text-anchor="middle" style="fill:${T.ink2};font-family:${T.fontMath};font-size:12px">${o.label}</text>`;
    return s + '</svg>';
  }
  /* phase colour legend ring */
  function phaseWheel(size = 84) {
    const T = Theme.tokens(), c = size / 2, R1 = size * 0.3, R2 = size * 0.42;
    let s = `<svg class="plot" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="phase colour wheel">`;
    for (let d = 0; d < 360; d += 6) {
      const a0 = d * PI / 180, a1 = (d + 6.5) * PI / 180;
      const p = (r, a) => `${(c + r * Math.cos(a)).toFixed(2)},${(c - r * Math.sin(a)).toFixed(2)}`;
      s += `<path d="M${p(R1, a0)}L${p(R2, a0)}A${R2},${R2} 0 0 0 ${p(R2, a1)}L${p(R1, a1)}A${R1},${R1} 0 0 1 ${p(R1, a0)}Z" fill="${phaseColor(a0 + 3 * PI / 180)}"/>`;
    }
    const lab = (a, t) => `<text x="${(c + (R2 + 8) * Math.cos(a)).toFixed(1)}" y="${(c - (R2 + 8) * Math.sin(a) + 3.5).toFixed(1)}" text-anchor="middle" font-size="9.5" style="fill:${T.ink2}">${t}</text>`;
    s += lab(0, '0') + lab(PI / 2, 'π/2') + lab(PI, 'π') + lab(3 * PI / 2, '3π/2');
    return s.replace(`width="${size}"`, `width="${size + 22}"`).replace(`viewBox="0 0 ${size} ${size}"`, `viewBox="-11 0 ${size + 22} ${size}"`) + '</svg>';
  }

  function phaseSwatch(size = 14) {
    const stops = []; for (let a = 0; a <= 360; a += 20) stops.push(`${phaseColor(-a * PI / 180)} ${a}deg`);
    return `<span class="phasewheel-inline" aria-hidden="true" style="width:${size}px;height:${size}px;background:conic-gradient(from 90deg, ${stops.join(', ')})"></span>`;
  }
  root.V = { phaseSwatch, BlochView, CircleGrid, svg, bars, linePlot, niceTicks, field, drawPoints, matrixHeat, matHTML, m2HTML, vecHTML, unitaryHTML, phasorSVG, phaseWheel, fmtVal, dprOf };
})(window);

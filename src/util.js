/* ==========================================================================
   Shared helpers: DOM, formatting, theme tokens, phase colours, tooltip,
   animation, and small UI controls.
   ========================================================================== */
(function (root) {
  'use strict';
  const PI = Math.PI;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- number formatting ---------- */
  const MINUS = '−';
  function num(x, d = 3) {
    if (Math.abs(x) < 0.5 * 10 ** -d) x = 0;
    const s = x.toFixed(d);
    return s.replace('-', MINUS);
  }
  function trimNum(x, d = 3) {
    let s = num(x, d);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
  /* angle as a multiple of pi when it is a multiple of pi/8 */
  function angle(t, d = 2) {
    const k = t / (PI / 24), kr = Math.round(k);
    if (Math.abs(k - kr) < 1e-6 && (kr % 3 === 0 || kr % 4 === 0)) {
      if (kr === 0) return '0';
      const g = gcd(kr, 24), nume = kr / g, den = 24 / g;
      const sign = nume < 0 ? MINUS : '';
      const a = Math.abs(nume);
      return sign + (a === 1 ? '' : a) + 'π' + (den === 1 ? '' : '/' + den);
    }
    return num(t, d);
  }
  function deg(t) { return Math.round(t * 180 / PI) + '°'; }
  function pct(p, d = 1) { return (100 * p).toFixed(d) + '%'; }

  const MAGS = [
    [1, '1'], [Math.SQRT1_2, '1/√2'], [0.5, '1/2'], [Math.sqrt(3) / 2, '√3/2'], [1 / Math.sqrt(8), '1/(2√2)'],
    [0.25, '1/4'], [1 / Math.sqrt(3), '1/√3'], [Math.sqrt(2 / 3), '√(2/3)'], [1 / Math.sqrt(32), '1/(4√2)'],
    [0.125, '1/8'], [0.75, '3/4'], [Math.sqrt(3) / 4, '√3/4'], [1 / Math.sqrt(6), '1/√6'], [1 / Math.sqrt(128), '1/(8√2)'], [1 / 16, '1/16']
  ];
  function magSym(m) {
    for (const [v, s] of MAGS) if (Math.abs(m - v) < 5e-7) return s;
    return null;
  }
  /* complex amplitude as HTML. mode 'sym' tries exact forms. */
  function cx(re, im, opts = {}) {
    const d = opts.d ?? 3;
    const m = Math.hypot(re, im);
    if (m < 5e-7) return '0';
    const ph = Math.atan2(im, re);
    const ms = magSym(m);
    const k4 = ph / (PI / 4), k4r = Math.round(k4);
    if (ms && Math.abs(k4 - k4r) < 1e-6) {
      const kk = ((k4r % 8) + 8) % 8; // 0..7 multiples of pi/4
      const withI = (pre) => ms === '1' ? pre + 'i' : (ms.startsWith('1/') ? pre + 'i' + ms.slice(1) : pre + 'i' + ms);
      switch (kk) {
        case 0: return ms;
        case 4: return MINUS + ms;
        case 2: return withI('');
        case 6: return withI(MINUS);
        default: { // odd multiples of pi/4
          const kkk = kk > 4 ? 8 - kk : kk;
          const ee = 'e<sup>' + (kk > 4 ? MINUS : '') + 'i' + (kkk === 1 ? '' : '3') + 'π/4</sup>';
          if (ms === '1') return ee;
          if (ms.startsWith('1/')) return ee + ms.slice(1);
          return ms + '·' + ee;
        }
      }
    }
    // numeric
    const r = Math.abs(re) < 5 * 10 ** (-d - 1) ? 0 : re, i = Math.abs(im) < 5 * 10 ** (-d - 1) ? 0 : im;
    if (i === 0) return trimNum(r, d);
    if (r === 0) return (i < 0 ? MINUS : '') + trimNum(Math.abs(i), d) + 'i';
    return trimNum(r, d) + (i < 0 ? ' ' + MINUS + ' ' : ' + ') + trimNum(Math.abs(i), d) + 'i';
  }
  /* coefficient for a ket expression: returns {sign:'+'|'−', body} */
  function coef(re, im, d = 3) {
    let s = cx(re, im, { d });
    let sign = '+';
    if (s.startsWith(MINUS)) { sign = MINUS; s = s.slice(1); }
    if (s.includes(' + ') || s.includes(' ' + MINUS + ' ')) s = '(' + s + ')';
    if (s === '1') s = '';
    return { sign, body: s };
  }
  function bits(i, n) { return i.toString(2).padStart(n, '0'); }
  function ket(label) { return '|' + label + '⟩'; }
  /* state -> "a|00⟩ + b|11⟩" HTML */
  function ketExpr(re, im, n, opts = {}) {
    const N = re.length, maxTerms = opts.maxTerms ?? 8, terms = [];
    for (let i = 0; i < N; i++) if (re[i] * re[i] + im[i] * im[i] > 1e-10) terms.push(i);
    if (!terms.length) return '0';
    let out = '';
    terms.slice(0, maxTerms).forEach((i, k) => {
      const c = coef(re[i], im[i], opts.d ?? 3);
      const sep = k === 0 ? (c.sign === '+' ? '' : MINUS) : ' ' + c.sign + ' ';
      out += sep + c.body + '<span class="kt">' + ket(bits(i, n)) + '</span>';
    });
    if (terms.length > maxTerms) out += ' + … <span class="note">(' + (terms.length - maxTerms) + ' more terms)</span>';
    return out;
  }

  /* ---------- theme tokens ---------- */
  const Theme = {
    _cache: null, _subs: new Set(),
    tokens() {
      if (this._cache) return this._cache;
      const cs = getComputedStyle(document.documentElement);
      const g = n => cs.getPropertyValue(n).trim();
      this._cache = {
        bg: g('--bg'), surface: g('--surface'), surface2: g('--surface-2'), surface3: g('--surface-3'), ink: g('--ink'), ink2: g('--ink-2'),
        muted: g('--muted'), line: g('--line'), lineStrong: g('--line-strong'), accent: g('--accent'), accentSoft: g('--accent-soft'),
        q: g('--q'), q2: g('--q2'), q3: g('--q3'), neg: g('--neg'), divMid: g('--div-mid'), grid: g('--grid'), good: g('--good'), bad: g('--bad'),
        fontBody: g('--font-body'), fontMono: g('--font-mono'), fontMath: g('--font-math'),
        dark: this.isDark()
      };
      return this._cache;
    },
    isDark() {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'dark') return true; if (t === 'light') return false;
      return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
    },
    /* el (optional): the subscription is dropped once el leaves the document */
    onChange(cb, el) { const s = { cb, el }; this._subs.add(s); return () => this._subs.delete(s); },
    _fire() {
      this._cache = null; phaseLUT = null;
      this._subs.forEach(s => {
        if (s.el && !s.el.isConnected) { this._subs.delete(s); return; }
        try { s.cb(); } catch (e) { console.error(e); }
      });
    }
  };
  if (typeof window !== 'undefined') {
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => Theme._fire()); } catch (e) { /* old browsers */ }
    try { new MutationObserver(() => Theme._fire()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] }); } catch (e) { /* noop */ }
  }

  /* ---------- colours ---------- */
  function hexToRgb(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function parseColor(c) {
    if (!c) return [128, 128, 128];
    if (c.startsWith('#')) return hexToRgb(c);
    const m = c.match(/rgba?\(([^)]+)\)/); if (m) return m[1].split(',').slice(0, 3).map(v => parseFloat(v));
    return [128, 128, 128];
  }
  function rgba(c, a) { const [r, g, b] = parseColor(c); return `rgba(${r},${g},${b},${a})`; }
  function mix(c1, c2, t) { const a = parseColor(c1), b = parseColor(c2); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  function oklch(L, C, hdeg) {
    const hr = hdeg * PI / 180;
    for (let c = C; c >= 0; c -= 0.005) {
      const a = c * Math.cos(hr), b = c * Math.sin(hr);
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
      const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
      if (rgb.every(v => v >= -0.001 && v <= 1.001)) {
        return rgb.map(v => { v = clamp(v, 0, 1); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); });
      }
    }
    return [128, 128, 128];
  }
  let phaseLUT = null;
  /* Phase is cyclic, so it gets a cyclic, constant-lightness hue wheel.
     phase 0 = blue (like a positive real amplitude), pi = amber. */
  function phaseRGB(phi) {
    if (!phaseLUT) {
      const dark = Theme.isDark(); phaseLUT = [];
      for (let d = 0; d < 360; d++) phaseLUT.push(oklch(dark ? 0.72 : 0.63, 0.15, ((252 - d) % 360 + 360) % 360));
    }
    let d = Math.round(phi * 180 / PI) % 360; if (d < 0) d += 360;
    return phaseLUT[d];
  }
  function phaseColor(phi, a = 1) { const [r, g, b] = phaseRGB(phi); return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`; }
  /* diverging (blue for f>0, red for f<0), strength in [0,1] */
  function divergingRGB(f, T, strength = 0.75) {
    const mid = parseColor(T.divMid), pole = parseColor(f >= 0 ? T.q : T.neg), t = Math.min(1, Math.abs(f)) * strength;
    return mid.map((v, i) => Math.round(v + (pole[i] - v) * t));
  }

  /* ---------- tooltip ---------- */
  let tipEl = null;
  const Tip = {
    show(html, x, y) {
      if (!tipEl) { tipEl = h('div', { class: 'tooltip', role: 'status' }); document.body.appendChild(tipEl); }
      tipEl.innerHTML = html; tipEl.hidden = false;
      const r = tipEl.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      let left = x + 14, top = y + 14;
      if (left + r.width > vw - 8) left = x - r.width - 14;
      if (top + r.height > vh - 8) top = y - r.height - 14;
      tipEl.style.left = Math.max(8, left) + 'px'; tipEl.style.top = Math.max(8, top) + 'px';
    },
    hide() { if (tipEl) tipEl.hidden = true; }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- animation ---------- */
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function animate(duration, frame, opts = {}) {
    return new Promise(resolve => {
      if (reduceMotion() || duration <= 0) { frame(1); resolve(); return; }
      const t0 = performance.now(), e = opts.linear ? (t => t) : ease;
      const tick = now => {
        if (opts.cancelled && opts.cancelled()) { resolve(); return; }
        const t = Math.min(1, (now - t0) / duration);
        frame(e(t));
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- UI controls ---------- */
  let uid = 0;
  const nextId = p => (p || 'c') + '-' + (++uid);
  function slider(o) {
    const id = o.id || nextId('s');
    const input = h('input', { type: 'range', id, min: o.min, max: o.max, step: o.step ?? 'any', value: o.value });
    const out = h('output', { for: id });
    const fmt = o.fmt || (v => num(v, 2));
    const el = h('div', { class: 'ctl' }, h('label', { for: id, html: o.label }), input, out);
    const snap = v => {
      if (!o.snapPi) return v;
      const k = Math.round(v / (PI / 24));
      return (k % 3 === 0 || k % 4 === 0) && Math.abs(v - k * PI / 24) < (o.snapTol ?? 0.03) ? k * PI / 24 : v;
    };
    let value = +o.value;
    const sync = () => { out.innerHTML = fmt(value); };
    input.addEventListener('input', () => { value = snap(+input.value); sync(); o.oninput && o.oninput(value); });
    sync();
    return {
      el, input,
      get: () => value,
      set(v, fire = false) { value = +v; input.value = v; sync(); if (fire && o.oninput) o.oninput(value); },
      setFmt(f) { o.fmt = f; }
    };
  }
  function seg(o) {
    const el = h('div', { class: 'seg', role: 'group', 'aria-label': o.label || '' });
    let value = o.value;
    const btns = o.options.map(opt => {
      const b = h('button', { type: 'button', 'aria-pressed': String(opt.value === value), html: opt.label, title: opt.title || null });
      b.addEventListener('click', () => { api.set(opt.value, true); });
      el.appendChild(b); return b;
    });
    const api = {
      el, get: () => value,
      set(v, fire = false) {
        value = v; btns.forEach((b, i) => b.setAttribute('aria-pressed', String(o.options[i].value === v)));
        if (fire && o.onchange) o.onchange(v);
      }
    };
    return api;
  }
  function button(label, onclick, cls = 'btn', attrs = {}) {
    return h('button', Object.assign({ type: 'button', class: cls, html: label, onclick }, attrs));
  }
  function select(o) {
    const el = h('select', { class: 'sel', id: o.id || nextId('sel'), 'aria-label': o.label || '' });
    o.options.forEach(opt => el.appendChild(h('option', { value: opt.value, text: opt.label })));
    el.value = o.value;
    el.addEventListener('change', () => o.onchange && o.onchange(el.value));
    return el;
  }
  async function copyText(text, btn) {
    const done = ok => { if (btn) { const old = btn.innerHTML; btn.innerHTML = ok ? 'Copied' : 'Select and copy'; setTimeout(() => { btn.innerHTML = old; }, 1600); } };
    try { await navigator.clipboard.writeText(text); done(true); } catch (e) { done(false); return false; }
    return true;
  }
  /* an editor-style Python code block (src/code.js); o = { file, output } */
  function codeBlock(code, o = {}) { return root.Code.el(code, o); }

  const storage = {
    get(k, d) { try { const v = localStorage.getItem('q2c:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('q2c:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  root.U = {
    PI, $, $$, h, clamp, lerp, reduceMotion, num, trimNum, angle, deg, pct, magSym, cx, coef, bits, ket, ketExpr, MINUS,
    Theme, parseColor, rgba, mix, oklch, phaseRGB, phaseColor, divergingRGB, Tip, esc, ease, animate,
    slider, seg, button, select, codeBlock, copyText, nextId, storage
  };
})(window);

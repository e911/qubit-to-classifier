/* ==========================================================================
   Python code blocks in the style of a code editor: syntax colours, line
   numbers, a file tab, a copy button and an output panel.

   Code.highlight(src)          -> HTML for the source, one <span class="cl"> per line
   Code.block(src, o)           -> HTML string for a whole code block
                                   o = { file: 'demo.py', output: '…', lang: 'Python' }
   Code.el(src, o)              -> the same block as a DOM element
   Copying is handled by one delegated click listener on [data-copy] (see app.js).
   ========================================================================== */
(function (root) {
  'use strict';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* keyword groups follow the usual editor themes: declarations and constants in one colour,
     control flow and imports in another */
  const KW_DECL = new Set('def class lambda None True False and or not in is global nonlocal del'.split(' '));
  const KW_CTRL = new Set('if elif else for while break continue return try except finally raise with yield pass import from as assert await async'.split(' '));
  const BUILTIN_FN = new Set(('print len enumerate zip sum abs min max round sorted reversed map filter any all isinstance ' +
    'issubclass open iter next pow divmod input format repr hash id hex bin oct ord chr super getattr setattr hasattr ' +
    'vars dir callable').split(' '));
  const BUILTIN_TYPE = new Set(('int float complex str list dict set tuple bool bytes object type range frozenset slice ' +
    'Exception ValueError TypeError IndexError KeyError ZeroDivisionError RuntimeError AssertionError').split(' '));

  const ID = /[A-Za-z_À-￿][\wÀ-￿]*/y;
  const NUM = /(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?[jJ]?|\.\d[\d_]*(?:[eE][+-]?\d+)?[jJ]?)/y;
  const STR = /([rRbBuUfF]{0,2})('''[\s\S]*?(?:'''|$)|"""[\s\S]*?(?:"""|$)|'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?)/y;
  const OP = /[+\-*/%=<>!&|^~@]+|[()[\]{},:;.]/y;

  function modulesOf(src) {
    const mods = new Set();
    for (const m of src.matchAll(/^\s*import\s+([^\n#]+)/gm)) {
      m[1].split(',').forEach(part => { const p = part.trim().split(/\s+as\s+/); if (p[1]) mods.add(p[1].trim()); else mods.add(p[0].trim().split('.')[0]); });
    }
    for (const m of src.matchAll(/^\s*from\s+([\w.]+)\s+import/gm)) mods.add(m[1].split('.')[0]);
    return mods;
  }

  /* tokens: [class, text]; classes are short names styled in styles.css (.t-kw, .t-str, …) */
  function tokenize(src, mods = modulesOf(src)) {
    const out = [];
    let i = 0, prevWord = '', lineStart = true;
    const push = (c, t) => { if (t) out.push([c, t]); };
    while (i < src.length) {
      const ch = src[i];
      if (ch === '\n') { push('', '\n'); i++; lineStart = true; continue; }
      if (ch === ' ' || ch === '\t' || ch === '\r') { let j = i; while (j < src.length && /[ \t\r]/.test(src[j])) j++; push('', src.slice(i, j)); i = j; continue; }
      if (ch === '#') { let j = src.indexOf('\n', i); if (j < 0) j = src.length; push('com', src.slice(i, j)); i = j; lineStart = false; continue; }
      if (ch === '@' && lineStart) { ID.lastIndex = i + 1; const m = ID.exec(src); if (m) { let j = ID.lastIndex; while (src[j] === '.' && (ID.lastIndex = j + 1, ID.exec(src))) j = ID.lastIndex; push('dec', src.slice(i, j)); i = j; lineStart = false; continue; } }
      STR.lastIndex = i; let m = STR.exec(src);
      if (m && (m[1] === '' || /^[rRbBuUfF]{1,2}$/.test(m[1])) && /['"]/.test(src[i + m[1].length] || '')) {
        if (/[fF]/.test(m[1])) fstring(m[1], m[2], out, mods); else push('str', m[0]);
        i += m[0].length; prevWord = ''; lineStart = false; continue;
      }
      ID.lastIndex = i; m = ID.exec(src);
      if (m) {
        const w = m[0], j = ID.lastIndex;
        let k = j; while (src[k] === ' ') k++;
        let c = 'var';
        if (KW_CTRL.has(w)) c = 'ctl';
        else if (KW_DECL.has(w)) c = 'kw';
        else if (prevWord === 'def') c = 'fn';
        else if (prevWord === 'class') c = 'type';
        else if (w === 'self' || w === 'cls') c = 'kw';
        else if (mods.has(w) && src[k] !== '(') c = 'mod';
        else if (BUILTIN_TYPE.has(w) && src[i - 1] !== '.') c = 'type';
        else if (src[k] === '(') c = 'fn';
        push(c, w); prevWord = w; i = j; lineStart = false; continue;
      }
      NUM.lastIndex = i; m = NUM.exec(src);
      if (m && m[0]) { push('num', m[0]); i = NUM.lastIndex; prevWord = ''; lineStart = false; continue; }
      OP.lastIndex = i; m = OP.exec(src);
      if (m) { push('op', m[0]); i = OP.lastIndex; if (m[0] !== '.') prevWord = ''; lineStart = false; continue; }
      push('', ch); i++; lineStart = false;
    }
    return out;
  }

  /* f-strings: the text is a string, each {expression} inside is highlighted as code */
  function fstring(prefix, body, out, mods) {
    const q = body.startsWith("'''") || body.startsWith('"""') ? 3 : 1;
    const open = body.slice(0, q), inner = body.slice(q, body.length - q >= q ? body.length - q : body.length), close = body.length >= 2 * q ? body.slice(body.length - q) : '';
    out.push(['str', prefix + open]);
    let i = 0, buf = '';
    while (i < inner.length) {
      const c = inner[i];
      if ((c === '{' || c === '}') && inner[i + 1] === c) { buf += c + c; i += 2; continue; }
      if (c === '{') {
        if (buf) { out.push(['str', buf]); buf = ''; }
        let depth = 1, j = i + 1;
        while (j < inner.length && depth) { if (inner[j] === '{') depth++; else if (inner[j] === '}') depth--; if (depth) j++; }
        out.push(['op', '{']);
        const expr = inner.slice(i + 1, j);
        const colon = topLevelColon(expr);
        tokenize(colon < 0 ? expr : expr.slice(0, colon), mods).forEach(t => out.push(t));
        if (colon >= 0) out.push(['str', expr.slice(colon)]);
        if (j < inner.length) out.push(['op', '}']);
        i = j + 1; continue;
      }
      buf += c; i++;
    }
    if (buf) out.push(['str', buf]);
    if (close) out.push(['str', close]);
  }
  function topLevelColon(expr) { // the format spec starts at the first ':' outside brackets and strings
    let d = 0, q = '';
    for (let i = 0; i < expr.length; i++) {
      const c = expr[i];
      if (q) { if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") q = c;
      else if ('([{'.includes(c)) d++;
      else if (')]}'.includes(c)) d--;
      else if (c === ':' && d === 0 && expr[i + 1] !== '=') return i;
      else if (c === '!' && d === 0 && /[rsa]/.test(expr[i + 1] || '') ) return i;
    }
    return -1;
  }

  function highlight(src) {
    const lines = [''];
    for (const [c, t] of tokenize(src.replace(/\s+$/, ''))) {
      const parts = t.split('\n');
      parts.forEach((p, k) => {
        if (k) lines.push('');
        if (p) lines[lines.length - 1] += c ? `<span class="t-${c}">${esc(p)}</span>` : esc(p);
      });
    }
    return lines.map(l => `<span class="cl">${l}</span>`).join('\n');
  }

  function block(src, o = {}) {
    const code = String(src).replace(/^\n+/, '').replace(/\s+$/, '');
    const file = o.file ? `<span class="code-file">${esc(o.file)}</span>` : `<span class="code-file">${esc(o.lang || 'Python')}</span>`;
    const out = o.output != null && String(o.output).trim() !== ''
      ? `<div class="code-out"><div class="code-out-bar">Output</div><pre class="code-out-pre">${esc(String(o.output).replace(/\s+$/, ''))}</pre></div>` : '';
    return `<div class="code${out ? ' has-out' : ''}"><div class="code-bar">${file}<span class="code-lang">${esc(o.lang || 'Python')}</span>` +
      `<button type="button" class="code-copy" data-copy aria-label="Copy the code${o.file ? ' in ' + esc(o.file) : ''}">Copy</button></div>` +
      `<pre class="code-pre" tabindex="0"><code class="code-src">${highlight(code)}</code></pre>${out}</div>`;
  }
  function el(src, o = {}) { const d = document.createElement('div'); d.innerHTML = block(src, o); return d.firstElementChild; }

  root.Code = { highlight, tokenize, block, el, esc };
})(window);

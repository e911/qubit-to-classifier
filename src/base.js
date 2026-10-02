/* ==========================================================================
   Chapter registry, prose helpers and the widget registry.

   A chapter is assembled from three places:
     src/chN.js        C.add({ id, part, num, title, init })   interactive code
     src/text/pN.js    C.text(id, { lede, html, quiz })         the words
     src/chN.js        C.widget(benchId, fn)                    extra benches
   The app merges C.texts into each chapter before showing it.
   ========================================================================== */
(function (root) {
  'use strict';
  const { h } = root.U;
  const PARTS = [
    { id: 0, label: 'Start here', title: 'The math toolkit' },
    { id: 1, label: 'Part I', title: 'One qubit' },
    { id: 2, label: 'Part II', title: 'Gates and measurement' },
    { id: 3, label: 'Part III', title: 'Many qubits' },
    { id: 4, label: 'Part IV', title: 'Circuits' },
    { id: 5, label: 'Part V', title: 'Algorithms' },
    { id: 6, label: 'Part VI', title: 'Noise and hardware' },
    { id: 7, label: 'Part VII', title: 'Quantum machine learning' },
    { id: 8, label: 'Appendix', title: 'Reference' }
  ];
  const strip = s => String(s).replace(/<[^>]+>/g, '');
  const C = {
    PARTS, list: [], pending: {}, texts: {}, widgets: {},
    add(ch) { this.list.push(ch); },
    text(id, o) { this.texts[id] = Object.assign(this.texts[id] || {}, o); },
    widget(benchId, fn) { this.widgets[benchId] = fn; },
    byId(id) { return this.list.find(c => c.id === id); },
    K: s => `<span class="m">|${s}⟩</span>`,
    B: s => `<span class="m">⟨${s}|</span>`,
    keyIdea: t => `<div class="keyidea"><span class="label">Key idea</span><p>${t}</p></div>`,
    tryThis: items => `<div class="try"><p class="try-title">Try this</p><ul>${items.map(t => `<li><label><input type="checkbox"><span>${t}</span></label></li>`).join('')}</ul></div>`,
    bench: (id, title, hint = '') => `<section class="bench" data-bench="${id}" aria-label="${strip(title)}"><div class="bench-title"><h3>${title}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}</div><div class="bench-body"></div></section>`,
    body: (root, id) => root.querySelector(`[data-bench="${id}"] .bench-body`),

    /* "In this chapter" box: goals plus the chapters it builds on (by id) */
    objectives(items, prereq = []) {
      const pre = prereq.length ? `<p class="obj-pre">Builds on ${prereq.map(id => `<a href="#${id}" data-ch="${id}">${id}</a>`).join(', ')}</p>` : '';
      return `<div class="objectives"><p class="obj-label">In this chapter you will</p><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul>${pre}</div>`;
    },
    /* Worked example: a title and numbered steps (HTML strings) */
    worked(title, steps, after = '') {
      const body = Array.isArray(steps) ? `<ol class="steps">${steps.map(s => `<li>${s}</li>`).join('')}</ol>` : steps;
      return `<div class="worked"><p class="worked-label">Worked example</p><p class="worked-title">${title}</p>${body}${after ? `<p class="worked-after">${after}</p>` : ''}</div>`;
    },
    pitfall: (title, html) => `<div class="pitfall"><p class="pitfall-label"><span class="pitfall-mark" aria-hidden="true">!</span>Common confusion</p><p class="pitfall-title">${title}</p><div class="pitfall-body">${html}</div></div>`,
    deeper: (title, html) => `<details class="deeper"><summary><span class="deeper-tag">Math behind it</span><span class="deeper-title">${title}</span></summary><div class="deeper-body">${html}</div></details>`,
    define: (term, html) => `<div class="define"><p class="define-label">Definition</p><p class="define-term"><dfn>${term}</dfn></p><div class="define-body">${/^\s*<(p|ul|ol|div|table)\b/.test(html) ? html : `<p>${html}</p>`}</div></div>`,
    recap: items => `<div class="recap"><p class="recap-label">Recap</p><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul></div>`,
    /* aligned derivation: rows of [left, right, note, relation='='] → "left = right   note".
       Leave left empty ('') on continuation lines. */
    align(rows) {
      return `<div class="align" role="math">${rows.map(([l, r, n, rel = '=']) => `<span class="al-l">${l}</span><span class="al-eq">${rel}</span><span class="al-r">${r}</span><span class="al-n">${n || ''}</span>`).join('')}</div>`;
    },
    /* inline math, display formula, cross-reference to a chapter by id */
    M: s => `<span class="m">${s}</span>`,
    F: s => `<div class="formula">${s}</div>`,
    ref: id => `<a href="#${id}" data-ch="${id}">${id}</a>`,
    /* static circuit figure: build(B) returns a circuit made with the builder B(n) from sim.js,
       o = { inputs: ['|0⟩', …], caption, colNums: true } */
    circs: {}, _ck: 0,
    circ(build, o = {}) {
      const k = 'circ' + (++C._ck); C.circs[k] = { build, o };
      return `<figure class="figure circ-fig" data-circ="${k}">${o.caption ? `<figcaption>${o.caption}</figcaption>` : ''}</figure>`;
    },
    /* static matrix / column vector in the same style as the live ones */
    mat(rows, cls = '') { return `<span class="mat ${cls}" style="grid-template-columns:repeat(${rows[0].length},auto)">${rows.flat().map(x => `<span>${x}</span>`).join('')}</span>`; },
    vec(items, cls = '') { return C.mat(items.map(x => [x]), cls); },
    table(head, rows, cls = '') {
      return `<div class="table-wrap"><table class="dtable ${cls}"><thead><tr>${head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((x, i) => i === 0 ? `<th scope="row">${x}</th>` : `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    },
    /* Questions are written with any answer index; the options are shown in a fixed,
       shuffled order (seeded by the question text) so the right answer moves around.
       Set keep: true on a question to show its options in the written order. */
    quiz(host, qs) {
      const wrap = h('div', { class: 'quiz' });
      const score = h('p', { class: 'note', 'aria-live': 'polite' });
      let answered = 0, right = 0;
      const order = q => {
        const idx = q.options.map((_, i) => i);
        if (q.keep) return idx;
        let s = 2166136261;
        for (const ch of String(q.q)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
        const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
        return idx;
      };
      qs.forEach((q, qi) => {
        const box = h('div', { class: 'q' });
        box.appendChild(h('p', { class: 'q-prompt', html: `${qi + 1}. ${q.q}` }));
        const opts = h('div', { class: 'q-opts' });
        const expl = h('p', { class: 'q-explain', hidden: true, html: q.why });
        const ord = order(q);
        ord.forEach(oi => {
          const b = h('button', { type: 'button', html: q.options[oi] });
          b.addEventListener('click', () => {
            opts.querySelectorAll('button').forEach((bb, k) => { bb.disabled = true; if (ord[k] === q.answer) bb.classList.add('right'); });
            if (oi !== q.answer) b.classList.add('wrong'); else right++;
            answered++; expl.hidden = false;
            score.textContent = `${right} of ${answered} answered correctly` + (answered === qs.length ? '.' : ' so far.');
          });
          opts.appendChild(b);
        });
        box.append(opts, expl); wrap.appendChild(box);
      });
      wrap.appendChild(score);
      host.appendChild(wrap);
    },
    quizSection(title = 'Check yourself') { return `<h2>${title}</h2><div data-quiz></div>`; }
  };
  root.C = C;
})(window);

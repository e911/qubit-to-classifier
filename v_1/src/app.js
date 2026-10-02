/* App shell: syllabus rail, routing, home page, progress. */
(function (root) {
  'use strict';
  const { h, $, $$, storage, Theme, reduceMotion, animate, angle } = root.U;
  const C = root.C, Q = root.QSim, PI = Math.PI;
  const rail = $('#rail'), main = $('#main');
  let leave = [], currentId = null;
  const seen = new Set(storage.get('seen', []));

  // merge the words (src/text/*.js) into the chapter objects
  C.list.forEach(ch => Object.assign(ch, C.texts[ch.id] || {}));
  const courseChapters = C.list.filter(c => c.part !== 8);

  const partOf = id => C.PARTS.find(p => p.id === id);
  function chapterLink(ch, cls = '') {
    return h('a', { href: '#' + ch.id, class: cls, 'data-id': ch.id },
      h('span', { class: 'num', text: ch.num }), h('span', { text: ch.title }), h('span', { class: 'seen' + (seen.has(ch.id) ? ' on' : ''), 'aria-hidden': 'true' }));
  }
  function buildRail() {
    rail.innerHTML = '';
    rail.appendChild(h('a', { href: '#home', class: 'brand', 'aria-label': 'Qubit to Classifier, course home' },
      h('span', { class: 'brand-name', text: 'Qubit to Classifier' }), h('span', { class: 'brand-sub', text: 'A visual course in quantum circuits and quantum machine learning' })));
    const count = C.list.filter(c => seen.has(c.id)).length;
    rail.appendChild(h('div', { class: 'progress' }, h('span', { text: `${count} of ${C.list.length} chapters opened` }), h('div', { class: 'meter' }, h('span', { style: { width: (100 * count / C.list.length) + '%' } }))));
    const toc = h('nav', { class: 'toc', 'aria-label': 'Chapters' });
    for (const p of C.PARTS) {
      const chs = C.list.filter(c => c.part === p.id); if (!chs.length) continue;
      toc.appendChild(h('div', { class: 'toc-part' }, h('p', { class: 'toc-part-title', text: `${p.label} · ${p.title}` }), ...chs.map(c => chapterLink(c))));
    }
    rail.appendChild(toc);
    markCurrent();
  }
  function markCurrent() { $$('.toc a', rail).forEach(a => { if (a.dataset.id === currentId) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }

  /* ---------------- home ---------------- */
  const HOME = {
    id: 'home',
    render(art, ctx) {
      const hero = h('div', { class: 'hero wide' });
      const text = h('div', {},
        h('p', { class: 'eyebrow', text: `A visual course · math toolkit + 7 parts · ${courseChapters.length} chapters` }),
        h('h1', { text: 'Qubit to Classifier' }),
        h('p', { class: 'lede', html: 'Learn quantum computing from the very beginning by watching it work. Start with the math you need, turn Bloch spheres, step through circuits gate by gate, watch entanglement shrink the arrows, then train a quantum classifier in your browser. Every picture is computed live on this page by an exact simulator, not pre-drawn.' }),
        h('div', { class: 'row', style: { marginTop: '18px' } },
          h('a', { href: '#complex', class: 'btn primary', style: { textDecoration: 'none' }, text: 'Start with the math toolkit' }),
          h('a', { href: '#qubit', class: 'btn', style: { textDecoration: 'none' }, text: 'Skip to qubits (1.1)' }),
          h('a', { href: '#lab', class: 'btn ghost', style: { textDecoration: 'none' }, text: 'Open the Circuit Lab' })));
      const demo = h('div', { class: 'hero-demo' });
      const sph = h('div', { style: { width: '100%', maxWidth: '380px' } });
      const cap = h('div', { class: 'hero-gate', 'aria-live': 'off' });
      demo.append(sph, cap);
      hero.append(text, demo);
      art.appendChild(hero);
      const bv = new root.V.BlochView(sph, { maxSize: 380, shadow: true });
      const seq = [['H', null], ['T', null], ['T', null], ['H', null], ['RY', PI / 3], ['S', null], ['X', null], ['RZ', PI / 2], ['H', null], ['SDG', null], ['RX', -PI / 2]];
      let v = [1, 0, 0, 0], i = 0, alive = true;
      ctx.onLeave(() => { alive = false; });
      const axisTxt = n => Math.abs(n[0] - 1) < 1e-6 ? 'x' : Math.abs(n[1] - 1) < 1e-6 ? 'y' : Math.abs(n[2] - 1) < 1e-6 ? 'z' : Math.abs(n[2] + 1) < 1e-6 ? '−z' : 'x+z';
      const describe = (g, p) => { const r = Q.gateRotation(g, p); const L = root.CircuitLab.LABEL[g] + (p !== null ? `(${angle(p)})` : ''); return `${L}: turn ${angle(r.theta)} about the ${axisTxt(r.n)} axis`; };
      bv.set({ vectors: [{ v: Q.blochOf(v), main: true }] });
      cap.textContent = 'Every single-qubit gate is a rotation of this sphere.';
      (async () => {
        await new Promise(r => setTimeout(r, 900));
        while (alive && art.isConnected) {
          const [g, p] = seq[i % seq.length]; i++;
          const m = Q.gateMatrix(g, p ?? undefined), r = Q.gateRotation(g, p ?? undefined), b0 = Q.blochOf(v), trail = [b0];
          cap.textContent = describe(g, p);
          if (reduceMotion()) { v = Q.m2apply(m, v); bv.set({ vectors: [{ v: Q.blochOf(v), main: true }], axis: r.n, trail: [] }); await new Promise(res => setTimeout(res, 2500)); continue; }
          bv.set({ axis: r.n });
          await animate(900 + 500 * Math.abs(r.theta) / PI, k => { const b = Q.rotateVec(b0, r.n, r.theta * k); trail.push(b); bv.set({ vectors: [{ v: b, main: true }], trail }); }, { cancelled: () => !alive });
          v = Q.m2apply(m, v);
          await new Promise(res => setTimeout(res, 900));
        }
      })();
      art.appendChild(h('h2', { class: 'wide', text: 'How to use it' }));
      art.appendChild(h('ul', { class: 'wide', html: [
        'Go in order if quantum computing is new to you. If you are comfortable with complex numbers and matrices, skim Part 0 and start at chapter 1.1.',
        'Each chapter opens with what you will learn and ends with a <b>recap</b> and a short <b>quiz</b> that explains every answer.',
        '<b>Worked examples</b> show every step of the arithmetic. Try each one on paper before you read the steps.',
        '<b>Math behind it</b> sections are optional on a first read. Open them when you want the full derivation.',
        '<b>Common confusion</b> boxes flag the mistakes nearly everyone makes once.',
        '<b>Drag</b> any Bloch sphere to turn it; on some you can drag the arrow itself. Double-click resets the view. Step through circuits with ▶, or click a column number to jump there.',
        'Your progress and ticked experiments are remembered in this browser only.'
      ].map(t => `<li>${t}</li>`).join('') }));
      art.appendChild(h('h2', { class: 'wide', text: 'The course' }));
      const map = h('div', { class: 'course-map wide' });
      const blurbs = {
        0: 'Complex numbers, vectors, matrices and eigenvectors: everything the rest of the course assumes, built from scratch.',
        1: 'Amplitudes, probabilities, phase and the Bloch sphere.', 2: 'Gates as rotations; measurement as projection.',
        3: 'Tensor products, controlled gates, entanglement.', 4: 'A full circuit lab, interference, identities.',
        5: 'Teleportation, oracles, Grover, QFT.', 6: 'Mixed states, noise channels, real hardware.',
        7: 'Encoding, trainable circuits, gradients, kernels, trainability.', 8: 'Glossary, notation and formula sheet.'
      };
      for (const p of C.PARTS) {
        const chs = C.list.filter(c => c.part === p.id); if (!chs.length) continue;
        const ol = h('ol'); chs.forEach(c => ol.appendChild(h('li', {}, h('a', { href: '#' + c.id }, h('span', { class: 'num', text: c.num }), h('span', { text: c.title })))));
        map.appendChild(h('div', { class: 'map-part' }, h('p', { class: 'eyebrow', text: p.label }), h('h3', { text: p.title }), blurbs[p.id] ? h('p', { class: 'note', style: { margin: '0 0 6px' }, text: blurbs[p.id] }) : null, ol));
      }
      art.appendChild(map);
      art.appendChild(h('h2', { class: 'wide', text: 'Conventions' }));
      art.appendChild(h('div', { class: 'conventions wide', html: `
        <div><b>Qubit order</b>q0 is the top wire and the leftmost bit: |q0 q1⟩. Qiskit prints the reverse.</div>
        <div><b>Colour = phase</b>A cyclic wheel: blue is a positive amplitude, amber a negative one. A needle or arrow always carries the same information.</div>
        <div><b>Exact simulation</b>Up to 10 qubits are simulated exactly in your browser; "shots" add realistic sampling noise.</div>
        <div><b>Background assumed</b>High-school algebra and a little trigonometry. Part 0 builds complex numbers and matrices from scratch.</div>` }));
    }
  };

  /* ---------------- chapter extras ---------------- */
  function readingMinutes(html) {
    const words = String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.round(words / 200));
  }
  function afterInit(ch, art, ctx) {
    // widgets registered with C.widget for benches that the chapter's own init did not fill
    art.querySelectorAll('[data-bench]').forEach(b => {
      const id = b.dataset.bench, fn = C.widgets[id], body = b.querySelector('.bench-body');
      if (fn && body && !body.childElementCount) {
        try { fn(body, ctx, art); } catch (e) { console.error('widget failed', id, e); }
      }
    });
    // static circuit figures from C.circ
    art.querySelectorAll('[data-circ]').forEach(fig => {
      const spec = C.circs[fig.dataset.circ]; if (!spec || fig.querySelector('.circuit-scroll')) return;
      try {
        const b = spec.build(n => Q.builder(n)), holder = h('div');
        fig.insertBefore(holder, fig.firstChild);
        const v = new root.CircuitLab.CircuitView(holder, { static: true, showPlayhead: false, inputs: spec.o.inputs, colNums: spec.o.colNums, label: spec.o.label });
        v.set({ n: b.n, cols: b.cols });
      } catch (e) { console.error('circuit figure failed', e); }
    });
    // per-chapter quiz
    const qh = art.querySelector('[data-quiz]');
    if (qh && !qh.childElementCount && ch.quiz && ch.quiz.length) C.quiz(qh, ch.quiz);
    // cross-references: <a data-ch="id"> gets the chapter number and title
    art.querySelectorAll('a[data-ch]').forEach(a => { const t = C.byId(a.dataset.ch); if (t) a.textContent = `${t.num} ${t.title}`; });
  }

  /* ---------------- routing ---------------- */
  function show(id) {
    leave.forEach(f => { try { f(); } catch (e) { console.error(e); } }); leave = [];
    root.U.Tip.hide();
    const idx = C.list.findIndex(c => c.id === id);
    const ch = idx >= 0 ? C.list[idx] : null;
    currentId = ch ? ch.id : 'home';
    main.innerHTML = '';
    const art = h('article', { class: 'chapter', id: 'chapter-' + currentId });
    main.appendChild(art);
    const ctx = { onLeave: f => leave.push(f), go: gid => { location.hash = gid; } };
    if (!ch) {
      document.title = 'Qubit to Classifier';
      HOME.render(art, ctx);
      $('.topbar .where').textContent = '';
    } else {
      const p = partOf(ch.part);
      const benches = (String(ch.html || '').match(/data-bench=/g) || []).length;
      const meta = [`About ${readingMinutes(ch.html)} minutes of reading`];
      if (benches) meta.push(`${benches} interactive panel${benches > 1 ? 's' : ''}`);
      if (ch.quiz && ch.quiz.length) meta.push(`${ch.quiz.length}-question quiz`);
      art.appendChild(h('header', { class: 'ch-head' },
        h('p', { class: 'eyebrow', text: p.id === 8 ? `Appendix · ${p.title}` : `${p.label} · ${p.title} · Chapter ${ch.num}` }),
        h('h1', { text: ch.title }), h('p', { class: 'lede', html: ch.lede || '' }),
        p.id === 8 ? null : h('p', { class: 'ch-meta' }, ...meta.map(t => h('span', { text: t })))));
      const body = h('div', { html: ch.html || '' });
      while (body.firstChild) art.appendChild(body.firstChild);
      try { ch.init && ch.init(art, ctx); } catch (e) { console.error('chapter init failed', ch.id, e); }
      afterInit(ch, art, ctx);
      const prev = C.list[idx - 1], next = C.list[idx + 1];
      art.appendChild(h('nav', { class: 'ch-nav', 'aria-label': 'Chapter navigation' },
        prev ? h('a', { href: '#' + prev.id, class: 'prev' }, h('small', { text: '← Previous' }), h('span', { text: `${prev.num} ${prev.title}` })) : h('a', { href: '#home', class: 'prev' }, h('small', { text: '← Course home' }), h('span', { text: 'Qubit to Classifier' })),
        next ? h('a', { href: '#' + next.id, class: 'next' }, h('small', { text: 'Next →' }), h('span', { text: `${next.num} ${next.title}` })) : h('span')));
      document.title = `${ch.title} · Qubit to Classifier`;
      $('.topbar .where').textContent = `${ch.num} ${ch.title}`;
      if (!seen.has(ch.id)) { seen.add(ch.id); storage.set('seen', [...seen]); buildRail(); }
      const boxes = $$('.try input', art), key = 'try:' + ch.id, saved = storage.get(key, []);
      boxes.forEach((b, i) => { b.checked = !!saved[i]; b.addEventListener('change', () => storage.set(key, boxes.map(x => x.checked))); });
    }
    storage.set('last', currentId);
    markCurrent();
    closeRail();
    window.scrollTo(0, 0);
    const h1 = $('h1', art); if (h1) { h1.setAttribute('tabindex', '-1'); try { h1.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
  }
  function route() { const id = location.hash.replace('#', '') || 'home'; show(id); }

  /* ---------------- mobile rail ---------------- */
  let scrim = null;
  function openRail() { rail.classList.add('open'); scrim = h('div', { class: 'scrim', onclick: closeRail }); document.body.appendChild(scrim); $('.topbar button').setAttribute('aria-expanded', 'true'); }
  function closeRail() { rail.classList.remove('open'); if (scrim) { scrim.remove(); scrim = null; } const b = $('.topbar button'); if (b) b.setAttribute('aria-expanded', 'false'); }
  $('.topbar button').addEventListener('click', () => rail.classList.contains('open') ? closeRail() : openRail());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRail(); });

  buildRail();
  window.addEventListener('hashchange', route);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => Theme._fire());
  route();
})(window);

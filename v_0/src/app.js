/* App shell: syllabus rail, routing, home page, progress. */
(function (root) {
  'use strict';
  const { h, $, $$, storage, Theme, reduceMotion, animate, angle } = root.U;
  const C = root.C, Q = root.QSim, PI = Math.PI;
  const rail = $('#rail'), main = $('#main');
  let leave = [], currentId = null;
  const seen = new Set(storage.get('seen', []));

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
      toc.appendChild(h('div', { class: 'toc-part' }, h('p', { class: 'toc-part-title', text: (p.id <= 7 ? 'Part ' + p.roman + ' · ' : '') + p.title }), ...chs.map(c => chapterLink(c))));
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
        h('p', { class: 'eyebrow', text: 'A visual course · 7 parts · 25 chapters' }),
        h('h1', { text: 'Qubit to Classifier' }),
        h('p', { class: 'lede', html: 'Learn quantum circuits by watching them work. Turn Bloch spheres, step through circuits gate by gate, watch entanglement shrink the arrows, then train a quantum classifier in your browser. Every picture is computed live on this page by an exact simulator, not pre-drawn.' }),
        h('div', { class: 'row', style: { marginTop: '18px' } },
          h('a', { href: '#qubit', class: 'btn primary', style: { textDecoration: 'none' }, text: 'Start with chapter 1.1' }),
          h('a', { href: '#lab', class: 'btn', style: { textDecoration: 'none' }, text: 'Open the Circuit Lab' }),
          h('a', { href: '#train', class: 'btn ghost', style: { textDecoration: 'none' }, text: 'Jump to the classifier' })));
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
      const describe = (g, p) => { const r = Q.gateRotation(g, p); const L = root.CircuitLab.LABEL[g] + (p !== null ? `(${angle(p)})` : ''); return `${L}: turn ${angle(r.theta)} about the ${axisTxt(r.n)} axis`; };
      const axisTxt = n => Math.abs(n[0] - 1) < 1e-6 ? 'x' : Math.abs(n[1] - 1) < 1e-6 ? 'y' : Math.abs(n[2] - 1) < 1e-6 ? 'z' : Math.abs(n[2] + 1) < 1e-6 ? '−z' : 'x+z';
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
      // how to
      art.appendChild(h('h2', { class: 'wide', text: 'How to use it' }));
      art.appendChild(h('ul', { class: 'wide', html: '<li><b>Drag</b> any Bloch sphere to turn it; on some you can drag the arrow itself. Double-click resets the view.</li><li><b>Step</b> through circuits with ▶, or click a column number to jump there.</li><li><b>Try this</b> boxes suggest experiments; tick them off as you go. Each part ends with three quick questions.</li><li>Your progress is remembered in this browser only.</li>' }));
      // course map
      art.appendChild(h('h2', { class: 'wide', text: 'The course' }));
      const map = h('div', { class: 'course-map wide' });
      const blurbs = { 1: 'Amplitudes, phase and the Bloch sphere.', 2: 'Gates as rotations; measurement as projection.', 3: 'Tensor products, controlled gates, entanglement.', 4: 'A full circuit lab, interference, identities.', 5: 'Teleportation, oracles, Grover, QFT.', 6: 'Mixed states, noise channels, real hardware.', 7: 'Encoding, trainable circuits, gradients, kernels, trainability.', 8: '' };
      for (const p of C.PARTS) {
        const chs = C.list.filter(c => c.part === p.id); if (!chs.length) continue;
        const ol = h('ol'); chs.forEach(c => ol.appendChild(h('li', {}, h('a', { href: '#' + c.id }, h('span', { class: 'num', text: c.num }), h('span', { text: c.title })))));
        map.appendChild(h('div', { class: 'map-part' }, h('p', { class: 'eyebrow', text: p.id <= 7 ? 'Part ' + p.roman : 'Appendix' }), h('h3', { text: p.title }), blurbs[p.id] ? h('p', { class: 'note', style: { margin: '0 0 6px' }, text: blurbs[p.id] }) : null, ol));
      }
      art.appendChild(map);
      art.appendChild(h('h2', { class: 'wide', text: 'Conventions' }));
      art.appendChild(h('div', { class: 'conventions wide', html: `
        <div><b>Qubit order</b>q0 is the top wire and the leftmost bit: |q0 q1⟩. Qiskit prints the reverse.</div>
        <div><b>Colour = phase</b>A cyclic wheel: blue is a positive amplitude, amber a negative one. A needle or arrow always carries the same information.</div>
        <div><b>Exact simulation</b>Up to 10 qubits are simulated exactly in your browser; "shots" add realistic sampling noise.</div>
        <div><b>Background assumed</b>Complex numbers and matrix–vector products. Everything else is introduced as it is needed.</div>` }));
    }
  };

  /* ---------------- routing ---------------- */
  function show(id, push = false) {
    leave.forEach(f => { try { f(); } catch (e) { console.error(e); } }); leave = [];
    root.U.Tip.hide();
    const idx = C.list.findIndex(c => c.id === id);
    const ch = idx >= 0 ? C.list[idx] : null;
    currentId = ch ? ch.id : 'home';
    if (push && location.hash.slice(1) !== currentId) { history.pushState(null, '', '#' + currentId); }
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
      art.appendChild(h('header', { class: 'ch-head' },
        h('p', { class: 'eyebrow', text: (p.id <= 7 ? `Part ${p.roman} · ${p.title} · Chapter ${ch.num}` : 'Appendix') }),
        h('h1', { text: ch.title }), h('p', { class: 'lede', html: ch.lede })));
      const body = h('div', { html: ch.html });
      while (body.firstChild) art.appendChild(body.firstChild);
      try { ch.init && ch.init(art, ctx); } catch (e) { console.error('chapter init failed', ch.id, e); }
      const prev = C.list[idx - 1], next = C.list[idx + 1];
      art.appendChild(h('nav', { class: 'ch-nav', 'aria-label': 'Chapter navigation' },
        prev ? h('a', { href: '#' + prev.id, class: 'prev' }, h('small', { text: '← Previous' }), h('span', { text: `${prev.num} ${prev.title}` })) : h('a', { href: '#home', class: 'prev' }, h('small', { text: '← Course home' }), h('span', { text: 'Qubit to Classifier' })),
        next ? h('a', { href: '#' + next.id, class: 'next' }, h('small', { text: 'Next →' }), h('span', { text: `${next.num} ${next.title}` })) : h('span')));
      document.title = `${ch.title} · Qubit to Classifier`;
      $('.topbar .where').textContent = `${ch.num} ${ch.title}`;
      if (!seen.has(ch.id)) { seen.add(ch.id); storage.set('seen', [...seen]); buildRail(); }
      // remember ticked experiments per chapter
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

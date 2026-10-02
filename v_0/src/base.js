/* Chapter registry and prose helpers. */
(function (root) {
  'use strict';
  const { h } = root.U;
  const PARTS = [
    { id: 1, roman: 'I', title: 'One qubit' },
    { id: 2, roman: 'II', title: 'Gates and measurement' },
    { id: 3, roman: 'III', title: 'Many qubits' },
    { id: 4, roman: 'IV', title: 'Circuits' },
    { id: 5, roman: 'V', title: 'Algorithms' },
    { id: 6, roman: 'VI', title: 'Noise and hardware' },
    { id: 7, roman: 'VII', title: 'Quantum machine learning' },
    { id: 8, roman: 'A', title: 'Appendix' }
  ];
  const C = {
    PARTS, list: [], pending: {},
    add(ch) { this.list.push(ch); },
    K: s => `<span class="m">|${s}⟩</span>`,
    keyIdea: t => `<div class="keyidea"><span class="label">Key idea</span><p>${t}</p></div>`,
    tryThis: items => `<div class="try"><p class="try-title">Try this</p><ul>${items.map(t => `<li><label><input type="checkbox"><span>${t}</span></label></li>`).join('')}</ul></div>`,
    bench: (id, title, hint = '') => `<section class="bench" data-bench="${id}" aria-label="${title.replace(/<[^>]+>/g, '')}"><div class="bench-title"><h3>${title}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}</div><div class="bench-body"></div></section>`,
    body: (root, id) => root.querySelector(`[data-bench="${id}"] .bench-body`),
    quiz(host, qs) {
      const wrap = h('div', { class: 'quiz' });
      const score = h('p', { class: 'note', 'aria-live': 'polite' });
      let answered = 0, right = 0;
      qs.forEach((q, qi) => {
        const box = h('div', { class: 'q' });
        box.appendChild(h('p', { class: 'q-prompt', html: `${qi + 1}. ${q.q}` }));
        const opts = h('div', { class: 'q-opts' });
        const expl = h('p', { class: 'q-explain', hidden: true, html: q.why });
        q.options.forEach((o, oi) => {
          const b = h('button', { type: 'button', html: o });
          b.addEventListener('click', () => {
            opts.querySelectorAll('button').forEach((bb, k) => { bb.disabled = true; if (k === q.answer) bb.classList.add('right'); });
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

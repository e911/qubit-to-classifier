# Qubit to Classifier

An interactive, visual course on quantum computing from the very beginning, ending with hands-on quantum machine learning. It starts with complex numbers and matrices, so the only background it assumes is high-school algebra and a little trigonometry.

Everything on the page is computed live in the browser by an exact state-vector simulator: drag Bloch spheres, step through circuits gate by gate, watch entanglement shrink the arrows, and train a quantum classifier with parameter-shift gradients.

Every chapter also has Python to practise with: worked examples to run and exercises with hints and solutions, shown in editor-style syntax colours next to the output they print. The same code is in the `practice/` folder as scripts and Jupyter notebooks.

No frameworks, no build step to run it, no server code: plain HTML, CSS and JavaScript.

## Contents

| Part | Chapters |
|---|---|
| 0 · The math toolkit | 0.1 Complex numbers · 0.2 Vectors, matrices and Dirac notation · 0.3 Eigenvectors, unitary and Hermitian matrices |
| I · One qubit | 1.1 Bits and qubits · 1.2 Phase · 1.3 The Bloch sphere |
| II · Gates and measurement | 2.1 Gates are rotations · 2.2 Measurement and bases (incl. tomography) |
| III · Many qubits | 3.1 Tensor product · 3.2 Multi-qubit gates and phase kickback · 3.3 Entanglement and CHSH |
| IV · Circuits | 4.1 Circuit Lab (drag-and-drop, step-through, unitary view, Qiskit export, exercises) · 4.2 Interference · 4.3 Identities and universality |
| V · Algorithms | 5.1 Teleportation and superdense coding · 5.2 Deutsch–Jozsa and Bernstein–Vazirani · 5.3 Grover · 5.4 QFT, phase estimation and Shor |
| VI · Noise and hardware | 6.1 Density matrices and noise channels · 6.2 T1/T2, routing, readout, mitigation vs correction |
| VII · Quantum machine learning | 7.1 Machine-learning basics and the variational loop · 7.2 Encoding data · 7.3 Circuits as models · 7.4 Parameter-shift rule · 7.5 Train a classifier · 7.6 Quantum kernels · 7.7 Barren plateaus · 7.8 Where to go next (NumPy simulator, PennyLane code, reading list) |
| Appendix | A Glossary, notation and conventions (searchable, about 160 terms) · B Formula sheet |

Every chapter follows the same pattern:

- **In this chapter you will**: the goals, and the earlier chapters it builds on.
- **Worked examples** with every step of the arithmetic shown (86 in total).
- **Math behind it**: optional derivations, folded away on a first read.
- **Common confusion**: the mistakes nearly everyone makes once.
- **Interactive panels** (60 in total) next to the idea they illustrate.
- **Key idea**, **Try this** experiments, a **Recap**, and a short **quiz** that explains every answer (167 questions in all).
- **Practice in Python**: examples to run and exercises with full solutions, most with a hint (27 examples and 63 exercises), each with the output it prints.

## Practice in Python

The `practice/` folder has the Python from every chapter as plain scripts, one folder per chapter (`practice/0.1-complex/`, `practice/1.1-qubit/`, …):

- `demo*.py` are worked examples; `exercise*.py` are exercises whose solution is the code below the task in the docstring.
- `practice/notebooks/` has one Jupyter notebook per part: the examples ready to run, the exercises with empty or starter cells, and every solution with its expected output at the end. They open in Jupyter, VS Code or Google Colab.

Everything needs only Python 3 and NumPy (`pip install numpy`); one optional exercise in 4.1 uses Qiskit. See `practice/README.md` for how to add an exercise.

## Run it locally

Open `index.html` in a browser. That's it.

If your browser is strict about local files, serve the folder instead:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publish on GitHub Pages

1. Create a new repository on GitHub, for example `qubit-to-classifier` (public, unless your plan allows Pages for private repos).
2. Push this folder to it:

   ```bash
   cd qubit-to-classifier
   git init
   git add .
   git commit -m "Qubit to Classifier course"
   git branch -M main
   git remote add origin https://github.com/<your-username>/qubit-to-classifier.git
   git push -u origin main
   ```

3. On GitHub, open the repository's **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose branch **main** and folder **/ (root)**, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/qubit-to-classifier/`.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are, without running Jekyll.

Updating an existing site: replace the files in your repository with these, then `git add . && git commit -m "Expanded chapters" && git push`.

## Project structure

```
index.html            page shell; loads the stylesheet and scripts in order
src/
  styles.css          design tokens (light and dark themes) and all styles
  sim.js              exact state-vector simulator: gates, circuits, measurement, unitaries
  qml.js              datasets, re-uploading classifier, parameter-shift training, kernels, barren-plateau experiment
  util.js             DOM helpers, number/ket formatting, theme tokens, phase colours, controls
  viz.js              Bloch sphere, circle notation, bar and line charts, heatmaps, matrices
  circuit.js          circuit renderer, Circuit Lab, worked examples, Qiskit export
  code.js             Python syntax colouring and the editor-style code blocks (file tab, line numbers, Copy, output)
  base.js             chapter registry and the prose helpers (worked examples, quizzes, figures, practice …)
  ch0.js … ch7b.js    interactive code for each part: chapter registration and the panels
  text/
    p0.js … p7.js     the words for each part: ledes, explanations, worked examples, quizzes
    appendix.js       conventions, symbols, Greek letters and the formula sheet
    practice.js       the Python practice sections (generated from practice/; don't edit by hand)
  app.js              navigation, hash routing, home page, progress
practice/
  0.1-complex/ …      one folder per chapter: demo*.py and exercise*.py, each a complete program
  notebooks/          one Jupyter notebook per part (generated)
test/
  sim.test.js         358 physics checks (Bell/GHZ, QFT, Grover, teleportation, identities …)
  qml.test.js         gradient checks plus training, kernel and barren-plateau experiments
  smoke.py            opens every chapter in headless Chromium (desktop/phone, light/dark)
  interact.py         drives the widgets and checks what they display
tools/
  bundle.py           packs everything into one self-contained HTML file
  build_practice.py   runs every practice script and rebuilds src/text/practice.js and the notebooks
CHANGELOG.md          what changed between versions, including content corrections
```

## Editing

A chapter is assembled from three places:

| Where | What | Example |
|---|---|---|
| `src/chN.js` | `C.add({ id, part, num, title, init })`: registers the chapter; `init(root, ctx)` fills its panels | `C.add({ id: 'bloch', part: 1, num: '1.3', title: 'The Bloch sphere', init(root) { … } })` |
| `src/text/pN.js` | `C.text(id, { lede, html, quiz })`: the words | `C.text('bloch', { lede: '…', html: \`…\`, quiz: [ … ] })` |
| `src/chN.js` | `C.widget(benchId, fn(body, ctx, root))`: an extra panel, filled automatically when the chapter opens | `C.widget('bloch-pair', body => { … })` |
| `practice/<num>-<id>/` | Python examples and exercises; run `python3 tools/build_practice.py` after editing | `practice/1.3-bloch/exercise1.py` |

The order of the `C.add` calls (and of the script tags) is the order in the menu. Inside `html`, these helpers from `src/base.js` keep every chapter consistent:

- `C.objectives(items, prereqIds)`, `C.recap(items)`, `C.keyIdea(text)`, `C.tryThis(items)`
- `C.worked(title, steps, after)`, `C.pitfall(title, html)` (common confusion), `C.deeper(title, html)` (math behind it), `C.define(term, html)`
- `C.bench(id, title, hint)`: a panel; its id must match a `C.body(root, id)` in `init` or a `C.widget(id, …)`
- `C.circ(B => B(2).g('H', 0).cx(0, 1), { caption })`: a static circuit figure drawn with the simulator's circuit builder
- `C.F(formula)`, `C.M(inline)`, `C.mat(rows)`, `C.vec(items)`, `C.align(rows)`, `C.table(head, rows)`
- `C.ref('lab')`: a link to another chapter, shown as its number and title
- `C.quizSection()` plus `quiz: [{ q, options, answer, why }]`. Write the options in any order; they are shown in a fixed shuffled order so the right answer moves around.
- `C.code(source, { file, output })`: a Python block with syntax colours, a Copy button and an optional output panel.

The practice section goes where the chapter's text has `<div data-practice></div>`; without one it goes just before the recap.

Colours and fonts are CSS variables at the top of `src/styles.css`; the dark theme redefines the same variables.

Conventions: qubit 0 is the top wire and the leftmost bit, `|q0 q1 …⟩` (Qiskit prints the reverse); gate matrices follow Nielsen & Chuang and Qiskit. Appendix A lists every convention and how other libraries differ.

## Tests

```bash
node test/sim.test.js        # simulator
node test/qml.test.js        # QML toolkit (prints small result tables)
python3 tools/build_practice.py --check   # runs every practice script; fails if an output no longer matches the page

# browser tests (optional)
pip install playwright && python -m playwright install chromium
python3 test/smoke.py        # every chapter: no errors, no sideways scrolling, every panel and quiz filled in
python3 test/smoke.py --only complex,linalg --shots   # some chapters, with screenshots in test/screenshots/
python3 test/interact.py     # Circuit Lab presets, teleportation, quizzes, training step, glossary search …
```

## Single-file version

```bash
python3 tools/bundle.py      # writes dist/qubit-to-classifier.html
```

The bundled file runs offline from disk; without internet it uses system fonts.

## Notes

- Reading progress and ticked "Try this" boxes are saved in the browser's `localStorage`, so they stay on that device only.
- Fonts come from Google Fonts: Newsreader, Atkinson Hyperlegible Next and Atkinson Hyperlegible Mono (SIL Open Font License).
- No license file is included. Add one (for example MIT) if you want others to reuse the code.

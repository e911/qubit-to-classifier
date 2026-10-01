# Qubit to Classifier

An interactive, visual course on quantum circuits that ends with hands-on quantum machine learning. Everything on the page is computed live in the browser by an exact state-vector simulator: drag Bloch spheres, step through circuits gate by gate, watch entanglement shrink the arrows, and train a quantum classifier with parameter-shift gradients.

No frameworks, no build step, no server code: plain HTML, CSS and JavaScript.

## Contents

| Part | Chapters |
|---|---|
| I · One qubit | 1.1 Bits and qubits · 1.2 Phase · 1.3 The Bloch sphere |
| II · Gates and measurement | 2.1 Gates are rotations · 2.2 Measurement and bases (incl. tomography) |
| III · Many qubits | 3.1 Tensor product · 3.2 Multi-qubit gates and phase kickback · 3.3 Entanglement and CHSH |
| IV · Circuits | 4.1 Circuit Lab (drag-and-drop, step-through, unitary view, Qiskit export) · 4.2 Interference · 4.3 Identities and universality |
| V · Algorithms | 5.1 Teleportation and superdense coding · 5.2 Deutsch–Jozsa and Bernstein–Vazirani · 5.3 Grover · 5.4 QFT and phase estimation |
| VI · Noise and hardware | 6.1 Noise channels on the Bloch ball · 6.2 T1/T2, routing, mitigation vs correction |
| VII · Quantum machine learning | 7.1 Overview · 7.2 Encoding data · 7.3 Circuits as models · 7.4 Parameter-shift rule · 7.5 Train a classifier · 7.6 Quantum kernels · 7.7 Barren plateaus · 7.8 Where to go next |
| Appendix | Glossary and conventions |

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
  base.js             chapter registry, quiz and prose helpers
  ch1.js … ch7b.js    the chapters (text + interactive benches)
  app.js              navigation, hash routing, home page, progress
test/
  sim.test.js         358 physics checks (Bell/GHZ, QFT, Grover, teleportation, identities …)
  qml.test.js         gradient checks plus training, kernel and barren-plateau experiments
  smoke.py            opens every chapter in headless Chromium (desktop/phone, light/dark)
  interact.py         drives the widgets and checks what they display
tools/
  bundle.py           packs everything into one self-contained HTML file
```

## Editing

- Each chapter is one `C.add({ id, part, num, title, lede, html, init })` call. `html` is the prose; `init(root, ctx)` builds the interactive benches. The order of `C.add` calls (and of the script tags) is the order in the menu.
- Links between chapters are plain hashes such as `#lab` or `#train`.
- Colours and fonts are CSS variables at the top of `src/styles.css`; the dark theme redefines the same variables.
- Conventions: qubit 0 is the top wire and the leftmost bit, `|q0 q1 …⟩` (Qiskit prints the reverse); gate matrices follow Nielsen & Chuang and Qiskit.

## Tests

```bash
node test/sim.test.js        # simulator
node test/qml.test.js        # QML toolkit (prints small result tables)

# browser tests (optional)
pip install playwright && python -m playwright install chromium
python3 test/smoke.py        # add --shots to save screenshots in test/screenshots/
python3 test/interact.py
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

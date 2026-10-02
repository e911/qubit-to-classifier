# Practice in Python

Runnable Python for every chapter of *Qubit to Classifier*: 27 worked examples and 63 exercises, each one a complete program that needs only Python 3 and NumPy. (One optional exercise in chapter 4.1 uses Qiskit.)

## Two ways to practise

**Scripts.** Each chapter has a folder, for example `0.1-complex/`. Inside, `demo*.py` are worked examples and `exercise*.py` are exercises with their solutions. The docstring at the top of each exercise states the task, so you can read it, close the file, and write your own version first.

```bash
pip install numpy
python practice/0.1-complex/demo.py
python practice/0.1-complex/exercise1.py
```

**Notebooks.** `notebooks/` has one Jupyter notebook per part of the course. Each notebook has the examples ready to run, the exercises with empty or starter cells to fill in, and all the solutions with their expected output at the end. Open them in Jupyter, VS Code or Google Colab (File → Upload notebook).

## How these files reach the course

The same scripts are shown in the course, in each chapter's "Practice in Python" section, with editor-style syntax colours and the output each one prints. They are copied there by a build step:

```bash
python3 tools/build_practice.py           # runs every script, then rebuilds src/text/practice.js and the notebooks
python3 tools/build_practice.py --check   # runs every script and fails if an output no longer matches the course
```

To add an exercise, create `exerciseN.py` in the chapter's folder with a docstring like this, then rebuild:

```python
"""
title: A short name for the exercise
task: What to do, in one or two sentences. `code` in backticks, e^{iθ} for superscripts, x_{i} for subscripts.
hint: Optional; shown behind "Show a hint".
starter:
    import numpy as np
    # optional starter code, indented
note: Optional; shown after the solution's output.
"""
import numpy as np
# ...the solution...
```

Use a fixed random seed (`np.random.default_rng(seed=…)`) so the printed output is the same every time.

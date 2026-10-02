#!/usr/bin/env python3
"""Build the "Practice in Python" sections of the course from the scripts in practice/.

Every chapter with practice has a folder practice/<chapter number>-<chapter id>/, for example
practice/0.1-complex/, holding demo*.py and exercise*.py files. Each file is a complete program.
Its module docstring holds the words shown on the page, as "key: value" lines:

    title:    heading of the demo or exercise
    heading:  (optional, first file only) a section heading instead of "Practice in Python"
    intro:    (first file of a chapter only) the paragraph under the heading
    text:     (demo) a paragraph shown before the code
    task:     (exercise) what to do
    hint:     (exercise, optional) shown behind "Show a hint"
    starter:  (exercise, optional) indented starter code on the following lines
    note:     (optional) a paragraph shown after the output

Everything after the docstring is the code. This tool runs every script, captures what it
prints, and writes
    src/text/practice.js         which the page renders with syntax colours, and
    practice/notebooks/*.ipynb   one Jupyter notebook per part, with the exercises to fill in
                                 and the solutions at the end.

    python3 tools/build_practice.py            # run every script and rebuild both
    python3 tools/build_practice.py --check    # run every script and fail if any output changed
"""
import argparse
import ast
import json
import os
import pathlib
import re
import subprocess
import sys
import textwrap

ROOT = pathlib.Path(__file__).resolve().parent.parent
PRACTICE = ROOT / "practice"
OUT = ROOT / "src" / "text" / "practice.js"
NOTEBOOKS = PRACTICE / "notebooks"
PARTS = {0: "The math toolkit", 1: "One qubit", 2: "Gates and measurement", 3: "Many qubits", 4: "Circuits",
         5: "Algorithms", 6: "Noise and hardware", 7: "Quantum machine learning"}
KEYS = ("heading", "title", "intro", "text", "task", "hint", "starter", "note")


def chapter_dirs():
    def key(p):
        num = p.name.split("-", 1)[0]
        return tuple(int(x) for x in num.split("."))
    return sorted((p for p in PRACTICE.iterdir() if p.is_dir() and re.match(r"^\d+\.\d+-[a-z0-9]+$", p.name)), key=key)


def split_file(path):
    """Return (metadata dict, code without the docstring)."""
    src = path.read_text(encoding="utf-8")
    tree = ast.parse(src)
    doc = ast.get_docstring(tree, clean=False) or ""
    if tree.body and isinstance(tree.body[0], ast.Expr) and isinstance(getattr(tree.body[0], "value", None), ast.Constant):
        end = tree.body[0].end_lineno
        code = "\n".join(src.splitlines()[end:])
    else:
        code = src
    meta, key, buf = {}, None, []

    def flush():
        if key is None:
            return
        if key == "starter":
            meta[key] = textwrap.dedent("\n".join(buf)).strip("\n")
        else:
            meta[key] = " ".join(line.strip() for line in buf if line.strip())

    for line in doc.splitlines():
        m = re.match(r"^(%s):\s?(.*)$" % "|".join(KEYS), line)
        if m:
            flush()
            key, buf = m.group(1), ([m.group(2)] if m.group(2) else [])
        elif key:
            buf.append(line)
    flush()
    return meta, code.strip("\n") + "\n"


def run(path):
    env = dict(os.environ, PYTHONHASHSEED="0", PYTHONIOENCODING="utf-8", MPLBACKEND="Agg")
    r = subprocess.run([sys.executable, path.name], cwd=path.parent, capture_output=True, text=True, timeout=300, env=env)
    if r.returncode != 0:
        raise SystemExit(f"{path.relative_to(ROOT)} failed:\n{r.stderr}")
    if r.stderr.strip():
        raise SystemExit(f"{path.relative_to(ROOT)} wrote to stderr:\n{r.stderr}")
    return r.stdout.rstrip()


def build():
    chapters = []
    for d in chapter_dirs():
        cid = d.name.split("-", 1)[1]
        files = sorted(d.glob("demo*.py")) + sorted(d.glob("exercise*.py"))
        items, intro, heading = [], "", ""
        for f in files:
            meta, code = split_file(f)
            if meta.get("intro") and not intro:
                intro = meta["intro"]
            if meta.get("heading") and not heading:
                heading = meta["heading"]
            item = {"kind": "demo" if f.name.startswith("demo") else "exercise", "file": f.name, "code": code, "output": run(f)}
            for k in ("title", "text", "task", "hint", "starter", "note"):
                if meta.get(k):
                    item[k] = meta[k]
                    if k != "starter" and re.search(r"[\^_]\{[^}]*\{", meta[k]):
                        raise SystemExit(f"{f.relative_to(ROOT)}: nested ^{{...}} or _{{...}} in {k}")
            if item["kind"] == "exercise" and not item.get("task"):
                raise SystemExit(f"{f.relative_to(ROOT)}: an exercise needs a task")
            items.append(item)
            print(f"  ran {f.relative_to(ROOT)} ({len(item['output'].splitlines())} lines of output)")
        data = {"intro": intro, "items": items}
        if heading:
            data["heading"] = heading
        chapters.append((cid, data, d.name.split("-", 1)[0]))
    return chapters


def render(chapters):
    lines = ["/* Python practice for each chapter. Generated by tools/build_practice.py from the scripts in",
             "   practice/ — edit those files and rebuild instead of editing this one. */",
             "(function (G) {", "  'use strict';", "  const C = G.C;"]
    for cid, data, _ in chapters:
        js = json.dumps(data, ensure_ascii=False, indent=None)
        if "</script" in js.lower():
            raise SystemExit(f"{cid}: practice text contains '</script'")
        lines.append(f"  C.practice({json.dumps(cid)}, {js});")
    lines.append("})(window);")
    return "\n".join(lines) + "\n"


def chapter_titles():
    titles = {}
    for f in sorted((ROOT / "src").glob("ch*.js")):
        for m in re.finditer(r"id: '([a-z0-9]+)', part: \d, num: '[^']*', title: '((?:\\.|[^'\\])*)'", f.read_text(encoding="utf-8")):
            titles[m.group(1)] = m.group(2).replace("\\'", "'")
    return titles


def markdown(text):
    return re.sub(r"_\{([^}]+)\}", r"<sub>\1</sub>", re.sub(r"\^\{([^}]+)\}", r"<sup>\1</sup>", text or ""))


def notebooks(chapters):
    """One notebook per part: demos to run, exercises to fill in, solutions at the end."""
    titles, cells_by_part = chapter_titles(), {}
    counter = [0]

    def cell(kind, text):
        counter[0] += 1
        c = {"cell_type": kind, "id": f"c{counter[0]:04d}", "metadata": {}, "source": text.splitlines(keepends=True)}
        if kind == "code":
            c.update(execution_count=None, outputs=[])
        return c

    for cid, data, num in chapters:
        part = int(num.split(".")[0])
        cells, sols = cells_by_part.setdefault(part, ([], []))
        cells.append(cell("markdown", f"## {num} {titles.get(cid, cid)}\n\n{markdown(data['intro'])}".rstrip()))
        n = 0
        for it in data["items"]:
            if it["kind"] == "demo":
                head = f"### {markdown(it.get('title', 'Example'))}\n\n{markdown(it.get('text', ''))}"
                cells.append(cell("markdown", head.rstrip()))
                cells.append(cell("code", it["code"].rstrip()))
                if it.get("note"):
                    cells.append(cell("markdown", markdown(it["note"])))
                continue
            n += 1
            md = f"### Exercise {num}.{n}: {markdown(it['title'])}\n\n{markdown(it['task'])}"
            if it.get("hint"):
                md += f"\n\n<details><summary>Hint</summary>\n\n{markdown(it['hint'])}\n\n</details>"
            cells.append(cell("markdown", md))
            cells.append(cell("code", (it.get("starter") or "# Your code here").rstrip()))
            sols.append(cell("markdown", f"### Solution {num}.{n}: {markdown(it['title'])}"))
            sols.append(cell("code", it["code"].rstrip()))
            out = "Expected output:\n\n```\n" + it["output"] + "\n```"
            if it.get("note"):
                out += "\n\n" + markdown(it["note"])
            sols.append(cell("markdown", out))
    NOTEBOOKS.mkdir(exist_ok=True)
    for part, (cells, sols) in sorted(cells_by_part.items()):
        top = cell("markdown", f"# Part {part}: {PARTS[part]}\n\nPractice notebook for *Qubit to Classifier*. Run the examples, fill in the exercises, and compare with the solutions at the end. Every cell needs only Python 3 and NumPy, except one optional Qiskit exercise in chapter 4.1.")
        body = [top] + cells + ([cell("markdown", "---\n\n# Solutions")] + sols if sols else [])
        nb = {"cells": body, "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                                          "language_info": {"name": "python"}}, "nbformat": 4, "nbformat_minor": 5}
        slug = re.sub(r"[^a-z0-9]+", "-", PARTS[part].lower()).strip("-")
        (NOTEBOOKS / f"part{part}-{slug}.ipynb").write_text(json.dumps(nb, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {len(cells_by_part)} notebooks in {NOTEBOOKS.relative_to(ROOT)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail if the generated file would change")
    args = ap.parse_args()
    chapters = build()
    text = render(chapters)
    if args.check:
        old = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if old != text:
            raise SystemExit("src/text/practice.js is out of date: run python3 tools/build_practice.py")
        print("practice.js is up to date")
        return
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(text) / 1024:.0f} KB)")
    notebooks(chapters)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Drive the interactive parts of the course and check what they show.

Usage:
    pip install playwright && playwright install chromium   (once)
    python3 test/interact.py

Checks the Circuit Lab presets against known results, teleportation for several
measurement outcomes, chapter navigation, quizzes, saved "Try this" boxes, the
one-step training panel, the glossary search and the formula-sheet topic buttons.
"""
import contextlib
import functools
import http.server
import pathlib
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


@contextlib.contextmanager
def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
        finally:
            httpd.shutdown()


# expected final probabilities of the Circuit Lab presets: {basis label: probability}
PRESETS = {
    "bell": {"00": 0.5, "11": 0.5},
    "ghz": {"000": 0.5, "111": 0.5},
    "uniform": {f"{k:03b}": 0.125 for k in range(8)},
    "kickback": {f"{k:02b}": 0.25 for k in range(4)},
    "interf": {"0": 1.0},
    "dense": {"11": 1.0},
    "bv": {"1011": 1.0},
    "grover2": {"11": 1.0},
    "qft": {f"{k:03b}": 0.125 for k in range(8)},
    "toffoli": {"000": 1.0},
    "swap3": {"01": 1.0},
}

LAB_PROBS = """(id) => {
  const lab = C.labInstance; lab.loadPreset(id, false);
  const s = lab.states[lab.circ.cols.length], p = s.probs(), out = {};
  p.forEach((v, i) => { if (v > 1e-9) out[i.toString(2).padStart(s.n, '0')] = v; });
  return out;
}"""

TELEPORT = """() => {
  const lab = C.labInstance, res = [];
  for (let seed = 1; seed <= 12; seed++) {
    lab.seed = seed; lab.loadPreset('teleport', false);
    const s = lab.states[lab.circ.cols.length], b = s.bloch(2), g = lab.preset.ghost.v;
    res.push({ outcomes: JSON.stringify(lab.outcomes), err: Math.hypot(b[0] - g[0], b[1] - g[1], b[2] - g[2]) });
  }
  return res;
}"""


def main():
    results = []

    def check(name, ok, detail=""):
        results.append((name, bool(ok), detail))
        print(f"{'ok ' if ok else 'BAD'} {name}{'  ' + detail if detail else ''}")

    with serve() as url, sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
        ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)

        def go(cid):
            page.evaluate(f"() => {{ location.hash = '{cid}'; }}")
            page.wait_for_timeout(450)

        page.goto(url + "#home")
        page.wait_for_timeout(300)

        # 1. Circuit Lab presets
        go("lab")
        for pid, want in PRESETS.items():
            got = page.evaluate(LAB_PROBS, pid)
            keys = set(want) | set(got)
            err = max(abs(want.get(k, 0) - got.get(k, 0)) for k in keys)
            check(f"lab preset {pid}", err < 1e-9, "" if err < 1e-9 else f"got {got}")
        dj = page.evaluate(LAB_PROBS, "dj")
        p000 = sum(v for k, v in dj.items() if k.startswith("000"))
        check("lab preset dj: inputs never read 000 for a balanced f", p000 < 1e-9, f"P = {p000:.3g}")

        # 2. Teleportation works for every measurement outcome
        tp = page.evaluate(TELEPORT)
        outcomes = {r["outcomes"] for r in tp}
        worst = max(r["err"] for r in tp)
        check("teleportation: Bob's qubit matches the message", worst < 1e-9 and len(outcomes) > 1, f"{len(outcomes)} different outcomes, worst error {worst:.2g}")

        # 3. Chapter navigation
        go("qubit")
        page.click("nav.ch-nav a.next")
        page.wait_for_timeout(450)
        check("next-chapter link", page.evaluate("() => location.hash") == "#phase")

        # 4. Quiz: answer the first question
        go("qubit")
        page.locator(".quiz .q").first.locator("button").first.click()
        shown = page.evaluate("() => !document.querySelector('.quiz .q .q-explain').hidden")
        score = page.evaluate("() => document.querySelector('.quiz > p.note').textContent")
        check("quiz shows the explanation and a score", shown and "of 1 answered" in score, score)

        # 5. "Try this" boxes are remembered
        go("bloch")
        box = page.locator(".try input").first
        box.check()
        page.reload()
        page.wait_for_timeout(500)
        go("bloch")
        check("Try-this checkbox survives a reload", page.locator(".try input").first.is_checked())
        page.locator(".try input").first.uncheck()

        # 6. One training step, every number shown
        go("train")
        page.get_by_role("button", name="Take one step", exact=True).click()
        page.wait_for_timeout(200)
        calc = page.evaluate("() => [...document.querySelectorAll('[data-bench=\"one-step\"] .calc div')].map(d => d.textContent).join(' | ')")
        check("one-step training: θ moves from 0 to 0.662", "L(θ = 0.662)" in calc, calc.split(" | ")[0])

        # 7. Glossary search
        go("glossary")
        page.fill(".gloss-search", "bell")
        page.wait_for_timeout(100)
        vis = page.evaluate("() => [...document.querySelectorAll('.gloss dt')].filter(d => !d.hidden && !d.closest('.gloss-group').hidden).map(d => d.textContent)")
        check("glossary search", "Bell state" in vis and "Bell basis" in vis and len(vis) < 10, ", ".join(vis))
        page.fill(".gloss-search", "qqqqq")
        page.wait_for_timeout(100)
        check("glossary search with no match shows a message", page.evaluate("() => !document.querySelector('[data-gloss] > p.note').hidden"))

        # 8. Formula sheet topic buttons
        go("formulas")
        page.click(".fs-toc button[data-jump='fs-ml']")
        page.wait_for_timeout(300)
        top = page.evaluate("() => document.getElementById('fs-ml').getBoundingClientRect().top")
        check("formula sheet topic button scrolls to its section", 0 <= top < 200, f"heading at {top:.0f}px")

        check("no JavaScript errors", not errors, "; ".join(errors[:3]))
        browser.close()

    bad = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(bad)} of {len(results)} checks passed")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()

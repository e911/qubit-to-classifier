#!/usr/bin/env python3
"""Interaction test: drives the main widgets in headless Chromium and checks
the physics they display (gate bench, measurement, Circuit Lab drag-and-drop,
Qiskit export, teleportation, trainer, kernels, Grover, identity checker).

Setup (once):  pip install playwright && python -m playwright install chromium
Run:           python3 test/interact.py
"""
import functools
import http.server
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/index.html"


results = []


def check(name, cond, info=""):
    results.append((name, bool(cond), info))


def main() -> None:
    server, url = serve()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            pg = browser.new_context(viewport={"width": 1440, "height": 1000}).new_page()
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)

            # Gate bench: H, Z, H on |0> gives |1>
            pg.goto(url + "#gates"); pg.wait_for_timeout(700)
            for g in ["H", "Z", "H"]:
                pg.locator(".gatebtn", has_text=g).first.click(); pg.wait_for_timeout(1500)
            hist = pg.locator('[data-bench="g-bench"] .readout').first.inner_text()
            check("gates: history shows ─H─Z─H─", "─H─Z─H─" in hist, hist[:80])
            check("gates: HZH|0⟩ = |1⟩", "|ψ⟩ = |1⟩" in hist, hist)

            # Measurement: a single shot collapses; tomography shows an estimate at rest
            pg.evaluate('location.hash = "measure"'); pg.wait_for_timeout(700)
            pg.get_by_role("button", name="Measure once").first.click(); pg.wait_for_timeout(800)
            check("measure: outcome shown", "Outcome" in pg.locator('[data-bench="m-axis"] .pill').first.inner_text())
            check("tomography: estimate present", "estimate" in pg.locator('[data-bench="m-tomo"] .readout').first.inner_text())

            # Circuit Lab
            pg.evaluate('location.hash = "lab"'); pg.wait_for_timeout(800)
            pg.get_by_role("button", name="Go to end").click(); pg.wait_for_timeout(300)
            ket = pg.locator(".ket-line").first.inner_text()
            check("lab: Bell state at the end", "|00⟩" in ket and "|11⟩" in ket, ket)
            item = pg.locator('.pal-item[data-id="X"]').bounding_box()
            svg = pg.locator(".circuit-svg").first.bounding_box()
            tx, ty = svg["x"] + 58 + 52 * 2.5, svg["y"] + 26 + 50 * 1.5          # column 3, qubit 1
            pg.mouse.move(item["x"] + item["width"] / 2, item["y"] + item["height"] / 2)
            pg.mouse.down(); pg.mouse.move(tx - 30, ty - 30, steps=5); pg.mouse.move(tx, ty, steps=5); pg.mouse.up()
            pg.wait_for_timeout(400)
            ket2 = pg.locator(".ket-line").first.inner_text()
            check("lab: dragged X gives (|01⟩ + |10⟩)/√2", "|01⟩" in ket2 and "|10⟩" in ket2, ket2)
            check("lab: inspector shows the selected X", "Pauli-X" in pg.locator(".inspector").first.inner_text())
            pg.locator('.pal-item[data-id="H"]').click()                         # tap-to-place
            pg.mouse.click(svg["x"] + 58 + 52 * 3.5, svg["y"] + 26 + 50 * 0.5); pg.wait_for_timeout(300)
            check("lab: tap-to-place adds a column", "Step 4 / 4" in pg.locator(".stepinfo").first.inner_text())
            pg.get_by_role("tab", name="Unitary").click(); pg.wait_for_timeout(300)
            check("lab: unitary heatmap", pg.locator('canvas[aria-label="unitary matrix heatmap"]').count() == 1)
            pg.get_by_role("tab", name="Qiskit code").click(); pg.wait_for_timeout(200)
            code = pg.locator(".codeblock pre").first.inner_text()
            check("lab: Qiskit export", "qc.h(0)" in code and "qc.cx(0, 1)" in code and "qc.x(1)" in code, code[:200])
            pg.locator("select.sel").first.select_option("teleport"); pg.wait_for_timeout(300)
            if pg.get_by_role("button", name="Pause").count():
                pg.get_by_role("button", name="Pause").click()
            pg.get_by_role("button", name="Go to end").click(); pg.wait_for_timeout(400)
            check("lab: teleportation notes", "ghost" in pg.locator(".stepnote").first.inner_text())

            # Trainer starts by itself and learns
            pg.evaluate('location.hash = "train"'); pg.wait_for_timeout(5000)
            stats = pg.locator('[data-bench="tr"] .stats').first.inner_text()
            check("train: runs and reports accuracy", "accuracy" in stats, stats.replace("\n", " "))

            # Kernels: decision map is coloured
            pg.evaluate('location.hash = "kernels"'); pg.wait_for_timeout(1200)
            px = pg.evaluate("""(() => { const c = document.querySelectorAll('[data-bench="kr"] canvas')[1];
                                 const d = c.getContext('2d').getImageData(10, 10, 1, 1).data; return d[0] + d[1] + d[2]; })()""")
            check("kernels: decision map drawn", px > 150, str(px))

            # Grover reaches high success
            pg.evaluate('location.hash = "grover"'); pg.wait_for_timeout(600)
            pg.get_by_role("button", name="Run to the optimum").click(); pg.wait_for_timeout(3000)
            rd = pg.locator('[data-bench="gr"] .readout').first.inner_text()
            check("grover: success ≥ 90%", "P(marked) = 9" in rd, rd)

            # Every identity verifies
            pg.evaluate('location.hash = "identities"'); pg.wait_for_timeout(600)
            buttons = pg.locator('[data-bench="ids"] .row.tight button')
            bad = []
            for i in range(buttons.count()):
                buttons.nth(i).click(); pg.wait_for_timeout(120)
                if "✓" not in pg.locator('[data-bench="ids"] .pill').first.inner_text():
                    bad.append(i)
            check("identities: all verify", not bad, str(bad))
            pg.get_by_role("button", name="Open the left circuit in the Circuit Lab").click(); pg.wait_for_timeout(800)
            check("identities → lab navigation", pg.evaluate("location.hash") == "#lab")

            check("no JavaScript errors", not errors, "; ".join(errors[:3]))
            browser.close()
    finally:
        server.shutdown()
    failed = 0
    for name, ok, info in results:
        print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  :: " + info))
        failed += not ok
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()

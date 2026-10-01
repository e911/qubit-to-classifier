#!/usr/bin/env python3
"""Browser smoke test: open every chapter in headless Chromium and report
JavaScript errors and horizontal overflow, at desktop and phone widths, in
light and dark mode.

Setup (once):  pip install playwright && python -m playwright install chromium
Run:           python3 test/smoke.py            # all four configurations
               python3 test/smoke.py --shots    # also save full-page screenshots to test/screenshots/
"""
import functools
import http.server
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "test" / "screenshots"
CONFIGS = {
    "desktop-light": ("light", 1440, 900),
    "desktop-dark": ("dark", 1440, 900),
    "phone-light": ("light", 390, 844),
    "phone-dark": ("dark", 390, 844),
}
SLOW = {"plateaus", "kernels", "train"}  # chapters that compute for a moment on load


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # keep the output readable
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/index.html"


def ignorable(text: str) -> bool:
    # Google Fonts cannot load without internet access; the page falls back to system fonts.
    return "Failed to load resource" in text or "ERR_" in text


def run(url: str, name: str, scheme: str, width: int, height: int, shots: bool) -> int:
    problems = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_context(viewport={"width": width, "height": height}, color_scheme=scheme).new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and not ignorable(m.text) else None)
        page.goto(url + "#home")
        page.wait_for_timeout(800)
        ids = ["home"] + page.evaluate("C.list.map(c => c.id)")
        for cid in ids:
            seen = len(errors)
            page.evaluate(f'location.hash = "{cid}"')
            page.wait_for_timeout(1500 if cid in SLOW else 700)
            overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            new_errors = errors[seen:]
            if overflow > 0 or new_errors:
                problems += 1
                print(f"  {cid}: overflowX={overflow} errors={new_errors[:2]}")
            if shots:
                SHOTS.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(SHOTS / f"{name}-{cid}.png"), full_page=True)
        browser.close()
    print(f"{name}: {len(ids)} pages, {problems} with problems")
    return problems


def main() -> None:
    shots = "--shots" in sys.argv
    server, url = serve()
    try:
        total = sum(run(url, name, *cfg, shots) for name, cfg in CONFIGS.items())
    finally:
        server.shutdown()
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()

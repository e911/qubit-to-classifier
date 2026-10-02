#!/usr/bin/env python3
"""Open every chapter in a headless browser and check it renders cleanly.

Usage:
    pip install playwright && playwright install chromium   (once)
    python3 test/smoke.py                 # all chapters, desktop + phone, light + dark
    python3 test/smoke.py --only complex,linalg
    python3 test/smoke.py --shots         # also save screenshots to test/screenshots/

For every chapter it checks: no JavaScript errors, no horizontal page scroll,
every interactive panel was filled in, and the quiz (if any) was rendered.
"""
import argparse
import contextlib
import functools
import http.server
import pathlib
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "test" / "screenshots"
VIEWPORTS = {"desktop": {"width": 1280, "height": 900}, "phone": {"width": 390, "height": 844}}


@contextlib.contextmanager
def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
        finally:
            httpd.shutdown()


CHECK = """() => {
  const art = document.querySelector('main article');
  const benches = [...document.querySelectorAll('[data-bench]')];
  const empty = benches.filter(b => !b.querySelector('.bench-body') || !b.querySelector('.bench-body').childElementCount).map(b => b.dataset.bench);
  const quizHost = document.querySelector('[data-quiz]');
  const wide = [...document.querySelectorAll('main *')].filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.right > innerWidth + 1 && !e.closest('.circuit-scroll, .table-wrap, .align, .calc, .formula, .ket-line, .codeblock, pre, .tooltip');
  }).slice(0, 5).map(e => e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).split(' ').join('.') : ''));
  return {
    title: document.title,
    h1: (document.querySelector('main h1') || {}).textContent || '',
    overflow: document.documentElement.scrollWidth - innerWidth,
    benches: benches.length, empty,
    quiz: quizHost ? quizHost.querySelectorAll('.q').length : -1,
    unresolvedRefs: [...document.querySelectorAll('a[data-ch]')].filter(a => a.textContent === a.dataset.ch).map(a => a.dataset.ch),
    wide,
    words: art ? art.innerText.split(/\\s+/).length : 0
  };
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="", help="comma-separated chapter ids")
    ap.add_argument("--shots", action="store_true", help="save full-page screenshots")
    ap.add_argument("--viewports", default="desktop,phone")
    ap.add_argument("--themes", default="light,dark")
    args = ap.parse_args()
    if args.shots:
        SHOTS.mkdir(parents=True, exist_ok=True)
    problems = 0
    with serve() as url, sync_playwright() as p:
        browser = p.chromium.launch()
        for vp_name in args.viewports.split(","):
            for theme in args.themes.split(","):
                ctx = browser.new_context(viewport=VIEWPORTS[vp_name], color_scheme=theme, reduced_motion="reduce")
                ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
                ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
                page = ctx.new_page()
                errors = []
                page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
                page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
                page.goto(url + "#home")
                page.wait_for_timeout(300)
                ids = page.evaluate("() => C.list.map(c => c.id)")
                if args.only:
                    ids = [i for i in ids if i in args.only.split(",")]
                for cid in ["home"] + ids:
                    errors.clear()
                    page.evaluate(f"() => {{ location.hash = '{cid}'; }}")
                    page.wait_for_timeout(450)
                    info = page.evaluate(CHECK)
                    bad = []
                    if errors:
                        bad.append("; ".join(errors[:3]))
                    if info["overflow"] > 1:
                        bad.append(f"page scrolls sideways by {info['overflow']}px {info['wide']}")
                    if info["empty"]:
                        bad.append(f"empty panels {info['empty']}")
                    if cid != "home" and info["quiz"] == 0:
                        bad.append("quiz host present but empty")
                    if info["unresolvedRefs"]:
                        bad.append(f"unresolved refs {info['unresolvedRefs']}")
                    status = "ok " if not bad else "BAD"
                    if bad:
                        problems += 1
                    print(f"{status} {vp_name:7} {theme:5} {cid:13} panels={info['benches']:<2} quiz={info['quiz']:<2} words={info['words']:<5} {' | '.join(bad)}")
                    if args.shots:
                        page.screenshot(path=str(SHOTS / f"{cid}-{vp_name}-{theme}.png"), full_page=True)
                ctx.close()
        browser.close()
    print(f"\n{problems} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()

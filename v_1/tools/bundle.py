#!/usr/bin/env python3
"""Bundle the site into ONE self-contained HTML file (CSS and JS inlined).

Usage:  python3 tools/bundle.py            -> dist/qubit-to-classifier.html

The bundled file works offline (fonts fall back to system fonts) and can be
opened straight from disk, attached to an email, or uploaded anywhere that
serves a single HTML page. GitHub Pages does not need this: it serves
index.html and the src/ folder as they are.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "qubit-to-classifier.html"


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    def inline_css(match: "re.Match[str]") -> str:
        css = (ROOT / match.group(1)).read_text(encoding="utf-8")
        return f"<style>\n{css}\n</style>"

    def inline_js(match: "re.Match[str]") -> str:
        path = match.group(1)
        code = (ROOT / path).read_text(encoding="utf-8")
        if "</script" in code.lower():
            raise SystemExit(f"{path} contains '</script' and cannot be inlined safely")
        return f"<script>\n/* ---- {path} ---- */\n{code}\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(src/[^"]+\.css)">', inline_css, html)
    html = re.sub(r'<script src="(src/[^"]+\.js)"></script>', inline_js, html)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(html) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()

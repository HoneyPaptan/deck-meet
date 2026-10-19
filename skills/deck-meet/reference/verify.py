#!/usr/bin/env python3
import re
import sys
from pathlib import Path

ZERO = [
    ("no unfilled {{slots}}", r"\{\{"),
    ("no surviving data-example blocks", r"data-example"),
    ("no TODO or TBD or lorem", r"TODO|TBD|[Ll]orem ipsum"),
    ("no img or iframe tags", r"<img[ >]|<iframe[ >]"),
    ("no emoji", "[\U0001F000-\U0001FAFF☀-➿️]"),
    ("no dash characters in text", "–|—"),
    ("no hex colors outside theme block", r"^(?!.*--).*#[0-9a-fA-F]{3,8}\b"),
    ("no svg gradients", r"<linearGradient|<radialGradient"),
    ("no glow or blur decoration", r"text-shadow|drop-shadow|filter:\s*blur"),
    ("no gradient text", r"background-clip:\s*text"),
    ("no bounce or elastic easing", r"ease[^,}]*(Bounce|Elastic)"),
    ("no vendored animation library", r"Anime\.js"),
]

HAS = [
    ("fonts embedded as data URIs", "data:font/woff2;base64,"),
    ("theme.css embedded", "--dm-theme-v1"),
    ("base.css embedded", "--dm-base-v2"),
    ("runtime.js embedded", "dm-runtime-v2"),
    ("toolbar present", 'class="toolbar"'),
    ("print styles present", "@media print"),
    ("voice set on body", 'data-voice="'),
    ("mode set on body", 'data-mode="'),
]


class Report:
    def __init__(self):
        self.fails = 0

    def check(self, ok, label, detail=()):
        print(("PASS " if ok else "FAIL ") + label)
        for line in detail:
            print("  " + line)
        self.fails += not ok


def lines_matching(lines, pattern):
    rx = re.compile(pattern)
    return [f"{n}: {line[:160]}" for n, line in lines if rx.search(line)]


def count_lines(lines, pattern):
    return len(lines_matching(lines, pattern))


def main():
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_file():
        print("usage: verify.py <deck.html>")
        return 2
    text = Path(sys.argv[1]).read_text(encoding="utf-8")
    lines = list(enumerate(text.splitlines(), 1))
    prose = [(n, line) for n, line in lines if len(line) < 4000]
    report = Report()

    for label, pattern in ZERO:
        hits = lines_matching(prose, pattern)
        report.check(not hits, label, hits[:5])

    externals = re.findall(r'(?:src|href)="(https?://[^"]+)', text)
    report.check(not externals, "no external resources, deck is fully offline", externals[:5])

    for label, needle in HAS:
        report.check(needle in text, label)

    h1s = count_lines(lines, r"<h1")
    report.check(h1s == 1, f"exactly one h1 (found {h1s})")

    slides = count_lines(lines, r'class="slide')
    report.check(slides >= 3, f"at least 3 slides (found {slides})")

    svgs = count_lines(lines, r"<svg")
    labelled = count_lines(lines, r'<svg[^>]*role="img"[^>]*aria-label')
    report.check(svgs == labelled, f"every svg has role and aria-label ({labelled} of {svgs})")

    figures = count_lines(lines, r"<figure")
    captions = count_lines(lines, r"<figcaption")
    report.check(figures == captions, f"every figure captioned ({captions} of {figures})")

    sections = count_lines(lines, r'<section class="slide')
    arias = count_lines(lines, r'<section class="slide[^>]*aria-label')
    report.check(sections == arias, f"every slide has aria-label ({arias} of {sections})")

    if svgs:
        motion = count_lines(lines, r'class="[^"]*(packet|flow|draw|pulse|pop|grow|trace|pt)[" ]')
        report.check(motion >= 1, f"motion primitives present ({motion})")

    print()
    if report.fails:
        print(f"{report.fails} CHECK(S) FAILED")
        return 1
    print("ALL CHECKS PASS")
    return 0


sys.exit(main())

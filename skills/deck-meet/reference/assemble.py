#!/usr/bin/env python3
import argparse
import base64
import html as markup
import re
from pathlib import Path

VOICES = ("display", "editorial", "mono", "contrast", "numbered")
MODES = ("talk", "story")

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
{fonts}
{theme}
{base}
</style>
</head>
<body data-voice="{voice}" data-mode="{mode}">
<div class="deck">
<div class="stage">

"""

TAIL = """
</div>
<div class="progress"><span></span></div>
<div class="counter"></div>
<div class="hint">arrows to move, E to edit, F for fullscreen</div>
<div class="toolbar">
  <button data-act="prev">prev</button>
  <button data-act="next">next</button>
  <button data-act="edit">edit</button>
  <button data-act="grid">grid</button>
  <button data-act="notes">notes</button>
  <button data-act="pdf">pdf</button>
  <button data-act="play">play</button>
  <button data-act="save">save copy</button>
</div>
</div>
<script>
{runtime}
</script>
</body>
</html>
"""


def inline_fonts(css, ref):
    def embed(match):
        font = ref / match.group(1)
        if not font.is_file():
            return "local('none')"
        data = base64.b64encode(font.read_bytes()).decode()
        return f"url(data:font/woff2;base64,{data})"

    return re.sub(r"url\((fonts/[a-z-]+\.woff2)\)", embed, css)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("title")
    ap.add_argument("slides", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--voice", choices=VOICES, default="display")
    ap.add_argument("--mode", choices=MODES, default="talk")
    args = ap.parse_args()
    ref = Path(__file__).parent
    read = lambda name: (ref / name).read_text()
    html = (
        HEAD.format(
            title=markup.escape(args.title),
            voice=args.voice,
            mode=args.mode,
            fonts=inline_fonts(read("fonts.css"), ref),
            theme=read("theme.css"),
            base=read("base.css"),
        )
        + args.slides.read_text().strip()
        + TAIL.format(runtime=read("runtime.js"))
    )
    args.out.write_text(html)
    print(f"{args.out} ({len(html)} bytes, voice={args.voice}, mode={args.mode})")


main()

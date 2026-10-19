#!/usr/bin/env python3
import argparse
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
{anime}
</script>
<script>
{runtime}
</script>
</body>
</html>
"""


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
            title=args.title,
            voice=args.voice,
            mode=args.mode,
            fonts=read("fonts.css"),
            theme=read("theme.css"),
            base=read("base.css"),
        )
        + args.slides.read_text().strip()
        + TAIL.format(anime=read("anime.umd.min.js"), runtime=read("runtime.js"))
    )
    args.out.write_text(html)
    print(f"{args.out} ({len(html)} bytes, voice={args.voice}, mode={args.mode})")


main()

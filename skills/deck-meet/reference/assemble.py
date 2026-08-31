#!/usr/bin/env python3
import sys
from pathlib import Path

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
<body>
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


def main():
    if len(sys.argv) != 4:
        print("usage: assemble.py <title> <slides-fragment.html> <out.html>")
        sys.exit(2)
    title, slides_path, out_path = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    ref = Path(__file__).parent
    read = lambda name: (ref / name).read_text()
    html = (
        HEAD.format(
            title=title,
            fonts=read("fonts.css"),
            theme=read("theme.css"),
            base=read("base.css"),
        )
        + slides_path.read_text().strip()
        + TAIL.format(runtime=read("runtime.js"))
    )
    out_path.write_text(html)
    print(f"{out_path} ({len(html)} bytes)")


main()

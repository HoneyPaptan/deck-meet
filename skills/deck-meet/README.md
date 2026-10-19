# deck-meet

A skill that turns any material into a presentation you can actually give. Give your agent notes, markdown, a PDF, a docx, a URL, or just an idea. deck-meet asks you five short questions, shows you a numbered slide plan to approve, and only then builds one self-contained HTML deck.

## Use it

Ask your agent for a deck in plain words:

- "make me a deck from notes.md for Friday's team review"
- "turn this blog post into a 10 minute talk"
- "deck-meet: why we are moving to small batches"

The agent interviews you (audience, time slot, goal, the one thing that must land, live talk or shared link), proposes the plan, waits for your yes, builds `<name>.html`, and runs the checks. Say "skip the questions" to go straight to the plan.

## What you get

- One HTML file that works offline. Fonts and runtime are inside it, so you can email it or open it on a plane.
- Talk mode: arrow keys, presenter window with notes and a clock (`N`), overview grid (`O`), fullscreen (`F`).
- Story mode: the same slides as one scrolling page, for decks people read alone.
- Animated SVG diagrams from a fixed catalogue: pipelines, sequences, charts, state machines, timelines and more.
- Edit in place (`E`) and download a copy, and a `pdf` button that prints exact 16:9 pages.

## Requirements

- Python 3.8 or newer (builds and checks the deck). Nothing to install.
- Optional: `pdftotext` for big PDFs, `pandoc` for docx input, any Chromium-family browser for headless PDF export.

## Files

- `SKILL.md`: the workflow the agent follows.
- `reference/`: the design system. `theme.css` holds every colour and font token, `base.css` and `runtime.js` style and drive the deck, `svg-motifs.md` and `skeleton.html` are the patterns, `DESIGN.md` the slide rules, `assemble.py` builds, `verify.py` runs 27 checks.
- `reference/fonts/`: Space Grotesk, Inter and JetBrains Mono, SIL OFL 1.1, licence texts alongside.
- `examples/`: a sample slide plan and two slide sources to show the expected output.

## Make it yours

Replace the values in `reference/theme.css` with your brand colours. To change fonts, put your woff2 files in `reference/fonts/` and point `reference/fonts.css` at them. Every future deck picks them up.

## Safety

The scripts read the files you give them and write only the deck you asked for. No network calls, no installs, no telemetry.

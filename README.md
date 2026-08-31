# deck-meet

A Claude Code plugin that turns any material into a presentation you can actually give. Markdown, PDF, docx, a URL, meeting notes, or just an idea you talk through: deck-meet interviews you about audience, time slot, and goal, proposes a per-slide plan for your approval, then builds **one self-contained HTML file**.

Every deck ships with:

- arrow-key and touch navigation, incremental reveals, position kept across reloads
- animated SVG diagrams built from a fixed motif catalogue (pipelines, sequence diagrams, state machines, bar charts, cell grids, and more)
- a presenter window (press `N`): your speaker notes, a clock, and the next slide title, synced live with the deck
- an overview grid (press `O`): live thumbnails, click to jump
- in-place editing (press `E`) with a save-copy download for last-minute changes
- a `pdf` button and print styles tuned for exact 16:9 pages
- fully offline: Space Grotesk, Inter, and JetBrains Mono are embedded in the file (all SIL OFL licensed, license texts included)

The output is assembled from a small design system, not improvised, so every deck looks deliberate and consistent. A 21-check verifier runs before a deck is delivered.

## Install

```
/plugin marketplace add HoneyPaptan/deck-meet
/plugin install deck-meet@deck-meet
```

Then say "make me a deck about ..." or just `deck-meet` in any Claude Code session.

## Demo

Open `skills/deck-meet/examples/deck-meet-demo.html` in a browser. Controls: arrows to move, `O` overview, `N` presenter notes, `E` edit, `F` fullscreen.

## Theming

`skills/deck-meet/reference/theme.css` is the single theming surface: every color and font role is a token there. Swap it for your brand palette and regenerate `reference/fonts.css` with your fonts as base64 data URIs, and every future deck wears them. If you redistribute fonts, mind their licenses; the bundled three are SIL OFL.

## Layout

- `skills/deck-meet/SKILL.md` is the workflow the agent follows: gather, interview, slide plan with an approval gate, assemble, verify, report.
- `skills/deck-meet/reference/` is the design system: theme tokens, base styles, deck runtime, SVG motif catalogue, a build assembler, and the verifier.

## License

MIT for everything in this repository except the embedded fonts, which are SIL OFL 1.1 (license texts in `skills/deck-meet/reference/fonts-src/`).

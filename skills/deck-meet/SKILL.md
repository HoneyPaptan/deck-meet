---
name: deck-meet
description: Use when the user wants a presentation or slide deck from any material (markdown, text, PDF, docx, blog post, URL, meeting notes, pasted context, or just an idea talked through), or says "deck-meet", "make slides", "turn this into a deck", or "help me prepare a talk".
---

# deck-meet

Turns any material plus a conversation into a standalone animated HTML deck: one self-contained file, no install, no network, arrow keys to present, SVG diagrams that move, an edit mode for last-minute changes, and a play button that goes fullscreen. On request it also emits a markdown outline of the approved plan and a rendered PDF.

The deck is only as good as the intent behind it. The build is the cheap part; the interview and the slide plan are the work. **Never build before the plan is approved.**

## The one rule that makes it look good

**Do not design. Assemble.** The `reference/` directory next to this file is a finished design system: `fonts.css` (Space Grotesk, Inter, and JetBrains Mono embedded as data URIs, so decks work offline), `theme.css` (the color and font tokens, the only theming surface), `base.css`, `runtime.js`, `skeleton.html` (the slide patterns), `svg-motifs.md`, `assemble.py`, and `verify.sh`. The deck is built by writing a slides fragment and running `assemble.py`, which pastes the system verbatim around it. Every diagram is a motif from `svg-motifs.md` with labels changed. A deck that follows the motifs exactly looks deliberate; a deck that improvises looks like every other generated page. The only creative work is picking the right visual for each idea and writing the sentences.

Read every file in `reference/` except `fonts.css` before starting. Do not skip this because the task looks simple.

## Phase 1: Gather

Take the material in whatever form it arrives, any mix of:

- **File on disk**: markdown, plain text, HTML. Read it. PDF: read with the Read tool, or `pdftotext` for big ones. docx: `pandoc -t markdown` when pandoc exists, otherwise ask for an export.
- **URL**: fetch it, strip navigation, sidebars, and comments.
- **Pasted context**: work on it as given.
- **Nothing but an idea**: the interview simply digs deeper; the user's answers become the source material.

Read all of it before asking anything.

Extract silently: the one-line claim, the candidate ideas (things a listener could be wrong about, not topics), every number that matters, the surprising part, any code, any caveats.

## Phase 2: Interview

Ask, in one short round (use AskUserQuestion when available, plain questions otherwise):

1. **Audience**: who sits in the room and what do they already know?
2. **Occasion and time**: standup, sprint review, external talk, teaching session? How many minutes?
3. **Goal**: after the last slide, what should the audience think, feel, or do? One sentence.
4. **Must-land**: the one thing that cannot be lost, and anything to deliberately leave out.

Follow up only where an answer changes the deck. Time gives the slide budget: roughly one content slide per 1.5 to 2 minutes, plus title and closing. Keep asking until the slide count is settled with the user, not assumed.

## Phase 3: Slide plan (approval gate)

Propose the full plan as a numbered list, one line block per slide:

```
NN. <slide title as a sentence>
    intent: <what the audience should get from this slide, one sentence>
    content: <bullets, number, code, or prose, sketched in a few words>
    visual: <motif from svg-motifs.md, or stats / panels / quote / steps / rules / table / code / none>
    reveals: <none, or which elements step in on arrow presses>
    notes: <optional: one or two spoken lines for the presenter window, when the user gave or wants them>
```

Then ask the user to approve, cut, merge, reorder, or rewrite. Apply edits and re-show only the changed slides. **Wait for an explicit yes before building.** This gate is not optional, and not satisfied by silence.

One exception, keyed to the user's own words: if they explicitly waived the back and forth ("skip the questions", "just build it, I trust you"), print the plan, build immediately without waiting, and invite per-slide edits in the report. The waiver must be stated by the user; urgency, seniority, or a short deadline never imply it.

Plan rules:

- Slide titles are sentences carrying the point ("Retries amplify the outage"), never topics ("Retries").
- One idea per slide. An idea needing two visuals is two slides.
- Every number the deck shows must exist in the source or come from the user. Invent nothing.
- Caveats from the source survive onto the slide that owns them.

## Phase 4: Build the HTML deck

Write a slides fragment, then assemble:

1. Write `<slug>.slides.html`: one `<section class="slide" aria-label="...">` per approved slide, following the patterns in `skeleton.html`. Title slide gets `class="slide center"` and the only `h1`, closing slide gets `center`. Never copy a block that carries `data-example`; those are teaching patterns, not content.
2. Fill each slide from its plan line. Visuals come from `svg-motifs.md` or the HTML blocks it lists. Mechanism diagrams get motion primitives; charts, timelines, and matrices stay still. At most three moving things per diagram.
3. Reveals: `data-step="1"`, `data-step="2"` on the planned elements, numbered per slide in the order they should appear.
4. Speaker notes: `<aside class="notes">...</aside>` as the last child of a slide that has them. Never rendered on the slide or in the PDF; the presenter window reads them.
5. Suffix svg marker ids per diagram (`arr`, `arr2`, `arr3`) so they never collide in one file.
6. Assemble: `python3 <skill-dir>/reference/assemble.py "<Title>" <slug>.slides.html <slug>.html`
7. Grep the output for `{{` and expect zero hits before calling it written.

Hard limits, each a build failure:

- Text on slides: a title plus at most 5 bullets, or one figure plus a caption, or one code block of at most 12 lines. Overflow means split the slide.
- No gradients, glassmorphism, blur, glow, drop-shadow stacks, emoji, or icon fonts. The design system already made these calls.
- One accent color. `.ok` and `.err` are the only other hues. No hex outside `theme.css`.
- No em dash, en dash, or spaced hyphen in any rendered string. Rewrite with a comma, colon, or two sentences.
- No external resources at all. Fonts ship inside the file; the deck must open with networking off.
- Nothing changed in `fonts.css`, `theme.css`, `base.css`, or `runtime.js`. A styling need the system cannot meet is raised with the user, not patched inline.

## Phase 5: Verify

```bash
bash <skill-dir>/reference/verify.sh <slug>.html
```

Fix and re-run until every line is PASS. Then check by eye against the plan: every approved slide present in order, reveals stepping where planned, every diagram moving where planned. Offer to open it: `xdg-open <slug>.html`.

## Extra outputs, on request only

- **Markdown outline** ("give me the outline too"): write `<slug>.deck.md`, the approved plan as a plain markdown deck: `#` title slide, `---` between slides, `##` per slide title, content beneath, `<!-- intent: ... -->` per slide.
- **PDF** ("make it a pdf"): the deck carries print CSS (one 16:9 page per slide, all reveals shown, chrome stripped, colors exact). Render with whichever Chromium-family browser exists (`chromium`, `google-chrome-stable`, `brave`, `edge`):

```bash
brave --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=<slug>.pdf <slug>.html
```

With no such browser, tell the user to open the deck and print it; the print CSS produces the same pages.

## Phase 6: Report

State: output path(s), slide count against the approved plan, which motifs were used, anything from the source deliberately dropped and why, and the controls: arrow keys or space to move, F for fullscreen, O for the overview grid (click a thumbnail to jump), N for the presenter window (notes, clock, next slide; its arrow keys drive the deck), position survives reload via the URL hash, and the toolbar top right. The toolbar's `edit` (or the E key) makes every slide text-editable in place with prev/next buttons for moving between slides, `grid` and `notes` mirror O and N, `pdf` opens the print dialog with the tuned print styles (save as PDF gives exact 16:9 pages), `play` leaves edit mode and goes fullscreen to present, `save copy` downloads the deck with the edits baked in. The file is fully self-contained and works offline.

## Iteration

The user will react slide by slide ("slide 4 needs the sequence diagram, not bullets", "cut 6", "make the packet slower"). Edit the slides fragment, re-run `assemble.py` and `verify.sh`, and keep untouched slides byte-identical. Print only what changed. A new idea mid-iteration goes through a one-line plan entry and a yes before it is built.

## Theme

`reference/theme.css` is the single theming surface: every color and font role the deck uses is a token there. To rebrand for your team, replace `theme.css` with your palette and regenerate `fonts.css` with your fonts embedded as data URIs; nothing else changes.

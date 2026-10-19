# DESIGN.md

How to structure the content of every slide and the taste the deck must follow. Read this after SKILL.md and before writing the slides fragment. svg-motifs.md governs how diagrams are drawn; this file governs what goes on a slide and how it looks as a whole.

Theme tokens come from theme.css and are the only source of color. This document never names a color; it names roles (accent, ink, muted, surface). More token sets will exist later; the rules here must hold under any of them.

## Taste laws

The look is technical editorial: the restraint of an engineering datasheet with the confidence of a magazine spread. Every law below is checkable; break none.

1. **One accent.** A single accent color per deck, used for: the subject of a diagram, eyebrow squares, index numerals, the chosen row, one value tag. If two things on a slide are accented, one of them is wrong.
2. **Mono carries data.** Every number, unit, axis label, index, tag, and eyebrow is set in the mono font, uppercase, letterspaced. Prose never uses mono; data never uses the body font. A reader must be able to squint and find every number by texture alone.
3. **Statements are headings.** On a statement slide the claim itself is the typography: one to three short sentences, uppercase, large. No separate title above it. The eyebrow names the subject; the statement says the thing.
4. **Hairlines, not boxes.** Structure comes from 1px rules and whitespace, never from filled cards, borders around everything, or background panels. A divider is 1px of the muted token.
5. **Line art only.** Every drawn visual is stroke-only: hairline to 2px strokes, no fills except tiny solids (bullets, dots, chips), no gradients. Motion history is shown with echo outlines: two or three offset copies of the shape at decreasing opacity, all stroke-only.
6. **Ornament budget: one.** At most one decorative element per slide: a dotted-grid block, a bracket pair, or a corner tag. It sits in leftover space and never competes with content.
7. **Whitespace is the layout.** Slides breathe. If a slide feels empty, it is correct. If content has to shrink to fit, split the slide.
8. **Banned outright:** glows, gradient fills or gradient text, drop shadows as decoration, blur, particles, 3D transforms, emoji, stock imagery, more than one accent, rounded-corner card grids, bounce easing.

## Slide archetypes

Every slide is one of these. Naming the archetype per slide in the plan is mandatory; the user approves archetypes, not just titles.

### stat
One number that matters. Structure, top to bottom: bracketed mono context line (the delta or comparison, e.g. `[ 27 -> 14 KN-M ]`), the number huge and light-weight, a quiet lowercase noun under it. Optionally a supporting chart fills the other half. One number per slide; two numbers is a comparison chart, not a stat.

### statement
The claim slide. One half is the statement block: small accent square + mono uppercase eyebrow naming the subject, then the uppercase claim, max ~20 words. The other half is a line-art visual or diagram. Optionally one mono value tag pinned to the visual (`3050 M`). Use for the ideas the audience must not leave without.

### list
Three to six rows separated by hairlines. Each row: accent square, mono two-digit index (`01`), one line of uppercase text. No sub-bullets, no wrapping past two lines, no ninth item. A visual may hold the other half. Order rows by importance unless sequence matters.

### chart
The claim is the heading, never a label like "Results". Chart style: dotted gridlines, mono axis labels with units, point series as small squares or dots, square legend chips, subject series in accent, comparison series in muted. Bars follow svg-motifs.md. Axis starts at zero for bars; say so in a footnote when it cannot.

### diagram
A mechanism from svg-motifs.md, step-synced so each arrow press (or scroll beat) advances the story. Eyebrow names the mechanism. At most one sentence of prose; the diagram is the content.

### section
A break between chapters: mono section numeral, short title, nothing else. Ornament allowed. These are the only slides allowed to be nearly empty on purpose.

### title / closing
Title: deck name, one-line subtitle, presenter, date. Closing: the one-sentence takeaway and, when there is one, the ask. Never end on "Thank you" alone; end on the takeaway.

## Content rules

- One idea per slide. A slide that needs "and" in its heading is two slides.
- Headings are claims, not topics. "CACHING CUT P99 BY HALF", never "Caching results".
- Every number carries its unit, in mono. A number without a unit does not go on a slide.
- Eyebrows name subjects in one or two words. They are wayfinding, not summary.
- Density caps: 20 words per statement, 6 list rows, 7 diagram boxes, 1 number per stat, 2 series per chart. Over the cap means split or cut.
- No filler slides: no agenda unless the talk exceeds 20 minutes, no "Questions?" slide, no clipart metaphors.

## Composition

Three grids cover everything; pick per slide, vary across the deck so consecutive slides do not repeat a grid.

- **Split**: two halves, visual and text. Statement, chart, and list slides default here. Either side may take the visual.
- **Asymmetric**: roughly 5/12 and 7/12. For stat + chart pairs and diagram + caption.
- **Full-bleed**: one element owns the slide. Section breaks, title, a single wide diagram.

Text blocks align to one left edge per slide. Vertical centering only on section, title, and stat slides; content slides hang from a consistent top line.

## Heading voice

The theme fixes color and fonts; the heading voice varies per deck and is chosen in the interview, named in the plan, and approved with it. Voices are the named presets in base.css (`data-voice` on body). Pick by content mood: heavier display voices for launches and pitches, mono/editorial voices for engineering and research decks. Never mix voices within a deck.

## Motion taste

Motion explains; it never decorates. Full primitive rules live in svg-motifs.md; the taste layer:

- Entrances ease out: `cubic-bezier(0.22, 1, 0.36, 1)` or the spring preset in runtime.js. Exits are faster than entrances.
- Durations 300-700ms. Stagger 40-90ms between siblings. Nothing loops faster than 1.5s.
- At most three moving things per slide, diagrams included.
- Echo outlines (offset stroke copies) are the only motion trail. No blur trails, no glow trails.
- In story mode, scroll progress drives the same timelines the arrow keys would; a beat must read correctly when the viewer stops mid-scroll.
- Everything settles: print, reduced motion, and headless rendering all see the final frame.

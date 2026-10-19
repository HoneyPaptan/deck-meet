# SVG motifs

Every diagram on a slide is assembled from these motifs. Copy the closest one, change labels, counts, and positions. Do not invent a new visual style; a new arrangement of these parts is fine, a new look is not.

## Grammar (applies to every diagram)

- Coordinates on an 8px grid. Standard canvas `viewBox="0 0 1000 300"`; taller diagrams may use 360 or 420.
- Every `<svg>` carries `role="img"` and an `aria-label` describing the mechanism in one sentence.
- Boxes: `<rect class="box">` with `rx="6"`, minimum 120x56. Variants: `.hot` (accent border, the component the slide is about), `.ok`, `.err`.
- Labels: `<text class="lbl">` centered with `text-anchor="middle"`, one or two words. Secondary text: `class="sub"`.
- Connections: `<path class="wire">` or `<line class="wire">` with `marker-end="url(#arr)"`. The path the slide is about gets `.hot`.
- At most 7 boxes per diagram. More than 7 means the idea should be split across two slides.
- Colors come only from the CSS classes above. No `fill` or `stroke` attributes carrying hex values.
- Include the marker defs block once per svg that uses arrows:

```html
<defs>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"/>
  </marker>
  <marker id="arr-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)"/>
  </marker>
</defs>
```

Reuse `id="arr"` only once per svg. When one file holds several svgs, suffix the ids (`arr2`, `arr-hot2`) so they never collide.

## Motion primitives

Mechanism diagrams must move; timelines and matrices stay still. At most three moving things per diagram, no loop faster than 1.5s. The runtime pauses everything on inactive slides and under reduced motion, and everything settles to its final frame for print, thumbnails, and reduced motion.

Looping primitives run on CSS; one-shot primitives are driven by `runtime.js` through the Web Animations API with an `outQuart` curve. Never bounce, never glow, never blur.

| Class | Engine | What it does | Use on |
|---|---|---|---|
| `.packet` | CSS, loops | A dot travels the path given in `style="offset-path: path('...')"` | The data moving through a pipeline or between actors |
| `.flow` | CSS, loops | Marching dashes along a wire | A stream or continuous channel |
| `.pulse` | CSS, loops | Element breathes | The component doing the work right now |
| `.draw` | CSS once, runtime when stepped | Path draws itself, staggered by `--i` | Arrows appearing in causal order (set `pathLength="1"`) |
| `.pop` | CSS once, staggered by `--i` | Element scales in | Boxes or nodes appearing in reading order |
| `.grow` | runtime, on activation | Bar scales from zero along x | Chart bars (`data-origin` overrides the default `left center`) |
| `.trace` | runtime, on activation | Line draws itself once | Chart lines and series paths |
| `.pt` | runtime, on activation | Points appear in a fast stagger | Chart point series |

Packet example, riding a wire from box A to box B. Start and end the offset path at least 16 units clear of any box edge so the dot never sits glued to a border between loops:

```html
<circle class="packet" r="6" style="offset-path: path('M 236 150 L 396 150')"/>
```

Draw-on arrow, second in its sequence:

```html
<path class="wire hot draw" style="--i:1" pathLength="1" d="M 300 96 L 300 160" marker-end="url(#arr-hot)"/>
```

## Step staging inside a diagram

`data-step` works on svg elements exactly as it does on list items: the element stays hidden until the presenter presses an arrow (talk mode) or the viewer scrolls to its beat (story mode). This is how a mechanism gets narrated one cause at a time instead of playing all at once.

- A stepped wire with `.draw` and `pathLength="1"` draws itself at the moment it is revealed.
- A stepped box or node scales in at the moment it is revealed.
- Number steps in causal order and never skip a number. Elements without `data-step` show with the slide.
- Elements sharing a step number reveal together as one beat; give a box and its label the same number.
- Two to four steps per diagram; more means the slide is doing a lecture's work.

```html
<rect class="box hot" x="420" y="82" width="160" height="56" rx="6" data-step="1"/>
<path class="wire hot draw" data-step="2" pathLength="1" d="M 300 110 L 412 110" marker-end="url(#arr-hot)"/>
```

## 1. Pipeline (left to right request or data flow)

For: system flow, request path, ingest pipeline, anything "X goes through Y to Z".

```html
<svg viewBox="0 0 1000 220" role="img" aria-label="Requests flow from the client through the gateway to the store">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <rect class="box" x="60" y="82" width="160" height="56" rx="6"/>
  <text class="lbl" x="140" y="116" text-anchor="middle">client</text>
  <rect class="box hot" x="420" y="82" width="160" height="56" rx="6"/>
  <text class="lbl" x="500" y="116" text-anchor="middle">gateway</text>
  <rect class="box" x="780" y="82" width="160" height="56" rx="6"/>
  <text class="lbl" x="860" y="116" text-anchor="middle">store</text>
  <line class="wire" x1="220" y1="110" x2="412" y2="110" marker-end="url(#arr)"/>
  <line class="wire" x1="580" y1="110" x2="772" y2="110" marker-end="url(#arr)"/>
  <circle class="packet" r="6" style="offset-path: path('M 228 110 L 772 110')"/>
</svg>
```

Variants: a branch (one wire splitting to two boxes stacked at the same x), a merge (two wires into one box), a return path (second wire drawn back underneath, `.sub` label saying what returns).

## 2. Sequence (two or three actors, time downward)

For: request and response, handshake, retry, race condition.

```html
<svg viewBox="0 0 1000 320" role="img" aria-label="The client writes, the primary acknowledges, then replicates to the follower">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <text class="lbl" x="200" y="36" text-anchor="middle">client</text>
  <text class="lbl" x="500" y="36" text-anchor="middle">primary</text>
  <text class="lbl" x="800" y="36" text-anchor="middle">follower</text>
  <line class="wire" x1="200" y1="52" x2="200" y2="290" stroke-dasharray="3 5"/>
  <line class="wire" x1="500" y1="52" x2="500" y2="290" stroke-dasharray="3 5"/>
  <line class="wire" x1="800" y1="52" x2="800" y2="290" stroke-dasharray="3 5"/>
  <line class="wire hot draw" style="--i:0" pathLength="1" x1="200" y1="100" x2="492" y2="100" marker-end="url(#arr)"/>
  <text class="sub" x="346" y="88" text-anchor="middle">write(k, v)</text>
  <line class="wire draw" style="--i:1" pathLength="1" x1="500" y1="160" x2="208" y2="160" marker-end="url(#arr)"/>
  <text class="sub" x="346" y="148" text-anchor="middle">ack</text>
  <line class="wire draw" style="--i:2" pathLength="1" x1="500" y1="230" x2="792" y2="230" marker-end="url(#arr)"/>
  <text class="sub" x="646" y="218" text-anchor="middle">replicate</text>
</svg>
```

A race condition is two `.draw` arrows that cross, the losing one `.err`.

## 3. Bars (comparison of magnitudes)

Labels on the bars, values at the end, no legend, no axis clutter. The subject bar is `.hot`. Add `.grow` to every bar so they scale in on activation; widths must be proportional to the real values. Two to six bars; more belongs in a table.

```html
<svg viewBox="0 0 1000 240" role="img" aria-label="The append path is three times faster than the in-place path">
  <text class="lbl" x="60" y="76">append</text>
  <rect class="bar hot grow" x="220" y="54" width="640" height="36" rx="4"/>
  <text class="lbl" x="876" y="78">41k ops/s</text>
  <text class="lbl" x="60" y="156">in-place</text>
  <rect class="bar grow" x="220" y="134" width="230" height="36" rx="4"/>
  <text class="lbl" x="466" y="158">12k ops/s</text>
</svg>
```

## 4. Nodes and edges (tree, graph, ring)

For: data structures, topologies, service graphs. Nodes are circles (`r="34"`) or small boxes; the traversal or subject path is `.hot`, visited nodes `.pop` in visit order.

```html
<svg viewBox="0 0 1000 300" role="img" aria-label="A lookup descends the tree from the root to the target leaf">
  <line class="wire hot" x1="500" y1="90" x2="320" y2="190"/>
  <line class="wire" x1="500" y1="90" x2="680" y2="190"/>
  <circle class="box hot pop" style="--i:0" cx="500" cy="70" r="34"/>
  <text class="lbl" x="500" y="76" text-anchor="middle">17</text>
  <circle class="box hot pop" style="--i:1" cx="320" cy="210" r="34"/>
  <text class="lbl" x="320" y="216" text-anchor="middle">8</text>
  <circle class="box pop" style="--i:2" cx="680" cy="210" r="34"/>
  <text class="lbl" x="680" y="216" text-anchor="middle">29</text>
</svg>
```

## 5. State machine

States are rounded boxes on a ring or a line, transitions are labelled arrows. The happy path is `.hot`; a `.packet` cycling the ring shows the lifecycle looping.

```html
<svg viewBox="0 0 1000 260" role="img" aria-label="A job moves from queued to running to done, or fails back to queued">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <rect class="box" x="80" y="90" width="160" height="56" rx="28"/>
  <text class="lbl" x="160" y="124" text-anchor="middle">queued</text>
  <rect class="box hot" x="420" y="90" width="160" height="56" rx="28"/>
  <text class="lbl" x="500" y="124" text-anchor="middle">running</text>
  <rect class="box ok" x="760" y="90" width="160" height="56" rx="28"/>
  <text class="lbl" x="840" y="124" text-anchor="middle">done</text>
  <line class="wire" x1="240" y1="118" x2="412" y2="118" marker-end="url(#arr)"/>
  <line class="wire" x1="580" y1="118" x2="752" y2="118" marker-end="url(#arr)"/>
  <path class="wire err" d="M 460 146 C 400 210, 260 210, 200 152" fill="none" marker-end="url(#arr)"/>
  <text class="sub" x="330" y="204" text-anchor="middle">fail, retry</text>
</svg>
```

## 6. Cell grid (memory, buffers, slots, wire formats)

A row of small rects. `.on` for occupied or written, `.bad` for tombstoned or corrupt. A record layout is one row with a named field per cell. A probe sequence is a `.packet` hopping the row.

```html
<svg viewBox="0 0 1000 140" role="img" aria-label="The record lays out a checksum, a timestamp, key size, value size, then the payload">
  <rect class="cell on" x="80" y="40" width="120" height="56"/>
  <text class="sub" x="140" y="72" text-anchor="middle">crc</text>
  <rect class="cell" x="200" y="40" width="150" height="56"/>
  <text class="sub" x="275" y="72" text-anchor="middle">timestamp</text>
  <rect class="cell" x="350" y="40" width="120" height="56"/>
  <text class="sub" x="410" y="72" text-anchor="middle">ksz</text>
  <rect class="cell" x="470" y="40" width="120" height="56"/>
  <text class="sub" x="530" y="72" text-anchor="middle">vsz</text>
  <rect class="cell on" x="590" y="40" width="330" height="56"/>
  <text class="sub" x="755" y="72" text-anchor="middle">payload</text>
</svg>
```

## 7. Flowchart (decision)

One diamond, two labelled exits, the taken branch `.hot` with a `.packet` riding it. More than two decisions means the idea is really a state machine or two slides.

```html
<svg viewBox="0 0 1000 280" role="img" aria-label="A hit is served from cache and a miss falls through to the database">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <polygon class="box" points="500,40 620,120 500,200 380,120"/>
  <text class="lbl" x="500" y="126" text-anchor="middle">in cache?</text>
  <line class="wire hot" x1="620" y1="120" x2="792" y2="120" marker-end="url(#arr)"/>
  <text class="sub" x="700" y="106" text-anchor="middle">hit</text>
  <rect class="box ok" x="800" y="92" width="140" height="56" rx="6"/>
  <text class="lbl" x="870" y="126" text-anchor="middle">serve</text>
  <line class="wire" x1="500" y1="200" x2="500" y2="248" marker-end="url(#arr)"/>
  <text class="sub" x="530" y="230">miss</text>
  <circle class="packet" r="6" style="offset-path: path('M 628 120 L 792 120')"/>
</svg>
```

## 8. Timeline (phases, history)

Static. One horizontal line, dots for events, labels alternating above and below.

```html
<svg viewBox="0 0 1000 160" role="img" aria-label="The rollout went from design in March to launch in August">
  <line class="wire" x1="80" y1="80" x2="920" y2="80"/>
  <circle class="box hot" cx="180" cy="80" r="9"/>
  <text class="sub" x="180" y="50" text-anchor="middle">design</text>
  <circle class="box hot" cx="500" cy="80" r="9"/>
  <text class="sub" x="500" y="120" text-anchor="middle">pilot</text>
  <circle class="box hot" cx="820" cy="80" r="9"/>
  <text class="sub" x="820" y="50" text-anchor="middle">launch</text>
</svg>
```

## 9. Series chart (trend or comparison over an axis)

The datasheet look: dotted gridlines, mono axis labels with units, the subject series `.hot`, the comparison series muted. Points are small squares (`.pt`, 7x7, centered on the value), a trend line is a `.trace` path. Legend goes in HTML next to the figure (`.legend` with `.chip` swatches), never inside the svg. Say the claim in the slide title; the chart only proves it.

```html
<svg viewBox="0 0 1000 320" role="img" aria-label="Latency falls with the new path while the old path stays flat">
  <line class="gridline" x1="120" y1="60" x2="120" y2="260"/>
  <line class="gridline" x1="120" y1="260" x2="940" y2="260"/>
  <line class="gridline" x1="120" y1="160" x2="940" y2="160"/>
  <line class="gridline" x1="120" y1="60" x2="940" y2="60"/>
  <text class="axis" x="100" y="265" text-anchor="end">0</text>
  <text class="axis" x="100" y="165" text-anchor="end">40</text>
  <text class="axis" x="100" y="65" text-anchor="end">80</text>
  <text class="axis" x="530" y="300" text-anchor="middle">requests per second, thousands</text>
  <path class="trace" d="M 140 100 L 340 110 L 540 105 L 740 112 L 920 108"/>
  <path class="trace hot" d="M 140 120 L 340 160 L 540 200 L 740 226 L 920 240"/>
  <rect class="pt" x="136" y="96" width="8" height="8"/>
  <rect class="pt" x="336" y="106" width="8" height="8"/>
  <rect class="pt" x="536" y="101" width="8" height="8"/>
  <rect class="pt hot" x="136" y="116" width="8" height="8"/>
  <rect class="pt hot" x="336" y="156" width="8" height="8"/>
  <rect class="pt hot" x="536" y="196" width="8" height="8"/>
  <rect class="pt hot" x="736" y="222" width="8" height="8"/>
  <rect class="pt hot" x="916" y="236" width="8" height="8"/>
</svg>
```

Pair it with the HTML legend under or beside the figure:

```html
<div class="legend">
  <span><span class="chip hot"></span>with frs</span>
  <span><span class="chip"></span>without frs</span>
</div>
```

## 10. Hub and spoke (one coordinator, many members)

For: cluster topology, orchestrator and workers, a gateway fanning out. Hub is `.hot` and may `.pulse`; spokes are wires; one `.packet` per direction at most.

```html
<svg viewBox="0 0 1000 320" role="img" aria-label="The orchestrator coordinates four workers">
  <line class="wire" x1="500" y1="160" x2="200" y2="80"/>
  <line class="wire" x1="500" y1="160" x2="800" y2="80"/>
  <line class="wire" x1="500" y1="160" x2="200" y2="240"/>
  <line class="wire" x1="500" y1="160" x2="800" y2="240"/>
  <rect class="box hot" x="420" y="132" width="160" height="56" rx="6"/>
  <text class="lbl" x="500" y="166" text-anchor="middle">orchestrator</text>
  <rect class="box pop" style="--i:0" x="120" y="52" width="160" height="56" rx="6"/>
  <text class="lbl" x="200" y="86" text-anchor="middle">worker a</text>
  <rect class="box pop" style="--i:1" x="720" y="52" width="160" height="56" rx="6"/>
  <text class="lbl" x="800" y="86" text-anchor="middle">worker b</text>
  <rect class="box pop" style="--i:2" x="120" y="212" width="160" height="56" rx="6"/>
  <text class="lbl" x="200" y="246" text-anchor="middle">worker c</text>
  <rect class="box pop" style="--i:3" x="720" y="212" width="160" height="56" rx="6"/>
  <text class="lbl" x="800" y="246" text-anchor="middle">worker d</text>
  <circle class="packet" r="6" style="offset-path: path('M 500 160 L 800 240')"/>
</svg>
```

## 11. Echo trace (one shape, its history as offset outlines)

For: a thing that moved, expanded, or iterated; a before-and-after of one object. One stroke-only shape at full opacity, one or two offset copies behind it with `.echo` and `.echo.far`. No fills, no gradients; the echoes ARE the motion trail.

```html
<svg viewBox="0 0 1000 300" role="img" aria-label="The rollout ring expanded outward in two waves">
  <polygon class="wire echo far" points="360,150 400,90 500,66 600,90 640,150 600,210 500,234 400,210"/>
  <polygon class="wire echo" points="380,150 416,96 500,74 584,96 620,150 584,204 500,226 416,204"/>
  <polygon class="wire hot" points="400,150 432,102 500,82 568,102 600,150 568,198 500,218 432,198"/>
</svg>
```

## Techniques (apply everywhere)

- A one-shot draw needs `pathLength="1"` so dash math is unit-based and identical for every path.
- Scale and pop on svg elements need `transform-box: fill-box; transform-origin: center` or they rotate around the canvas origin. The runtime sets this for `.grow`, `.pt`, and stepped elements; hand-written CSS must do it itself.
- Morphing one path into another requires both paths to share the same number and types of commands; when they cannot, crossfade two elements instead.
- Gradients, filters, and `<image>` do not exist in this system. `<defs>` holds arrow markers only.
- Keep every stroke between 1 and 2.5 units at the standard viewBox; hairlines are the look.

These ideas use HTML blocks from `base.css`, not a diagram:

| Idea | Block |
|---|---|
| A number that matters | `.stats` with count-up `data-to` |
| Two things contrasted | `.panels` |
| The key insight or a quote | `.quote` |
| Ordered steps of a procedure | `ol.steps` |
| Rules or principles, not sequential | `ul.rules` |
| Options compared on features | `table`, chosen row `tr.chosen` |
| Mechanism in code | `pre` with `.k .s .c .n` spans and one to three `.hl` lines |

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

Mechanism diagrams must move; charts, timelines, and matrices stay still. At most three moving things per diagram, no loop faster than 1.5s. The runtime pauses everything on inactive slides and under reduced motion.

| Class | What it does | Use on |
|---|---|---|
| `.packet` | A dot travels the path given in `style="offset-path: path('...')"`, looping | The data moving through a pipeline or between actors |
| `.flow` | Marching dashes along a wire | A stream or continuous channel |
| `.draw` | Path draws itself once, staggered by `--i` | Arrows appearing in causal order (set `pathLength="1"`) |
| `.pulse` | Element breathes | The component doing the work right now |
| `.pop` | Element scales in once, staggered by `--i` | Boxes or nodes appearing in reading order |

Packet example, riding a wire from box A to box B:

```html
<circle class="packet" r="6" style="offset-path: path('M 180 150 L 420 150')"/>
```

Draw-on arrow, second in its sequence:

```html
<path class="wire hot draw" style="--i:1" pathLength="1" d="M 300 96 L 300 160" marker-end="url(#arr-hot)"/>
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

Static. Labels on the bars, values at the end, no legend, no axis clutter. The subject bar is `.hot`.

```html
<svg viewBox="0 0 1000 240" role="img" aria-label="The append path is three times faster than the in-place path">
  <text class="lbl" x="60" y="76">append</text>
  <rect class="bar hot" x="220" y="54" width="640" height="36" rx="4"/>
  <text class="lbl" x="876" y="78">41k ops/s</text>
  <text class="lbl" x="60" y="156">in-place</text>
  <rect class="bar" x="220" y="134" width="230" height="36" rx="4"/>
  <text class="lbl" x="466" y="158">12k ops/s</text>
</svg>
```

Bar widths must be proportional to the real values. Two to six bars; more belongs in a table.

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

## Not SVG

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

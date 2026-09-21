# The Arms of Time

Deep time laid out across a pair of outstretched arms. The left fingertip is the
start, the right fingertip is now, and everything in between is drawn along the
arms of Leonardo's Vitruvian Man. Drag the scrubber along the fingertip line to
move through it.

The point of the thing is the scale readout. On a 1.90 m span the whole universe
works out at **1 mm = 7.26 million years**, so one swipe of a nail file across a
fingertip takes off 726,000 years — every human who ever lived, gone.

On the **Humans** timeline everything is shown twice: in years, and in **human
generations** (one generation = about 27 years). Same number, and the second one
is harder to shake off. Generations are left off the Universe and Earth
timelines — there were no humans to count.

The whole thing is one screen: a single slim bar at the top, the arms, the
readouts, then the events — a strip of cards running left to right like the
arms, or a list down the page. Nothing scrolls but the events.

After the Natural History Museum of Los Angeles County's
[At Arm's Length: A Short History of Earth](https://www.youtube.com/watch?v=uMXt0eGXuZc).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173 (or the port Vite prints)
npm run build    # typecheck + production build into dist/
npm run preview  # serve the build
npm run typecheck
```

Vite + SolidJS + TypeScript, Tailwind CSS 4 with DaisyUI 5. No router, no
network calls, no fonts fetched from anywhere.

## Using it

Every control lives in the one bar at the top: title, timeline, timelines,
how many events, arm span, theme.

- **Theme** — `System` / `Dark` / `Light`. Default is `System`: it takes the
  browser's `prefers-color-scheme` and keeps following it, so flipping the OS
  to night mode repaints the app while it is open. The choice is kept in
  `localStorage` and settled before the first paint, so there is no flash on
  reload.
- **Timeline** — five, each one a whole arm span: Universe (13.8 Ga), Earth
  (4.54 Ga), Life (3.7 Ga, from the first traces), Humans (7 Ma, from the split
  with chimpanzees) and Modern humans (4,600 years, from the Great Pyramid).
  **Earth** and **Modern humans** are still being worked on, so they only
  appear in dev mode: add `?dev=1` to the URL
  (`http://localhost:5173/?dev=1`). The flag is read once, at load, and nothing
  is stored; a timeline kept from a dev visit falls back to Universe without it.
  Dev mode also adds a **Prototype** panel, under Dev in the settings menu:
  a floating box of live sliders for numbers that ship as constants, in tabs.
  **Figure** holds the top cut, the bottom cut and the height, and copies back
  into `src/figure.ts`. **Fade** holds the run-out into air — over the head,
  under the arms, at each fingertip, a circle that hides or keeps what is
  inside it, and a dimmer on each of the two layers — and copies back into
  `src/fade.ts`. Everything on the Fade tab but the run-out under the arms sits
  at "does nothing" by default, so it is a workbench and not a second look.
  **Scrub** holds the sizes and distances around the knob — how far the
  timeline is drawn under the fingertips and how thick it is, the ring's size,
  edge, halo, lift and press, the event dots, the bars, the names above the
  line and the readout rail — and copies back into `src/scrub.ts`.
  Drag until it looks right, press Copy, paste the block back into the file it
  names. Where the box sits, which tab is open and every value are remembered. Everything behind the flag
  is purple, and nothing else in the app is, so a purple thing on screen is a
  thing that does not ship.
- **Timelines** — the named spans (eons, periods, species, ages) on their own strip
  above the arms, coarsest row at the top and the finest against the fingertip
  line. Two rows at most: more than that reads as a wall of little boxes, so
  the finest families are left off. On by default; switch them off to read the
  arms bare.
- **Simple / All** — Simple is the default: about fourteen turning points per
  timeline, listed in each timeline's `keyEvents`. All shows everything the data
  holds.
- **Scale unit** — an arrow each side of the scale readout steps the ruler:
  **1 mm**, **a hair** (0.07 mm), **a finger**. A finger is a 96th of the span,
  rounded to whole millimetres — Vitruvius counts a man as 24 palms of 4
  fingers — so it stays a finger at any arm span. On 1.90 m it is 20 mm.
- **Numbers** — **Plain** or **Science**. Plain is the default: each date is a
  round number, the way a person says it. Science adds the ± error bar to the
  date line, grey and small, sharing one unit — "130 ±5 million years ago". A
  handful of the deepest dates are pinned finer than their own unit, so their
  bar keeps its own words: "4.57 billion years ago ±500,000 years". Science
  also draws that bar on the arms: a short grey line through the dot, as wide
  as the date is unsure.
- **Arm span** — set your own. 1.90 m is the default; anything from 0.50 to
  2.60 m is accepted.

Every choice in the bar is kept in `localStorage` under `armsoftime:` and comes
back on the next visit — `src/prefs.ts` for the timeline, the timeline strip, the scale
unit, the event count, the error bars and the arm span, `src/theme.ts` for the theme, which also has to
land before the first paint. Anything stored that no longer parses (a renamed
timeline, say) falls back to the default. The marker itself is not kept.
- **Scrubber** — an empty ring on the fingertip line, so the drawing shows
  through it. Drag it, or press anywhere along the arms.
  With the knob focused: `←` `→` to step, `Shift` for bigger jumps, `Alt` to hop
  between events, `PageUp` / `PageDown` for large jumps, `Home` / `End` for the
  fingertips.
- **Events** — the one nearest the marker is highlighted and held in the middle;
  everything older than the marker greys back, so the events read as a strip
  running past the knob. Click any card or row to move the marker there. Each
  carries its Wikipedia link and its date source. On All there are sixty of
  them, so dragging does as little work as it can: at most one scroll a frame,
  and none at all when the live one is already centred.
  Events can share an instant — the asteroid sits on the end of the age of
  dinosaurs, and three events share the first moment of the universe — and then
  the marker alone cannot say which card is meant. The card the reader picked
  wins, then a moment over something that merely lasted through it. Otherwise
  the moment's card could never be reached: it owns a single point, and the
  range around it would take every one of them.
- **Timeline preview** — point at another timeline in the bar and the arms show
  what it would cover, without picking it: its whole span as a highlighted
  block running from where it starts to the right fingertip, because every
  timeline ends at now. Two thin curves fall from the button onto the block's
  two edges, the same line the live card gets. The one already picked answers
  too: it is the whole arm, fingertip to fingertip. A longer one has nowhere to
  sit on this arm, so it shows nothing. On the long spans the block is a
  sliver at the very end of the arm, which is the point, so it is held to a
  couple of pixels rather than allowed to vanish.
- **Span preview** — point at a cell in the timeline strip and that span is painted
  down the whole drawing in its own colour. A cell is a few pixels tall, so a
  long span like the dinosaurs' reads there as a stripe of colour rather than
  as a stretch of arm; this puts it back on the arm without moving the marker.
- **The link** — on cards, a thin line runs from the readout under the knob to
  the live card, fading in at one end and out at the other, so the reading and
  the event are visibly the same thing. Both ends move on their own — the
  readout glides, the strip scrolls the card back to the middle — so
  `src/components/MarkerLink.tsx` measures the two anchors frame by frame and
  stops once they hold still.

The scale numbers sit beside the arms, left and right, rather than in a band
under them: that height belongs to the event list. Below `lg` they fold into
one compact line.

The marker readout says the year the marker is on, all the way to the
fingertip — near now that reads "8,420 years ago", not "under 20 million years
ago". Years are written to three figures in the thousands and up, two below
that: "440 years ago", never "437 years ago". On the two short timelines it also gives the calendar year.

The page fits one viewport (`100dvh`, a flex column) and never scrolls, in
either direction. Only the events scroll, and only sideways: one card per event
on a rail, oldest at the left fingertip and now at the right, the same way the
arms run. Both ends of the strip fade out, and each end carries half a strip of
padding, so the first and the last card can sit in the middle like any other.

## Data

Timeline data lives in [`data/`](data/), split one entity per file, and is
imported at build time, so a change to it shows up on the next dev reload. It
holds five timelines (`universe`, `earth`, `life`, `humans`, `modern`), 60 bands
and 173 events, every one of them with a Wikipedia link and a date source.
[`research/research.md`](research/research.md) is the working notes behind it:
the spans, the scale maths, the band tables and the full source list.

```
data/
  meta.json                 the few global numbers
  timelines/<id>.json       one file per timeline
  bands/<group>.json        bands, grouped by the timeline they start on
  events/<group>/<id>.json  one file per event
```

The `<group>` folder is where a thing *starts*, not everywhere it shows. There
is no `events/life/` folder: every life event is also an earth one and lives
under `earth`. `src/data.ts` globs the whole tree, so a new file needs no
registration anywhere — write it and it is in.

**The data folder is read-only to the app,** the same way `research/` is.
`src/data.ts` still drops anything malformed rather than letting it break the
render.

Shape:

```jsonc
// data/meta.json
{ "generated": "YYYY-MM-DD", "defaultArmSpanM": 1.90,
  "generationYears": 26.9, "generationSource", "note" }

// data/timelines/life.json
{ "id", "label", "spanYears", "spanUncertaintyYears", "spanGenerations",
  "startLabel", "endLabel", "note", "wikipedia", "source", "sourceTitle" }

// data/bands/earth.json — a list
[{ "id", "label", "kind", "fromYearsAgo", "toYearsAgo",
   "timelines": ["timeline id", ...], "wikipedia", "source", "sourceTitle" }]

// data/events/earth/e-first-life.json
{ "id", "label", "description", "yearsAgo", "endYearsAgo", "uncertaintyYears",
  "generationsAgo", "certainty", "wikipedia", "source", "sourceTitle",
  "watch", "watchTitle",
  "timelines": {
    "earth": { "simple": true },
    "life":  { "simple": true, "landmark": false, "label", "description" }
  } }
```

An event's `timelines` is a map, not a list: the key is the timeline, the value
is how *that* timeline treats it. The same moment can be a headline on one and
a footnote on another — first life is the whole point of the Life timeline and
one step among many on Earth's — so `simple`, `landmark` and the wording are
each set per timeline. `src/data.ts` folds them in at load, and nothing on
screen has to know an event can live in two places.

- `simple` keeps the event in Simple mode. A timeline where nothing is marked
  simple shows everything in both modes.
- `landmark` writes the event's name on the arm itself, just above the line,
  instead of only on its card. For the few fixed points a reader should see
  without scrubbing — `u-earth` on the universe timeline. Keep the list short:
  the names sit on the drawing.
- `label` and `description` say it differently on one timeline. Both optional;
  without them the event's own wording is used.

A **band's** `timelines` stays a plain list: a band has nothing to set per
timeline. The Proterozoic is the same band on Earth and on Life.

A timeline only takes what fits inside its span; anything older is dropped.

- `yearsAgo` counts back from now (`0` = now, taken as 2026). Position along
  the arms is `x = 1 - yearsAgo / spanYears`.
- `endYearsAgo` makes an event a **stretch** instead of a moment: something
  that lasted, like the age of dinosaurs. `yearsAgo` is then the older edge and
  `endYearsAgo` the younger one. The arm draws a bar with a tick on each edge,
  and the card says how long it ran instead of how well it is pinned. Leave it
  out for a moment. A band is still the way to name a *part of the timeline* —
  an eon, a species, an age; a stretch is one the reader should meet as an
  event. Do not call a stretch a range: the ± on a date is a range too, and
  both show on the same card.
- `generationsAgo` is optional. When it is missing it is worked out as
  `yearsAgo / meta.generationYears`, and `generationYears` itself falls back to
  **26.9**.
- `wikipedia` and `source` are rendered as links when they start with `http`.
  `sourceTitle` names the `source` link; when `source` is plain text instead of
  a URL it is shown as a quiet citation. All three are optional.
- `watch` on an event is a video for the reader who wants more than the card
  holds, shown as a third quiet link beside Wikipedia. `watchTitle` names it and
  falls back to "Video". A link and nothing else: a still would fill a card that
  is only fifteen rem tall, the page fetches nothing at runtime, and the video's
  artwork is not ours to bundle. Anything that is not an `http` URL is dropped.
- `note` on a timeline is the quiet line above the events. The tooltip on its
  button in the top bar is built instead from `startLabel`, `endLabel` and
  `spanYears`, so it stays one short line.
- `meta.generationSource` and `meta.generated` are shown in the credit line at
  the foot of the page: the paper the 26.9 years comes from, and the date of
  the data.
- `kind` groups bands into families — `eon`, `era`, `period`, `epoch`,
  `species`, `culture` — and the timeline strip draws one row per family, coarsest
  at the top. `MAX_BAND_ROWS` in `src/figure.ts` caps the strip at **two**
  rows: each family gets one row while another is still waiting, the last one
  in takes whatever is left, and families past the cap are dropped rather than
  squeezed. Bands inside a family that overlap in time (Paranthropus and
  *Homo habilis* did) would need a row each, so on a busy family only the first
  row survives the cap. A band is named only when its cell is wide enough to
  hold the name; the rest carry it in a DaisyUI `tooltip`, which is also where
  the family shows up. Clicking one moves the marker to where it starts.

### Reading the data as a table

`?dev=1` → Settings → **Data browser** puts every row in `data/` on screen:
one tab for events, one for bands. It is a window, not an editor — nothing in
it writes back to the files.

It shows what a single file cannot. Each row carries a chip per timeline it is
on, marked `★` for `simple`, `▲` for `landmark` and `✎` where that timeline
overrides the wording, so a disagreement between two timelines is one glance.
**Missing something** filters to the rows with no Wikipedia link, no date
source or no description — the standing rule is that every event and band
carries both links, and this is how that gets checked. The foot counts each
timeline's events, simple, landmarks and bands. Clicking a row walks the marker
to its date.

The headers are the words the data uses, not friendlier ones — hover one for
the field it reads. That is the point of a dev table: what you see is what you
would type into the file.

**Editing.** The pencil on a row opens an editor for the wording and the
per-timeline flags: the shared `label` and `description`, then `simple`,
`landmark` and the per-timeline overrides, one block per timeline the event is
on. Edits are drafts. They live in `localStorage`, never touch a file, and the
app reads them on top of the real data — so a new label lands on the arm and on
the card while the box is still open. That is why the panel is docked to the
bottom of the screen instead of centred: the arms have to stay visible.

**Copy as prompt** turns every draft into a block to paste into a chat:

```
data/events/universe/u-cmb.json
  label: "The fog clears" -> "The fog lifts"
  timelines.universe.landmark: false -> true
```

The same loop as the prototype panel — tune it where you can see it, copy the
result, never guess the value in the editor. Claude writes the files from that
block; on the next reload the drafts are gone, because `pruneDrafts` in
[src/edits.ts](src/edits.ts) drops anything the files have caught up with.

Dates, sources and `endYearsAgo` are deliberately not editable here: a date
needs research and a citation, not a text box in a side panel. Bands are
read-only for the same reason they are grouped into files — there is nothing to
set on them per timeline.

It costs a visitor almost nothing. All three dev workbenches are `lazy()`
imports, so they build into their own chunks and nothing asks for one until
`?dev=1` is on: a plain visit fetches the page, the Solid runtime, the
stylesheet and the two drawings, and no more.

The one part that cannot be deferred is the draft store, because `src/data.ts`
reads it on every lookup to lay the drafts over the real data. That is why it
is a module of its own — [src/drafts.ts](src/drafts.ts), the signal and
nothing else, a few dozen lines. Everything that *changes* a draft, and
`copyText`, lives in [src/edits.ts](src/edits.ts), which only the data browser
imports. Keep that line: a helper put in the wrong one of those two files
ships to everybody. With nothing drafted — every public build — `noDrafts()`
is true on the first line of `eventsFor` and the draft path is never walked.

### The punchy line per timeline

`src/facts.ts` carries one line per timeline, lifted from "The lines worth putting
on the screen" in `research/research.md`, and it shows above the event list.
Each is written as a proportion, never as a fixed count of years or
millimetres, so it stays true at any arm span — the live numbers next to it are
the scale bar's job.

## Layout of the code

| File | What it does |
| --- | --- |
| [src/App.tsx](src/App.tsx) | State and the one-screen layout: theme, arm span, timeline, marker |
| [src/theme.ts](src/theme.ts) | The two themes, the system follow, `localStorage`, the cross-fade |
| [src/prefs.ts](src/prefs.ts) | Signals that remember themselves in `localStorage` |
| [src/figure.ts](src/figure.ts) | The crop band, where the fingertips and chest sit, and the band rows |
| [src/fade.ts](src/fade.ts) | How the drawing runs out into air, as a list of mask layers |
| [src/scrub.ts](src/scrub.ts) | The timeline line, the ring, the dots, and the sizes around them |
| [src/scale.ts](src/scale.ts) | Scale maths, years, generations, all formatting |
| [src/data.ts](src/data.ts) | Globs and sanitises `data/`, folds in the per-timeline settings, and holds the dev-only timeline list |
| [src/dev.ts](src/dev.ts) | The `?dev=1` flag |
| [src/prototype/](src/prototype/) | Dev only: the floating panel of live knobs for numbers that ship as constants |
| [src/components/DataPanel.tsx](src/components/DataPanel.tsx) | Dev only: the whole of `data/` as a table, one row per file, with an editor |
| [src/drafts.ts](src/drafts.ts) | Dev only: the draft edits themselves. The one dev module on the visitor's path |
| [src/edits.ts](src/edits.ts) | Dev only: changing a draft, and the prompt they copy out as. Lazy, with the browser |
| [src/facts.ts](src/facts.ts) | The one punchy line per timeline, from the research notes |
| [src/components/Header.tsx](src/components/Header.tsx) | The one bar: title, timeline, timelines, events, arm span, theme |
| [src/components/Segmented.tsx](src/components/Segmented.tsx) | The pill of buttons, used three times in the bar |
| [src/components/ArmStage.tsx](src/components/ArmStage.tsx) | The arms, the event ticks, the scrubber, the readout |
| [src/components/TimelineStrip.tsx](src/components/TimelineStrip.tsx) | The named spans on their own strip above the arms |
| [src/components/TimelinePreviewLink.tsx](src/components/TimelinePreviewLink.tsx) | The two curves from a hovered timeline button onto the span it would cover |
| [src/components/ScaleBar.tsx](src/components/ScaleBar.tsx) | The scale numbers: two rails beside the arms, one line on small screens |
| [src/components/EventCards.tsx](src/components/EventCards.tsx) | The card strip and its source links |

Generations are a human measure, so `showsGenerations()` in `src/data.ts` is the
single gate: it is true for the `humans` and `modern` timelines, and it drives the
scale readouts, the scrubber readout and the event cards. `generationsAgo` on
any other timeline is ignored.

## Themes

The two themes are defined in [`src/index.css`](src/index.css) as DaisyUI
themes named exactly `dark` and `light`; all of DaisyUI's built-in themes are
switched off. Each gets one accent colour — cyan, rust — and its own set of band
colours, because the pale band set disappears on paper.

`System` is not a third theme. It resolves to one of the two, and
`watchSystemTheme` in [`src/theme.ts`](src/theme.ts) listens to the
`prefers-color-scheme` media query so a browser or OS switch repaints the app
straight away. The listener only acts while the choice is `System`.

Switching sets `data-theme` on `<html>` and adds a short-lived `theme-shift`
class that cross-fades the colours, so nothing snaps.

## Image credit

[`public/vitruvian-man.webp`](public/vitruvian-man.webp) is Leonardo da Vinci's
*Vitruvian Man* (c. 1490), which is in the **public domain**. Source file:
[Da Vinci Vitruve Luc Viatour.jpg](https://commons.wikimedia.org/wiki/File:Da_Vinci_Vitruve_Luc_Viatour.jpg)
on Wikimedia Commons, photograph by Luc Viatour.

The file itself holds the head, arms and torso, converted to greyscale, inverted
and levelled so the ink reads white on black, and faded out at the bottom. The
app then crops it down to the arms in CSS (see below).

Because the file is white ink on an opaque black card, the themes handle it with
blend modes rather than a second image (see `.figure-ink` in `src/index.css`):

| Theme | Filter | Blend | Opacity | Effect |
| --- | --- | --- | --- | --- |
| `dark` | none | `screen` | 0.20 | the black card drops away, ink stays white |
| `light` | `invert(1)` | `multiply` | 0.20 | black ink on paper, the white card drops away |

The fingertips of the horizontal arms were measured on the original scan and are
pinned in `src/figure.ts`:

| Landmark | Fraction of the image box |
| --- | --- |
| Left middle fingertip | `x = 0.1014` |
| Right middle fingertip | `x = 0.8914` |
| Fingertip line | `y = 0.3995` |
| Chest (measured) | `y = 0.6135` |

The scrubber ring and the marker dot both ride the fingertip line, so there is
no separate knob landmark. How far under the fingertips that line is drawn, and
every size and distance placed around it, is in
[`src/scrub.ts`](src/scrub.ts) — picked by eye, not measured off the scan. The
ring is the one piece that has to be two sizes, one for a phone and one from
40rem up, so it takes its width from a custom property that `.fob` in
[`src/index.css`](src/index.css) spends; a Tailwind class cannot be a variable.

Replacing the image means re-measuring those numbers.

Only a band of the file is shown: `CROP` in `src/figure.ts` cuts it to
`y = 0.158 … 0.632`, the head down to about the navel, with the legs out of
frame. The arms are the timeline, so they take the width and almost none of the
height. The crop is done in CSS, not in the file:

- the stage box gets `aspect-ratio: 1400 / <crop height>`,
- the `<img>` is drawn full width inside it and pulled up, with the overflow
  clipped,
- the overlay `<svg>` uses `viewBox="0 <crop top> 1400 <crop height>"`, so every
  landmark stays in source pixels.

The knob sits a little above the measured chest so it and the line up to the
arms both fit inside that band; its readout rides on its own rail underneath.

Nothing ends on a hard edge. [`src/fade.ts`](src/fade.ts) holds the drawing in
air on every side: a run-out over the head, one under the arms, one at each
fingertip, and a soft circle that takes the face out. What is left is the pair
of arms, which is all the ruler needs. Each of those is a mask layer, and they
are intersected, so a layer only ever takes ink away. The **Fade** tab of the
prototype panel is where those numbers are picked.

## The lines

The scan carries a lot the timeline does not need: the paper grain, the
vignette, the hatching. So the figure is drawn twice. The scan itself is faded
right back to a ghost, and the lines are traced by hand on top of it in
[`public/vitruvian-man-outline.webp`](public/vitruvian-man-outline.webp) — white
ink on a black card, the same 1400 x 797 box as the scan, so it lands on it to
the pixel. The GIMP file it is exported from sits beside it.

That trace is used as a **CSS mask**, not as an image: `.figure-lines` in
[`src/index.css`](src/index.css) is a block of `currentColor` with the mask cut
out of it, so every theme paints its own ink through the lines. There is no
build step and no derived file — the browser merges the card away, because the
mask layer is read in `mask-mode: luminance`:

- the black card has no brightness, so it is nothing;
- the lines are near white, so they are ink at full strength;
- what grain is left comes through as faintly as it is drawn.

Each run-out is a further mask layer, a gradient, intersected with the trace.
The trace is read by brightness and a gradient carries its own alpha, so the
layers get different modes: `mask-mode: luminance, alpha, alpha, …`. Older
WebKit spells the property `-webkit-mask-source-type`.

[`src/fade.ts`](src/fade.ts) builds that layer list, because there is more than
one gradient: the head and the arms in a single vertical one, the fingertips in
a second, and the circle over the face in a third. The mode list has to name
every layer: a short list is repeated, so `luminance, alpha` over four layers
would read two of the gradients as brightness and blank them. The same list is
cut from the scan as well, one layer shorter.

A CSS `filter` cannot help here — filters apply to what an element paints, not
to the pixels a mask is sampled from. So grain is cleaned in the trace itself,
in GIMP, and not in the stylesheet.

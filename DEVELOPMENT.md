# The Arms of Time — how it is built

The [readme](readme.md) is for people who use the page. This file is for people
who work on it: the layout, the data, the drawing and the dev tools.

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
arms, or a list down the page. Nothing scrolls but the events. The cards sit
on a tinted tray, all one height, so the tray is the same on every timeline.
The arms take the rest of the height, and their line sits at a set share of it
([src/layout.ts](src/layout.ts)), so the man stays put when the timeline
changes. The top bar and the footer stop at 75rem (1200 px).

Every card is built the same way, so the names line up from card to card. The
date is one line: the number large, the words after it small — "243–66
million years ago". Where it is still wider than the card (a long ± on a
phone) the whole date shrinks to fit, never below three quarters. Under the
date comes the calendar and generations line, on the human timelines only and
there on every card. Then the name and the description. Whatever only some
cards have goes at the foot: how long a stretch lasted, and the body part a
moment lands on. The links sit behind one **Sources** button at the foot,
which opens a small box above it: Read more (Wikipedia), Watch, Date source.

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
  with chimpanzees) and History (5,300 years, from the first writing; `modern`
  in the files).
  **Earth** and **Life** are still being worked on, so they only
  appear in dev mode, in the dev purple in the picker: add `?dev=1` to the URL
  (`http://localhost:5173/?dev=1`). The flag is read once, at load, and nothing
  is stored; a timeline kept from a dev visit falls back to Universe without it.
  Dev mode also adds a **Prototype** panel, under Dev in the settings menu:
  a floating box of live sliders for numbers that ship as constants, in tabs.
  **Knob** holds the ring the reader drags — its lift, size, edge, halo and
  press — and the card under it: how close it rides, its padding, corners,
  paper and edge, which rows it shows, and how they line up. It copies back
  into `src/fob.ts`. Its switches ship at what the card has always done, so
  they are a workbench and not a second look. **Scrub** holds everything along
  the line — how far the timeline is drawn under the fingertips and how thick
  it is, the event dots, the bars and the names above the line — and copies
  back into `src/scrub.ts`. **Rail** holds the two scale numbers at the
  screen's edges — how far in they sit, how big the number is, accent or
  plain — and copies back into `src/rail.ts`. Both sides share those values.
  **Light** colours the drawing — the scan, the whole outline, and the
  highlight on the top edge of the arms — and slides it up or down under the
  line. It copies back
  into `src/light.ts`. **Layout** holds where the arm line sits and the card
  tray — the room around the cards, their gap and height, and how small a
  date's words are next to its number — and copies back into `src/layout.ts`.
  Drag until it looks right, press Copy, paste the block back into the file it
  names. Where the box sits, which tab is open and every value are remembered. Everything behind the flag
  is purple, and nothing else in the app is, so a purple thing on screen is a
  thing that does not ship.
- **Time periods** — the named spans (eons, periods, species, ages) on their own strip
  just above the arms, clear of the landmark names, coarsest row at the top and
  the finest nearest the line. Two rows at most: more than that reads as a wall of little boxes, so
  the finest families are left off. Off by default, so the arms read bare
  first; switch them on to see the periods.
- **Simple / All** — Simple is the default: about fourteen turning points per
  timeline, listed in each timeline's `keyEvents`. All shows everything the data
  holds.
- **Scale unit** — two numbers sit out at the screen's edges, level with the
  fingertip line (over the arms below 1280 px): the whole span on the left,
  one ruler on the right. An arrow
  each side of the ruler steps it: **1 mm**, **a hair** (0.07 mm), **a
  finger**. A finger is a 96th of the span, rounded to whole millimetres —
  Vitruvius counts a man as 24 palms of 4 fingers — so it stays a finger at
  any arm span. On 1.90 m it is 20 mm. **One life** (80 years) turns it round:
  how many fingers a life takes. It is only offered where a life is at least
  half a finger, which today is History alone, and there it is the
  default. The ruler is kept per timeline.
- **Numbers** — **Plain** or **Science**. Plain is the default: each date is a
  round number, the way a person says it. Science adds the ± error bar to the
  date line, grey and small, sharing one unit — "130 ±5 million years ago". A
  handful of the deepest dates are pinned finer than their own unit, so their
  bar keeps its own words: "4.57 billion ±500,000 years ago". Science
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
  carries its Wikipedia link and its date source, behind its Sources button.
  On All there are sixty of them, so dragging does as little work as it can: at most one scroll a frame,
  and none at all when the live one is already centred.
  Events can share an instant — the asteroid sits on the end of the age of
  dinosaurs, and three events share the first moment of the universe — and then
  the marker alone cannot say which card is meant. The card the reader picked
  wins, then a moment over something that merely lasted through it. Otherwise
  the moment's card could never be reached: it owns a single point, and the
  range around it would take every one of them.
  A stretch with other cards starting inside it — Egypt of the pharaohs, with
  the Great Pyramid and Athens — counts at its start only, like a moment. The
  strip runs in start order, so held for its whole length it would keep the
  middle while the live card sat two cards to the right. `startsInside` in
  `src/scale.ts` is the one rule; the live card and the strip both ask it.
- **Timeline preview** — point at another timeline in the bar and the arms show
  what it would cover, without picking it: its whole span as a highlighted
  block running from where it starts to the right fingertip, because every
  timeline ends at now. The block reaches from the names down through the
  line, the same full bar a hovered band gets, with the strip on or off. Two thin curves fall from the button onto the block's
  two edges, the same line the live card gets. The one already picked answers
  too: it is the whole arm, fingertip to fingertip. A longer one has nowhere to
  sit on this arm, so it shows nothing. On the long spans the block is a
  sliver at the very end of the arm, which is the point, so it is held to a
  couple of pixels rather than allowed to vanish.
- **Span preview** — point at a cell in the timeline strip and that span is painted
  in its own colour from the cell down through the line. A cell is a few pixels tall, so a
  long span like the dinosaurs' reads there as a stripe of colour rather than
  as a stretch of arm; this puts it back on the arm without moving the marker.
- **The link** — on cards, a thin line runs from the readout under the knob to
  the live card, fading in at one end and out at the other, so the reading and
  the event are visibly the same thing. Both ends move on their own — the
  readout glides, the strip scrolls the card back to the middle — so
  `src/components/MarkerLink.tsx` measures the two anchors frame by frame and
  stops once they hold still.

The scale numbers sit beside the arms, left and right, rather than in a band
under them: that height belongs to the event list. Below `xl` (1280 px) they
move over the arms, just under the top bar, still one each side: the rails sit
in from the screen's edge, and on a 1024 x 768 projector they ran over the
"Big Bang" and "Now" captions. Not under the arms: there they sat between the
knob's readout and the cards, in the path of the line that joins the two, and
on a phone the pair wrapped onto two lines.

The readout hangs centred under the knob until its edge meets the screen's,
then it stops and the knob runs on over it. Near the fingertips on a phone,
centred, half of "13.8 billion years ago" was off the screen. `railEdge` in
`src/fob.ts` (Knob tab, *Off the edge*) is the gap it keeps.

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
holds five timelines (`universe`, `earth`, `life`, `humans`, `modern`), 60 bands,
173 events and 17 odd facts, every one of them with a Wikipedia link and a date
source.
[`research/research.md`](research/research.md) is the working notes behind it:
the spans, the scale maths, the band tables and the full source list.

```
data/
  meta.json                 the few global numbers
  timelines/<id>.json       one file per timeline
  bands/<group>.json        bands, grouped by the timeline they start on
  events/<group>/<id>.json  one file per event
  oddities/<id>.json        one file per odd fact
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

// data/oddities/o-cleopatra.json
{ "id", "label", "line", "certainty", "wikipedia", "source", "sourceTitle",
  "timelines": ["timeline id", ...],
  "points": [ { "label", "yearsAgo" | "yearsAhead", "uncertaintyYears",
                "wikipedia", "source", "sourceTitle" }, ... ] }

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
  the names sit on the drawing. Names that crowd are pushed apart, and where
  a push would carry a name too far off its dot the name is left off on that
  screen; the dot and the card stay.
  [`src/landmarks.ts`](src/landmarks.ts) picks which; how far a name may
  slide is `landmarkSlide` in `src/scrub.ts`.
- `label` and `description` say it differently on one timeline. Both optional;
  without them the event's own wording is used.

A **band's** `timelines` stays a plain list: a band has nothing to set per
timeline. The Proterozoic is the same band on Earth and on Life.

A timeline only takes what fits inside its span; anything older is dropped. A
stretch only has to end inside it. One that began before the left fingertip
has its bar fade in from there.

- `yearsAgo` counts back from now (`0` = now, taken as 2026). Position along
  the arms is `x = 1 - yearsAgo / spanYears`.
- `endYearsAgo` makes an event a **stretch** instead of a moment: something
  that lasted, like the age of dinosaurs. `yearsAgo` is then the older edge and
  `endYearsAgo` the younger one. The arm puts a dot on each edge and nothing
  between them. While its card is live, a bar over the arms shows the length,
  the same shape as a fun fact's gap, with how long it ran written at its
  top. That measure stands on the landmark names, never among them: Roman
  Empire's name sits on its own bar's edge, and the bar grows to hold both. The
  card says how long it ran instead of how well it is pinned. Leave it
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
  holds, listed under the card's Sources after Wikipedia. `watchTitle` names it and
  falls back to "Video". A link and nothing else: a still would fill a card that
  is only fifteen rem tall, the page fetches nothing at runtime, and the video's
  artwork is not ours to bundle. Anything that is not an `http` URL is dropped.
- `note` on a timeline is the quiet line above the events. The tooltip on its
  button in the top bar is built instead from `startLabel`, `endLabel` and
  `spanYears`, so it stays one short line.
- `meta.generationSource` and `meta.generated` are shown under Credits in
  the About box: the paper the 26.9 years comes from, and the date of the
  data.
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

### Odd facts

An **oddity** is two or three moments, and what it shows is the *gaps between
them*. Three moments make two gaps that share the middle one, the hinge, and
the fact compares them:

> Cleopatra lived nearer in time to the first Moon landing than to the building
> of the Great Pyramid.

Two moments make one gap, and the fact is about that one stretch of time:

> Mammoths were still alive on an Arctic island when the Great Pyramid was
> finished.

The hinge is then the second moment. Do not pad a one-gap fact with *now* to
make it three. The gap to now says nothing, and the arm draws it as loudly as
the gap that does — the mammoth fact used to show 4,000 purple years that had
nothing to do with mammoths.

Every gap is a fraction of the same span, so the fact holds at any arm span —
nothing in the sentence has to name a millimetre or a year — and the reader can
measure it on their own arm. In a two-gap fact the surprise is not the number.
It is that the bar they expected to be shorter is longer. The card says how
much longer; a one-gap card adds no number, because the measure under the line
already says it.

Each file names the timelines whose span makes its gaps big enough to see.
Cleopatra is a `modern` fact only: on the humans arm her whole story is a
fingernail. Every point carries its own source, because most of them are not
events — Cleopatra earns one line in one comparison, not a card on the arm.

**The future is the same shape.** The right fingertip stays *now*; a fact about
what is ahead simply puts the hinge there, so everything so far is the arm span
and what is left is measured in more of it. In the files a future moment is
written `yearsAhead`, and the loader keeps it as a negative `yearsAgo` — the
one place in the data where that number goes below zero — so a single value
sorts the whole line and the drawing needs no second case. Earth has about a
hand of liveable time left; the Sun takes it more than half a span further on.

The drawing only has the page margin past the fingertip — a tenth of a span.
A moment that fits is a dot in it, to scale. One that does not gets a dashed
arrow to the edge instead, and its bar fades out there: a dot at the edge
would sit at a false date. The measure under the bar still gives the real gap.

**On screen: the Fun fact button**, next to Settings in the top bar. It puts
one fact on the arm — its moments dotted on the line, each gap a bar of
its own colour over the arms it covers — and squeezes a card
into the event strip at its hinge, where it says the fact
in words. Press the button again for another; it never repeats itself in a row.

It squeezes in: the card opens out from nothing and pushes its neighbours
apart, so the reader sees it arrive rather than find it already sitting there.
`.fact-squeeze` in `src/index.css` does it, animating width because pushing the
neighbours is the whole point — a transform would slide over them.

Two things follow from the card being *in* the strip rather than in a banner of
its own. The marker lands on it, so the card that lights up is the fact's own
and no event is wrongly picked out — put the fact anywhere else and the marker
sits on it while some unrelated card three along takes the highlight. And the
one-screen budget does not change: no new row, nothing to scroll.

Picking any other card closes the fact, and so does moving the marker on the
arm — dragging, a tap, the keys. The reader has moved on, and leaving it up would hold the arm's names and the dimmed drawing against a
marker that is no longer standing on it.

A fact's hinge is usually an event: the oxygen fact turns on the same date as
the Great Oxygen Event card. Both cards then sit at the same point on the arm,
so the fact wins that tie in `nearest()` — the reader is standing there because
of the fact, not because of the card behind it.

The bars are the same shape as the band under the pointer in the strip: from
the names down through the line, fading out below it, whether the strip is on
or not. The names sit just above the line, each centred over its moment; the
measures sit just under it. The hinge's name goes up one more row only
when it would touch a neighbour. Now gets no name of its own: the bars change
colour at the fingertip, and a fact about the future hides the *Now* caption,
because the margin it sits in is where the future is drawn. A moment on the
left fingertip gets no name either: the start caption in the margin already
says it.

The scan is turned down to `FACT_DIM` while a fact is up (`src/fade.ts`). The
fact puts up to two bars, three dots and five words on the same strip of arm
the drawing already fills; at full strength the drawing wins and none of it
reads.

The moments are marked **whether or not they are events in `data/`, and
whether or not the short list keeps them**. Cleopatra has no card on any arm
and never will; the fact still has to show where she falls.

**A fact is only offered where it can be read.** `MIN_GAP` in
`src/oddities.ts` is the gate: every gap has to cover at least **4 %** of the
span, about a palm on a 1.90 m arm. Tyrannosaurus lived nearer to us than to
Stegosaurus, but on the 3.7-billion-year Life arm both gaps are two per cent —
two hairlines and three names on top of each other. It stays in the data and
waits for a timeline short enough to hold it. `odditiesFor()` gives what the
files pin to a timeline, `factsFor()` what that arm can actually draw; today
that is 12 of the 17.

`?dev=1` → Settings → **Odd facts** lists every one of them as bars, readable
or not, and says which are too small for the arm they are on and why.

### Body marks

`?dev=1` → Settings → **Body marks** draws the parts of the arm as purple
lines on both arms: the two knuckles of the middle finger, the big knuckle,
the base of the thumb, the wrist, the elbow, the shoulder, the armpit, the nipple and the middle of the chest. Each has a faint band for how
much one grown-up differs from the next. Hover a line for its share of the
span, that spread, and the date it lands on in this timeline. The switch is
remembered.

They are a typical adult with the span taken as the height, rounded so the
parts fit the span — the hand and fingers are firm, the shoulder and armpit
rough. The list is [src/body.ts](src/body.ts).

The lines are dev-only; the words are not. When the marker stands inside a
part's spread, "at your wrist" fades in over the readout card, between it and
the knob. In the last 2 cm it gets a line above it with the length from now
("12 mm from now"), and an event card whose date falls on one gets a row saying so under
its date. The card counts the date's ±: a part whose middle falls inside it
is named, so the Great Oxygen Event (± 100 million years) sits at the nipple
on the Earth arm. The readout does not — the marker is a point. No left or right: the drawing faces the reader, so its hands are the
mirror of theirs, and that is not worth a sentence on screen. Where
two spreads overlap — shoulder and armpit — the
nearer middle wins, in `bodyAt()`.

### Reading the data as a table

`?dev=1` → Settings → **Data browser** puts every row in `data/` on screen:
one tab for events, one for bands. It is a window, not an editor — nothing in
it writes back to the files.

It shows what a single file cannot. Each row carries a chip per timeline it is
on, marked `★` for `simple`, `▲` for `landmark` and `✎` where that timeline
overrides the wording, so a disagreement between two timelines is one glance.
The chip shows the timeline's name; hover it for the key in the file
(`timelines.modern` for History).
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
app reads them on top of the real data — so a new label is already on the arm
and on the card when the box closes. The box takes 90 % of the screen each
way, because the table needs the room more than the arm needs to show behind it.

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
on the screen" in `research/research.md`. It is **not on screen** right now:
the footer dropped it, because the scale numbers already say what the arm is
worth. The lines are kept for a place that needs them. Each is written as a proportion, never as a fixed count of years or
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
| [src/landmarks.ts](src/landmarks.ts) | Where the landmark names go, and which are left off when they crowd |
| [src/scale.ts](src/scale.ts) | Scale maths, years, generations, all formatting |
| [src/data.ts](src/data.ts) | Globs and sanitises `data/`, folds in the per-timeline settings, and holds the dev-only timeline list |
| [src/dev.ts](src/dev.ts) | The `?dev=1` flag, and the Body marks switch |
| [src/body.ts](src/body.ts) | Where the knuckles, wrist, elbow and the rest fall along the span, and the "at your wrist" phrase |
| [src/components/BodyMarks.tsx](src/components/BodyMarks.tsx) | Dev only: those as purple lines on the arms, with a hover card. Lazy |
| [src/prototype/](src/prototype/) | Dev only: the floating panel of live knobs for numbers that ship as constants |
| [src/components/DataPanel.tsx](src/components/DataPanel.tsx) | Dev only: the whole of `data/` as a table, one row per file, with an editor |
| [src/drafts.ts](src/drafts.ts) | Dev only: the draft edits themselves. The one dev module on the visitor's path |
| [src/edits.ts](src/edits.ts) | Dev only: changing a draft, and the prompt they copy out as. Lazy, with the browser |
| [src/oddities.ts](src/oddities.ts) | The odd facts — one gap, or two that share a moment — and the gate on which arm may show one |
| [src/components/FactMarks.tsx](src/components/FactMarks.tsx) | A fact on the arm: a dot per moment, a coloured bar per gap |
| [src/components/FactCard.tsx](src/components/FactCard.tsx) | The fact's own card in the strip: the sentence, and for two gaps the difference in numbers |
| [src/components/OddityPanel.tsx](src/components/OddityPanel.tsx) | Dev only: every odd fact as bars, readable on this arm or not |
| [src/facts.ts](src/facts.ts) | The one punchy line per timeline, from the research notes |
| [src/components/Header.tsx](src/components/Header.tsx) | The one bar: title, timeline, timelines, events, arm span, theme |
| [src/components/Segmented.tsx](src/components/Segmented.tsx) | The pill of buttons, used three times in the bar |
| [src/components/ArmStage.tsx](src/components/ArmStage.tsx) | The arms, the event ticks, the scrubber, the readout |
| [src/components/TimelineStrip.tsx](src/components/TimelineStrip.tsx) | The named spans on their own strip above the arms |
| [src/components/TimelinePreviewLink.tsx](src/components/TimelinePreviewLink.tsx) | The two curves from a hovered timeline button onto the span it would cover |
| [src/components/ScaleBar.tsx](src/components/ScaleBar.tsx) | The scale numbers: two rails beside the arms, one line on small screens |
| [src/components/EventCards.tsx](src/components/EventCards.tsx) | The card strip, and the one-line date on each card |
| [src/components/Sources.tsx](src/components/Sources.tsx) | A card's links behind one Sources button, in a popover |
| [src/components/About.tsx](src/components/About.tsx) | The About box: what it is, how to read it, use in a classroom or museum, the licence, the credits (drawing, idea, generation, data date), Ko-fi |
| [src/components/KofiLink.tsx](src/components/KofiLink.tsx) | The Ko-fi button, as a plain link |
| [src/components/Logo.tsx](src/components/Logo.tsx) | The mark beside the About title: a figure whose arms are an infinity loop. [public/favicon.svg](public/favicon.svg) is the same drawing for the tab and the readme |

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
are intersected, so a layer only ever takes ink away.

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

### Light from above

The drawing is three layers, faintest at the back. The scan is almost
nothing. Over it sits the whole trace, softer. On top sits the highlight,
[`public/vitruvian-man-highlight.webp`](public/vitruvian-man-highlight.webp):
only the top edge of the arms, where the light falls, at near full ink. Each
layer has only its own colour and opacity; there are no shadow tricks. All
three can slide up or down together under the line, which stays put. Both traces are exported from the same GIMP file, in the same
box. The scan is warmed towards brown ink. All of it is in
[`src/light.ts`](src/light.ts), and the prototype panel's **Light** tab tunes
it.

A tint on the scan only moves the dark theme: the light theme inverts the scan
to black ink first, and no tint moves black. So the scan can also be painted
the way the trace is — a colour cut out through the scan as a luminance mask —
and then it reads the same on paper and on dark.

## Licence

Free to use, change and sell. Only keep the credit. The full text is in
[LICENSE](LICENSE); the About box in the footer says the same in short.

| Part | Licence |
| --- | --- |
| The code | [MIT](https://opensource.org/license/mit) |
| The data, the research notes, the words on screen, the design | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| The figure | Public domain (see **Image credit** above) |

Both licences allow commercial use and both ask for attribution. The credit
line is **The Arms of Time**, with a link back where the medium allows one. The
string lives once, as `CREDIT` in
[`src/components/About.tsx`](src/components/About.tsx).

## Support

The footer is one line: how to drive the cards, then two quiet text links —
Support on Ko-fi and About — in the bottom-right corner. The same two sit at
the foot of the Settings menu as pills, Support first. The About box repeats Ko-fi as a larger solid
button.

Ko-fi hands out a widget script (`storage.ko-fi.com/cdn/widget/Widget_2.js`).
It is **not** used: it would be the only thing on the page fetched from another
host, and it draws itself with `document.write`, which a Solid render has no
place for. [`src/components/KofiLink.tsx`](src/components/KofiLink.tsx) is a
plain `<a>` to the same page, in Ko-fi's blue. Changing the page means changing
`KOFI_URL` there.

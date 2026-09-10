# The Arms of Time

Deep time laid out across a pair of outstretched arms. The left fingertip is the
start, the right fingertip is now, and everything in between is drawn along the
arms of Leonardo's Vitruvian Man. Drag the scrubber at the chest to move through
it.

The point of the thing is the scale readout. On a 1.90 m span the whole universe
works out at **1 mm = 7.26 million years**, so one swipe of a nail file across a
fingertip takes off 726,000 years — every human who ever lived, gone.

On the **Humans** timeline everything is shown twice: in years, and in **human
generations** (one generation = about 27 years). Same number, and the second one
is harder to shake off. Generations are left off the Universe and Earth
timelines — there were no humans to count.

The whole thing is one screen: a single slim bar at the top, the arms, the
readouts, then the event list. Nothing scrolls but the list.

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

Every control lives in the one bar at the top: title, timeline, arm span, theme.

- **Theme** — `Black` / `Dark` / `Light`. Black is true black for OLED screens.
  The choice is kept in `localStorage` and restored before the first paint, so
  there is no flash on reload. Default is `Dark`.
- **Timeline** — Universe, Earth, or Humans (the whole human story, from the
  split with chimpanzees to now).
- **Arm span** — set your own. 1.90 m is the default; anything from 0.50 to
  2.60 m is accepted.
- **Scrubber** — drag the knob at the chest, or press anywhere along the arms.
  With the knob focused: `←` `→` to step, `Shift` for bigger jumps, `Alt` to hop
  between events, `PageUp` / `PageDown` for large jumps, `Home` / `End` for the
  fingertips.
- **Events** — the one nearest the marker is highlighted; click any of them to
  move the marker there. Each carries its Wikipedia link and its date source.
  The lists are long (37 / 56 / 60 rows), so dragging does as little work as it
  can: the highlighted row is only scrolled into view when it is actually off
  screen, at most once a frame, and the rows keep their classes until the
  marker really crosses one.

The page fits one viewport (`100dvh`, a flex column) and never scrolls, in
either direction. Only the event list scrolls, inside its own box.

## Data

Timeline data lives in [`research/timelines.json`](research/timelines.json) and
is imported at build time, so a change to it shows up on the next dev reload.
It holds three zones (`universe`, `earth`, `humans`), 53 bands and 153 events,
every one of them with a Wikipedia link and a date source.
[`research/research.md`](research/research.md) is the working notes behind it:
the spans, the scale maths, the band tables and the full source list.

**The research folder is read-only to the app.** `src/data.ts` still drops
anything malformed rather than letting it break the render.

Shape:

```jsonc
{
  "meta":   { "generated": "YYYY-MM-DD", "defaultArmSpanM": 1.90,
              "generationYears": 26.9, "generationSource", "note" },
  "zones":  [{ "id", "label", "spanYears", "spanUncertaintyYears",
               "spanGenerations", "startLabel", "endLabel", "note",
               "wikipedia", "source", "sourceTitle" }],
  "bands":  [{ "id", "zone", "label", "fromYearsAgo", "toYearsAgo", "kind",
               "wikipedia", "source", "sourceTitle" }],
  "events": [{ "id", "zone", "yearsAgo", "uncertaintyYears", "generationsAgo",
               "label", "description", "certainty",
               "wikipedia", "source", "sourceTitle" }]
}
```

- `yearsAgo` counts back from now (`0` = now). Position along the arms is
  `x = 1 - yearsAgo / spanYears`.
- `generationsAgo` is optional. When it is missing it is worked out as
  `yearsAgo / meta.generationYears`, and `generationYears` itself falls back to
  **26.9**.
- `wikipedia` and `source` are rendered as links when they start with `http`.
  `sourceTitle` names the `source` link; when `source` is plain text instead of
  a URL it is shown as a quiet citation. All three are optional.
- `note` on a zone is the quiet line above the event list, and the tooltip on
  its button in the top bar.
- `meta.generationSource` and `meta.generated` are shown in the credit line at
  the foot of the page: the paper the 26.9 years comes from, and the date of
  the data.
- `kind` groups bands into families — `eon`, `era`, `period`, `epoch`,
  `species`, `culture` — and the stage draws one lane per family, coarsest at
  the top. Bands inside a family that overlap in time (Paranthropus and
  *Homo habilis* did) get a lane each, so nothing is drawn over anything else.
  A band is named only when it is wide enough to hold the name; the rest tell
  you on hover.

### The punchy line per zone

`src/facts.ts` carries one line per zone, lifted from "The lines worth putting
on the screen" in `research/research.md`, and it shows under the scale numbers.
Each is written as a proportion, never as a fixed count of years or
millimetres, so it stays true at any arm span — the live numbers next to it are
the scale bar's job.

## Layout of the code

| File | What it does |
| --- | --- |
| [src/App.tsx](src/App.tsx) | State and the one-screen layout: theme, arm span, zone, marker |
| [src/theme.ts](src/theme.ts) | The three themes, `localStorage`, the cross-fade |
| [src/figure.ts](src/figure.ts) | The crop band, where the fingertips and chest sit, and the band lanes |
| [src/scale.ts](src/scale.ts) | Scale maths, years, generations, all formatting |
| [src/data.ts](src/data.ts) | Reads and sanitises `research/timelines.json` |
| [src/facts.ts](src/facts.ts) | The one punchy line per zone, from the research notes |
| [src/components/Header.tsx](src/components/Header.tsx) | The one bar: title, timeline, arm span, theme |
| [src/components/Segmented.tsx](src/components/Segmented.tsx) | The pill of buttons, used twice in the bar |
| [src/components/ArmStage.tsx](src/components/ArmStage.tsx) | The arms, the bands, the scrubber, the readout |
| [src/components/ScaleBar.tsx](src/components/ScaleBar.tsx) | The line of numbers under the arms |
| [src/components/EventList.tsx](src/components/EventList.tsx) | The event list and its source links |

Generations are a human measure, so `showsGenerations()` in `src/data.ts` is the
single gate: it is true only for the `humans` zone, and it drives the scale
readouts, the scrubber readout and the event rows. `generationsAgo` on any other
zone is ignored.

## Themes

The three themes are defined in [`src/index.css`](src/index.css) as DaisyUI
themes named exactly `black`, `dark` and `light`; all of DaisyUI's built-in
themes are switched off. Each gets one accent colour — amber, cyan, rust — and
its own set of band colours, because the pale band set disappears on paper.

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

| Theme | Filter | Blend | Effect |
| --- | --- | --- | --- |
| `black` | none | `screen` | the card is already the page colour |
| `dark` | none | `screen` | the black card drops away, ink stays white |
| `light` | `invert(1)` | `multiply` | black ink on paper, the white card drops away |

The fingertips of the horizontal arms were measured on the original scan and are
pinned in `src/figure.ts`:

| Landmark | Fraction of the image box |
| --- | --- |
| Left fingertip | `x = 0.1035` |
| Right fingertip | `x = 0.8946` |
| Arm line | `y = 0.4174` |
| Chest (measured) | `y = 0.6135` |
| Knob (scrubber) | `y = 0.552` |

Replacing the image means re-measuring those numbers.

Only a band of the file is shown: `CROP` in `src/figure.ts` cuts it to
`y = 0.32 … 0.60`, which is fingertip to fingertip with the head and the legs
out of frame. The arms are the timeline, so they take the width and almost none
of the height. The crop is done in CSS, not in the file:

- the stage box gets `aspect-ratio: 1400 / <crop height>`,
- the `<img>` is drawn full width inside it and pulled up, with the overflow
  clipped,
- the overlay `<svg>` uses `viewBox="0 <crop top> 1400 <crop height>"`, so every
  landmark stays in source pixels.

The knob sits a little above the measured chest so it and the line up to the
arms both fit inside that band; its readout rides on its own rail underneath.

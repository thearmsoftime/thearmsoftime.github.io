# The Arms of Time — working notes for Claude

Deep time drawn along the outstretched arms of Leonardo's *Vitruvian Man*. Left
fingertip is the beginning, right fingertip is now. Drag the scrubber to move
through it. The point of the thing is the scale readout: on a 1.90 m span,
1 mm = 7.26 million years.

[DEVELOPMENT.md](DEVELOPMENT.md) is the real documentation — layout, data
shape, themes, the figure measurements. Read it before changing anything. Keep
it in step with the code; it is written for a reader, not as a changelog.

[readme.md](readme.md) is the front page on GitHub, for the public: what it is,
how to use it, the licence, the use of AI. No code in it — that goes in
DEVELOPMENT.md. Same voice as the screen.

## Who it is for

The general public, roughly age 10 to 100. No science background assumed. Many
readers are not native English speakers. One screen, on a phone or a projector,
often with no one there to explain it.

So: nothing on screen may need prior knowledge. But the reader is here to
learn, so a real name may stay — *Cambrian explosion*, *Homo erectus* — as long
as the same card says in plain words what it is. A term only experts use
(stromatolite, Ga, biosphere) does not appear.

One exception: **band names.** A band is a named age — Jurassic, Phanerozoic,
Bronze Age — and its name is the thing itself, so it stays even when only
experts know it. A band has no room to explain; its strip and dates do that.
In event descriptions those words still get plain words instead.

## What it is for

Inform and amaze — in that order, and both at once. Amazement comes from a true
number made physical, not from the writing. A fact the reader can feel on their
own arm is the whole effect; the copy only has to get out of the way.

## Languages

Readers should be able to read it in their own language. **Nothing is localised
yet** — every string is English, and the locale is hardcoded. Treat that as a
debt, not as the design: do not add new hardcoded English where a lookup would
do.

Copy lives in three places, and all three have to move together:

| Where | What | Size |
| --- | --- | --- |
| `data/` | event and band labels, descriptions, timeline labels and notes | ~340 text fields |
| `src/facts.ts` | the one punchy line per timeline | 5 lines |
| components + `src/format.ts` | UI labels, and the words around the numbers | small, but scattered |

When that work starts:

- **Numbers go through `Intl` with the active locale.** `src/format.ts` pins
  `'en-GB'` in two places; separators and decimal marks differ.
- **The words around a number are a template, not concatenation.** "440 years
  ago" puts the number, the unit and "ago" in an order other languages do not
  share, and plural rules are not English's. Build the whole phrase per
  language.
- **Wikipedia links are per language.** Swap the `en.` host, and fall back to
  the English article when the language has none.
- **Do not mirror the layout for right-to-left.** The arms run oldest at the
  left fingertip to now at the right because that is the reader's own body, not
  because English reads that way. Text direction flips; the arms do not.

## Voice on screen

Informative and plain. Not funny, not chatty, not breathless.

**Simple English**, so it is understood all over the world. Write for someone
who learned English at school: age 10 and up, or a language learner. Simple is
about the sentences, not the facts — the reader may learn a new word.

- Short sentences. Common words. One idea each. Aim for under 15 words.
- **Say what happened: who, what, where.** No riddles, no jokes, no winks, no
  exclamation marks, no second-person pep ("get ready to..."). If the reader
  has to work out what the card is about, it is a riddle.
  - Yes: *Charles Darwin publishes On the Origin of Species. It explains how
    living things change over time.*
  - No: *The book that explains everything on the left half of this arm.*
- **Real names stay, and get explained.** The label is the name the reader
  would look up: *Cambrian explosion*, *Homo erectus*, *Tiktaalik*. The
  description says in plain words what it is. Do not swap a real name for a
  made-up one ("Animals everywhere"). But when the thing has a plain name of
  its own, use that and put the formal one in the description: *Written laws*,
  not *Code of Hammurabi*.
- **No "first" unless it was.** Hammurabi's laws are not the oldest known;
  "one of the oldest" is. Check before writing *first*, *oldest* or *last*.
- **No codes and no expert words.** Not *JADES-GS-z14-0*, *biosphere*, *body
  plans*, *hominin*, *Mesozoic*. Say what they mean: "the most distant galaxy
  found so far", "all living things", "the early relatives of humans".
- **Numbers in digits,** written the way the scale bar writes them:
  *66 years*, *12 seconds*, *300,000 years*, *4.5 billion years*. Never "three
  hundred thousand years" or "sixty-six". Years before Christ as *3300 BC*.
  This is about real dates and durations. A length on the arm, or years per
  length, is still never written down — see *Arm span is a setting* below.
- **Label:** a name, a few words. **Description:** 1 or 2 short sentences,
  about 100 characters at most — the card fades out the rest.
- **Do not repeat what the card already shows.** It prints the date, and on
  Humans and History the calendar year and the generations too. Use the
  description for what happened and why it matters.
- Concrete over abstract: a nail file, a hair, a palm — real objects the reader
  can picture.
- No hype words: incredible, mind-blowing, staggering, journey.
- Say what is uncertain when it is uncertain: "about", "probably", "the
  oldest found so far". Honesty is part of the amazement.

## Rules that are easy to break by accident

- **One screen, no scrolling.** `100dvh`, a flex column. Only the event strip
  scrolls, and only sideways.
- **Arm span is a setting** (0.50–2.60 m). Never write a length on the arm,
  or the years one length stands for, into copy — phrase it as a proportion, the way `src/facts.ts`
  does. Live numbers are the scale bar's job.
- **Every event and band carries a source.** A Wikipedia link plus a date
  source. New data without a source does not go in.
- **`data/` and `research/` are read-only to the app.** The database lives in
  `data/`, one entity per file (`meta.json`, `timelines/`, `bands/`,
  `events/<group>/<id>.json`); the notes live in `research/research.md`.
  `src/data.ts` globs the tree, sanitises it and drops anything malformed
  rather than breaking the render.
- **An event's `timelines` is a map, not a list.** The key is the timeline, the
  value is that timeline's settings for it: `simple`, `landmark`, and optional
  `label` / `description` overrides. One event, two timelines, different
  treatment. There is no `keyEvents` list on a timeline any more.
- **A timeline is Universe, Earth, Life, Humans, History.** Never call one
  a "zone" — that was the old name and it is gone from the code and the data.
  History is `modern` in the files — the id predates the name.
  The word itself is not banned: *zone* is a real unit in the band vocabulary
  (a chronozone sits under a stage), so it stays free for a `kind` value. It is
  not a word for an eon, an era, a period or an epoch either — those are bands,
  and each says which it is in `kind`.
- **The five words, and only these.** A **timeline** is a whole arm span. A
  **band** is a named part of one, drawn on the strip above the arms. An
  **event** is a moment on the arm. A **stretch** is an event that lasted — it
  carries `endYearsAgo`: the age of dinosaurs, Egypt of the pharaohs, the Roman Empire. Never
  call a stretch a "range": the ± on a date is a range too, and the card shows
  both. An **oddity** is moments whose *gaps* are the point: three for two
  gaps it compares — Cleopatra is nearer to the Moon landing than to the
  pyramid — or two for one gap — mammoths were still alive when the pyramid
  was finished. Never pad a one-gap fact with *now* to make three: the gap to
  now says nothing, and the arm draws it as loudly as the one that does. Never
  call one a "comparison": `src/scale.ts` already uses that word for the nail-file
  match the ruler workbench reads. The dev data browser uses these words and the field names,
  nothing friendlier.
- **A fact is only offered where every gap can be read.** `MIN_GAP` in
  `src/oddities.ts` is the single gate: 4 % of the span each, about a palm on a
  1.90 m arm. `odditiesFor()` is what the files pin to a timeline; `factsFor()`
  is what that arm may draw, and the Fun fact button only ever sees the second.
  Never widen the gate to get a favourite fact on screen — two hairlines and
  three names in a heap is a drawing that lies. Write a shorter timeline
  instead.
- **A fact marks its own moments,** events or not, simple list or not.
  That is the point of it: Cleopatra has no card on any arm. While a fact is up
  the landmark names stand down and the scan is turned down to `FACT_DIM`, so
  there is one set of names on the arm and the rules are readable over it.
- **The fact's card lives in the event strip, not in a banner.** `items()` in
  `EventCards.tsx` is the events with the fact spliced in at its own moment,
  and `measure()` walks that list beside the cards in the DOM — same length,
  same order, or every anchor is off by one. Put the events and the fact in
  that list **as they arrive**: `For` keys on identity, so a fresh wrapper
  object per pass throws away and rebuilds every card in the strip each time
  the fact changes. The card squeezes in over 0.32 s, so `measure()` runs again
  on `animationend` — measure while it is still growing and every anchor to the
  right of it is out by half a card. The animation fills `backwards`, never
  `both`: the card has to end up back on its own width from the class, or a
  browser that skips the animation shows nothing at all.
- **A fact's hinge is usually an event,** on the same date, so both cards sit on
  the same point. `nearest()` in `App.tsx` gives the fact the top rank for that
  tie — the reader is standing there because of the fact, not the card behind
  it.
- **Generations are human-only.** `showsGenerations()` in `src/data.ts` is the
  single gate — `humans` and `modern` timelines only.
- **The figure landmarks are measured, not guessed.** The fingertip and chest
  fractions in `src/figure.ts` belong to the image file. Replacing the image
  means re-measuring them.
- **`earth` and `life` are dev-only** until their research is done: `?dev=1`.
  The picker shows them in the dev purple.
- **Check data changes in the data browser**: `?dev=1` → Settings → Data
  browser. Every row in `data/` as a table, with a **Missing something** filter
  for rows with no source, link or description.
- **Sander edits wording there, then pastes the block.** The pencil on a row
  edits `label`, `description` and the per-timeline `simple` / `landmark` /
  overrides as a draft in the browser, live on the arm; **Copy as prompt**
  writes it out as `file` + `field: now -> should be`. When that block arrives,
  apply it exactly and change nothing else — he has already seen the result on
  screen. Never widen it, and never edit a date or a source from it.

## Stack and commands

Vite + SolidJS + TypeScript, Tailwind 4 with DaisyUI 5. No router, no network
calls on the visitor's path, no fonts fetched. The three dev workbenches
(prototype panel, ruler workbench, data browser) are `lazy()` imports in
`src/App.tsx`: their chunks are only fetched under `?dev=1`, so keep them
behind `lazy()` and never import one at the top of a file the app always
loads. Same split in the draft edits: `src/drafts.ts` is the store and is on
the visitor's path because `src/data.ts` reads it; `src/edits.ts` changes
drafts and builds the copied prompt, and only the data browser may import it.
A helper put in the wrong one of those two ships to everybody. Two DaisyUI themes defined in `src/index.css` —
`dark`, `light`; the built-ins are off, and a `System` choice follows the
browser live.

```bash
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # typecheck + build into dist/
```

`npm run build` runs `tsc --noEmit` first, so a type error fails the build. Run
`npm run typecheck` before saying a change is done.

## Code style

Match what is there: no semicolons, single quotes, arrow functions, small
files, one job each. Comments explain *why* — the measured numbers, the caps,
the browser quirks — and there are a lot of them on purpose. Keep that density.

# Research brief — date verification and gaps

Fact-check and extend the deep-time event data for a Vitruvian-Man timeline app.
Current data: `research/timelines.json` (153 events across three zones: universe
13.787 Gyr, earth 4.54 Gyr, humans 7 Myr) and the write-up in
`research/research.md`. Read both first. There is no build script — an earlier
`_build.py` was removed once it had generated the JSON.

## Priority 1 — the human/chimpanzee divergence date

This sets `spanYears` for the whole humans zone, so every event position depends
on it. Currently 7 Ma +/- 500 kyr, anchored on *Sahelanthropus tchadensis*.
Establish, with citations:

- What recent molecular clock work gives, and how much the answer moves with the
  per-year mutation rate assumption (pedigree rates vs phylogenetic rates).
- How incomplete lineage sorting and possible post-split gene flow make this a
  span rather than a date, and what span the literature supports.
- The current state of the *Sahelanthropus* hominin debate (the femur and ulna
  papers, and the replies).
- What the fossil record actually brackets: *Orrorin*, *Ardipithecus kadabba*.

Then recommend one number for `spanYears` plus an honest uncertainty, and say
which papers would move it. Do not just average the estimates.

## Priority 2 — events that are missing

Give date, uncertainty, one authoritative source (paper or museum, not
Wikipedia) and an English Wikipedia article title:

- Leonardo da Vinci's *Vitruvian Man* drawing, c. 1490. The app is drawn on it
  and it is not in the timeline. Also Leonardo's dates.
- The origin of animals: molecular clock and fossil estimates for the first
  metazoans and the first sponges, well before the Ediacaran.
- Cephalopods: first appearance, and the Ordovician/Silurian period sometimes
  called the age of cephalopods or the age of squids. Is that a real convention
  or a museum label? Say so plainly.
- Same question for "Age of Reptiles" and "Age of Mammals" as informal names for
  the Mesozoic and Cenozoic: who uses them, and are they safe to show as band
  labels next to the formal names.
- Anything else obviously missing from a general-audience deep-time timeline.

## Priority 3 — verify what is already there

Check the dates in `timelines.json` marked `medium` or `disputed`. Flag any that are
outdated, superseded, or resting on a single contested paper. Particularly:
first life 3.7 Ga (Isua), first dinosaurs (*Nyasasaurus* 243 Ma), first mammals
(*Brasilodon* 225 Ma), first birds (*Archaeopteryx* 150 Ma), first primates
(*Purgatorius* 65.9 Ma), Panama closure 2.8 Ma, dog domestication 15 ka, White
Sands footprints 23 ka.

## Priority 4 — descriptions

Each event carries a 1-2 sentence description for a general audience. Where a
date is contested, the description should say so in plain words rather than hide
it. Suggest text for the new events, and rewrite any existing description that
is now wrong.

## Output

A table of events (id, zone, yearsAgo, uncertaintyYears, certainty, label,
description, wikipedia title, source URL, source title) matching the existing
`timelines.json` event shape, plus a short prose section on Priority 1 alone. Keep every
claim sourced. Where the literature genuinely disagrees, say that instead of
picking a winner.

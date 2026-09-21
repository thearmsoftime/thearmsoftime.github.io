# Research brief 2 — the two undocumented zones

Read [`research.md`](research.md) and [`timelines.json`](timelines.json) first,
plus the first brief, [`_research-brief.md`](_research-brief.md), which has
already been carried out.

The app grew from three timelines to five. Two of them were added after the
research pass and are undocumented and thinly sourced. That is the whole job.

## What the data says now

| Zone | Span | Events | Of those, sourced only to Wikipedia | Bands |
| --- | --- | --- | --- | --- |
| universe | 13.787 Gyr | 37 | 7 | 5 |
| earth | 4.54 Gyr | 56 | 20 | 31 |
| **life** | **3.7 Gyr** | **38** | **12** | **23** |
| humans | 7 Myr | 60 | 22 | 17 |
| **modern** | **4600 yr** | **31** | **31 — all of them** | **7** |

`research.md` §1 documents three spans. `life` and `modern` are not in it, and
§5 has no source section for either.

## Priority 1 — the `life` span, 3.7 Gyr

Nothing in `research.md` justifies this number. It appears to rest on the Isua
3.7 Ga first-life claim, which the first brief already flagged for checking and
which §6 lists as contested.

Establish, with citations:

- The state of the Isua 3.7 Ga stromatolite claim (Nutman et al. and the
  replies arguing the structures are deformation, not biology).
- The competing anchors: Strelley Pool ~3.48 Ga, Dresser Formation ~3.49 Ga,
  the Nuvvuagittuq 3.77–4.28 Ga claim, and carbon-isotope arguments for life
  before 3.8 Ga.
- Whether a timeline for a general audience should start this zone at the
  oldest *contested* evidence or the oldest *accepted* evidence, and what each
  choice does to the number.

Recommend one `spanYears` plus an honest `spanUncertaintyYears`, and name the
papers that would move it. Do not average the estimates.

## Priority 2 — the `modern` span, 4600 yr

Also unjustified in `research.md`. Work out what it should be and say why.
4600 years lands near the Giza pyramids and near the start of written history
in some framings, but the file does not say which it means.

Options to weigh explicitly: the first writing (Uruk IV cuneiform, Egyptian
hieroglyphs), the first named person, the start of the Bronze Age, or a round
number chosen for reading. Say which the span is, and whether the zone label
"Modern humans" still fits it — 4600 years is recorded history, not the span of
*Homo sapiens*, and the app already has a `humans` zone.

If the label and the span disagree, say so plainly and recommend a fix.

## Priority 3 — sources for the `modern` zone

All 31 of its events are sourced to Wikipedia. For each, give one authoritative
non-Wikipedia source (a museum, a university press, an excavation report, a
standard reference) alongside the existing Wikipedia title. Where no such source
is reachable, say so rather than inventing one, and mark the event's `certainty`
honestly.

Do the same for the 12 Wikipedia-only events in the `life` zone.

## Priority 4 — the bands

`life` has 23 bands and `modern` has 7, none of them covered by the band tables
in `research.md` §4. Check each band's `fromYearsAgo` / `toYearsAgo` against the
current ICS chart (for `life`) or standard archaeological periodisation (for
`modern`). The §4 warning that the `humans` cultural bands are Old World only
probably applies to `modern` too — confirm and say so.

## Priority 5 — corrections to `research.md`

- The header says "3 zones, 53 bands, 153 events". It is now 5 zones, 77 bands,
  169 events.
- §6 open question 14 says the JSON could not be machine-validated. It parses
  cleanly now. Replace that item.
- Add a §1 subsection for `life` and one for `modern`, in the same shape as the
  three that exist, and a §5 source section for each.

## Output

Put the whole answer in your reply — do not write or edit any file. Sander
reviews it in the chat and decides what lands.

Structure the reply as:

1. **Priority 1** — prose, the `life` span, with the recommended
   `spanYears` and `spanUncertaintyYears` stated once, plainly.
2. **Priority 2** — prose, the `modern` span and the label question.
3. **A table of field changes** for `timelines.json`: zone id, event or band
   id, field, old value, new value, source URL, source title.
4. **Draft text** for the new `research.md` §1 and §5 subsections, in that
   file's existing voice, ready to paste.
5. **What you could not settle**, and what would settle it.

Keep every claim sourced. Where the literature genuinely disagrees, say that
instead of picking a winner.

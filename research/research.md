# The Arms of Time — research

Three timelines laid across one arm span. Written 2026-09-10. Companion file:
[`data/`](../data/) — 3 timelines, 53 bands, 153 events, every one with
a Wikipedia link and a date source.

Default arm span **1.90 m = 1900 mm**. `yearsAgo` counts back from now; now is
taken as the year 2026.

---

## 1. The three spans

| Zone | Span | Uncertainty | Source |
| --- | --- | --- | --- |
| `universe` | 13,787,000,000 yr | ± 20,000,000 yr | [Planck 2018 results VI](https://arxiv.org/abs/1807.06209) |
| `earth` | 4,540,000,000 yr | ± 50,000,000 yr (≈1 %) | [Age of Earth, after Dalrymple 2001](https://en.wikipedia.org/wiki/Age_of_Earth) |
| `humans` | 7,000,000 yr | ± 1,000,000 yr | [Smithsonian Human Origins: *Sahelanthropus tchadensis*](https://humanorigins.si.edu/evidence/human-fossils/species/sahelanthropus-tchadensis) |

### Universe — 13.787 Gyr

Planck's final full-mission result. The exact figure depends on which data are
combined: **13.787 ± 0.020 Gyr** is the `TT,TE,EE+lowE+lensing+BAO` combination,
and it is the value quoted almost everywhere. Without BAO the same paper gives
13.797 ± 0.023 Gyr. The two agree inside their error bars, and the 10 Myr between
them is **1.4 mm** on the arm.

That is worth sitting with: the quoted ± 20 Myr is **2.8 mm**, which is three
times the width of the entire `humans` zone drawn on the same arm. The error bar
on the start of the universe is bigger than the whole human story.

Worth knowing too: local measurements of the expansion rate (Cepheids plus type
Ia supernovae) disagree with Planck's. That is the "Hubble tension". It would
shift the age by a few hundred million years — 300 Myr is **41 mm**, most of a
palm — so the choice of value is not cosmetic. Planck is the conventional
number and the one used here.

### Earth — 4.54 Gyr

**4.54 ± 0.05 Gyr**, about 1 per cent, unchanged since Patterson's 1956 lead
isotope work and reconfirmed by Dalrymple. Two nearby numbers are often confused
with it:

- **4.567 Gyr** — the age of the Solar System, from the oldest calcium-aluminium
  inclusions in meteorites. The ICS now formally puts the base of the Hadean here.
- **4.404 Gyr** — the oldest surviving fragment of Earth, a Jack Hills zircon.

Earth "forming" is a process, not a moment: accretion took tens of millions of
years. 4.54 Gyr is the conventional end of it.

Note for the band drawing: the ICS base of the Hadean (4567.3 Ma) is *older than
this timeline*. In `data/bands/earth.json` the Hadean band is clipped to the timeline start
(4540 Ma) so `x` stays inside 0–1.

### Humans — 7 Myr, and why

The zone is the whole human story, not one life. Start is the **hominin split
from chimpanzees**, marked by *Sahelanthropus tchadensis* from Chad, dated
7–6 Ma.

Why this start:

- It is the oldest point at which "our line" exists as a separate thing. Anything
  earlier is the story of apes in general.
- There is a fossil there, which makes it concrete rather than purely molecular.
- It gives the zone a span where the interesting parts are still visible: at
  7 Myr, one millimetre is 3,684 years, so recorded history is 1.4 mm — small,
  but not invisible.

Other defensible starts:

| Start | Age | What you gain | What you lose |
| --- | --- | --- | --- |
| Genus *Homo* | 2.8 Ma ([Villmoare et al. 2015](https://www.science.org/doi/10.1126/science.aaa1343)) | A sharp fossil marker, no ape-vs-hominin argument | All of *Australopithecus*, Lucy, the oldest tools |
| *Homo sapiens* | 315 ka ([Richter et al. 2017](https://www.nature.com/articles/nature22335)) | "Us" only; 1 mm = 166 years, so history is readable | The whole evolutionary story |
| Hominin split | **7 Ma** | The full arc, first ancestor to now | The recent end is crowded |

Honest caveat: molecular clocks put the human–chimpanzee split at roughly
**6.5–7.5 Ma**, and some estimates run as young as 5.4 Ma. *Sahelanthropus* at
7.2–6.8 Ma is therefore right at, or slightly before, the split — which is one
reason its status as a hominin is still argued. 7 Ma is a round, defensible
number, and `spanUncertaintyYears` is set to 1 Myr to say so.

---

## 2. Generations

`meta.generationYears` = **26.9**

Source: Wang, Al-Saffar, Rogers & Hahn (2023), *Human generation times across the
past 250,000 years*, Science Advances 9:eabm7047 —
<https://www.science.org/doi/10.1126/sciadv.abm7047>. They infer generation times
from shifts in the mutation spectrum in whole genomes: **sex-averaged 26.9 years**,
fathers 30.7, mothers 23.2, averaged over the last 250,000 years.

The two common conventions, for comparison:

| Convention | Years | Effect on the `humans` zone |
| --- | --- | --- |
| Short / archaeological | 25 | 280,000 generations |
| **Wang et al. 2023** | **26.9** | **260,223 generations** |
| Long / demographic | 30 | 233,333 generations |

The spread between 25 and 30 is about 20 %, so treat every generation figure as
"roughly". A rebuttal ([Coll Macià et al. 2023, MBE](https://academic.oup.com/mbe/article/40/8/msad160/7224425))
argues the method carries more uncertainty than the paper claims. 26.9 is still
the best single sourced number.

**Generations are only literally meaningful in the `humans` zone.** For `universe`
and `earth` the figure answers "how many human generations would fit in this", not
"how many ancestors ago".

| Zone | Span in generations |
| --- | --- |
| `universe` | 512,527,881 |
| `earth` | 168,773,234 |
| `humans` | 260,223 |

### The punchy generation facts

- The whole `humans` zone is **260,000 generations**. Two hundred and sixty
  thousand grandmothers in a row.
- *Homo sapiens* is **11,700 generations**. Out of Africa: **2,230**.
- Farming: **428 generations**. That is the whole distance from foragers to now.
- **All of recorded history is 197 generations.** Under two hundred people,
  handing over in turn.
- The Roman Empire: **74**. The printing press: **22**. The Industrial
  Revolution: **9**. The Moon landing: **2**.
- One nail-file swipe (0.1 mm) erases **26,976** generations on the universe arm,
  **8,883** on the earth arm, and **13.7** on the humans arm.

---

## 3. Scale maths for a 1.90 m span

1900 mm of arm. Reference sizes used below: nail-file swipe **0.1 mm**, human
hair **0.07 mm**, fingernail length **12 mm**.

| | `universe` | `earth` | `humans` |
| --- | --- | --- | --- |
| Span | 13.787 Gyr | 4.54 Gyr | 7 Myr |
| Metres per year | 1.378 × 10⁻¹⁰ m (0.138 nm) | 4.185 × 10⁻¹⁰ m (0.419 nm) | 2.714 × 10⁻⁷ m (0.271 µm) |
| Years per metre | 7.256 Gyr | 2.389 Gyr | 3.684 Myr |
| **Years per millimetre** | **7.26 Myr** | **2.39 Myr** | **3,684 yr** |
| Millimetres per million years | 0.138 mm | 0.419 mm | 271 mm |
| One nail-file swipe (0.1 mm) | 726,000 yr | 239,000 yr | 368 yr |
| One hair's width (0.07 mm) | 508,000 yr | 167,000 yr | 258 yr |
| One fingernail (12 mm) | 87.1 Myr | 28.7 Myr | 44,200 yr |
| One generation (26.9 yr) | 3.7 nm | 11 nm | 7.3 µm |

### How long things are, drawn

| Thing | On `universe` | On `earth` | On `humans` |
| --- | --- | --- | --- |
| Whole `humans` zone (7 Myr) | 0.96 mm | 2.9 mm | 1900 mm |
| *Homo sapiens* (315 kyr) | 0.043 mm | 0.13 mm | 85 mm |
| Recorded history (5,300 yr) | 0.73 µm | 2.2 µm | 1.4 mm |
| Industrial era (250 yr) | 0.03 µm | 0.1 µm | 0.07 mm |
| One human lifetime (80 yr) | 0.01 µm | 0.03 µm | 0.022 mm |

### The lines worth putting on the screen

- **Universe:** one swipe of a nail file across the right fingertip takes off
  **726,000 years** — every *Homo sapiens* who has ever lived, and then some.
  Our whole species is **0.043 mm**, thinner than a hair. All of recorded
  history is **0.73 micrometres**, a hundredth of a hair's width.
- **Earth:** a swipe is **239,000 years**. A fingernail (12 mm) is **28.7 million
  years**. The whole Cenozoic, asteroid to now, is **27.6 mm** — a bit over one
  fingernail. The Phanerozoic, everything with shells and eyes, is **226 mm** —
  a hand and a wrist.
- **Humans:** a swipe is **368 years**, about **14 generations**. The industrial
  era is exactly **one hair's width**. One generation is **7.3 µm**, roughly the
  width of a red blood cell. All of recorded history fits inside **1.4 mm** at
  the very tip of the finger.
- The ± 20 Myr error bar on the age of the universe is **2.8 mm** — wider than
  the whole `humans` zone (0.96 mm) drawn on the same arm.

---

## 4. Bands

Two families of band. `kind` distinguishes them so the site can draw them on
separate rows: `eon`, `era`, `period`, `epoch` on `earth`; `species` and
`culture` on `humans`; `epoch` on `universe`.

### Universe

No standard chart exists, so these follow the usual popular-science division
(see [Chronology of the universe](https://en.wikipedia.org/wiki/Chronology_of_the_universe)).
Boundaries are soft; only the first is sharp.

| Band | From (yr ago) | To (yr ago) |
| --- | --- | --- |
| Radiation era | 13,787,000,000 | 13,786,620,000 |
| Cosmic dark ages | 13,786,620,000 | 13,600,000,000 |
| Reionization | 13,600,000,000 | 12,800,000,000 |
| Galaxies grow | 12,800,000,000 | 4,567,300,000 |
| Solar System | 4,567,300,000 | 0 |

The first band is 380,000 years long — **0.05 mm** on the arm, two thirds of a
hair's width. It will not draw at screen resolution. The site should either drop
it or give every band a minimum drawn width.

### Earth — the geological time scale

All boundary ages from the **ICS International Chronostratigraphic Chart**
(<https://stratigraphy.org/chart>), consulted September 2026. The chart is
revised most years; the most recent update was June 2026, touching two Triassic
stages and one Permian stage, none of which are boundaries used here.

**Eons**

| Eon | From | To |
| --- | --- | --- |
| Hadean | 4540 Ma (ICS: 4567.3 Ma, clipped to the zone) | 4031 Ma |
| Archean | 4031 Ma | 2500 Ma |
| Proterozoic | 2500 Ma | 538.8 Ma |
| Phanerozoic | 538.8 Ma | 0 |

**Eras** — Palaeoproterozoic 2500–1600, Mesoproterozoic 1600–1000,
Neoproterozoic 1000–538.8, Palaeozoic 538.8–251.902, Mesozoic 251.902–66,
Cenozoic 66–0 Ma. (The four Archean eras — Eoarchean 4031–3600, Palaeoarchean
3600–3200, Mesoarchean 3200–2800, Neoarchean 2800–2500 — are in the chart but
are left out of the JSON; nothing in the event list needs them.)

**Periods**

| Period | Base (Ma) |
| --- | --- |
| Cryogenian | 720 |
| Ediacaran | 635 |
| Cambrian | 538.8 |
| Ordovician | 486.85 |
| Silurian | 443.1 |
| Devonian | 419.62 |
| Carboniferous | 358.86 |
| Permian | 298.9 |
| Triassic | 251.902 |
| Jurassic | 201.4 |
| Cretaceous | 143.1 |
| Palaeogene | 66.00 |
| Neogene | 23.04 |
| Quaternary | 2.58 |

Several of these were revised in the 2023 chart and still appear with older
values in print: Ordovician was 485.4, Silurian 443.8, Devonian 419.2,
Carboniferous 358.9, Cretaceous 145.

**Cenozoic epochs** — Palaeocene 66–56, Eocene 56–33.9, Oligocene 33.9–23.04,
Miocene 23.04–5.333, Pliocene 5.333–2.58, Pleistocene 2.58–0.0117,
Holocene 0.0117–0 Ma. Worth drawing: the Cenozoic is 27.6 mm here, so the
epochs are 1–9 mm each and readable.

The Holocene is **0.005 mm** on this zone. Same problem as the radiation era.

The Anthropocene is **not** in the JSON. The IUGS rejected it as a formal epoch
in March 2024, so it has no chart boundary. The `e-industrial` and `e-keeling`
events cover the same ground without pretending it is ratified.

### Humans — two band families

**Species ranges** (`kind: "species"`), all from Smithsonian Human Origins:

| Species | From | To |
| --- | --- | --- |
| *Sahelanthropus* | 7.2 Ma | 6.8 Ma |
| *Ardipithecus* | 5.8 Ma | 4.4 Ma |
| *Australopithecus* | 4.2 Ma | 1.9 Ma |
| *Paranthropus* | 2.7 Ma | 1.2 Ma |
| *Homo habilis* | 2.4 Ma | 1.4 Ma |
| *Homo erectus* | 1.89 Ma | 110 ka |
| *Homo heidelbergensis* | 700 ka | 200 ka |
| Neanderthals | 400 ka | 40 ka |
| *Homo sapiens* | 315 ka | 0 |

These **overlap on purpose**. For most of the last 3 million years there were
several kinds of human alive at once. The site should draw them stacked, not in
one row.

**Cultural / archaeological ages** (`kind: "culture"`):

| Band | From | To |
| --- | --- | --- |
| Lower Palaeolithic | 3.3 Ma | 300 ka |
| Middle Palaeolithic | 300 ka | 50 ka |
| Upper Palaeolithic | 50 ka | 11.7 ka |
| Neolithic | 11.7 ka | 5.3 ka |
| Bronze Age | 5.3 ka | 3.2 ka |
| Iron Age | 3.2 ka | 1.5 ka |
| Recorded history | 5.3 ka | 0 |
| Industrial era | 250 yr | 0 |

Two warnings for the UI:

1. **These ages are regional, not global.** The Bronze Age starts around 3300 BC
   in the Near East, 1700 BC in Britain, and never happens at all in Australia
   or most of the Americas. The numbers above are Near East / Old World. Say so
   somewhere, or the map is a lie.
2. **Recorded history overlaps Bronze and Iron.** It is a different kind of
   thing — a way of knowing, not a technology — so it needs its own row.
3. Mesolithic is deliberately left out. It is 11.7–10 ka in some regions and
   absent in others, and at 271 mm per million years it is 0.5 mm wide.

---

## 5. Sources, per zone

Each list stands on its own.

### Universe

| What | Source |
| --- | --- |
| Age of the universe, CMB at 380 kyr, reionization, dark energy | Planck Collaboration 2018, *Planck 2018 results VI: cosmological parameters* — <https://arxiv.org/abs/1807.06209> |
| Most distant galaxy (JADES-GS-z14-0, z = 14.32, 290 Myr after the Big Bang) | Carniani et al. 2024, Nature — <https://www.nature.com/articles/s41586-024-07860-9> |
| Milky Way thick disc at ~13 Gyr; inner halo assembly ~11 Gyr | Xiang & Rix 2022, Nature — <https://www.nature.com/articles/s41586-022-04496-5> |
| Peak of cosmic star formation, 3.5 Gyr after the Big Bang (z ≈ 1.9) | Madau & Dickinson 2014, ARA&A — <https://www.annualreviews.org/doi/pdf/10.1146/annurev-astro-081811-125615> |
| Solar System age 4567.3 Ma | ICS chart (base of the Hadean) — <https://stratigraphy.org/chart> |
| Moon-forming impact, 4.51 Ga | Barboni et al. 2017, Science Advances — <https://www.science.org/doi/10.1126/sciadv.1602365> |

### Earth

| What | Source |
| --- | --- |
| Every eon / era / period / epoch boundary; the five big extinctions; PETM; Messinian; onset of Quaternary glaciation; base of the Holocene | ICS International Chronostratigraphic Chart — <https://stratigraphy.org/chart> |
| Age of Earth, 4.54 ± 0.05 Ga | Age of Earth, after Dalrymple 2001 — <https://en.wikipedia.org/wiki/Age_of_Earth> |
| Oldest terrestrial material, Jack Hills zircon 4404 ± 8 Ma, with liquid water | Wilde et al. 2001, Nature — <https://www.nature.com/articles/35051550> |
| LUCA, last universal common ancestor, ~4.2 Ga (4.09–4.33) | Moody et al. 2024, Nature Ecology & Evolution — <https://www.nature.com/articles/s41559-024-02461-1> |
| Oldest claimed life, Isua 3.7 Ga; Dresser Formation 3.48 Ga | Nutman et al. 2016, Nature — <https://www.nature.com/articles/nature19355> |
| Great Oxidation Event, first rise 2.43 Ga, permanent 2.22 Ga | Poulton et al. 2021, Nature — <https://www.nature.com/articles/s41586-021-03393-7> |
| Decimetre-scale multicellular eukaryotes, Gaoyuzhuang Formation 1.56 Ga | Zhu et al. 2016, Nature Communications — <https://www.nature.com/articles/ncomms11500> |
| Oldest datable crown-group eukaryote and sexual reproduction, *Bangiomorpha* 1047 Ma | Gibson et al. 2018, Geology — <https://authors.library.caltech.edu/records/7brz9-8mw86> |
| Oldest fungi, *Ourasphaira giraldae* ~1.0–0.9 Ga | Loron et al. 2019, Nature — <https://www.nature.com/articles/s41586-019-1217-0> |
| Neoproterozoic Oxygenation Event, second oxygen rise from ~800 Ma | Och & Shields-Zhou 2012, Earth-Science Reviews — <https://www.sciencedirect.com/science/article/abs/pii/S0012825211001498> |
| First large animals, Avalon assemblage 575 Ma | Shen et al. 2008, Science — <https://www.science.org/doi/10.1126/science.1150279> |
| Oldest vertebrate, *Myllokunmingia* 518 Ma | Shu et al. 2003, Nature — <https://pubmed.ncbi.nlm.nih.gov/12350247/> |
| First land plants, cryptospores ~470 Ma | Wellman 2010, New Phytologist — <https://nph.onlinelibrary.wiley.com/doi/10.1111/j.1469-8137.2010.03471.x> |
| *Tiktaalik* 375 Ma | Nature News 2006 on Daeschler et al. — <https://www.nature.com/news/2006/060403/full/news060403-7.html> |
| Oldest dinosaur, *Nyasasaurus* 243 Ma | UCMP Berkeley on Nesbitt et al. 2013 — <https://ucmp.berkeley.edu/2012/12/werning-in-biology-letters-with-oldest-dinosaur/> |
| Oldest mammal, *Brasilodon* 225.4 Ma | Natural History Museum, London — <https://www.nhm.ac.uk/press-office/press-releases/earliest-known-mammal-is-identified-using-fossil-tooth-records.html> |
| *Archaeopteryx* ~150 Ma | Britannica — <https://www.britannica.com/animal/Archaeopteryx> |
| Oldest primate, *Purgatorius* 65.9 Ma | UC Berkeley Research on Wilson Mantilla et al. 2021 — <https://vcresearch.berkeley.edu/news/our-earliest-primate-ancestors-rapidly-spread-after-dinosaur-extinction> |
| *Teilhardina* worldwide at 56 Ma | Smith et al. 2006, PNAS — <https://www.pnas.org/doi/10.1073/pnas.0511296103> |

### Humans

| What | Source |
| --- | --- |
| Hominin species ranges: *Sahelanthropus*, *Orrorin*, *Ardipithecus*, *Australopithecus*, *Kenyanthropus*, *Paranthropus*, *H. habilis*, *H. erectus*, *H. antecessor*, *H. heidelbergensis*, *H. neanderthalensis*, *H. naledi* | Smithsonian Human Origins species pages — <https://humanorigins.si.edu/evidence/human-fossils/species/sahelanthropus-tchadensis> (same path pattern for each) |
| Laetoli footprints 3.66 Ma; Dmanisi 1.8 Ma; burial at Qafzeh/Skhul ~100 ka | Smithsonian Human Origins timeline — <https://humanorigins.si.edu/evidence/human-evolution-timeline-interactive> |
| Oldowan by 2.6 Ma; hand axes ~1.7 Ma; controlled fire by 790 ka | Smithsonian Human Origins: Tools & Food — <https://humanorigins.si.edu/human-characteristics/tools-food> |
| Oldest stone tools, Lomekwi 3.3 Ma | Harmand et al. 2015, Nature — <https://www.nature.com/articles/nature14464> |
| Earliest *Homo*, Ledi-Geraru 2.8 Ma | Villmoare et al. 2015, Science — <https://www.science.org/doi/10.1126/science.aaa1343> |
| *Homo sapiens*, Jebel Irhoud 315 ± 34 ka | Richter et al. 2017, Nature — <https://www.nature.com/articles/nature22335> |
| Schöningen spears, redated to ~200 ka | Dahl et al. 2025, Science Advances — <https://www.science.org/doi/10.1126/sciadv.adv0752> |
| Oldest shell beads, Bizmoune Cave ≥142 ka | Sehasseh et al. 2021, Science Advances — <https://www.science.org/doi/10.1126/sciadv.abi8620> |
| Out of Africa, 51–72 ka, single main dispersal | Malaspinas et al. 2016, Nature — <https://www.nature.com/articles/nature19792> |
| Australia by 65 ka, Madjedbebe | Clarkson et al. 2017, Nature — <https://www.nature.com/articles/nature22968> |
| Oldest narrative cave art, Sulawesi 51.2 ka | Oktaviana et al. 2024, Nature — <https://www.nature.com/articles/s41586-024-07541-7> |
| Neanderthal disappearance ~40 ka | Higham et al. 2014, Nature — <https://www.nature.com/articles/nature13621> |
| Americas by 23 ka, White Sands footprints | Bennett et al. 2021, Science — <https://www.science.org/doi/10.1126/science.abg7586> (reaffirmed: <https://science.org/doi/10.1126/science.adh5007>) |
| Oldest pottery, Xianrendong 20 ka | Wu et al. 2012, Science — <https://www.science.org/doi/10.1126/science.1218643> |
| Last Glacial Maximum, 26.5–19 ka | Clark et al. 2009, Science — <https://www.science.org/doi/10.1126/science.1172873> |
| Dog domestication (disputed) | Frantz et al. 2016, Science — <https://www.science.org/doi/10.1126/science.aaf3161> |
| Göbekli Tepe, 9500–8000 BC | German Archaeological Institute — <https://www.dainst.blog/the-tepe-telegrams/2016/06/22/how-old-ist-it-dating-gobekli-tepe/> |
| Cereal cultivation and domestication in southwest Asia | Arranz-Otaegui et al. 2016, PNAS — <https://www.pnas.org/doi/10.1073/pnas.1612797113> |
| Earliest writing, Uruk ~3300 BC | The Met, *The Origins of Writing* — <https://www.metmuseum.org/essays/the-origins-of-writing> |
| Generation length, 26.9 yr | Wang et al. 2023, Science Advances — <https://www.science.org/doi/10.1126/sciadv.abm7047> |

### Where Wikipedia is the date source

**47 of the 153 events**, plus 5 of the 53 bands, carry
`sourceTitle: "English Wikipedia (secondary)"` — the Wikipedia article is both the
subject link and the date source. That is a third of the events, so it is worth
being explicit. They fall into two groups. Both are honest, both are weaker than
the rest of the file.

**Group 1 — documented history (25 events).** Great Pyramid, Roman Empire,
*Sidereus Nuncius*, Hubble's law, the discovery of the CMB, Apollo 11 (twice,
once per zone), the Keeling Curve, the Industrial Revolution (twice), the wheel,
the alphabet, printing press, Columbus, vaccination, *On the Origin of Species*,
powered flight, penicillin, the double helix, the Web, the human genome, eight
billion people, Chauvet, Dolní Věstonice, Blombos, domestication of livestock.
These dates are not in dispute and no single paper establishes them. An
institutional page (NASA, UN, a museum) would read better in the UI but says the
same thing.

**Group 2 — textbook palaeontology with no single anchoring paper (22 events).**
Early photosynthesis, cyanobacteria, Columbia, Rodinia, first animals on land
(*Pneumodesmus*), first forests (*Archaeopteris*), Pangaea, amniotes,
Carboniferous rainforest collapse, the Atlantic opening, first flowers, *Eomaia*,
*Pakicetus*, the Himalaya collision, first apes, grassland spread, the Isthmus of
Panama, Denisovans, Cro-Magnon in Europe. Each of those Wikipedia articles cites
the primary literature. **This is the obvious next job:** promote the best
citation out of each article into `source`, and drop any event where none holds up.

The 5 bands are Middle and Upper Palaeolithic, Bronze Age, Iron Age and the
industrial era — period definitions rather than dated discoveries.

Every one of the 209 `wikipedia` links was checked against the MediaWiki API on
2026-09-10: all resolve, none is a disambiguation page, none is a red link.

---

## 6. Open questions

Things I had to choose rather than read off a source.

1. **Nail-file swipe = 0.1 mm.** Nobody publishes this. 0.1 mm is a reasonable
   single pass on a coarse file and it matches the number already in the readme
   (726,000 years on the universe zone). If the site wants a different figure,
   every "swipe" number scales linearly.
2. **Hair = 0.07 mm, fingernail = 12 mm.** Both are mid-range human values with
   real spread (hair 0.017–0.18 mm). Fine as illustrations, not as measurements.
3. **First stars at 13.6 Ga.** This is a model estimate, not a measurement.
   Sourced to Planck's reionization constraint. The EDGES 21-cm claim (~180 Myr
   after the Big Bang) is still disputed and is not used. Marked `medium`.
4. **End of reionization at 12.9 Ga.** Planck gives a midpoint at z ≈ 7.7;
   "complete" is usually put near z ≈ 6, which is ~12.85 Ga. I used 12.9 Ga with
   a 200 Myr error bar and `medium`.
5. **Dark energy taking over at 6 Ga.** Derived from the deceleration-to-
   acceleration transition around z ≈ 0.6–0.7, not quoted directly by Planck.
   ± 1 Gyr, `medium`.
6. **The Gaia-Enceladus merger at 11 Ga.** Xiang & Rix date inner-halo assembly
   to ~11 Ga; the merger itself is often quoted at 8–10 Ga. Wide error bar.
7. **Origin of eukaryotes is not an event in the JSON.** Claims run from 1.65 Ga
   to 2.7 Ga and none is solid. Instead the file uses *Bangiomorpha* at
   1047 Ma — the oldest crown-group eukaryote anyone can actually date — and
   says so in the description.
8. **Oxygenic photosynthesis at 2.7 Ga and anoxygenic at 3.4 Ga** are both marked
   `disputed`. The estimates in the literature span a billion years.
9. **First birds.** *Archaeopteryx* at ~150 Ma is the famous answer, not the
   strictly correct one — whether it is a bird depends on where you cut the
   cladogram. Marked `medium`.
10. **"Now" is 2026.** Every historical `yearsAgo` is 2026 minus the year. The
    file will drift by one year each January. `meta.generated` records the
    baseline.
11. **Duplicate `yearsAgo` values.** Some pairs sit on the same spot on purpose:
    PETM and *Teilhardina* both at 56 Ma; Panama and genus *Homo* both at 2.8 Ma;
    LGM and oldest pottery both at 20 ka; the three Big Bang events all at
    13.787 Ga. The UI needs to cope with several events at one `x`.
12. **The `humans` cultural bands are Old World only.** See the warning in §4.
13. **Generation length applied outside its range.** Wang et al. cover the last
    250,000 years. Using 26.9 years for a 13.8 billion year span is a rhetorical
    device, not a measurement. Worth a footnote in the UI.
14. **Could not machine-validate the JSON here.** Bash is locked down in this
    session, so no `jq` or `python -m json.tool` run. It was verified
    structurally instead: 211 matched braces, 3 matched arrays, 209 `id` /
    `wikipedia` / `source` / `sourceTitle` fields, 153 events with a valid
    `certainty`, no trailing or doubled commas. Run a real parser before
    trusting it in a build.

---

## 7. Odd facts — two gaps that share a moment

A different kind of row, added 2026-09-29. Not an event and not a band: a
**oddity** is three moments, and what it shows is the *two gaps between them*.
The middle moment is the hinge both gaps share.

Why the shape is worth having its own entity:

- Both gaps are fractions of the same span, so the fact holds at any arm span.
  Nothing in the sentence has to name a millimetre or a year.
- The reader can measure both gaps on their own arm. That is the whole trick:
  the surprise is not a number, it is that the bar they expected to be shorter
  is longer.
- The third point is usually *now*, which is why the fact lands: the far thing
  turns out to be nearer to us than to the thing next to it.

They live in `data/oddities/<id>.json`, one file each, and each names the
timelines whose span makes the two gaps big enough to see. Cleopatra is a
`modern` fact only: on the humans arm the whole of her story is a fingernail.

### The set as it stands (17)

| id | Timelines | Older gap | Younger gap |
| --- | --- | --- | --- |
| `o-cleopatra` | modern | pyramid → Cleopatra, 2,544 yr | Cleopatra → Moon, 1,999 yr |
| `o-mammoth` | modern | pyramid → last mammoths, 600 yr | mammoths → now, 4,000 yr |
| `o-oxford` | modern | Oxford → Aztec empire, 332 yr | Aztec → now, 598 yr |
| `o-harvard` | modern | Harvard → *Principia*, 51 yr | *Principia* → now, 339 yr |
| `o-fax` | modern | fax → telephone, 33 yr | telephone → now, 150 yr |
| `o-tools-fire` | humans | tools → fire, 2.51 Myr | fire → now, 790 kyr |
| `o-neanderthal` | humans | split → end, 560 kyr | end → now, 40 kyr |
| `o-writing` | humans | *sapiens* → writing, 310 kyr | writing → now, 5.3 kyr |
| `o-trex` | life, earth | *Stegosaurus* → *T. rex*, 83 Myr | *T. rex* → now, 67 Myr |
| `o-sharks` | life, earth | sharks → forests, 65 Myr | forests → now, 385 Myr |
| `o-single-cells` | life | first life → large animals, 3.13 Gyr | animals → now, 575 Myr |
| `o-oxygen` | life | first life → oxygen, 1.27 Gyr | oxygen → now, 2.43 Gyr |
| `o-earth-late` | universe | Big Bang → Earth, 9.25 Gyr | Earth → now, 4.54 Gyr |
| `o-earth-too-hot` | universe | Big Bang → now, 13.787 Gyr | now → too hot, 1 Gyr |
| `o-eclipses` | universe | Big Bang → now, 13.787 Gyr | now → last eclipse, 600 Myr |
| `o-sun-swallows` | universe | Big Bang → now, 13.787 Gyr | now → Earth swallowed, 7.59 Gyr |
| `o-last-stars` | universe | Big Bang → now, 13.787 Gyr | now → last stars, 10^14 yr |

### The future, and why it needs no new arm

The right fingertip stays *now*. A fact about the future is the same three
points with the hinge at zero: everything so far is the arm span, and what is
ahead is measured in more of it. On the universe span, at any arm length:

| Ahead | As a share of the whole span | Reads as |
| --- | --- | --- |
| Last total eclipse, ~600 Myr | 4 % | half a palm past the fingertip |
| Earth too hot for life, ~1 Gyr | 7 % | about a hand |
| Sun swallows the Earth, 7.59 Gyr | 55 % | more than half the span again |
| Last stars go out, 10^14 yr | 7,250 spans | a line of people kilometres long |

In the data a future moment is written `yearsAhead`; the loader keeps it as a
negative `yearsAgo`, so one number sorts the whole line and the drawing needs
no second case.

### Which ones the arm can actually show

Added with the Fun fact button: a fact is only offered on a timeline where both
gaps cover at least 4 % of the span — about a palm on a 1.90 m arm. Below that
the two rules are hairlines and the three names land in a heap, so the drawing
would say the opposite of the truth.

That leaves **11 of the 17**, and the six it drops are worth reading as a
finding, not as a bug:

| Dropped | Smaller gap, as a share of the arm | Wanted |
| --- | --- | --- |
| `o-trex`, `o-sharks` | 1.8 % of the Life arm | a timeline of the last ~250 Myr |
| `o-neanderthal` | 0.6 % of the Humans arm | a timeline of the last ~500 kyr |
| `o-writing` | 0.08 % of the Humans arm | same |
| `o-harvard` | 1.1 % of the Modern arm | a timeline of the last ~500 yr |
| `o-fax` | 0.7 % of the Modern arm | same |

Four of the five gaps between our timelines show up here at once. Between
Modern humans (4,600 yr) and Humans (7 Myr) there is a factor of 1,500, and
between Humans and Life a factor of 530. Any fact whose moments fall inside one
of those gaps has nowhere to be drawn. A sixth timeline of roughly a hundred
million years, and a seventh of a few hundred years, would give five of these
six a home.

### Sources, and what is still thin

Every point carries its own `wikipedia` and `source`, because most of them are
not events in `data/events/` — Cleopatra earns one line in one comparison, not
a card on the arm. Dates that *are* already events were copied from those files
so the two never disagree.

Still to fix before any of this is shown to a visitor:

1. **First sharks at 450 Ma is the weakest date in the set.** Marked
   `disputed`. The oldest scales usually read as shark are Late Ordovician and
   contested; unambiguous teeth are ~410 Ma and *Doliodus* is 397 Ma. The claim
   survives either way — trees are 385 Ma — but the number needs a real paper,
   not a Wikipedia overview.
2. **Last total solar eclipse, ~600 Myr.** Widely repeated, sourced here to
   Wikipedia's lunar-distance article. Marked `medium`. Find the calculation.
3. **Cleopatra's death, 30 BC.** Sourced to Britannica. Fine for the claim, but
   it is the only Britannica citation in the whole database.
4. **Oxford's 1096.** "Teaching existed in some form" is the university's own
   careful wording, not a founding date. Marked `medium`.
5. **The fax fact is the only one that is merely amusing.** It teaches nothing
   about deep time. Keep it or cut it — it is the test case for whether the set
   is about scale or about trivia.
6. **`o-harvard` and `o-oxford` are both European/American institutions.** The
   set as a whole leans that way. Wanted: an oddity with its hinge outside
   Europe — the Mediterranean refilling, Angkor, Great Zimbabwe, the Polynesian
   crossings.

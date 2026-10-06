export type TimelineId = string

/** Anything in the data that can cite where its date came from. */
export interface Sourced {
  /** Article link, for the reader who wants the story. */
  wikipedia?: string
  /** Where the date comes from: either a URL or a plain citation. */
  source?: string
  /** What to call `source` when it is a URL. */
  sourceTitle?: string
}

export interface Timeline extends Sourced {
  id: TimelineId
  label: string
  /** Total length of the timeline, in years. Maps onto the whole arm span. */
  spanYears: number
  /** Error bar on `spanYears`, in years. */
  spanUncertaintyYears?: number
  /** The same span counted in human generations. */
  spanGenerations?: number
  startLabel: string
  endLabel: string
  /** One line on how the span is fixed and how the bands are cut. */
  note?: string
}

export interface Band extends Sourced {
  id: string
  /** Every timeline this band belongs on. The same eon serves Earth and Life. */
  timelines: TimelineId[]
  label: string
  /** Older edge, counted back from now. */
  fromYearsAgo: number
  /** Younger edge, counted back from now. */
  toYearsAgo: number
  /** eon, era, period, epoch, species, culture. */
  kind?: string
}

export type Certainty = 'high' | 'medium' | 'disputed'

/**
 * How one timeline treats an event. The same moment can be a headline on one
 * timeline and a footnote on another: first life is the whole point of the
 * Life timeline and one step among many on Earth's.
 */
export interface Placement {
  /** Keep it when the reader asks for the short list. */
  simple: boolean
  /**
   * Write its name on the arm itself, above the line, so the reader sees where
   * it falls without having to scrub onto it.
   */
  landmark: boolean
  /** Said differently on this timeline. Falls back to the event's own wording. */
  label?: string
  description?: string
}

/**
 * An event as a file holds it: the shared facts once, then one entry per
 * timeline it appears on.
 */
export interface EventRecord extends Sourced {
  id: string
  timelines: Record<TimelineId, Placement>
  /** A moment, or the older edge of a stretch. */
  yearsAgo: number
  /**
   * The younger edge, for something that lasted rather than happened: the age
   * of dinosaurs, not the asteroid. Absent on a single moment.
   */
  endYearsAgo?: number
  uncertaintyYears?: number | null
  label: string
  description?: string
  certainty?: Certainty
  /**
   * A video worth watching, for the reader who wants more than a card. A URL
   * only: nothing is embedded and nothing is fetched, so the page stays quiet.
   */
  watch?: string
  /** What to call the `watch` link. Falls back to "Video". */
  watchTitle?: string
  /** Human generations back from now. Derived from `yearsAgo` when it is missing. */
  generationsAgo: number
}

/**
 * An event as one timeline shows it. The per-timeline settings are already
 * folded in, so nothing on screen has to know an event can live in two places.
 */
export interface TimelineEvent extends Sourced {
  id: string
  /** The timeline this copy belongs to. */
  timelineId: TimelineId
  yearsAgo: number
  endYearsAgo?: number
  uncertaintyYears?: number | null
  label: string
  description?: string
  certainty?: Certainty
  watch?: string
  watchTitle?: string
  landmark: boolean
  /** True when the short list keeps it. */
  simple: boolean
  generationsAgo: number
}

export interface Meta {
  /** The date the research file was written, shown in the credit line. */
  generated: string
  defaultArmSpanM: number
  /** Years in one human generation. Everything in generations is divided by this. */
  generationYears: number
  /** The paper `generationYears` comes from, ending in its URL. */
  generationSource?: string
  note?: string
}

/**
 * One of the moments an oddity hangs on. It carries its own source,
 * because most of them are not in `data/events/`: Cleopatra earns a mention in
 * one comparison, not a card of her own on the arm.
 */
export interface OddityPoint extends Sourced {
  label: string
  /**
   * Counted back from now, like an event — and negative for a moment still
   * ahead, which is the only place in the data where that happens. The files
   * write those as `yearsAhead`; the loader flips the sign, so one number
   * orders the whole line: oldest first, now at zero, the future past it.
   */
  yearsAgo: number
  uncertaintyYears?: number
}

/**
 * Oldest first. The second one is the hinge: the moment the two gaps share,
 * or the end of the only gap. The fact's card and the marker go there.
 */
export type OddityPoints =
  | [OddityPoint, OddityPoint]
  | [OddityPoint, OddityPoint, OddityPoint]

/**
 * A fact drawn as gaps on the arm. Three moments make two gaps sharing a
 * middle moment, for a fact that compares them: Cleopatra is nearer to the
 * Moon landing than to the pyramid she lived beside. Two moments make one
 * gap, for a fact about one stretch of time: mammoths were still alive when
 * the pyramid was finished. Never pad a one-gap fact with *now* to make three
 * — the gap to now says nothing, and it is drawn as loudly as the one that
 * does.
 *
 * Every gap is a fraction of the same span, so an oddity holds at any arm
 * span and the reader can measure it with their own fingers. That is why it
 * is worth having its own entity rather than being written into copy.
 */
export interface Oddity extends Sourced {
  id: string
  /** Only the timelines its gaps are big enough to see on. */
  timelines: TimelineId[]
  /** A short name for the dev browser. Not the sentence. */
  label: string
  /** The sentence on screen. */
  line: string
  points: OddityPoints
  certainty?: Certainty
}

export type ZoneId = string

/** Anything in the data that can cite where its date came from. */
export interface Sourced {
  /** Article link, for the reader who wants the story. */
  wikipedia?: string
  /** Where the date comes from: either a URL or a plain citation. */
  source?: string
  /** What to call `source` when it is a URL. */
  sourceTitle?: string
}

export interface Zone extends Sourced {
  id: ZoneId
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
  zone: ZoneId
  label: string
  /** Older edge, counted back from now. */
  fromYearsAgo: number
  /** Younger edge, counted back from now. */
  toYearsAgo: number
  /** eon, era, period, epoch, species, culture. */
  kind?: string
}

export type Certainty = 'high' | 'medium' | 'disputed'

export interface TimelineEvent extends Sourced {
  id: string
  zone: ZoneId
  yearsAgo: number
  uncertaintyYears?: number | null
  label: string
  description?: string
  certainty?: Certainty
  /** Human generations back from now. Derived from `yearsAgo` when it is missing. */
  generationsAgo: number
}

export interface TimelinesMeta {
  /** The date the research file was written, shown in the credit line. */
  generated: string
  defaultArmSpanM: number
  /** Years in one human generation. Everything in generations is divided by this. */
  generationYears: number
  /** The paper `generationYears` comes from, ending in its URL. */
  generationSource?: string
  note?: string
}

export interface Timelines {
  meta: TimelinesMeta
  zones: Zone[]
  bands: Band[]
  events: TimelineEvent[]
}

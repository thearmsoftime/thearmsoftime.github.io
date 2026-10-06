import rawMeta from '../data/meta.json'
import { DEV } from './dev'
import { drafts, noDrafts } from './drafts'
import { DEFAULT_GENERATION_YEARS, generationsOf } from './format'
import type {
  Band,
  Certainty,
  EventRecord,
  Meta,
  Placement,
  Sourced,
  Timeline,
  TimelineEvent,
} from './types'

/**
 * `data/` is the database, split by entity: one file per timeline, one per
 * event, bands grouped. Reading it still goes through these checks: anything
 * that is not a usable number or is pinned to an unknown timeline is dropped
 * rather than allowed to break the render.
 *
 * Vite inlines every match of these globs at build time, so the whole tree
 * ships as one bundle and nothing is fetched at runtime.
 */
const rawTimelines = import.meta.glob('../data/timelines/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>
const rawBands = import.meta.glob('../data/bands/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>
const rawEvents = import.meta.glob('../data/events/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const HUMANS_ID = 'humans'
export const MODERN_ID = 'modern'

/** Simple keeps a timeline's short list; All shows everything the data holds. */
export type Detail = 'simple' | 'all'

export const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

export const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' && v.trim() !== '—' ? v.trim() : undefined

/** True for something we can safely put in an href. */
export const isUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^https?:\/\//i.test(v)

/** "en.wikipedia.org/wiki/Homo" -> "en.wikipedia.org", for a link with no title. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'source'
  }
}

/** Every object a glob brought in, flattening the files that hold a list. */
export function records(loaded: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  for (const value of Object.values(loaded)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item && typeof item === 'object') out.push(item as Record<string, unknown>)
    }
  }
  return out
}

export const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter((s): s is string => !!s) : []

const CERTAINTY = new Set<Certainty>(['high', 'medium', 'disputed'])
export const certaintyOf = (v: unknown): Certainty | undefined =>
  typeof v === 'string' && CERTAINTY.has(v as Certainty) ? (v as Certainty) : undefined

/** The three citation fields, carried by timelines, bands and events alike. */
export const readSourced = (o: Record<string, unknown>): Sourced => ({
  wikipedia: str(o.wikipedia),
  source: str(o.source),
  sourceTitle: str(o.sourceTitle),
})

function readTimelines(input: Record<string, unknown>[]): Timeline[] {
  const out: Timeline[] = []
  for (const o of input) {
    const id = str(o.id)
    const span = num(o.spanYears)
    if (!id || !span || span <= 0) continue
    out.push({
      id,
      label: str(o.label) ?? id,
      spanYears: span,
      spanUncertaintyYears: num(o.spanUncertaintyYears) ?? undefined,
      spanGenerations: num(o.spanGenerations) ?? undefined,
      startLabel: str(o.startLabel) ?? 'Start',
      endLabel: str(o.endLabel) ?? 'Now',
      note: str(o.note),
      ...readSourced(o),
    })
  }
  // Widest span first: Universe, Earth, Humans.
  return out.sort((a, b) => b.spanYears - a.spanYears)
}

function readBands(input: Record<string, unknown>[], known: Map<string, Timeline>): Band[] {
  const out: Band[] = []
  for (const o of input) {
    const id = str(o.id)
    // A band can sit on more than one timeline, so its edges are kept as the
    // data gives them. Each timeline crops its own copy when it draws it.
    const on = strings(o.timelines).filter((t) => known.has(t))
    const from = num(o.fromYearsAgo)
    const to = num(o.toYearsAgo)
    if (!id || on.length === 0 || from === null || to === null) continue
    // Tolerate the two edges arriving the wrong way round.
    out.push({
      id,
      timelines: on,
      label: str(o.label) ?? id,
      fromYearsAgo: Math.max(from, to),
      toYearsAgo: Math.max(Math.min(from, to), 0),
      kind: str(o.kind),
      ...readSourced(o),
    })
  }
  return out.sort((a, b) => b.fromYearsAgo - a.fromYearsAgo)
}

/** One timeline's entry on an event. Anything unreadable falls back to off. */
const readPlacement = (v: unknown): Placement => {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  return {
    simple: o.simple === true,
    landmark: o.landmark === true,
    label: str(o.label),
    description: str(o.description),
  }
}

function readEvents(
  input: Record<string, unknown>[],
  known: Map<string, Timeline>,
  generationYears: number,
): EventRecord[] {
  const out: EventRecord[] = []
  for (const o of input) {
    const id = str(o.id)
    if (!id) continue
    const back = num(o.yearsAgo)
    if (back === null) continue
    const end = num(o.endYearsAgo)
    // A stretch is kept oldest edge first, like a band. An end at or before
    // the start is no stretch at all, so it reads as a single moment.
    const yearsAgo = Math.max(back, end ?? back, 0)
    const younger = end === null ? null : Math.max(Math.min(back, end), 0)
    const endYearsAgo = younger !== null && younger < yearsAgo ? younger : undefined

    const placements: Record<string, Placement> = {}
    const on = (o.timelines && typeof o.timelines === 'object' ? o.timelines : {}) as Record<
      string,
      unknown
    >
    for (const [timelineId, settings] of Object.entries(on)) {
      const timeline = known.get(timelineId)
      // A timeline only carries the events that fit inside its own span. A
      // stretch only has to end inside it: Egypt of the pharaohs was already
      // old when the Great Pyramid went up, and the arm shows the part it has.
      if (!timeline || (endYearsAgo ?? yearsAgo) > timeline.spanYears) continue
      placements[timelineId] = readPlacement(settings)
    }
    if (Object.keys(placements).length === 0) continue

    out.push({
      id,
      timelines: placements,
      yearsAgo,
      endYearsAgo,
      uncertaintyYears: num(o.uncertaintyYears) ?? 0,
      label: str(o.label) ?? id,
      description: str(o.description),
      certainty: certaintyOf(o.certainty),
      // A video is only ever a link, so anything that is not one is no video.
      watch: isUrl(o.watch) ? o.watch : undefined,
      watchTitle: str(o.watchTitle),
      // The file carries this; if it ever does not, years and the generation
      // length are enough to work it out.
      generationsAgo: num(o.generationsAgo) ?? generationsOf(yearsAgo, generationYears),
      ...readSourced(o),
    })
  }
  // Oldest first, so the list reads left to right along the arms.
  return out.sort((a, b) => b.yearsAgo - a.yearsAgo)
}

function readMeta(src: Record<string, unknown> | undefined): Meta {
  const gen = num(src?.generationYears)
  return {
    generated: str(src?.generated) ?? 'unknown',
    defaultArmSpanM: num(src?.defaultArmSpanM) ?? 1.9,
    generationYears: gen && gen > 0 ? gen : DEFAULT_GENERATION_YEARS,
    generationSource: str(src?.generationSource),
    note: str(src?.note),
  }
}

/**
 * Which file each event came from, so the dev browser can name it in an edit
 * and the copied prompt points at something real.
 */
const eventFiles = new Map<string, string>()
for (const [path, value] of Object.entries(rawEvents)) {
  const id = (value as Record<string, unknown> | null)?.id
  if (typeof id === 'string') eventFiles.set(id, path.replace(/^\.\.\//, ''))
}
export const fileOf = (id: string): string => eventFiles.get(id) ?? `data/events/${id}.json`

export const meta = readMeta(rawMeta as unknown as Record<string, unknown>)
export const timelines = readTimelines(records(rawTimelines))

const byId = new Map(timelines.map((t) => [t.id, t]))

/**
 * Every band and every event as the files hold them, before any timeline folds
 * its own settings in. The screen never reads these — it takes `bandsFor` and
 * `eventsFor` instead — but the dev data browser does, because the whole point
 * there is to see one row per file, timelines and all.
 */
export const allBands = readBands(records(rawBands), byId)
export const allEvents = readEvents(records(rawEvents), byId, meta.generationYears)


/** Timelines still being worked on: only reachable with `?dev=1`. */
const DEV_ONLY_TIMELINES = new Set(['earth', 'humans'])

/**
 * The timelines a visitor may pick: Universe, Life and Modern humans. Everything else
 * in here still works on the whole set, so a dev-only one is a line away from
 * being public again.
 */
export const visibleTimelines: Timeline[] = DEV
  ? timelines
  : timelines.filter((t) => !DEV_ONLY_TIMELINES.has(t.id))

/** An event's shared facts with one timeline's settings folded over the top. */
function place(event: EventRecord, timelineId: string, on: Placement): TimelineEvent {
  return {
    id: event.id,
    timelineId,
    yearsAgo: event.yearsAgo,
    endYearsAgo: event.endYearsAgo,
    uncertaintyYears: event.uncertaintyYears,
    // The timeline may say it differently; most do not, and fall through.
    label: on.label ?? event.label,
    description: on.description ?? event.description,
    certainty: event.certainty,
    watch: event.watch,
    watchTitle: event.watchTitle,
    landmark: on.landmark,
    simple: on.simple,
    generationsAgo: event.generationsAgo,
    wikipedia: event.wikipedia,
    source: event.source,
    sourceTitle: event.sourceTitle,
  }
}

/** Every timeline's events and bands, built once at load instead of per render. */
const byTimeline = new Map<string, { bands: Band[]; all: TimelineEvent[]; simple: TimelineEvent[] }>(
  timelines.map((t) => {
    const all: TimelineEvent[] = []
    for (const event of allEvents) {
      const on = event.timelines[t.id]
      if (on) all.push(place(event, t.id, on))
    }
    const simple = all.filter((e) => e.simple)
    return [
      t.id,
      {
        // A band that ends before the timeline starts has nothing to show here.
        bands: allBands.filter((b) => b.timelines.includes(t.id) && b.toYearsAgo < t.spanYears),
        all,
        // With no short list in the data, Simple would be an empty screen.
        simple: simple.length > 0 ? simple : all,
      },
    ]
  }),
)

const EMPTY_BANDS: Band[] = []
const EMPTY_EVENTS: TimelineEvent[] = []

export const bandsFor = (timelineId: string): Band[] =>
  byTimeline.get(timelineId)?.bands ?? EMPTY_BANDS


/**
 * True for a stretch: an event that lasted rather than happened, carrying a
 * younger edge as well as an older one. The age of dinosaurs, not the asteroid.
 */
export const isStretch = (event: TimelineEvent): boolean => event.endYearsAgo !== undefined

/** Every event, looked up by id: what the dev browser edits against. */
export const eventById = new Map(allEvents.map((e) => [e.id, e]))

// Stale drafts are pruned by the data browser when it loads, not here: a draft
// the files have caught up with renders identically either way, and pruning is
// the editor's business, not the page's.

/**
 * The same fold as `place`, with the dev browser's draft laid over the top
 * first. Only reached when something is actually drafted, so a public build
 * never walks this path.
 */
function drafted(timelineId: string, detail: Detail): TimelineEvent[] {
  const all: TimelineEvent[] = []
  const draft = drafts()
  for (const event of allEvents) {
    const base = event.timelines[timelineId]
    if (!base) continue
    const patch = draft[event.id]
    if (!patch) {
      all.push(place(event, timelineId, base))
      continue
    }
    all.push(
      place(
        {
          ...event,
          label: patch.label ?? event.label,
          description: patch.description ?? event.description,
        },
        timelineId,
        { ...base, ...(patch.timelines?.[timelineId] ?? {}) },
      ),
    )
  }
  if (detail === 'all') return all
  const simple = all.filter((e) => e.simple)
  return simple.length > 0 ? simple : all
}

export const eventsFor = (timelineId: string, detail: Detail): TimelineEvent[] => {
  const timeline = byTimeline.get(timelineId)
  if (!timeline) return EMPTY_EVENTS
  // Reading the signal is what makes an edit in the dev browser show up on the
  // arm straight away. With nothing drafted the list built at load is handed
  // back untouched, which is every public build.
  if (noDrafts()) return detail === 'simple' ? timeline.simple : timeline.all
  return drafted(timelineId, detail)
}

/**
 * Generations are a human measure, so they are only shown on the two human
 * timelines. The data carries `generationsAgo` everywhere; it is ignored on
 * the rest.
 */
export const showsGenerations = (timelineId: string): boolean =>
  timelineId === HUMANS_ID || timelineId === MODERN_ID

export interface Credit {
  /** "Wang, Al-Saffar, Rogers & Hahn (2023)" — enough to name it in one line. */
  label: string
  /** The whole citation, for the title tooltip. */
  detail: string
  url?: string
}

/**
 * `meta.generationSource` is one long citation ending in the paper's URL. Split
 * it into a short label, the full text and a link for the credit line.
 */
function readCredit(text: string | undefined): Credit | undefined {
  if (!text) return undefined
  const link = text.match(/https?:\/\/\S+$/)
  const detail = (link ? text.slice(0, link.index).trim() : text).replace(/[.,;]$/, '')
  // Authors up to and including the year, when the citation is written that way.
  const named = detail.match(/^.{0,120}?\(\d{4}\)/)
  return {
    label: named?.[0] ?? detail.slice(0, 60),
    detail,
    url: link?.[0],
  }
}

export const generationCredit = readCredit(meta.generationSource)

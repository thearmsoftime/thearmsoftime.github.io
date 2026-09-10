import raw from '../research/timelines.json'
import { DEFAULT_GENERATION_YEARS, generationsOf } from './scale'
import type {
  Band,
  Certainty,
  Sourced,
  Timelines,
  TimelineEvent,
  TimelinesMeta,
  Zone,
} from './types'

/**
 * `research/timelines.json` is the research session's finished file. Reading it
 * still goes through these checks: anything that is not a usable number or is
 * pinned to an unknown zone is dropped rather than allowed to break the render.
 */

export const HUMANS_ID = 'humans'

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

const str = (v: unknown): string | undefined =>
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

const CERTAINTY = new Set<Certainty>(['high', 'medium', 'disputed'])
const certaintyOf = (v: unknown): Certainty | undefined =>
  typeof v === 'string' && CERTAINTY.has(v as Certainty) ? (v as Certainty) : undefined

/** The three citation fields, carried by zones, bands and events alike. */
const readSourced = (o: Record<string, unknown>): Sourced => ({
  wikipedia: str(o.wikipedia),
  source: str(o.source),
  sourceTitle: str(o.sourceTitle),
})

function readZones(input: unknown[]): Zone[] {
  const out: Zone[] = []
  for (const z of input) {
    const o = z as Record<string, unknown>
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
  return out
}

function readBands(input: unknown[], zones: Map<string, Zone>): Band[] {
  const out: Band[] = []
  for (const b of input) {
    const o = b as Record<string, unknown>
    const id = str(o.id)
    const zoneId = str(o.zone)
    const zone = zoneId ? zones.get(zoneId) : undefined
    const from = num(o.fromYearsAgo)
    const to = num(o.toYearsAgo)
    if (!id || !zone || from === null || to === null) continue
    // Tolerate the two edges arriving the wrong way round.
    const older = Math.max(from, to)
    const younger = Math.min(from, to)
    out.push({
      id,
      zone: zone.id,
      label: str(o.label) ?? id,
      fromYearsAgo: Math.min(older, zone.spanYears),
      toYearsAgo: Math.max(younger, 0),
      kind: str(o.kind),
      ...readSourced(o),
    })
  }
  return out.sort((a, b) => b.fromYearsAgo - a.fromYearsAgo)
}

function readEvents(
  input: unknown[],
  zones: Map<string, Zone>,
  generationYears: number,
): TimelineEvent[] {
  const out: TimelineEvent[] = []
  for (const e of input) {
    const o = e as Record<string, unknown>
    const id = str(o.id)
    const zoneId = str(o.zone)
    const zone = zoneId ? zones.get(zoneId) : undefined
    if (!id || !zone) continue
    const back = num(o.yearsAgo)
    if (back === null) continue
    const yearsAgo = Math.min(Math.max(back, 0), zone.spanYears)
    out.push({
      id,
      zone: zone.id,
      yearsAgo,
      uncertaintyYears: num(o.uncertaintyYears) ?? 0,
      label: str(o.label) ?? id,
      description: str(o.description),
      certainty: certaintyOf(o.certainty),
      // The file carries this; if it ever does not, years and the generation
      // length are enough to work it out.
      generationsAgo: num(o.generationsAgo) ?? generationsOf(yearsAgo, generationYears),
      ...readSourced(o),
    })
  }
  // Oldest first, so the list reads left to right along the arms.
  return out.sort((a, b) => b.yearsAgo - a.yearsAgo)
}

function readMeta(src: Record<string, unknown> | undefined): TimelinesMeta {
  const gen = num(src?.generationYears)
  return {
    generated: str(src?.generated) ?? 'unknown',
    defaultArmSpanM: num(src?.defaultArmSpanM) ?? 1.9,
    generationYears: gen && gen > 0 ? gen : DEFAULT_GENERATION_YEARS,
    generationSource: str(src?.generationSource),
    note: str(src?.note),
  }
}

function load(): Timelines {
  const src = raw as unknown as Record<string, unknown>
  const meta = readMeta(src.meta as Record<string, unknown> | undefined)
  const zones = readZones(Array.isArray(src.zones) ? src.zones : [])
  const byId = new Map(zones.map((z) => [z.id, z]))
  const bands = readBands(Array.isArray(src.bands) ? src.bands : [], byId)
  const events = readEvents(
    Array.isArray(src.events) ? src.events : [],
    byId,
    meta.generationYears,
  )

  // Widest span first: Universe, Earth, Humans.
  zones.sort((a, b) => b.spanYears - a.spanYears)

  return { meta, zones, bands, events }
}

export const timelines = load()

/** Every zone's events and bands, split once at load instead of on every render. */
const byZone = new Map<string, { bands: Band[]; events: TimelineEvent[] }>(
  timelines.zones.map((z) => [
    z.id,
    {
      bands: timelines.bands.filter((b) => b.zone === z.id),
      events: timelines.events.filter((e) => e.zone === z.id),
    },
  ]),
)

const EMPTY_BANDS: Band[] = []
const EMPTY_EVENTS: TimelineEvent[] = []

export const bandsFor = (zoneId: string): Band[] => byZone.get(zoneId)?.bands ?? EMPTY_BANDS

export const eventsFor = (zoneId: string): TimelineEvent[] =>
  byZone.get(zoneId)?.events ?? EMPTY_EVENTS

/**
 * Generations are a human measure, so they are only shown on the human
 * timeline. The data carries `generationsAgo` on the other zones; it is
 * ignored there.
 */
export const showsGenerations = (zoneId: string): boolean => zoneId === HUMANS_ID

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

export const generationCredit = readCredit(timelines.meta.generationSource)

import { certaintyOf, num, readSourced, records, str, strings, timelines } from './data'
import type { Oddity, OddityPoint, OddityPoints, Timeline } from './types'

/**
 * The odd facts: three moments whose *two gaps* are the point. Kept out of
 * `data.ts` because they are their own entity and nothing else reads them —
 * the header's Fun fact button, the marks it puts on the arm, and the dev
 * panel.
 */
const rawOddities = import.meta.glob('../data/oddities/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

/**
 * One moment on an oddity. A file writes a moment still to come as
 * `yearsAhead`; it is kept here as a negative `yearsAgo` so the three points
 * sort on one number and the drawing needs no second case.
 */
function readOddityPoint(v: unknown): OddityPoint | null {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const label = str(o.label)
  const ahead = num(o.yearsAhead)
  const yearsAgo = ahead !== null ? -Math.abs(ahead) : num(o.yearsAgo)
  if (!label || yearsAgo === null) return null
  return {
    label,
    yearsAgo,
    uncertaintyYears: num(o.uncertaintyYears) ?? undefined,
    ...readSourced(o),
  }
}

function readOddities(input: Record<string, unknown>[], known: Map<string, Timeline>): Oddity[] {
  const out: Oddity[] = []
  for (const o of input) {
    const id = str(o.id)
    const line = str(o.line)
    const points = (Array.isArray(o.points) ? o.points : [])
      .map(readOddityPoint)
      .filter((p): p is OddityPoint => p !== null)
    // Two gaps need exactly three moments. Anything else is not an oddity yet.
    if (!id || !line || points.length !== 3) continue
    points.sort((a, b) => b.yearsAgo - a.yearsAgo)
    const on = strings(o.timelines).filter((t) => {
      const timeline = known.get(t)
      // A moment already past has to fit inside the span; one still ahead sits
      // past the fingertip, where there is no edge to fall off.
      return !!timeline && points.every((p) => p.yearsAgo <= timeline.spanYears)
    })
    if (on.length === 0) continue
    out.push({
      id,
      timelines: on,
      label: str(o.label) ?? id,
      line,
      points: points as OddityPoints,
      certainty: certaintyOf(o.certainty),
      ...readSourced(o),
    })
  }
  return out
}

const byId = new Map(timelines.map((t) => [t.id, t]))

/** Every oddity the files hold, whichever timeline it belongs on. */
export const allOddities = readOddities(records(rawOddities), byId)

/** One of an oddity's moments, placed on a timeline. */
export interface FactStop {
  point: OddityPoint
  /**
   * 0 at the left fingertip, 1 at the right. Past 1 for a moment still ahead,
   * which has no place on the arm — the arm ends at now.
   */
  t: number
  /** True when the moment is still ahead, so the drawing has to run off the end. */
  beyond: boolean
}

/**
 * Where an oddity's three moments fall on a timeline. A moment still ahead is
 * kept with its true `t` past 1 rather than dropped: the drawing needs to know
 * how far off the end it would be, even though it can only draw to the
 * fingertip.
 */
export const stopsOf = (oddity: Oddity, spanYears: number): FactStop[] =>
  oddity.points.map((point) => {
    const t = 1 - point.yearsAgo / spanYears
    return { point, t, beyond: t > 1 }
  })

const EMPTY_ODDITIES: Oddity[] = []
const odditiesByTimeline = new Map<string, Oddity[]>(
  timelines.map((t) => [t.id, allOddities.filter((o) => o.timelines.includes(t.id))]),
)

/** Every oddity a file pins to this timeline, readable there or not. */
export const odditiesFor = (timelineId: string): Oddity[] =>
  odditiesByTimeline.get(timelineId) ?? EMPTY_ODDITIES

/**
 * How much of the arm the smaller of the two gaps has to cover before the fact
 * is worth drawing — about a palm on a 1.90 m span.
 *
 * This is the gate everything else hangs on. Tyrannosaurus lived nearer to us
 * than to Stegosaurus, but on the 3.7-billion-year Life arm both gaps are two
 * per cent of the span: two hairlines and three names on top of each other.
 * The fact is true and the drawing would be a lie, so it is not offered there.
 * It stays in the data and in the dev panel, waiting for a timeline short
 * enough to hold it.
 */
const MIN_GAP = 0.04

/**
 * How far past the right fingertip a bar may run, in spans. It mirrors the
 * cap in `FactMarks.tsx`, which is the drawing's own margin.
 */
const BEYOND_MARGIN = 0.1

/** The gaps as they can actually be drawn, in spans. */
const drawnGaps = (oddity: Oddity, spanYears: number): number[] => {
  const stops = stopsOf(oddity, spanYears)
  // A moment still ahead is drawn in the margin past the fingertip, so its gap
  // is measured to where the drawing stops rather than to the true date.
  const at = (i: number) => Math.min(Math.max(stops[i]!.t, 0), 1 + BEYOND_MARGIN)
  return [at(1) - at(0), at(2) - at(1)]
}

export const isReadable = (oddity: Oddity, spanYears: number): boolean =>
  drawnGaps(oddity, spanYears).every((gap) => gap >= MIN_GAP)

/**
 * The facts this timeline can actually show: the ones whose two gaps are both
 * big enough on the arm to be seen and measured.
 */
const readableByTimeline = new Map<string, Oddity[]>(
  timelines.map((t) => [
    t.id,
    (odditiesByTimeline.get(t.id) ?? []).filter((o) => isReadable(o, t.spanYears)),
  ]),
)

export const factsFor = (timelineId: string): Oddity[] =>
  readableByTimeline.get(timelineId) ?? EMPTY_ODDITIES

/**
 * The two gaps an oddity compares, in years. Older is the first pair, younger
 * the second; on a fact about the future the younger gap runs past now and so
 * past the right fingertip.
 */
export const gapsOf = (oddity: Oddity): { older: number; younger: number } => ({
  older: oddity.points[0].yearsAgo - oddity.points[1].yearsAgo,
  younger: oddity.points[1].yearsAgo - oddity.points[2].yearsAgo,
})

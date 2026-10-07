/**
 * Where the reader is, in the address bar, so a link can be shared and opens
 * on the same spot: `?timeline=humans&card=homo-erectus`.
 *
 * - `timeline` — the timeline id.
 * - `card` — the event the marker stands on, when it stands right on one.
 * - `fact` — the fun fact on show.
 * - `ago` — where the marker is, in years ago, when no card says it.
 *
 * The arm span, the theme and the rest of the bar are left out on purpose:
 * they belong to the reader, not to the place in time. Other parameters —
 * `?dev=1` — are kept as they are.
 */
export type Link = {
  timeline?: string
  card?: string
  fact?: string
  ago?: number
}

const KEYS = ['timeline', 'card', 'fact', 'ago'] as const

export function readLink(): Link {
  if (typeof location === 'undefined') return {}
  const params = new URLSearchParams(location.search)
  const ago = Number.parseFloat(params.get('ago') ?? '')
  return {
    timeline: params.get('timeline') ?? undefined,
    card: params.get('card') ?? undefined,
    fact: params.get('fact') ?? undefined,
    ago: Number.isFinite(ago) && ago >= 0 ? ago : undefined,
  }
}

/**
 * Four significant figures of the date itself, not of the span: near now the
 * readout says "7.48 million years ago" on a 13.8-billion-year arm, and the
 * link has to land on that, not on 7 million. Still a number a person can
 * read — `ago=66000000`, not `ago=66003412.77`. Never finer than a whole year.
 */
const roundAgo = (ago: number): number => {
  if (ago < 1) return 0
  const step = Math.max(1, 10 ** (Math.floor(Math.log10(ago)) - 3))
  return Math.round(ago / step) * step
}

/** The query string for `link`, with every parameter that is not ours kept. */
export function linkSearch(link: Link): string {
  const params = new URLSearchParams(location.search)
  for (const key of KEYS) params.delete(key)
  if (link.timeline) params.set('timeline', link.timeline)
  if (link.card) params.set('card', link.card)
  if (link.fact) params.set('fact', link.fact)
  if (link.ago !== undefined) params.set('ago', String(roundAgo(link.ago)))
  const search = params.toString()
  return search ? `?${search}` : ''
}

/**
 * Keeps the address bar in step. A click — a timeline, a card, a fact — is a
 * step the Back button should undo, so it pushes. Dragging is not: one drag
 * would be hundreds of steps, so it only replaces the current entry, and only
 * once the hand has rested a moment (Safari throttles `replaceState` calls).
 */
const SETTLE_MS = 250

export function createLinkWriter() {
  let pending: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const url = (search: string) => `${location.pathname}${search}${location.hash}`

  /** Write a waiting replace now, so it lands on the entry it was meant for. */
  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (pending !== undefined && pending !== location.search)
      history.replaceState(history.state, '', url(pending))
    pending = undefined
  }

  return {
    push(search: string) {
      flush()
      if (search !== location.search) history.pushState(null, '', url(search))
    },
    replace(search: string) {
      pending = search
      clearTimeout(timer)
      timer = setTimeout(flush, SETTLE_MS)
    },
    /** After Back or Forward: a waiting replace belongs to the entry just left. */
    drop() {
      clearTimeout(timer)
      timer = undefined
      pending = undefined
    },
  }
}

/**
 * Where the landmark names go on the arm, and which of them fit at all.
 *
 * Names that would collide are pushed apart, but a push only helps so far: on
 * a phone four names on History slide so far that "Roman Empire" sits over
 * the wrong dot. A name off its own dot is a drawing that lies, so the one
 * whose loss frees the rest is left off instead. Its dot and its card stay;
 * only the name on the arm stands down.
 *
 * Map labelling solves the same thing in two dimensions. One row of a handful
 * of names needs no library for it.
 *
 * Everything here is a fraction of the stage width. It depends only on the
 * dates, the names and the width, so a name never moves or vanishes when the
 * marker arrives on its dot.
 */

export interface Mark {
  id: string
  label: string
  /** Where its dot is. */
  dot: number
  /** Half the name's width. */
  half: number
}

export interface PlacedMark extends Mark {
  /** Where the name's centre ends up. */
  at: number
}

/** Push apart left to right, then walk back to keep the last one on stage. */
const pushApart = (marks: Mark[]): PlacedMark[] => {
  const placed = marks.map((m) => ({ ...m, at: m.dot }))
  for (let i = 1; i < placed.length; i++) {
    const prev = placed[i - 1]!
    const cur = placed[i]!
    cur.at = Math.max(cur.at, prev.at + prev.half + cur.half)
  }
  for (let i = placed.length - 1; i >= 0; i--) {
    const cur = placed[i]!
    const next = placed[i + 1]
    const ceiling = next ? next.at - next.half - cur.half : 1 - cur.half
    cur.at = Math.min(cur.at, ceiling)
  }
  return placed
}

/** How far a name slid, as a share of its own half width: 1 puts the dot at its edge. */
const slid = (m: PlacedMark): number => (m.half > 0 ? Math.abs(m.at - m.dot) / m.half : 0)

/** How many names slid past `slide`, then how far the worst one went. Lower is better. */
const score = (placed: PlacedMark[], slide: number): [number, number] => [
  placed.filter((m) => slid(m) > slide).length,
  Math.max(0, ...placed.map(slid)),
]

const better = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])

/**
 * Drop one name at a time — each time the one whose loss leaves the best
 * layout — until every name is within `slide` of its dot. Trying each beats a
 * fixed order: on a phone the three Humans names leave Homo erectus and Homo
 * sapiens, the pair that sits nearest its dots. A tie drops the older name.
 * There are a handful of landmarks per arm, so trying each is cheap.
 */
export const placeLandmarks = (marks: Mark[], slide: number): PlacedMark[] => {
  let kept = [...marks].sort((a, b) => a.dot - b.dot)
  let placed = pushApart(kept)
  while (score(placed, slide)[0] > 0) {
    let best = { kept, placed, score: [Infinity, Infinity] as [number, number] }
    kept.forEach((_, i) => {
      const trialKept = kept.filter((_, j) => j !== i)
      const trial = pushApart(trialKept)
      const s = score(trial, slide)
      if (better(s, best.score)) best = { kept: trialKept, placed: trial, score: s }
    })
    kept = best.kept
    placed = best.placed
  }
  return placed
}

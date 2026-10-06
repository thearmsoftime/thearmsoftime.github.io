/**
 * Where the parts of an arm fall along the span, measured in from a
 * fingertip, as a share of the whole span. The readout and the event cards
 * say "at your right wrist" when a moment falls on one, so the reader can find
 * it on their own arm; under `?dev=1` they are also purple guides.
 *
 * Typical adult, arm span taken as equal to height. The finger and hand
 * numbers come from hand-length studies (a hand is about a tenth of the span)
 * and are fairly firm. The shoulder and the armpit are rough: the textbook
 * upper-arm and shoulder-width numbers are taken standing with the arms down,
 * and they do not add up to half a span with the arms out. So these are
 * rounded so that the parts fit the span, not copied from one table.
 *
 * `plusMinus` is how far one grown-up differs from the next, roughly one
 * standard deviation, as a share of the span. It is a guide to how loosely an
 * event may be pinned to a body part, not a measured error bar.
 *
 * Only proportions: the arm span is a setting.
 */
export interface BodyMark {
  id: string
  label: string
  /** 0..0.5, from the fingertip in towards the middle of the chest. */
  fromTip: number
  plusMinus: number
  /**
   * The whole phrase for the readout and the cards, not "at your" + a name:
   * other languages will not put those words in that order. No left or
   * right — the reader facing the screen has the drawing's arms mirrored, and
   * which hand is which is a thing to explain, not a thing to read.
   */
  at: string
}

export const BODY_MARKS: readonly BodyMark[] = [
  {
    id: 'last-knuckle',
    label: 'Last knuckle of the middle finger', fromTip: 0.014, plusMinus: 0.002,
    at: 'at the top knuckle of your middle finger',
  },
  {
    id: 'middle-knuckle',
    label: 'Middle knuckle of the middle finger', fromTip: 0.03, plusMinus: 0.003,
    at: 'at the middle knuckle of your middle finger',
  },
  {
    id: 'finger-base',
    label: 'Big knuckle, where the middle finger starts', fromTip: 0.055, plusMinus: 0.004,
    at: 'at the base of your middle finger',
  },
  {
    id: 'thumb-base',
    label: 'Base of the thumb, where it leaves the hand', fromTip: 0.085, plusMinus: 0.008,
    at: 'at the base of your thumb',
  },
  {
    id: 'wrist',
    label: 'Wrist crease, where the palm starts', fromTip: 0.105, plusMinus: 0.005,
    at: 'at your wrist',
  },
  {
    id: 'elbow',
    // Wider than the real spread (about 1 %) on purpose: the elbow is a
    // joint, not a crease, and at 2 % the start of life on the universe arm
    // lands on it — a match worth more to a reader than the last per cent.
    label: 'Elbow', fromTip: 0.25, plusMinus: 0.02,
    at: 'at your elbow',
  },
  {
    id: 'shoulder',
    label: 'Tip of the shoulder', fromTip: 0.39, plusMinus: 0.02,
    at: 'at your shoulder',
  },
  {
    id: 'armpit',
    label: 'Armpit', fromTip: 0.4, plusMinus: 0.02,
    at: 'at your armpit',
  },
  {
    id: 'nipple',
    label: 'Nipple', fromTip: 0.445, plusMinus: 0.015,
    at: 'at your nipple',
  },
]

/**
 * The one mark both arms share. Nobody differs here — it is the middle by
 * definition — so its spread is only a catch zone, about half a palm
 * across, or the readout would name it on a single pixel.
 */
export const CHEST_MIDDLE: BodyMark = {
  id: 'chest-middle',
  label: 'Middle of the chest',
  fromTip: 0.5,
  plusMinus: 0.01,
  at: 'at the middle of your chest',
}

/**
 * The body part a point on the span falls on, as its phrase, or undefined
 * between parts. `t` is 0..1 along the span, left fingertip to right. Where
 * two spreads overlap — the shoulder and the armpit — the nearer middle wins.
 *
 * `plusMinus` is the date's own ± as a share of the span. A part counts when
 * the point is inside the part's spread, or the part's middle is inside the
 * date's ±: the Great Oxygen Event is 2.43 ± 0.1 billion years, and on the
 * Earth arm that ± takes in the nipple. The larger of the two, not the sum —
 * adding them would name a part that neither the body nor the date reaches.
 */
export function bodyAt(t: number, plusMinus = 0): string | undefined {
  const fromTip = Math.min(t, 1 - t)
  let best: BodyMark | undefined
  let bestGap = Infinity
  for (const mark of [...BODY_MARKS, CHEST_MIDDLE]) {
    const gap = Math.abs(fromTip - mark.fromTip)
    if (gap <= Math.max(mark.plusMinus, plusMinus) && gap < bestGap) {
      best = mark
      bestGap = gap
    }
  }
  return best?.at
}

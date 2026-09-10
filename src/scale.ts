const DAY = 1 / 365.25
const HOUR = DAY / 24
const MINUTE = HOUR / 60

/** Thickness a single pass of a nail file takes off a fingernail. */
export const NAIL_FILE_MM = 0.1

/**
 * Years in one human generation, used when `research/timelines.json` does not
 * say. Roughly the worldwide average age at which people have children.
 */
export const DEFAULT_GENERATION_YEARS = 26.9

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

/** 0 = left fingertip (start of time), 1 = right fingertip (now). */
export const fractionOf = (yearsAgo: number, spanYears: number): number =>
  clamp01(1 - yearsAgo / spanYears)

export const yearsAgoAt = (fraction: number, spanYears: number): number =>
  (1 - clamp01(fraction)) * spanYears

function sig(value: number, digits = 3): string {
  if (value === 0) return '0'
  const rounded = Number(value.toPrecision(digits))
  return rounded.toLocaleString('en-GB', { maximumFractionDigits: 20 })
}

/** A duration in years, written the way a person would say it. */
export function formatYears(years: number): string {
  const y = Math.abs(years)
  if (y === 0) return 'no time at all'
  if (y >= 1e9) return `${sig(y / 1e9)} billion years`
  if (y >= 1e6) return `${sig(y / 1e6)} million years`
  if (y >= 2) return `${sig(y, 3)} years`
  if (y >= 1) return '1 year'
  if (y >= 2 * DAY) return `${sig(y / DAY, 2)} days`
  if (y >= DAY) return '1 day'
  if (y >= HOUR) return `${sig(y / HOUR, 2)} hours`
  if (y >= MINUTE) return `${sig(y / MINUTE, 2)} minutes`
  return `${sig(y / (MINUTE / 60), 2)} seconds`
}

/** How long ago, for the readout under the marker. */
export function formatYearsAgo(years: number): string {
  if (years <= 0) return 'now'
  return `${formatYears(years)} ago`
}

/** A plain count, in words once it gets big: "512 million", "3,450", "84". */
export function formatCount(count: number): string {
  const n = Math.abs(count)
  if (n >= 1e9) return `${sig(n / 1e9)} billion`
  if (n >= 1e6) return `${sig(n / 1e6)} million`
  if (n >= 1e5) return `${sig(n / 1e3)} thousand`
  if (n >= 1) return Math.round(n).toLocaleString('en-GB')
  return sig(n, 2)
}

export const generationsOf = (years: number, generationYears: number): number =>
  years / (generationYears > 0 ? generationYears : DEFAULT_GENERATION_YEARS)

/** A count of generations, written out. */
export function formatGenerations(generations: number): string {
  const g = Math.abs(generations)
  if (g < 0.5) return 'less than one generation'
  if (g < 1.5) return 'one generation'
  return `${formatCount(g)} generations`
}

/** The same, said as a distance back from now. */
export function formatGenerationsAgo(generations: number): string {
  if (Math.abs(generations) < 0.5) return 'this generation'
  return `${formatGenerations(generations)} ago`
}

/** A length in metres, in whatever unit keeps it readable. */
export function formatLength(metres: number): string {
  const mm = Math.abs(metres) * 1000
  if (mm >= 1000) return `${sig(mm / 1000, 3)} m`
  if (mm >= 10) return `${sig(mm / 10, 3)} cm`
  if (mm >= 0.1) return `${sig(mm, 2)} mm`
  if (mm >= 1e-4) return `${sig(mm * 1000, 2)} µm`
  return `${sig(mm * 1e6, 2)} nm`
}

interface Reference {
  years: number
  label: string
}

/** Spans a person has a feel for, used for the nail-file comparison. */
const REFERENCES: Reference[] = [
  { years: MINUTE, label: 'A minute' },
  { years: HOUR, label: 'An hour' },
  { years: DAY, label: 'A day' },
  { years: 7 * DAY, label: 'A week' },
  { years: 30 * DAY, label: 'A month' },
  { years: 1, label: 'A year' },
  { years: 10, label: 'A decade' },
  { years: 80, label: 'A whole human life' },
  { years: 1000, label: 'A thousand years' },
  { years: 5500, label: 'All of written history' },
  { years: 12000, label: 'Everything since farming began' },
  { years: 300000, label: 'All of Homo sapiens' },
  { years: 2.8e6, label: 'The whole genus Homo' },
  { years: 7e6, label: 'The whole human story' },
  { years: 66e6, label: 'The whole age of mammals' },
  { years: 538.8e6, label: 'Every animal fossil ever found' },
]

/** The reference span closest in size to one nail-file swipe. */
function pickReference(yearsPerSwipe: number): Reference {
  let best = REFERENCES[0]!
  let bestDistance = Infinity
  for (const r of REFERENCES) {
    const distance = Math.abs(Math.log(r.years / yearsPerSwipe))
    if (distance < bestDistance) {
      bestDistance = distance
      best = r
    }
  }
  return best
}

export interface ScaleReadout {
  yearsPerMetre: number
  yearsPerMm: number
  /** e.g. "7.26 million years" */
  perMm: string
  /** e.g. "270 thousand generations" */
  perMmGenerations: string
  /** e.g. "726 thousand years" */
  nailFile: string
  /** e.g. "27 thousand generations" */
  nailFileGenerations: string
  /** e.g. "All of Homo sapiens" */
  comparisonLabel: string
  /** e.g. "41 µm of fingertip" */
  comparisonLength: string
}

export function scaleReadout(
  spanYears: number,
  armSpanM: number,
  generationYears: number,
): ScaleReadout {
  const yearsPerMetre = spanYears / armSpanM
  const yearsPerMm = yearsPerMetre / 1000
  const yearsPerSwipe = yearsPerMm * NAIL_FILE_MM
  const ref = pickReference(yearsPerSwipe)
  const refMetres = ref.years / yearsPerMetre

  return {
    yearsPerMetre,
    yearsPerMm,
    perMm: formatYears(yearsPerMm),
    perMmGenerations: formatGenerations(generationsOf(yearsPerMm, generationYears)),
    nailFile: formatYears(yearsPerSwipe),
    nailFileGenerations: formatGenerations(generationsOf(yearsPerSwipe, generationYears)),
    comparisonLabel: ref.label,
    comparisonLength: `${formatLength(refMetres)} of fingertip`,
  }
}

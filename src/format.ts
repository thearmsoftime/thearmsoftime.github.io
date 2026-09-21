/**
 * One place where numbers become text.
 *
 * Every figure on the screen is an estimate. Dates come with an error bar and
 * generations are years divided by an average, so nothing here prints a number
 * to its last digit: each formatter first rounds to a step a person would
 * actually say out loud. "75,000 generations ago", never "74,349
 * generations ago". The marker readout is the exception — it says the year the
 * marker is on, however close to now that lands.
 *
 * Everything that writes a year, a date, a count, a generation or a length
 * goes through this file. `scale.ts` does the geometry and calls in here for
 * the words.
 */

const DAY = 1 / 365.25
const HOUR = DAY / 24
const MINUTE = HOUR / 60
const SECOND = MINUTE / 60
/** A twelfth of a year: the rung between a year and a day. */
const MONTH = 1 / 12

/** The year the whole file counts back from. */
export const NOW_YEAR = 2026

/**
 * Years in one human generation, used when `data/meta.json` does not
 * say. Roughly the worldwide average age at which people have children.
 */
export const DEFAULT_GENERATION_YEARS = 26.9

/** Value rounded to `digits` significant figures, written out with separators. */
function sig(value: number, digits = 3): string {
  if (value === 0) return '0'
  const rounded = Number(value.toPrecision(digits))
  return rounded.toLocaleString('en-GB', { maximumFractionDigits: 20 })
}

/** 1, 2 or 5 times a power of ten: the steps a person reads without stopping. */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 0
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / magnitude
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * magnitude
}

/** Round to a step, tolerating a step of zero. */
export const snapTo = (value: number, step: number): number =>
  step > 0 ? Math.round(value / step) * step : value

/**
 * The step an estimate of this size is honest to: a readable step of about a
 * twentieth of it, so the number is right to a few percent and no further.
 * 74,349 lands on 75,000; 512,527,881 lands on 500,000,000.
 */
export const estimateStep = (value: number): number => niceStep(Math.abs(value) / 20)

/** A number snapped to that step. The one rounding rule for derived counts. */
export const estimate = (value: number): number => snapTo(value, estimateStep(value))

/** Decimals worth printing at this step: none once the step is a whole number. */
const decimalsAt = (step: number): number =>
  step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step)))

/** "1 year", "1.1 years", "11 months" — a count that never says "1 months". */
function count(value: number, unit: string, digits = 2): string {
  const text = sig(value, digits)
  return `${text} ${text === '1' ? unit : `${unit}s`}`
}

/**
 * A duration in years, written the way a person would say it.
 *
 * Three figures once the number is in the thousands, two below that. Nobody
 * says "437 years ago", they say "440 years ago", and the arm cannot tell
 * those apart anyway.
 */
export function formatYears(years: number): string {
  const y = Math.abs(years)
  if (y === 0) return 'no time at all'
  if (y >= 1e9) return `${sig(y / 1e9)} billion years`
  if (y >= 1e6) return `${sig(y / 1e6)} million years`
  if (y >= 2) return count(y, 'year', y >= 1000 ? 3 : 2)
  // Below two years it steps down a rung at a time. Without the months rung a
  // year and a bit had to be said in 300-odd days, or rounded flat to "1 year".
  if (y >= 1) return count(y, 'year')
  // Nobody says "12 months".
  if (y >= 11.5 * MONTH) return '1 year'
  if (y >= MONTH) return count(y / MONTH, 'month')
  if (y >= DAY) return count(y / DAY, 'day')
  if (y >= HOUR) return count(y / HOUR, 'hour')
  if (y >= MINUTE) return count(y / MINUTE, 'minute')
  return count(y / SECOND, 'second')
}

/** How long ago, for the readout under the marker. */
export function formatYearsAgo(years: number): string {
  if (years <= 0) return 'now'
  return `${formatYears(years)} ago`
}

/**
 * A date and its error bar, split so the bar can be set grey and small:
 * "130" + "±5" + "million years ago". The unit is said once, at the end,
 * because "130 million ± 5 million years" is the unit read twice for no gain.
 *
 * A few dates are pinned far finer than their own unit (the Solar System, to
 * half a million years in 4.57 billion). "±0.0005 billion" is a row of zeros,
 * so those keep their own words in the bar and leave `trail` empty.
 */
export interface UncertainDate {
  /** The number, or the whole date when the bar carries its own unit. */
  lead: string
  /** "±5", glued tight. Absent when the date has no error bar. */
  bar?: string
  /** The shared unit and "ago", after the bar. */
  trail?: string
}

export function formatYearsAgoUncertain(years: number, uncertainty = 0): UncertainDate {
  if (years <= 0 || !(uncertainty > 0)) return { lead: formatYearsAgo(years) }
  const own = (): UncertainDate => ({
    lead: formatYearsAgo(years),
    bar: `±${formatYears(uncertainty)}`,
  })
  const unit = years >= 1e9 ? 1e9 : years >= 1e6 ? 1e6 : 1
  // Under two years the date itself is months or days; no unit to share.
  if (unit === 1 && (years < 2 || uncertainty < 1)) return own()
  const bar = sig(uncertainty / unit, 2)
  // Past two decimals the shared unit stops paying: "±0.024 million" is a
  // worse way to say 24,000 years.
  if ((bar.split('.')[1]?.length ?? 0) > 2) return own()
  const word = unit === 1e9 ? 'billion years' : unit === 1e6 ? 'million years' : 'years'
  return { lead: sig(years / unit), bar: `±${bar}`, trail: `${word} ago` }
}

/**
 * A span, said as one line: "243 to 66 million years ago". Both edges share
 * the bigger one's unit whenever that stays readable, because "243 million
 * years to 66 million years ago" is the same fact said twice.
 */
export function formatYearsAgoStretch(from: number, to: number): string {
  if (to <= 0) return `${formatYears(from)} ago to now`
  const unit = from >= 1e9 ? 1e9 : from >= 1e6 ? 1e6 : 0
  if (unit > 0 && to >= unit / 10) {
    const word = unit === 1e9 ? 'billion' : 'million'
    return `${sig(from / unit)} to ${sig(to / unit)} ${word} years ago`
  }
  return `${formatYears(from)} to ${formatYearsAgo(to)}`
}

/**
 * A calendar year, for spans short enough that people think in dates. Year 0
 * does not exist, so 1 BC is followed by AD 1.
 */
export function formatCalendarYear(yearsAgo: number): string {
  const year = Math.round(NOW_YEAR - yearsAgo)
  if (year > 0) return year >= 1000 ? `${year}` : `AD ${year}`
  return `${1 - year} BC`
}

/** A plain count, in words once it gets big: "500 million", "75,000", "84". */
export function formatCount(count: number): string {
  const n = Math.abs(count)
  if (n === 0) return '0'
  const step = estimateStep(n)
  const rounded = snapTo(n, step)
  if (rounded >= 1e9) return `${sig(rounded / 1e9)} billion`
  if (rounded >= 1e6) return `${sig(rounded / 1e6)} million`
  if (rounded >= 1e5) return `${sig(rounded / 1e3)} thousand`
  return rounded.toLocaleString('en-GB', { maximumFractionDigits: decimalsAt(step) })
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

/** A thickness in millimetres, for the ruler labels. */
export const formatMm = (mm: number): string => `${sig(mm, 3)} mm`

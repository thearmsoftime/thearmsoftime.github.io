import { clamp01 } from './scale'
import type { Band } from './types'

/**
 * Where the drawing's landmarks sit, as fractions of the image box.
 * Measured off public/vitruvian-man.webp (see readme).
 */
export const FIGURE = {
  src: '/vitruvian-man.webp',
  width: 1400,
  height: 797,
  /** Left fingertip of the outstretched arms = start of the timeline. */
  leftX: 0.1035,
  /** Right fingertip = now. */
  rightX: 0.8946,
  /** The line running through both hands. */
  armY: 0.4174,
  /** Chest, as measured on the scan. */
  chestY: 0.6135,
} as const

/**
 * Only a band of the scan is shown: the outstretched arms, with the head and
 * the legs cut away. Fractions of the source height. The arms are the timeline,
 * so they get the width and almost none of the height.
 */
export const CROP = { top: 0.32, bottom: 0.6 } as const

export const CROP_TOP = FIGURE.height * CROP.top
export const CROP_HEIGHT = FIGURE.height * (CROP.bottom - CROP.top)
/** Width divided by height of the visible band. The stage box uses this. */
export const CROP_ASPECT = FIGURE.width / CROP_HEIGHT

/** Source y (user units) -> 0..1 down the visible band. */
export const yFrac = (y: number): number => (y - CROP_TOP) / CROP_HEIGHT

/** 0..1 along the arm span -> 0..1 across the image box. */
export const xFrac = (t: number): number =>
  FIGURE.leftX + t * (FIGURE.rightX - FIGURE.leftX)

/** 0..1 along the arm span -> SVG user units. */
export const xUnits = (t: number): number => xFrac(t) * FIGURE.width

export const ARM_Y = FIGURE.armY * FIGURE.height

/**
 * Where the scrubber knob rides. A little above the measured chest, so the knob
 * and the line up to the arms both sit inside the cropped band.
 */
export const KNOB_Y = 0.552 * FIGURE.height

/**
 * Bands are drawn in lanes above the arm line. The real data both nests them
 * (eon inside era inside period inside epoch) and overlaps them (Paranthropus
 * and Homo habilis lived at the same time), so a single strip would just pile
 * them on top of each other. Each family gets its own lane, and a family whose
 * bands overlap gets one more lane per overlap. The finest family sits nearest
 * the arm, next to the event ticks.
 */
const BAND_BOTTOM = FIGURE.armY * FIGURE.height + 11
const BAND_CEILING = CROP_TOP + 8
const BAND_GAP = 2

/** A single lane keeps the same 22-unit bar the app has always drawn. */
const laneHeight = (lanes: number): number =>
  lanes <= 1
    ? 22
    : Math.min(20, (BAND_BOTTOM - BAND_CEILING - (lanes - 1) * BAND_GAP) / lanes)

/** Top edge of lane `index`, counting 0 from the arm line upwards. */
const laneTop = (index: number, lanes: number): number =>
  BAND_BOTTOM - (index + 1) * laneHeight(lanes) - index * BAND_GAP

/** Coarse to fine. Anything the data adds later lands after these. */
const BAND_FAMILY_ORDER = ['eon', 'era', 'period', 'epoch', 'species', 'culture']

export interface PlacedBand {
  band: Band
  /** Both edges as 0..1 along the arm span, and the middle for the label. */
  from: number
  to: number
  mid: number
  size: number
  color: string
  /** Source y of the lane's top edge, and its height in the same units. */
  top: number
  height: number
  /** How many families this zone has, which is how many lanes are drawn. */
  lanes: number
}

/** Bands placed into their lanes, ready to draw. */
export function layoutBands(bands: readonly Band[], spanYears: number): PlacedBand[] {
  const byFamily = new Map<string, Band[]>()
  for (const band of bands) {
    const kind = band.kind ?? 'band'
    const family = byFamily.get(kind)
    if (family) family.push(band)
    else byFamily.set(kind, [band])
  }

  const seen = [...byFamily.keys()]
  const rank = (kind: string) => {
    const i = BAND_FAMILY_ORDER.indexOf(kind)
    return i === -1 ? BAND_FAMILY_ORDER.length + seen.indexOf(kind) : i
  }
  // Coarse first, so the finest family ends up nearest the arm.
  const families = seen.sort((a, b) => rank(a) - rank(b))

  // One row per family, plus an extra row whenever bands in it overlap:
  // oldest first, each band into the first row it does not clash with.
  const rows: Band[][] = []
  for (const family of families) {
    const packed: Band[][] = []
    const sorted = [...byFamily.get(family)!].sort((a, b) => b.fromYearsAgo - a.fromYearsAgo)
    for (const band of sorted) {
      const row = packed.find((r) => r[r.length - 1]!.toYearsAgo >= band.fromYearsAgo)
      if (row) row.push(band)
      else packed.push([band])
    }
    rows.push(...packed)
  }

  const lanes = rows.length
  const height = laneHeight(lanes)
  const laneOf = new Map<string, number>()
  rows.forEach((row, index) => {
    for (const band of row) laneOf.set(band.id, lanes - 1 - index)
  })

  return bands.map((band, index) => {
    const from = clamp01(1 - band.fromYearsAgo / spanYears)
    const to = clamp01(1 - band.toYearsAgo / spanYears)
    return {
      band,
      from,
      to,
      mid: (from + to) / 2,
      size: to - from,
      color: bandColor(index),
      top: laneTop(laneOf.get(band.id) ?? 0, lanes),
      height,
      lanes,
    }
  })
}

/** Fraction of the arm span covered by one CSS pixel at a given rendered width. */
export const spanPerPixel = (renderedWidth: number): number =>
  renderedWidth > 0 ? 1 / (renderedWidth * (FIGURE.rightX - FIGURE.leftX)) : 0

/**
 * Band colours are set per theme in index.css, so the same index reads on the
 * two dark themes and on paper.
 */
export const BAND_COUNT = 8

export const bandColor = (index: number): string =>
  `var(--band-${(index % BAND_COUNT) + 1})`

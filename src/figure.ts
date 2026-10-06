import { createSignal } from 'solid-js'
import { clamp01 } from './scale'
import type { Band } from './types'

/**
 * Where the drawing's landmarks sit, as fractions of the image box.
 * Measured off public/vitruvian-man.webp (see DEVELOPMENT.md).
 */
export const FIGURE = {
  src: '/vitruvian-man.webp',
  /**
   * The contours, traced off the scan by hand: white ink on a black card, the
   * same box as the scan, so it lands on it to the pixel. Used as a CSS mask
   * in luminance mode, so the card drops out and the lines take whatever
   * colour the theme is wearing. No derived file — the browser does the merge.
   */
  lines: '/vitruvian-man-outline.webp',
  /**
   * The top edge of the arms only, where light from above falls: a part of
   * the trace above, in the same box, drawn again over it. See `src/light.ts`.
   */
  highlight: '/vitruvian-man-highlight.webp',
  width: 1400,
  height: 797,
  /** Left fingertip of the outstretched arms = start of the timeline. */
  leftX: 0.1014,
  /** Right fingertip = now. */
  rightX: 0.8914,
  /** The line running through both hands: the middle fingertips, not the palms. */
  armY: 0.3995,
  /** Chest, as measured on the scan. */
  chestY: 0.6135,
} as const

/**
 * How much of the scan is shown: the head down to about the navel, with the
 * legs cut away. Fractions of the source height, and the arm line sits a
 * little above the middle of it. A taller window can only buy its height out
 * of the width — the stage keeps the aspect — and the width is the ruler, so
 * this stops at the belly rather than showing the whole figure.
 */
export const CROP = { top: 0.158, bottom: 0.632 } as const

/*
 * The run-out into air — under the arms, and everything the workbench adds on
 * top of it — lives in `src/fade.ts`. It is cut from this same box, so it
 * reads the crop from here.
 */

/**
 * How much height the drawing may take on screen. The arms fill the width but
 * never grow past this, so the card strip below keeps a usable share of the
 * viewport. The window is taller than the arms are thick, so the height it is
 * allowed is what sets how long the arms draw.
 */
export const FIT = { maxVh: 61, maxRem: 26 } as const

/**
 * The three numbers above, live, so a prototype tab can drag them while the
 * app runs and the figure re-lays out under the pointer. The Figure tab that
 * did that is gone, so for now nothing writes them and everyone gets the
 * constants above.
 */
export interface Tune {
  /** Fraction of the source height cut off the top. */
  top: number
  /** Fraction of the source height the window ends at. */
  bottom: number
  /** Cap on the stage height, in vh. */
  maxVh: number
}

export const TUNE_DEFAULT: Tune = {
  top: CROP.top,
  bottom: CROP.bottom,
  maxVh: FIT.maxVh,
}

const [tune, setTune] = createSignal<Tune>(TUNE_DEFAULT)
export { tune, setTune }

/** Top of the window, in source y. */
export const cropTop = (): number => FIGURE.height * tune().top
/** Height of the window, in source y. */
export const cropHeight = (): number => FIGURE.height * (tune().bottom - tune().top)
/** Width divided by height of the visible band. The stage box uses this. */
export const cropAspect = (): number => FIGURE.width / cropHeight()

/** Source y (user units) -> 0..1 down the visible band. */
export const yFrac = (y: number): number => (y - cropTop()) / cropHeight()

/** 0..1 along the arm span -> 0..1 across the image box. */
export const xFrac = (t: number): number =>
  FIGURE.leftX + t * (FIGURE.rightX - FIGURE.leftX)

/** 0..1 along the arm span -> SVG user units. */
export const xUnits = (t: number): number => xFrac(t) * FIGURE.width

export const ARM_Y = FIGURE.armY * FIGURE.height

/*
 * The timeline is not drawn through the fingertips but a little under them, and
 * the knob, the dots and the labels are all placed around it. Those sizes and
 * distances live in `src/scrub.ts`, which measures them off `ARM_Y` above.
 */

/**
 * Bands are drawn on their own strip above the arms, not on the drawing. The
 * real data both nests them (eon inside era inside period inside epoch) and
 * overlaps them (Paranthropus and Homo habilis lived at the same time), so a
 * single row would just pile them on top of each other. Each family gets a
 * row, coarse first, so the coarsest sits at the top of the strip and the
 * finest lands hard against the fingertip line.
 *
 * Two rows is the whole budget. Past that the strip turns into a wall of
 * little boxes that says less than nothing, so the finest families are left
 * off rather than squeezed in — the picker in the top bar is where you go for
 * a closer look.
 */
export const MAX_BAND_ROWS = 2

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
}

/** Bands packed into rows, coarsest row first. */
export function bandRows(bands: readonly Band[], spanYears: number): PlacedBand[][] {
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
  const families = seen.sort((a, b) => rank(a) - rank(b))

  const colorOf = new Map<string, string>()
  bands.forEach((band, index) => colorOf.set(band.id, bandColor(index)))

  const place = (band: Band): PlacedBand => {
    const from = clamp01(1 - band.fromYearsAgo / spanYears)
    const to = clamp01(1 - band.toYearsAgo / spanYears)
    return {
      band,
      from,
      to,
      mid: (from + to) / 2,
      size: to - from,
      color: colorOf.get(band.id) ?? bandColor(0),
    }
  }

  // Oldest first, each band into the first row of its family it does not clash
  // with.
  const rows: PlacedBand[][] = []
  families.forEach((family, index) => {
    const left = MAX_BAND_ROWS - rows.length
    if (left <= 0) return

    const packed: Band[][] = []
    const sorted = [...byFamily.get(family)!].sort((a, b) => b.fromYearsAgo - a.fromYearsAgo)
    for (const band of sorted) {
      const row = packed.find((r) => r[r.length - 1]!.toYearsAgo >= band.fromYearsAgo)
      if (row) row.push(band)
      else packed.push([band])
    }

    // One row each while another family is still waiting, so two families never
    // lose out to one that overlaps itself. The last one in gets what is left.
    const budget = index === families.length - 1 ? left : 1
    rows.push(...packed.slice(0, budget).map((row) => row.map(place)))
  })

  return rows
}

/**
 * Band colours are set per theme in index.css, so the same index reads on dark
 * and on paper.
 */
export const BAND_COUNT = 8

export const bandColor = (index: number): string => `var(--band-${(index % BAND_COUNT) + 1})`

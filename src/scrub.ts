import { createSignal } from 'solid-js'
import { ARM_Y } from './figure'

/**
 * The timeline the knob rides, and everything placed along it: the event
 * dots, the bars lying along the line, the columns that mark a stretch of arm
 * and the names above it. The knob itself and its readout card are next door,
 * in `fob.ts`.
 *
 * These are sizes and distances, not measurements off the scan, so there is no
 * right answer to look up — they are picked by eye. They ship as the defaults
 * below and the prototype panel's Scrub tab is the only thing that moves them,
 * so a visitor gets exactly these numbers.
 *
 * Everything here sits on the drawing, so it is source y, the same units as
 * `figure.ts`.
 */

export interface Scrub {
  /**
   * How far under the fingertips the timeline is drawn — about one and a half
   * times its own width, so the hands stay readable above it.
   */
  lineDrop: number
  /** How thick the timeline is. */
  lineWidth: number

  /** Event dots: normal, the live one, and the invisible disc that catches the pointer. */
  dotR: number
  dotLiveR: number
  dotHit: number
  /** The paper-coloured edge that keeps two neighbouring dots apart. */
  dotStroke: number

  /** The bar for a shaky date. */
  slackWidth: number

  /** The column that marks a stretch of arm: its cap in px, and the same band in source units. */
  columnPx: number
  columnUnits: number

  /** Names above the line, measured from the fingertips. */
  landmarkLift: number
  hoverLift: number
  /**
   * How far a landmark name may be pushed off its dot by a neighbour before it
   * is left off, as a share of half its width: at 1 the dot sits at the name's
   * edge. Past that the name reads as some other dot's. See `landmarks.ts`.
   */
  landmarkSlide: number
  /** How far the start and end captions keep off the fingertips, in px. */
  captionGap: number
}

export const SCRUB_DEFAULT: Scrub = {
  lineDrop: 10,
  lineWidth: 7,

  dotR: 5.5,
  dotLiveR: 7,
  dotHit: 25,
  dotStroke: 1.5,

  slackWidth: 13,

  columnPx: 20,
  columnUnits: 135,

  landmarkLift: 20,
  hoverLift: 20,
  landmarkSlide: 1,
  captionGap: 11,
}

const [scrub, setScrub] = createSignal<Scrub>(SCRUB_DEFAULT)
export { scrub, setScrub }

/**
 * The line the knob rides. `ARM_Y` stays the drawing's own fingertip line;
 * everything that sits *on* the timeline uses this.
 */
export const lineY = (): number => ARM_Y + scrub().lineDrop

/**
 * The column is centred on the line: run it the whole height and it stops
 * being a mark on the arms and becomes a block over the drawing.
 */
export const columnFrom = (): number => lineY() - scrub().columnUnits / 2
export const columnTo = (): number => lineY() + scrub().columnUnits / 2

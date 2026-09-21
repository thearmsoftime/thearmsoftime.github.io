import { createSignal } from 'solid-js'
import { ARM_Y } from './figure'

/**
 * The timeline the knob rides, the knob itself, and everything placed around
 * them: the event dots, the bars lying along the line, the columns that mark a
 * stretch of arm, the names above it and the readout rail under it.
 *
 * These are sizes and distances, not measurements off the scan, so there is no
 * right answer to look up — they are picked by eye. They ship as the defaults
 * below and the prototype panel's Scrub tab is the only thing that moves them,
 * so a visitor gets exactly these numbers.
 *
 * Distances that sit on the drawing are source y, the same units as
 * `figure.ts`. The knob and the rail are HTML rather than SVG, so theirs are
 * px and rem — and both come in two sizes, because a phone and a projector
 * want different ones.
 */

export interface Scrub {
  /**
   * How far under the fingertips the timeline is drawn — about one and a half
   * times its own width, so the hands stay readable above it.
   */
  lineDrop: number
  /** How thick the timeline is. */
  lineWidth: number

  /** The ring, across, on a phone and from 40rem up. */
  fobSize: number
  fobSizeWide: number
  /** How heavy its edge is. */
  fobBorder: number
  /** The clear paper around it, so it never sits straight on a dot. */
  fobHalo: number
  /** How much it grows while it is being dragged. */
  fobPress: number
  /** How far it rides above the line. 0 sits it on the line. */
  fobLift: number

  /** Event dots: normal, the live one, and the invisible disc that catches the pointer. */
  dotR: number
  dotLiveR: number
  dotHit: number
  /** The paper-coloured edge that keeps two neighbouring dots apart. */
  dotStroke: number

  /** The bar across a stretch, and the one for a shaky date. */
  stretchWidth: number
  slackWidth: number

  /** The column that marks a stretch of arm: its cap in px, and the same band in source units. */
  columnPx: number
  columnUnits: number

  /** Names above the line, measured from the fingertips. */
  landmarkLift: number
  hoverLift: number
  /** How far the start and end captions keep off the fingertips, in px. */
  captionGap: number

  /** The readout rail, pulled up into the bottom of the band. In rem. */
  railGap: number
  railGapWide: number
  /** Padding inside the readout pill, and how far it keeps from each edge. */
  railPadX: number
  railPadY: number
  railEdge: number
}

export const SCRUB_DEFAULT: Scrub = {
  lineDrop: 10,
  lineWidth: 7,

  fobSize: 21,
  fobSizeWide: 28,
  fobBorder: 1,
  fobHalo: 2.5,
  fobPress: 1.22,
  fobLift: 0,

  dotR: 5.5,
  dotLiveR: 7,
  dotHit: 25,
  dotStroke: 1.5,

  stretchWidth: 12,
  slackWidth: 13,

  columnPx: 20,
  columnUnits: 135,

  landmarkLift: 20,
  hoverLift: 20,
  captionGap: 11,

  railGap: 2.05,
  railGapWide: 4.5,
  railPadX: 1.85,
  railPadY: 0.4,
  railEdge: 0,
}

const [scrub, setScrub] = createSignal<Scrub>(SCRUB_DEFAULT)
export { scrub, setScrub }

/**
 * The line the knob rides. `ARM_Y` stays the drawing's own fingertip line;
 * everything that sits *on* the timeline uses this.
 */
export const lineY = (): number => ARM_Y + scrub().lineDrop

/** Where the ring's middle sits. Usually straight on the line. */
export const fobY = (): number => lineY() - scrub().fobLift

/**
 * The column is centred on the line: run it the whole height and it stops
 * being a mark on the arms and becomes a block over the drawing.
 */
export const columnFrom = (): number => lineY() - scrub().columnUnits / 2
export const columnTo = (): number => lineY() + scrub().columnUnits / 2

import { createSignal } from 'solid-js'
import { lineY } from './scrub'

/**
 * The knob the reader drags, and the card under it that says where they are:
 * how many years ago and the line under that; over it, the body part it is on
 * and — near now — the same reading as a length.
 *
 * Picked by eye, like everything in `scrub.ts`, and the prototype panel's Knob
 * tab is the only thing that moves it. The knob sits on the drawing, so its
 * lift is source y; the ring and the card are HTML, so the rest is px and rem.
 * The ring and the pull-up come in two sizes, because a phone and a projector
 * want different ones.
 *
 * The switches below — which rows show, how they line up — are the workbench
 * part: they ship at what
 * the card has always done, and are here to find out if another look is better.
 */

/** Which way the rows sit across the card. */
export type CardAlign = 'start' | 'center' | 'end'
/** The rows under each other, or on one line. */
export type CardLayout = 'stack' | 'line'

export interface Fob {
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

  /** The card's rail, pulled up into the bottom of the band. In rem. */
  railGap: number
  railGapWide: number
  /** Padding inside the card, and how far it keeps from each edge. */
  railPadX: number
  railPadY: number
  railEdge: number
  /** Corner radius in rem. At `CARD_ROUND_FULL` it is a pill. */
  cardRound: number
  /** Air between the rows, in rem. */
  cardRowGap: number
  /** How solid the card's paper is, 0 to 1. */
  cardFill: number
  /** Its edge in px, and how strong that edge is, 0 to 1. */
  cardBorder: number
  cardBorderInk: number
  cardShadow: boolean

  /** Which rows are drawn at all. */
  showYears: boolean
  showSub: boolean
  /** The length near now, in the line over the card. */
  showLength: boolean
  cardAlign: CardAlign
  cardLayout: CardLayout
}

/** The top of the Round slider, which reads as a full pill. */
export const CARD_ROUND_FULL = 3

export const FOB_DEFAULT: Fob = {
  fobSize: 21,
  fobSizeWide: 28,
  fobBorder: 1,
  fobHalo: 2.5,
  fobPress: 1.22,
  fobLift: 0,

  railGap: 2.05,
  railGapWide: 4.5,
  railPadX: 1.85,
  railPadY: 0.4,
  railEdge: 0,
  cardRound: 3,
  cardRowGap: 0,
  cardFill: 0.85,
  cardBorder: 1,
  cardBorderInk: 0.35,
  cardShadow: true,

  showYears: true,
  showSub: true,
  showLength: true,
  cardAlign: 'center',
  cardLayout: 'stack',
}

const [fob, setFob] = createSignal<Fob>(FOB_DEFAULT)
export { fob, setFob }

/** Where the ring's middle sits. Usually straight on the line. */
export const fobY = (): number => lineY() - fob().fobLift

/** The corner, with the top of the knob meaning a full pill. */
export const cardRadius = (): string =>
  fob().cardRound >= CARD_ROUND_FULL ? '9999px' : `${fob().cardRound}rem`

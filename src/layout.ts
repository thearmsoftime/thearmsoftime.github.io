import { createSignal } from 'solid-js'

/**
 * Where the arms sit on the page, and the room around the cards under them.
 * The Layout tab in the prototype panel is the only thing that moves these.
 */
export interface Layout {
  /**
   * Where the fingertip line runs, as a share of the height above the card
   * tray: 0 is right under the bar, 1 is on the tray. A share of that height,
   * not a centring of whatever is drawn there, so the line — and the man — sit
   * at the same height on every timeline, whatever the bands and labels add.
   */
  lineShare: number
  /** Room above the cards inside the tray, in rem. */
  trayTopRem: number
  /** Room below the cards inside the tray, in rem. The scrollbar rides here. */
  trayBottomRem: number
  /** Gap between two cards, in rem. */
  cardGapRem: number
  /**
   * Height of every card, in rem. One height for all of them, so the tray is
   * the same height on every timeline and the arms above it never move.
   */
  cardHeightRem: number
}

export const LAYOUT_DEFAULT: Layout = {
  lineShare: 0.46,
  trayTopRem: 1.25,
  trayBottomRem: 1.25,
  cardGapRem: 1,
  cardHeightRem: 13,
}

/** On a short screen the cards give way before the arms do. */
export const CARD_MAX_VH = 38

const [layout, setLayout] = createSignal<Layout>(LAYOUT_DEFAULT)
export { layout, setLayout }

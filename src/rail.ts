import { createSignal } from 'solid-js'

/**
 * The two scale numbers out at the screen's edges: how far in from the edge
 * they sit, how big the number is, and whether both wear the accent. Both
 * cells use the same values, so the whole span and the ruler read as a pair.
 * The Rail tab in the prototype panel is the only thing that moves these.
 */

export type RailTone = 'accent' | 'plain'

export interface Rail {
  /** Room between the screen edge and the number, in rem. */
  edgeRem: number
  /** The number's size, in rem. 0.875 is Tailwind's `text-sm`. */
  valueRem: number
  /** Both numbers in the accent, or both in the body colour. */
  tone: RailTone
}

export const RAIL_DEFAULT: Rail = {
  edgeRem: 4.5,
  valueRem: 1.05,
  tone: 'accent',
}

const [rail, setRail] = createSignal<Rail>(RAIL_DEFAULT)
export { rail, setRail }

import { createSignal } from 'solid-js'

/**
 * Where a fun fact's words sit around the line, in rem so they hold on a
 * phone and on a projector. The names go over the line, the two gap measures
 * under it. The Fact tab in the prototype panel is the only thing that moves
 * these.
 */

export interface FactRows {
  /** From the line up to the bottom of the first row of names. */
  nameRem: number
  /** How much higher a raised name sits than the first row. */
  rowRem: number
  /** From the line down to the top of the measures. */
  measureRem: number
  /** Room left over the top row of names, so they sit inside the bar. */
  headRem: number
}

export const FACT_ROWS_DEFAULT: FactRows = {
  nameRem: 1.45,
  rowRem: 1.25,
  measureRem: 1.05,
  headRem: 0.85,
}

const [factRows, setFactRows] = createSignal<FactRows>(FACT_ROWS_DEFAULT)
export { factRows, setFactRows }

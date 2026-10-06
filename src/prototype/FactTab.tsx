import { readStored, writeStored } from '../prefs'
import { FACT_ROWS_DEFAULT, factRows, setFactRows, type FactRows } from '../factRows'
import { Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * A fun fact's words around the line: how far the names sit over it, and the
 * measures under it. Press Fun fact first, so there is something to move. See
 * `src/factRows.ts`.
 */

const KEY = 'protofact'

const rem = (v: number) => `${Math.round(v * 100) / 100}rem`

const NAME = { min: 0, max: 2.5, step: 0.05 }
const ROW = { min: 0.8, max: 2.5, step: 0.05 }
const MEASURE = { min: 0, max: 2.5, step: 0.05 }
const HEAD = { min: 0, max: 1.5, step: 0.05 }

const within = (v: unknown, r: { min: number; max: number }) =>
  typeof v === 'number' && Number.isFinite(v) && v >= r.min && v <= r.max

/** Anything stored that is out of range is dropped. */
function parse(raw: string): FactRows | undefined {
  try {
    const next = { ...FACT_ROWS_DEFAULT, ...(JSON.parse(raw) as Partial<FactRows>) }
    const ok =
      within(next.nameRem, NAME) &&
      within(next.rowRem, ROW) &&
      within(next.measureRem, MEASURE) &&
      within(next.headRem, HEAD)
    return ok ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: FactRows) => {
  setFactRows(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = <K extends keyof FactRows>(key: K, value: FactRows[K]) =>
  apply({ ...factRows(), [key]: value })

function Body() {
  return (
    <div class="flex flex-col gap-2">
      <Group title="Names, over the line" />
      <Knob
        label="Gap to line"
        {...NAME}
        value={factRows().nameRem}
        show={rem}
        onInput={(v) => set('nameRem', v)}
      />
      <Knob
        label="Raised row"
        hint="when the middle name would touch"
        {...ROW}
        value={factRows().rowRem}
        show={rem}
        onInput={(v) => set('rowRem', v)}
      />
      <Knob
        label="Bar over names"
        {...HEAD}
        value={factRows().headRem}
        show={rem}
        onInput={(v) => set('headRem', v)}
      />

      <Group title="Measures, under the line" />
      <Knob
        label="Gap to line"
        {...MEASURE}
        value={factRows().measureRem}
        show={rem}
        onInput={(v) => set('measureRem', v)}
      />
    </div>
  )
}

const copy = () => {
  const f = factRows()
  return [
    'src/factRows.ts',
    'FACT_ROWS_DEFAULT = {',
    `  nameRem: ${f.nameRem},`,
    `  rowRem: ${f.rowRem},`,
    `  measureRem: ${f.measureRem},`,
    `  headRem: ${f.headRem},`,
    '}',
  ].join('\n')
}

export const factTab: ProtoTab = {
  id: 'fact',
  label: 'Fact',
  Body,
  copy,
  reset: () => apply(FACT_ROWS_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setFactRows(stored)
  },
}

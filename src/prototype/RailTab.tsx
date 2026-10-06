import { readStored, writeStored } from '../prefs'
import { RAIL_DEFAULT, rail, setRail, type Rail, type RailTone } from '../rail'
import { Choice, Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * The scale numbers at the screen's edges: the whole span on the left, the
 * ruler on the right. How far in they sit, and how they look — the same on
 * both sides. See `src/rail.ts`.
 */

const KEY = 'protorail'

const rem = (v: number) => `${Math.round(v * 100) / 100}rem`

const EDGE = { min: 0, max: 8, step: 0.25 }
const VALUE = { min: 0.7, max: 2.4, step: 0.025 }

const TONES = [
  { value: 'accent', label: 'Accent' },
  { value: 'plain', label: 'Plain' },
] as const satisfies readonly { value: RailTone; label: string }[]

const within = (v: unknown, r: { min: number; max: number }) =>
  typeof v === 'number' && Number.isFinite(v) && v >= r.min && v <= r.max

/** Anything stored that is out of range, or not a known word, is dropped. */
function parse(raw: string): Rail | undefined {
  try {
    const next = { ...RAIL_DEFAULT, ...(JSON.parse(raw) as Partial<Rail>) }
    const ok =
      within(next.edgeRem, EDGE) &&
      within(next.valueRem, VALUE) &&
      TONES.some((t) => t.value === next.tone)
    return ok ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Rail) => {
  setRail(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = <K extends keyof Rail>(key: K, value: Rail[K]) => apply({ ...rail(), [key]: value })

function Body() {
  return (
    <div class="flex flex-col gap-2">
      <Group title="Place" />
      <Knob
        label="From the edge"
        hint="both sides, wide screens only"
        {...EDGE}
        value={rail().edgeRem}
        show={rem}
        onInput={(v) => set('edgeRem', v)}
      />

      <Group title="Look" />
      <Knob
        label="Number size"
        {...VALUE}
        value={rail().valueRem}
        show={rem}
        onInput={(v) => set('valueRem', v)}
      />
      <Choice label="Colour" value={rail().tone} options={TONES} onPick={(v) => set('tone', v)} />
    </div>
  )
}

const copy = () => {
  const r = rail()
  return [
    'src/rail.ts',
    'RAIL_DEFAULT = {',
    `  edgeRem: ${r.edgeRem},`,
    `  valueRem: ${r.valueRem},`,
    `  tone: '${r.tone}',`,
    '}',
  ].join('\n')
}

export const railTab: ProtoTab = {
  id: 'rail',
  label: 'Rail',
  Body,
  copy,
  reset: () => apply(RAIL_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setRail(stored)
  },
}

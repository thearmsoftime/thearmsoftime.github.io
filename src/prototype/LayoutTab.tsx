import { readStored, writeStored } from '../prefs'
import { LAYOUT_DEFAULT, layout, setLayout, type Layout } from '../layout'
import { Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * Where the arms sit on the page, and the room around the cards in the tray
 * under them. See `src/layout.ts`.
 */

const KEY = 'protolayout'

const rem = (v: number) => `${Math.round(v * 100) / 100}rem`
const share = (v: number) => `${Math.round(v * 100)}%`

const RANGES: Record<keyof Layout, { min: number; max: number; step: number }> = {
  lineShare: { min: 0, max: 1, step: 0.01 },
  trayTopRem: { min: 0, max: 3, step: 0.125 },
  trayBottomRem: { min: 0, max: 3, step: 0.125 },
  cardGapRem: { min: 0, max: 3, step: 0.125 },
  cardHeightRem: { min: 8, max: 18, step: 0.25 },
}

const within = (v: unknown, r: { min: number; max: number }) =>
  typeof v === 'number' && Number.isFinite(v) && v >= r.min && v <= r.max

/** Anything stored that is out of range is dropped. */
function parse(raw: string): Layout | undefined {
  try {
    const next = { ...LAYOUT_DEFAULT, ...(JSON.parse(raw) as Partial<Layout>) }
    const ok = (Object.keys(RANGES) as (keyof Layout)[]).every((k) => within(next[k], RANGES[k]))
    return ok ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Layout) => {
  setLayout(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = (key: keyof Layout, value: number) => apply({ ...layout(), [key]: value })

function Body() {
  return (
    <div class="flex flex-col gap-2">
      <Group title="Arms" />
      <Knob
        label="Line height"
        hint="share of the space above the cards"
        {...RANGES.lineShare}
        value={layout().lineShare}
        show={share}
        onInput={(v) => set('lineShare', v)}
      />

      <Group title="Cards" />
      <Knob
        label="Room above"
        {...RANGES.trayTopRem}
        value={layout().trayTopRem}
        show={rem}
        onInput={(v) => set('trayTopRem', v)}
      />
      <Knob
        label="Room below"
        {...RANGES.trayBottomRem}
        value={layout().trayBottomRem}
        show={rem}
        onInput={(v) => set('trayBottomRem', v)}
      />
      <Knob
        label="Gap between"
        {...RANGES.cardGapRem}
        value={layout().cardGapRem}
        show={rem}
        onInput={(v) => set('cardGapRem', v)}
      />
      <Knob
        label="Card height"
        hint="short screens cap it lower"
        {...RANGES.cardHeightRem}
        value={layout().cardHeightRem}
        show={rem}
        onInput={(v) => set('cardHeightRem', v)}
      />
    </div>
  )
}

const copy = () => {
  const l = layout()
  return [
    'src/layout.ts',
    'LAYOUT_DEFAULT = {',
    `  lineShare: ${l.lineShare},`,
    `  trayTopRem: ${l.trayTopRem},`,
    `  trayBottomRem: ${l.trayBottomRem},`,
    `  cardGapRem: ${l.cardGapRem},`,
    `  cardHeightRem: ${l.cardHeightRem},`,
    '}',
  ].join('\n')
}

export const layoutTab: ProtoTab = {
  id: 'layout',
  label: 'Layout',
  Body,
  copy,
  reset: () => apply(LAYOUT_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setLayout(stored)
  },
}

import { For } from 'solid-js'
import { readStored, writeStored } from '../prefs'
import {
  CARD_ROUND_FULL,
  FOB_DEFAULT,
  fob,
  setFob,
  type CardAlign,
  type CardLayout,
  type Fob,
} from '../fob'
import { Choice, Flags, Group, Knob, Toggle } from './Knob'
import type { ProtoTab } from './types'

/**
 * The thing the reader drags, and the card under it: where the ring sits and
 * how big it is, how close the card rides to it, and what the card looks like
 * — its padding, corners, paper and edge, which rows it shows and how they
 * line up. The switches ship at what the card has always done, so opening the
 * tab changes nothing on screen. See `src/fob.ts`.
 */

const KEY = 'protoknob'

type NumKey = {
  [K in keyof Fob]: Fob[K] extends number ? K : never
}[keyof Fob]

interface KnobSpec {
  key: NumKey
  label: string
  hint?: string
  min: number
  max: number
  step: number
  show: (value: number) => string
}

const px = (v: number) => `${Math.round(v * 10) / 10}px`
const rem = (v: number) => `${v.toFixed(2)}rem`
const share = (v: number) => `${Math.round(v * 100)}%`

const GROUPS: { title: string; knobs: KnobSpec[] }[] = [
  {
    title: 'Ring',
    knobs: [
      {
        key: 'fobLift',
        label: 'Lift',
        hint: 'off the line, up is more',
        min: -60,
        max: 60,
        step: 1,
        show: px,
      },
      { key: 'fobSize', label: 'Size', hint: 'on a phone', min: 12, max: 80, step: 1, show: px },
      {
        key: 'fobSizeWide',
        label: 'Size wide',
        hint: 'from 40rem up',
        min: 12,
        max: 96,
        step: 1,
        show: px,
      },
      { key: 'fobBorder', label: 'Edge', min: 0, max: 8, step: 0.5, show: px },
      {
        key: 'fobHalo',
        label: 'Halo',
        hint: 'clear paper around it',
        min: 0,
        max: 16,
        step: 0.5,
        show: px,
      },
      {
        key: 'fobPress',
        label: 'Press',
        hint: 'how much it grows when dragged',
        min: 1,
        max: 1.8,
        step: 0.01,
        show: (v) => `${v.toFixed(2)}x`,
      },
    ],
  },
  {
    title: 'Card place',
    knobs: [
      {
        key: 'railGap',
        label: 'Pull up',
        // The whole run from the line down to the crop edge, because that is
        // the gap between the knob and its reading — the figure has faded out
        // long before then, so the card may sit well up inside the band.
        hint: 'up into the band, towards the knob',
        min: 0,
        max: 14,
        step: 0.05,
        show: rem,
      },
      { key: 'railGapWide', label: 'Pull up wide', min: 0, max: 14, step: 0.05, show: rem },
      {
        key: 'railEdge',
        label: 'Off the edge',
        hint: 'how far it keeps from each side',
        min: 0,
        max: 16,
        step: 0.25,
        show: rem,
      },
    ],
  },
  {
    title: 'Card look',
    knobs: [
      { key: 'railPadX', label: 'Padding across', min: 0, max: 2.5, step: 0.05, show: rem },
      { key: 'railPadY', label: 'Padding down', min: 0, max: 2.5, step: 0.05, show: rem },
      {
        key: 'cardRound',
        label: 'Round',
        hint: 'all the way right is a pill',
        min: 0,
        max: CARD_ROUND_FULL,
        step: 0.05,
        show: (v) => (v >= CARD_ROUND_FULL ? 'pill' : rem(v)),
      },
      { key: 'cardRowGap', label: 'Row gap', min: 0, max: 1, step: 0.05, show: rem },
      { key: 'cardFill', label: 'Paper', hint: 'how solid', min: 0, max: 1, step: 0.05, show: share },
      { key: 'cardBorder', label: 'Edge', min: 0, max: 4, step: 0.5, show: px },
      { key: 'cardBorderInk', label: 'Edge ink', min: 0, max: 1, step: 0.05, show: share },
    ],
  },
]

const ALL = GROUPS.flatMap((g) => g.knobs)

const ROWS = [
  { key: 'showYears', label: 'Years' },
  { key: 'showSub', label: 'Line 2' },
  { key: 'showLength', label: 'Length' },
] as const

const BOOLS = ['showYears', 'showSub', 'showLength', 'cardShadow'] as const

const LAYOUTS = [
  { value: 'stack', label: 'Stack' },
  { value: 'line', label: 'One line' },
] as const satisfies readonly { value: CardLayout; label: string }[]

const ALIGNS = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Middle' },
  { value: 'end', label: 'Right' },
] as const satisfies readonly { value: CardAlign; label: string }[]

const oneOf = (options: readonly { value: string }[], v: unknown) =>
  options.some((o) => o.value === v)

/** Anything stored that is out of range, or the wrong kind of value, is dropped. */
function parse(raw: string): Fob | undefined {
  try {
    const value = JSON.parse(raw) as Partial<Fob>
    const next = { ...FOB_DEFAULT, ...value }
    const nums = ALL.every((k) => {
      const v = next[k.key]
      return typeof v === 'number' && Number.isFinite(v) && v >= k.min && v <= k.max
    })
    const bools = BOOLS.every((k) => typeof next[k] === 'boolean')
    const picks =
      oneOf(LAYOUTS, next.cardLayout) &&
      oneOf(ALIGNS, next.cardAlign)
    return nums && bools && picks ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Fob) => {
  setFob(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = <K extends keyof Fob>(key: K, value: Fob[K]) => apply({ ...fob(), [key]: value })

function Body() {
  return (
    <div class="flex flex-col gap-2">
      <For each={GROUPS}>
        {(group) => (
          <>
            <Group title={group.title} />
            <For each={group.knobs}>
              {(knob) => (
                <Knob
                  label={knob.label}
                  hint={knob.hint}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  value={fob()[knob.key]}
                  show={knob.show}
                  onInput={(v) => set(knob.key, v)}
                />
              )}
            </For>
          </>
        )}
      </For>
      <Toggle label="Shadow" on={fob().cardShadow} onFlip={(on) => set('cardShadow', on)} />

      <Group title="Card rows" />
      <Flags
        label="Show"
        options={ROWS}
        on={(key) => fob()[key]}
        onFlip={(key, on) => set(key, on)}
      />
      <Choice
        label="Layout"
        value={fob().cardLayout}
        options={LAYOUTS}
        onPick={(v) => set('cardLayout', v)}
      />
      <Choice
        label="Across"
        value={fob().cardAlign}
        options={ALIGNS}
        onPick={(v) => set('cardAlign', v)}
      />
    </div>
  )
}

/** What lands on the clipboard: the source file, then the lines to change. */
const copy = () => {
  const f = fob()
  const lines = (Object.keys(FOB_DEFAULT) as (keyof Fob)[]).map((k) => {
    const v = f[k]
    const shown = typeof v === 'number' ? Number(v.toFixed(2)) : typeof v === 'string' ? `'${v}'` : v
    return `  ${k}: ${shown},`
  })
  return ['src/fob.ts', 'FOB_DEFAULT = {', ...lines, '}'].join('\n')
}

export const knobTab: ProtoTab = {
  id: 'knob',
  label: 'Knob',
  Body,
  copy,
  reset: () => apply(FOB_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setFob(stored)
  },
}

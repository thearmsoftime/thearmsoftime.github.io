import { For } from 'solid-js'
import { readStored, writeStored } from '../prefs'
import { FIGURE, FIT, TUNE_DEFAULT, setTune, tune, type Tune } from '../figure'
import { Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * The Vitruvian window: where the drawing is cut at the top, where it is cut
 * at the bottom, and how much height it may take on screen. Three numbers that
 * are otherwise constants in `src/figure.ts`, and the only honest way to pick
 * them is to watch the figure move. How the drawing runs out into air is next
 * door, on the Fade tab.
 */

const KEY = 'prototune'

interface KnobSpec {
  key: keyof Tune
  label: string
  /** What the number means in the file, for the row under the slider. */
  hint: string
  min: number
  max: number
  step: number
  /** How the value reads next to its name. */
  show: (value: number) => string
}

const KNOBS: KnobSpec[] = [
  {
    key: 'top',
    label: 'Top',
    hint: 'cut off the top',
    min: 0,
    max: 0.4,
    step: 0.002,
    show: (v) => `${v.toFixed(3)} · ${Math.round(v * FIGURE.height)}px`,
  },
  {
    key: 'bottom',
    label: 'Bottom',
    hint: 'where the window ends',
    min: 0.45,
    max: 1,
    step: 0.002,
    show: (v) => `${v.toFixed(3)} · ${Math.round(v * FIGURE.height)}px`,
  },
  {
    key: 'maxVh',
    label: 'Size',
    hint: 'height it may take',
    min: 20,
    max: 80,
    step: 1,
    show: (v) => `${Math.round(v)}vh`,
  },
]

/** Anything stored that is not three finite numbers is dropped. */
function parse(raw: string): Tune | undefined {
  try {
    const value = JSON.parse(raw) as Partial<Tune>
    const next = { ...TUNE_DEFAULT, ...value }
    const ok = KNOBS.every((k) => {
      const v = next[k.key]
      return typeof v === 'number' && Number.isFinite(v) && v >= k.min && v <= k.max
    })
    // A window with no height in it would render as nothing at all.
    return ok && next.bottom > next.top ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Tune) => {
  setTune(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = (key: keyof Tune, value: number) => apply({ ...tune(), [key]: value })

function Body() {
  return (
    <div class="flex flex-col gap-2.5">
      <For each={KNOBS}>
        {(knob) => (
          <Knob
            label={knob.label}
            hint={knob.hint}
            min={knob.min}
            max={knob.max}
            step={knob.step}
            value={tune()[knob.key]}
            show={knob.show}
            onInput={(v) => set(knob.key, v)}
          />
        )}
      </For>
    </div>
  )
}

/** What lands on the clipboard: the source file, then the lines to change. */
const copy = () => {
  const t = tune()
  return [
    'src/figure.ts',
    `CROP = { top: ${t.top.toFixed(3)}, bottom: ${t.bottom.toFixed(3)} }`,
    `FIT = { maxVh: ${Math.round(t.maxVh)}, maxRem: ${FIT.maxRem} }`,
  ].join('\n')
}

export const figureTab: ProtoTab = {
  id: 'figure',
  label: 'Figure',
  Body,
  copy,
  reset: () => apply(TUNE_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setTune(stored)
  },
}

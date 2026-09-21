import { For, Show } from 'solid-js'
import { readStored, writeStored } from '../prefs'
import { FIGURE } from '../figure'
import { FADE_DEFAULT, fade, setFade, type Fade, type SpotMode } from '../fade'
import { Choice, Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * How the drawing runs out into air. What ships is the one gradient under the
 * arms; the rest is here to find out whether anything else earns its place —
 * a run-out over the head, one at each fingertip, a circle that hides or keeps
 * what is inside it, and a dimmer per layer.
 *
 * Everything sits at "does nothing" until it is dragged, so opening the tab
 * changes nothing on screen. See `src/fade.ts` for what each number means.
 */

const KEY = 'protofade'

/** Every knob here is a number except the spot's mode. */
type NumKey = Exclude<keyof Fade, 'spot'>

interface KnobSpec {
  key: NumKey
  label: string
  hint?: string
  min: number
  max: number
  step: number
  show: (value: number) => string
}

const px = (v: number) => `${Math.round(v)}px`
const share = (v: number) => `${Math.round(v * 100)}%`

const GROUPS: { title: string; knobs: KnobSpec[] }[] = [
  {
    title: 'Head',
    knobs: [
      {
        key: 'topLength',
        label: 'Run-out',
        hint: 'how far the head dissolves',
        min: 0,
        max: 300,
        step: 2,
        show: px,
      },
      {
        key: 'topOffset',
        label: 'Start',
        hint: 'off the top edge, down is more',
        min: -120,
        max: 220,
        step: 2,
        show: px,
      },
    ],
  },
  {
    title: 'Torso',
    knobs: [
      {
        key: 'bottomLength',
        label: 'Run-out',
        hint: 'the one that ships',
        min: 0,
        max: 320,
        step: 2,
        show: px,
      },
      {
        key: 'bottomOffset',
        label: 'Start',
        hint: 'off the bottom edge',
        min: -220,
        max: 120,
        step: 2,
        show: px,
      },
    ],
  },
  {
    title: 'Fingertips',
    knobs: [
      {
        key: 'sideLength',
        label: 'Run-out',
        hint: 'both ends of the arms',
        min: 0,
        max: 0.3,
        step: 0.005,
        show: (v) => `${share(v)} · ${Math.round(v * FIGURE.width)}px`,
      },
    ],
  },
  {
    title: 'Shape',
    knobs: [
      {
        key: 'curve',
        label: 'Curve',
        hint: 'ink left halfway. 0.50 is straight',
        min: 0.05,
        max: 0.95,
        step: 0.01,
        show: (v) => v.toFixed(2),
      },
    ],
  },
]

/** The circle, which only draws once it has a mode. */
const SPOT_KNOBS: KnobSpec[] = [
  { key: 'spotX', label: 'Across', min: 0, max: 1, step: 0.005, show: share },
  { key: 'spotY', label: 'Down', min: 0, max: 1, step: 0.005, show: share },
  {
    key: 'spotR',
    label: 'Size',
    min: 0,
    max: 0.6,
    step: 0.005,
    show: (v) => `${share(v)} · ${Math.round(v * FIGURE.width)}px`,
  },
  { key: 'spotFeather', label: 'Feather', min: 0, max: 1, step: 0.01, show: share },
]

const INK_KNOBS: KnobSpec[] = [
  { key: 'ink', label: 'Scan', hint: 'on top of the theme', min: 0, max: 1, step: 0.01, show: share },
  { key: 'lineInk', label: 'Lines', hint: 'the traced contours', min: 0, max: 1, step: 0.01, show: share },
]

const SPOT_MODES: readonly { value: SpotMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'hide', label: 'Hide' },
  { value: 'keep', label: 'Keep' },
]

const ALL = [...GROUPS.flatMap((g) => g.knobs), ...SPOT_KNOBS, ...INK_KNOBS]

/** Anything stored that is out of range, or not a number at all, is dropped. */
function parse(raw: string): Fade | undefined {
  try {
    const value = JSON.parse(raw) as Partial<Fade>
    const next = { ...FADE_DEFAULT, ...value }
    const ok =
      SPOT_MODES.some((m) => m.value === next.spot) &&
      ALL.every((k) => {
        const v = next[k.key]
        return typeof v === 'number' && Number.isFinite(v) && v >= k.min && v <= k.max
      })
    return ok ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Fade) => {
  setFade(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = (key: NumKey, value: number) => apply({ ...fade(), [key]: value })

const Row = (props: { knob: KnobSpec }) => (
  <Knob
    label={props.knob.label}
    hint={props.knob.hint}
    min={props.knob.min}
    max={props.knob.max}
    step={props.knob.step}
    value={fade()[props.knob.key]}
    show={props.knob.show}
    onInput={(v) => set(props.knob.key, v)}
  />
)

function Body() {
  return (
    <div class="flex flex-col gap-2">
      <For each={GROUPS}>
        {(group) => (
          <>
            <Group title={group.title} />
            <For each={group.knobs}>{(knob) => <Row knob={knob} />}</For>
          </>
        )}
      </For>

      <Group title="Circle" />
      <Choice
        label="Mode"
        value={fade().spot}
        options={SPOT_MODES}
        onPick={(spot) => apply({ ...fade(), spot })}
      />
      {/* Its four numbers say nothing while it is off, so they stay away. */}
      <Show when={fade().spot !== 'off'}>
        <For each={SPOT_KNOBS}>{(knob) => <Row knob={knob} />}</For>
      </Show>

      <Group title="Ink" />
      <For each={INK_KNOBS}>{(knob) => <Row knob={knob} />}</For>
    </div>
  )
}

/** What lands on the clipboard: the source file, then the lines to change. */
const copy = () => {
  const f = fade()
  const round = (v: number, digits: number) => Number(v.toFixed(digits))
  const body = [
    `topLength: ${Math.round(f.topLength)}`,
    `topOffset: ${Math.round(f.topOffset)}`,
    `bottomLength: ${Math.round(f.bottomLength)}`,
    `bottomOffset: ${Math.round(f.bottomOffset)}`,
    `curve: ${round(f.curve, 2)}`,
    `sideLength: ${round(f.sideLength, 3)}`,
    `spot: '${f.spot}'`,
    `spotX: ${round(f.spotX, 3)}`,
    `spotY: ${round(f.spotY, 3)}`,
    `spotR: ${round(f.spotR, 3)}`,
    `spotFeather: ${round(f.spotFeather, 2)}`,
    `ink: ${round(f.ink, 2)}`,
    `lineInk: ${round(f.lineInk, 2)}`,
  ]
  return ['src/fade.ts', 'FADE_DEFAULT = {', ...body.map((line) => `  ${line},`), '}'].join('\n')
}

export const fadeTab: ProtoTab = {
  id: 'fade',
  label: 'Fade',
  Body,
  copy,
  reset: () => apply(FADE_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setFade(stored)
  },
}

import { For, Show } from 'solid-js'
import {
  LIGHT_DEFAULT,
  light,
  setLight,
  sideColour,
  type Light,
  type LightColour,
  type Side,
} from '../light'
import { readStored, writeStored } from '../prefs'
import { Choice, Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * Light on Leonardo's arms, as three layers: the scan at the back, the whole
 * outline over it, and the highlight on top — the top edge of the arms, where
 * light from above falls. Each gets its own colour and strength, and all
 * three slide up or down together under the line. See `src/light.ts`.
 */

// A new key when the shape changed: the old one held a split line and a scan
// at near full strength, and would have won over the new defaults.
const KEY = 'protolight-layers'

type Layer = 'scan' | 'outline' | 'highlight'
type NumKey = {
  [K in keyof Light]: Light[K] extends number ? K : never
}[keyof Light]
type SideKey = Exclude<keyof Side, 'colour'>

interface Spec<K> {
  key: K
  label: string
  hint?: string
  min: number
  max: number
  step: number
  show: (value: number) => string
}

const share = (v: number) => `${Math.round(v * 100)}%`
const deg = (v: number) => `${Math.round(v)}°`

const SCAN: Spec<NumKey>[] = [
  {
    key: 'scanInk',
    label: 'Strength',
    hint: 'on top of the theme',
    min: 0,
    max: 3,
    step: 0.05,
    show: share,
  },
  {
    key: 'scanTint',
    label: 'Warm',
    hint: 'sepia, 0 is off',
    min: 0,
    max: 1,
    step: 0.01,
    show: share,
  },
  { key: 'scanHue', label: 'Hue turn', min: -180, max: 180, step: 1, show: deg },
  { key: 'scanSaturate', label: 'Colour', min: 0, max: 5, step: 0.05, show: share },
]

const SHIFT: Spec<NumKey>[] = [
  {
    key: 'shift',
    label: 'Up / down',
    hint: 'the drawing under the line',
    min: -60,
    max: 60,
    step: 0.5,
    show: (v) => `${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}`,
  },
]

const SIDE: Spec<SideKey>[] = [
  { key: 'hue', label: 'Hue', min: 0, max: 360, step: 1, show: deg },
  {
    key: 'chroma',
    label: 'Chroma',
    hint: 'how strong the colour is',
    min: 0,
    max: 0.37,
    step: 0.005,
    show: (v) => v.toFixed(3),
  },
  {
    key: 'lightness',
    label: 'Lightness',
    min: 0,
    max: 100,
    step: 1,
    show: (v) => `${Math.round(v)}%`,
  },
]

const OPACITY: Spec<SideKey> = {
  key: 'opacity',
  label: 'Opacity',
  min: 0,
  max: 1,
  step: 0.01,
  show: share,
}

const COLOURS = [
  { value: 'ink', label: 'Ink' },
  { value: 'custom', label: 'Custom' },
] as const satisfies readonly { value: LightColour; label: string }[]

/**
 * Starting points, not answers. Warm light because it is the idea in its
 * plainest form; red chalk because Leonardo drew in it; iron gall because the
 * Vitruvian Man itself is pen and brown ink.
 */
const PRESETS: { label: string; set: Partial<Light> }[] = [
  { label: 'Shipped', set: LIGHT_DEFAULT },
  {
    label: 'Lit',
    set: {
      highlight: { colour: 'ink', lightness: 70, chroma: 0.1, hue: 70, opacity: 1 },
      outline: { colour: 'ink', lightness: 70, chroma: 0.1, hue: 70, opacity: 0.35 },
    },
  },
  {
    label: 'Warm light',
    set: {
      highlight: { colour: 'custom', lightness: 86, chroma: 0.11, hue: 80, opacity: 1 },
      outline: { colour: 'custom', lightness: 45, chroma: 0.05, hue: 270, opacity: 0.5 },
      scanTint: 0.4,
    },
  },
  {
    label: 'Red chalk',
    set: {
      highlight: { colour: 'custom', lightness: 62, chroma: 0.14, hue: 35, opacity: 1 },
      outline: { colour: 'custom', lightness: 42, chroma: 0.09, hue: 30, opacity: 0.55 },
      scanTint: 0.8,
      scanHue: -15,
    },
  },
  {
    label: 'Iron gall',
    set: {
      highlight: { colour: 'custom', lightness: 58, chroma: 0.07, hue: 65, opacity: 1 },
      outline: { colour: 'custom', lightness: 38, chroma: 0.04, hue: 60, opacity: 0.6 },
      scanTint: 1,
    },
  },
]

const inRange = (k: Spec<unknown>, v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= k.min && v <= k.max

const validSide = (s: unknown): s is Side =>
  typeof s === 'object' &&
  s !== null &&
  COLOURS.some((c) => c.value === (s as Side).colour) &&
  [...SIDE, OPACITY].every((k) => inRange(k, (s as Side)[k.key]))

/** Anything stored that is out of range, or not a known word, is dropped. */
function parse(raw: string): Light | undefined {
  try {
    const next = { ...LIGHT_DEFAULT, ...(JSON.parse(raw) as Partial<Light>) }
    const ok =
      [...SCAN, ...SHIFT].every((k) => inRange(k, next[k.key])) &&
      validSide(next.highlight) &&
      validSide(next.outline) &&
      validSide(next.scan)
    return ok ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Light) => {
  setLight(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = (key: NumKey, value: number) => apply({ ...light(), [key]: value })
const setSide = <K extends keyof Side>(layer: Layer, key: K, value: Side[K]) =>
  apply({ ...light(), [layer]: { ...light()[layer], [key]: value } })

function Knobs(props: { specs: Spec<NumKey>[] }) {
  return (
    <For each={props.specs}>
      {(k) => (
        <Knob
          label={k.label}
          hint={k.hint}
          min={k.min}
          max={k.max}
          step={k.step}
          value={light()[k.key]}
          show={k.show}
          onInput={(v) => set(k.key, v)}
        />
      )}
    </For>
  )
}

/** Colour and strength for one layer of the drawing, with a swatch of it. */
function SideKnobs(props: { layer: Layer; noOpacity?: boolean }) {
  const side = () => light()[props.layer]
  const knob = (k: Spec<SideKey>) => (
    <Knob
      label={k.label}
      hint={k.hint}
      min={k.min}
      max={k.max}
      step={k.step}
      value={side()[k.key]}
      show={k.show}
      onInput={(v) => setSide(props.layer, k.key, v)}
    />
  )
  return (
    <>
      <div class="flex items-center gap-2">
        <span
          class="border-base-300 size-3 shrink-0 rounded-full border"
          style={{ 'background-color': sideColour(side()), opacity: side().opacity }}
        />
        <div class="flex-1">
          <Choice
            label="Colour"
            value={side().colour}
            options={COLOURS}
            onPick={(v) => setSide(props.layer, 'colour', v)}
          />
        </div>
      </div>
      <Show when={side().colour === 'custom'}>
        <For each={SIDE}>{knob}</For>
      </Show>
      <Show when={!props.noOpacity}>{knob(OPACITY)}</Show>
    </>
  )
}

function Body() {
  return (
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap gap-1">
        <For each={PRESETS}>
          {(p) => (
            <button
              type="button"
              class="btn btn-xs h-5 min-h-0 px-1.5 text-[0.58rem] font-medium"
              style={{ 'border-color': 'var(--dev)' }}
              onClick={() => apply({ ...light(), ...p.set })}
            >
              {p.label}
            </button>
          )}
        </For>
      </div>

      <Group title="Highlight, top edge" />
      <SideKnobs layer="highlight" />

      <Group title="Outline" />
      <SideKnobs layer="outline" />

      <Group title="Scan behind" />
      <SideKnobs layer="scan" noOpacity />
      {/* The tint only moves the photo; a custom colour replaces it. */}
      <Knobs specs={light().scan.colour === 'ink' ? SCAN : SCAN.slice(0, 1)} />

      <Group title="Position" />
      <Knobs specs={SHIFT} />
    </div>
  )
}

/** What lands on the clipboard: the source file, then the whole default. */
const copy = () => {
  const l = light()
  const n = (v: number) => Number(v.toFixed(3))
  const side = (s: Side) =>
    `{ colour: '${s.colour}', lightness: ${n(s.lightness)}, chroma: ${n(s.chroma)}, hue: ${n(s.hue)}, opacity: ${n(s.opacity)} }`
  return [
    'src/light.ts',
    'LIGHT_DEFAULT = {',
    `  scan: ${side(l.scan)},`,
    ...SCAN.map((k) => `  ${k.key}: ${n(l[k.key])},`),
    `  highlight: ${side(l.highlight)},`,
    `  outline: ${side(l.outline)},`,
    ...SHIFT.map((k) => `  ${k.key}: ${n(l[k.key])},`),
    '}',
  ].join('\n')
}

export const lightTab: ProtoTab = {
  id: 'light',
  label: 'Light',
  Body,
  copy,
  reset: () => apply(LIGHT_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setLight(stored)
  },
}

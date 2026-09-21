import { For } from 'solid-js'
import { readStored, writeStored } from '../prefs'
import { SCRUB_DEFAULT, scrub, setScrub, type Scrub } from '../scrub'
import { Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * Everything around the knob: how far the timeline is drawn under the
 * fingertips, how thick it is, how big the ring is and how much air it keeps,
 * how big the event dots are, and how the names and the readout sit off the
 * line. None of it is measured off anything — it is all picked by eye, which
 * is exactly what this tab is for. See `src/scrub.ts`.
 */

const KEY = 'protoscrub'

interface KnobSpec {
  key: keyof Scrub
  label: string
  hint?: string
  min: number
  max: number
  step: number
  show: (value: number) => string
}

const px = (v: number) => `${Math.round(v * 10) / 10}px`
const rem = (v: number) => `${v.toFixed(2)}rem`

const GROUPS: { title: string; knobs: KnobSpec[] }[] = [
  {
    title: 'Line',
    knobs: [
      {
        key: 'lineDrop',
        label: 'Drop',
        hint: 'under the fingertips',
        min: 0,
        max: 60,
        step: 1,
        show: px,
      },
      { key: 'lineWidth', label: 'Thickness', min: 1, max: 16, step: 0.5, show: px },
    ],
  },
  {
    title: 'Ring',
    knobs: [
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
        key: 'fobLift',
        label: 'Lift',
        hint: 'off the line, up is more',
        min: -60,
        max: 60,
        step: 1,
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
    title: 'Dots',
    knobs: [
      { key: 'dotR', label: 'Size', min: 1, max: 24, step: 0.5, show: px },
      { key: 'dotLiveR', label: 'Size live', min: 1, max: 32, step: 0.5, show: px },
      {
        key: 'dotHit',
        label: 'Reach',
        hint: 'the disc that catches the pointer',
        min: 4,
        max: 48,
        step: 1,
        show: px,
      },
      { key: 'dotStroke', label: 'Edge', min: 0, max: 8, step: 0.5, show: px },
    ],
  },
  {
    title: 'Bars',
    knobs: [
      { key: 'stretchWidth', label: 'How long it ran', min: 1, max: 40, step: 1, show: px },
      { key: 'slackWidth', label: 'How unsure', min: 1, max: 24, step: 1, show: px },
      {
        key: 'columnUnits',
        label: 'Column',
        hint: 'the stretch of arm, on the drawing',
        min: 20,
        max: 320,
        step: 5,
        show: px,
      },
      {
        key: 'columnPx',
        label: 'Column cap',
        hint: 'the same band, on screen',
        min: 20,
        max: 300,
        step: 5,
        show: px,
      },
    ],
  },
  {
    title: 'Names',
    knobs: [
      {
        key: 'landmarkLift',
        label: 'Landmark',
        hint: 'above the fingertips',
        min: 0,
        max: 90,
        step: 1,
        show: px,
      },
      { key: 'hoverLift', label: 'Hover', min: 0, max: 90, step: 1, show: px },
      {
        key: 'captionGap',
        label: 'Ends',
        hint: 'clear of the fingertips',
        min: 0,
        max: 40,
        step: 1,
        show: px,
      },
    ],
  },
  {
    title: 'Readout',
    knobs: [
      {
        key: 'railGap',
        label: 'Pull up',
        // The whole run from the line down to the crop edge, because that is
        // the gap between the knob and its reading — the figure has faded out
        // long before then, so the pill may sit well up inside the band.
        hint: 'up into the band, towards the knob',
        min: 0,
        max: 14,
        step: 0.05,
        show: rem,
      },
      { key: 'railGapWide', label: 'Pull up wide', min: 0, max: 14, step: 0.05, show: rem },
      { key: 'railPadX', label: 'Padding across', min: 0, max: 2.5, step: 0.05, show: rem },
      { key: 'railPadY', label: 'Padding down', min: 0, max: 2.5, step: 0.05, show: rem },
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
]

const ALL = GROUPS.flatMap((g) => g.knobs)

/** Anything stored that is out of range, or not a number at all, is dropped. */
function parse(raw: string): Scrub | undefined {
  try {
    const value = JSON.parse(raw) as Partial<Scrub>
    const next = { ...SCRUB_DEFAULT, ...value }
    const ok = ALL.every((k) => {
      const v = next[k.key]
      return typeof v === 'number' && Number.isFinite(v) && v >= k.min && v <= k.max
    })
    return ok ? next : undefined
  } catch {
    return undefined
  }
}

const apply = (next: Scrub) => {
  setScrub(next)
  writeStored(KEY, JSON.stringify(next))
}

const set = (key: keyof Scrub, value: number) => apply({ ...scrub(), [key]: value })

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
                  value={scrub()[knob.key]}
                  show={knob.show}
                  onInput={(v) => set(knob.key, v)}
                />
              )}
            </For>
          </>
        )}
      </For>
    </div>
  )
}

/** What lands on the clipboard: the source file, then the lines to change. */
const copy = () => {
  const s = scrub()
  const lines = ALL.map((k) => `  ${k.key}: ${Number(s[k.key].toFixed(2))},`)
  return ['src/scrub.ts', 'SCRUB_DEFAULT = {', ...lines, '}'].join('\n')
}

export const scrubTab: ProtoTab = {
  id: 'scrub',
  label: 'Scrub',
  Body,
  copy,
  reset: () => apply(SCRUB_DEFAULT),
  restore: () => {
    const raw = readStored(KEY)
    const stored = raw === undefined ? undefined : parse(raw)
    if (stored) setScrub(stored)
  },
}

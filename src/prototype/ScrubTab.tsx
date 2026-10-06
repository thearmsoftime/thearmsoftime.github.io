import { For } from 'solid-js'
import { readStored, writeStored } from '../prefs'
import { SCRUB_DEFAULT, scrub, setScrub, type Scrub } from '../scrub'
import { Group, Knob } from './Knob'
import type { ProtoTab } from './types'

/**
 * Everything along the line: how far the timeline is drawn under the
 * fingertips, how thick it is, how big the event dots are, and how the names
 * sit off the line. None of it is measured off anything — it is all picked by
 * eye, which is exactly what this tab is for. See `src/scrub.ts`. The knob and
 * its card are on the Knob tab.
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
        key: 'landmarkSlide',
        label: 'Slide',
        hint: 'off its dot before it goes; 100% = dot at its edge',
        min: 0,
        max: 3,
        step: 0.05,
        show: (v) => `${Math.round(v * 100)}%`,
      },
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

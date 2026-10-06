import { For, Show, createSignal } from 'solid-js'
import { BODY_MARKS, CHEST_MIDDLE, type BodyMark } from '../body'
import { xFrac } from '../figure'
import { formatYearsAgo } from '../format'
import { clamp01 } from '../scale'

/**
 * The body landmarks as purple guides over the arms, on both arms, with the
 * spread between grown-ups as a faint band either side. Dev-only, and a lazy
 * chunk: `ArmStage` only fetches it under `?dev=1` with the switch on.
 *
 * The guides take hover and nothing else. A press falls through to the stage,
 * so scrubbing still works on top of them, and they sit under the event dots
 * in the DOM so a dot still wins its own hover.
 */

interface Placed {
  key: string
  mark: BodyMark
  side: 'left' | 'right' | 'middle'
  /** 0..1 along the arm span. */
  t: number
}

const PLACED: Placed[] = [
  ...BODY_MARKS.map((mark) => ({ key: `l-${mark.id}`, mark, side: 'left' as const, t: mark.fromTip })),
  { key: CHEST_MIDDLE.id, mark: CHEST_MIDDLE, side: 'middle', t: CHEST_MIDDLE.fromTip },
  ...BODY_MARKS.map((mark) => ({ key: `r-${mark.id}`, mark, side: 'right' as const, t: 1 - mark.fromTip })),
]

const pct = (f: number) => `${(f * 100).toFixed(1)} %`
const at = (t: number) => `${xFrac(clamp01(t)) * 100}%`

export default function BodyMarks(props: { spanYears: number }) {
  const [hovered, setHovered] = createSignal<Placed | null>(null)
  const ago = (t: number) => formatYearsAgo((1 - clamp01(t)) * props.spanYears)

  return (
    <div class="pointer-events-none absolute inset-0">
      <For each={PLACED}>
        {(p) => (
          <>
            <Show when={p.mark.plusMinus > 0}>
              <div
                class="absolute inset-y-0"
                style={{
                  left: at(p.t - p.mark.plusMinus),
                  width: `calc(${at(p.t + p.mark.plusMinus)} - ${at(p.t - p.mark.plusMinus)})`,
                  'background-color': 'color-mix(in oklab, var(--dev) 7%, transparent)',
                }}
              />
            </Show>
            <div
              class="pointer-events-auto absolute inset-y-0 w-2.5 -translate-x-1/2"
              style={{ left: at(p.t) }}
              onPointerEnter={() => setHovered(p)}
              onPointerLeave={() => setHovered(null)}
            >
              <div
                class="absolute inset-y-0 left-1/2 w-px"
                style={{
                  'background-color': 'var(--dev)',
                  opacity: hovered() === p ? 1 : 0.55,
                }}
              />
            </div>
          </>
        )}
      </For>

      <Show when={hovered()}>
        {(p) => (
          <div
            class="bg-base-100/95 text-base-content absolute top-1 z-20 rounded border px-2 py-1 text-[0.65rem] leading-snug whitespace-nowrap shadow-sm"
            style={{
              left: at(p().t),
              'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)',
              // Keep the box on stage near the fingertips.
              transform: `translateX(${p().side === 'left' ? '-10%' : p().side === 'right' ? '-90%' : '-50%'})`,
            }}
          >
            <div class="font-semibold" style={{ color: 'var(--dev)' }}>
              {p().mark.label}
              {p().side === 'middle' ? '' : `, ${p().side} arm`}
            </div>
            <div class="tabular-nums">
              {pct(p().mark.fromTip)} of the span from the{' '}
              {p().side === 'middle' ? 'either' : p().side} fingertip
              {p().mark.plusMinus > 0 ? `, ± ${pct(p().mark.plusMinus)}` : ''}
            </div>
            <div class="text-base-content/60 tabular-nums">
              {ago(p().t)}
              <Show when={p().mark.plusMinus > 0}>
                {' '}· between {ago(p().t - p().mark.plusMinus)} and{' '}
                {ago(p().t + p().mark.plusMinus)}
              </Show>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}

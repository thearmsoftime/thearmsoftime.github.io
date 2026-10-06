import { For, Show, createMemo } from 'solid-js'
import { Portal } from 'solid-js/web'
import { OutLink } from './Sources'
import { hostOf, isUrl } from '../data'
import { gapsOf, isReadable, odditiesFor } from '../oddities'
import { formatLength, formatYears } from '../format'
import type { Oddity, OddityPoint } from '../types'

/**
 * Dev only, while the wording and the sources are still being checked. What it
 * is for: an oddity is one gap, or two that share a moment, and the only way
 * to judge one is to see its bars at the scale the arm would draw them. The panel is deliberately dumb — no arm, no figure, just the
 * track — so that deciding where this belongs on the page stays an open
 * question.
 */

interface Props {
  timelineId: string
  /** The reader's own reach, so each gap can also be said as a length. */
  armSpanM: number
  spanYears: number
  /** Moves the marker on the arm behind the panel. Past moments only. */
  onPick: (yearsAgo: number) => void
  onClose: () => void
}

/**
 * How far past the right fingertip the track will draw before it gives up. The
 * last stars are thousands of spans away; without a cap the arm itself would
 * be a hairline and the card would say nothing at all.
 */
const FUTURE_CAP = 2

/** Where a moment sits on the track, 0 at the left fingertip. */
interface Frame {
  /** Years ago at the left edge and the right edge of the drawn track. */
  left: number
  right: number
  x: (yearsAgo: number) => number
  /** True when the youngest moment is further ahead than the track can show. */
  clipped: boolean
}

function frameOf(oddity: Oddity, spanYears: number): Frame {
  const youngest = oddity.points[oddity.points.length - 1]!.yearsAgo
  const floor = -FUTURE_CAP * spanYears
  const clipped = youngest < floor
  // The track is always the whole timeline, so the arm stays recognisable, plus
  // whatever room the future needs on the right.
  const left = spanYears
  const right = Math.min(0, Math.max(youngest, floor))
  const total = left - right
  return {
    left,
    right,
    clipped,
    x: (yearsAgo) => ((left - Math.max(yearsAgo, floor)) / total) * 100,
  }
}

const pct = (v: number) => `${v}%`

/** One gap, drawn as a bar with its length written on it. */
function Gap(props: { from: number; to: number; years: number; metres: number; accent: boolean }) {
  return (
    <div
      class="absolute flex h-4 items-center justify-center rounded-sm text-[0.6rem] whitespace-nowrap tabular-nums"
      classList={{
        'bg-accent/25 text-accent': props.accent,
        'bg-base-content/15 text-base-content/60': !props.accent,
      }}
      style={{ left: pct(props.from), width: pct(Math.max(props.to - props.from, 0.2)) }}
    >
      {/* The bar is often far too narrow for its own label, so the label is
          allowed to spill out of it rather than be cut. */}
      <span class="pointer-events-none absolute px-1">
        {formatYears(props.years)} · {formatLength(props.metres)}
      </span>
    </div>
  )
}

/** A point's name under the track, nudged so the outer two stay on the card. */
function PointLabel(props: { point: OddityPoint; x: number; onPick?: () => void }) {
  const align = () => (props.x < 15 ? 'start' : props.x > 85 ? 'end' : 'middle')
  return (
    <button
      type="button"
      class="text-base-content/55 hover:text-accent absolute text-[0.62rem] whitespace-nowrap transition-colors disabled:cursor-default disabled:hover:text-inherit"
      style={{
        left: pct(props.x),
        transform:
          align() === 'middle'
            ? 'translateX(-50%)'
            : align() === 'end'
              ? 'translateX(-100%)'
              : 'none',
      }}
      disabled={!props.onPick}
      onClick={() => props.onPick?.()}
    >
      {props.point.label}
    </button>
  )
}

function Card(props: {
  oddity: Oddity
  spanYears: number
  armSpanM: number
  onPick: (yearsAgo: number) => void
}) {
  const frame = createMemo(() => frameOf(props.oddity, props.spanYears))
  const gaps = createMemo(() => gapsOf(props.oddity))
  /** The longer gap is the surprise; the first one wins a tie. */
  const longest = createMemo(() => gaps().indexOf(Math.max(...gaps())))
  const metres = (years: number) => (years / props.spanYears) * props.armSpanM
  const wiki = () => (isUrl(props.oddity.wikipedia) ? props.oddity.wikipedia : undefined)
  const src = () => (isUrl(props.oddity.source) ? props.oddity.source : undefined)

  return (
    <li class="border-base-300/60 rounded-box border p-3">
      <p class="text-sm leading-snug">{props.oddity.line}</p>

      <div class="relative mt-3 mb-11 h-11">
        {/* The arm itself: fingertip to fingertip, whatever else the track shows. */}
        <div
          class="bg-base-content/10 absolute top-0 h-1 rounded-full"
          style={{ left: '0%', width: pct(frame().x(0)) }}
        />
        {/* Now — the right fingertip. Everything to the right of it is ahead. */}
        <div
          class="bg-base-content/40 absolute top-0 h-3 w-px"
          style={{ left: pct(frame().x(0)) }}
        />

        {/* Each gap on a row of its own. */}
        <For each={gaps()}>
          {(years, i) => (
            <div
              class="absolute right-0 left-0"
              classList={{ 'top-4': i() === 0, 'top-9': i() === 1 }}
            >
              <Gap
                from={frame().x(props.oddity.points[i()]!.yearsAgo)}
                to={frame().x(props.oddity.points[i() + 1]!.yearsAgo)}
                years={years}
                metres={metres(years)}
                accent={i() === longest()}
              />
            </div>
          )}
        </For>

        {/*
          Two rows of names, not one. The moments are often close
          together — Harvard and the Principia are fifty years apart on a span
          of four thousand — and on one row the names sit on top of each other.
          The hinge, the second moment, gets the second row to itself.
        */}
        <div class="absolute -bottom-5 right-0 left-0 h-4">
          <For each={props.oddity.points.filter((_, i) => i !== 1)}>
            {(point) => (
              <PointLabel
                point={point}
                x={frame().x(point.yearsAgo)}
                // A moment still ahead has nowhere on the arm to send the marker.
                onPick={point.yearsAgo >= 0 ? () => props.onPick(point.yearsAgo) : undefined}
              />
            )}
          </For>
        </div>
        <div class="absolute -bottom-10 right-0 left-0 h-4">
          <PointLabel
            point={props.oddity.points[1]}
            x={frame().x(props.oddity.points[1].yearsAgo)}
            onPick={
              props.oddity.points[1].yearsAgo >= 0
                ? () => props.onPick(props.oddity.points[1].yearsAgo)
                : undefined
            }
          />
        </div>
      </div>

      <div class="text-base-content/40 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.65rem]">
        <span class="text-base-content/30">{props.oddity.id}</span>
        <Show when={props.oddity.certainty && props.oddity.certainty !== 'high'}>
          <span class="text-warning">{props.oddity.certainty}</span>
        </Show>
        <Show when={frame().clipped}>
          <span class="text-warning">runs off the track</span>
        </Show>
        {/* Why a fact the data holds is not offered on the arm. */}
        <Show when={!isReadable(props.oddity, props.spanYears)}>
          <span class="text-warning">too small to draw on this arm</span>
        </Show>
        <Show when={wiki()}>{(href) => <OutLink href={href()}>Wikipedia</OutLink>}</Show>
        <Show when={src()}>
          {(href) => <OutLink href={href()}>{props.oddity.sourceTitle ?? hostOf(href())}</OutLink>}
        </Show>
      </div>
    </li>
  )
}

export default function OddityPanel(props: Props) {
  const oddities = createMemo(() => odditiesFor(props.timelineId))

  return (
    <Portal>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Odd facts"
          class="rounded-box bg-base-100 flex max-h-[85vh] w-full max-w-3xl flex-col border shadow-2xl"
          style={{ 'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)' }}
        >
          <div
            class="flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
            style={{
              'border-color': 'color-mix(in oklab, var(--dev) 30%, transparent)',
              'background-color': 'color-mix(in oklab, var(--dev) 10%, transparent)',
            }}
          >
            <span
              class="font-display text-[0.72rem] tracking-[0.18em] uppercase"
              style={{ color: 'var(--dev)' }}
            >
              Odd facts
            </span>
            <span class="text-base-content/45 text-[0.68rem]">
              {oddities().filter((o) => isReadable(o, props.spanYears)).length} of{' '}
              {oddities().length} big enough to draw on this arm
            </span>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle ms-auto"
              aria-label="Close"
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>

          <div class="min-h-0 overflow-auto px-4 py-3">
            <Show
              when={oddities().length > 0}
              fallback={
                <p class="text-base-content/50 py-6 text-center text-sm">
                  No oddities for this timeline yet. They live in{' '}
                  <code>data/oddities/</code>, and each one names the timelines its
                  gaps are big enough to see on.
                </p>
              }
            >
              <ul class="flex flex-col gap-3">
                <For each={oddities()}>
                  {(oddity) => (
                    <Card
                      oddity={oddity}
                      spanYears={props.spanYears}
                      armSpanM={props.armSpanM}
                      onPick={props.onPick}
                    />
                  )}
                </For>
              </ul>
            </Show>
            <p class="text-base-content/40 mt-3 text-[0.68rem] leading-relaxed">
              The thin line is the arm, fingertip to fingertip; the tick is now. A bar
              that runs past the tick is a gap in the future. Two bars are the two
              gaps the fact compares — the longer one is the surprise. One bar is a
              fact about one stretch of time. Click a name to put the marker on it.
            </p>
          </div>
        </div>
      </div>
    </Portal>
  )
}

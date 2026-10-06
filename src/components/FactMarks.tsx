import { For, Show, createMemo } from 'solid-js'
import { xFrac, xUnits, yFrac } from '../figure'
import { lineY, scrub } from '../scrub'
import { factRows } from '../factRows'
import { formatYears } from '../format'
import { gapsOf, stopsOf, type FactStop } from '../oddities'
import type { Oddity } from '../types'

/**
 * A fun fact drawn on the arm: three moments dotted on the line, and the two
 * gaps between them laid over the arms as two bars, each in its own colour.
 *
 * The bars are the same shape as the band under the pointer in the strip: a
 * block of colour from the names down through the line, fading out below it.
 * One idea on the arm, whether the strip is on or not — a gap is a stretch of
 * arm, and a bar says that without a dimension line to read.
 *
 * The three moments are marked whether or not they are events in `data/`, and
 * whether or not the short list keeps them. That is the point of a fact:
 * Cleopatra has no card on any arm, and the reader still has to see where she
 * falls between the pyramid and the Moon.
 *
 * The names of the moments sit above the line, and each gap's measure just
 * under it: the reader looks up for who, and down for how long.
 */

/**
 * How far past the right fingertip a bar may run, in arm spans. The square's
 * side runs through the fingertips and the drawing keeps a margin outside it;
 * this is that margin. A gap longer than this fades out at the edge instead of
 * ending — the future is the only thing that goes there, and most of it does
 * not fit on any body.
 */
const BEYOND_CAP = 0.1

/**
 * A moment still ahead is drawn into the margin past the fingertip, to scale
 * while it fits and cut off when it does not.
 */
const tOf = (stop: FactStop) => Math.min(Math.max(stop.t, 0), 1 + BEYOND_CAP)
/** True when the moment is so far ahead that the bar had to be cut. */
const isCut = (stop: FactStop) => stop.t > 1 + BEYOND_CAP

/** The two gaps' colours, older first. `--fact-near` is set per theme in index.css. */
const GAP_COLOUR = ['var(--color-secondary)', 'var(--fact-near)'] as const

/** A name's rough width, for telling whether two of them would touch. */
const NAME_CHAR_PX = 5.6
const NAME_PAD_PX = 14

interface Props {
  fact: Oddity
  spanYears: number
}

/** The three dots on the line. A bare `<g>`, for inside the stage's svg. */
export function FactDots(props: Props) {
  const stops = createMemo(() => stopsOf(props.fact, props.spanYears))
  return (
    <g class="text-base-content">
      <For each={stops()}>
        {(stop) => (
          <circle
            cx={xUnits(tOf(stop))}
            cy={lineY()}
            r="5"
            fill="currentColor"
            stroke-width="1.5"
            class="stroke-base-100"
            opacity={stop.beyond ? 0.55 : 1}
          />
        )}
      </For>
    </g>
  )
}

// Near-solid backgrounds: the marker's guide line runs up through this strip,
// and it must pass behind the words, not through them.
const NAME_CLASS =
  'text-base-content pointer-events-none absolute rounded bg-base-100/95' +
  ' px-1 text-[0.58rem] leading-tight font-medium tracking-wide whitespace-nowrap sm:text-[0.7rem]'

const MEASURE_CLASS =
  'pointer-events-none absolute rounded bg-base-100/95' +
  ' px-1 text-[0.58rem] leading-tight font-semibold tabular-nums whitespace-nowrap sm:text-[0.66rem]'

/**
 * A measure hangs off its gap by its own left end at the start of the arm, by
 * its right end at the far end, and by its middle between — so it never runs
 * off the drawing, and the first and last lean into their own bars.
 */
const anchorOf = (t: number) => (t < 0.15 ? 0 : t > 0.85 ? 1 : 0.5)

/**
 * Now is the right fingertip itself, and the bars change colour there, so a
 * name for it only crowds the corner the future is drawn in. The left
 * fingertip is the start of the timeline, and its caption in the margin
 * already names it.
 */
const named = (stop: FactStop) => stop.point.yearsAgo !== 0 && stop.t > 0

const nameWidth = (stop: FactStop) => stop.point.label.length * NAME_CHAR_PX + NAME_PAD_PX

/**
 * Where a name's left and right ends land, in px across the stage. A name is
 * always centred over its moment, so the reader can tell which dot it names.
 * Past the right fingertip that runs into the page margin; the stage does not
 * clip, and nothing else is drawn there while a fact is up.
 */
const extent = (stop: FactStop, stageWidth: number) => {
  const width = nameWidth(stop)
  const left = xFrac(tOf(stop)) * stageWidth - width / 2
  return [left, left + width] as const
}

/**
 * The hinge's name goes up a row only when it would touch a neighbour's.
 * Most facts keep all three on one row, and the bars stay short.
 */
const hingeUpOf = (stops: FactStop[], stageWidth: number) => {
  const [first, hinge, last] = stops
  if (!named(hinge!)) return false
  const [l, r] = extent(hinge!, stageWidth)
  return (
    (named(first!) && extent(first!, stageWidth)[1] > l) ||
    (named(last!) && extent(last!, stageWidth)[0] < r)
  )
}

/** How far over the line the bars reach, in rem: up past the top row of names. */
const liftOf = (hingeUp: boolean) => {
  const f = factRows()
  return f.nameRem + f.rowRem * (hingeUp ? 2 : 1) + f.headRem
}

/**
 * The same, for the band strip: with a fact up it sits on top of the bars,
 * or the hinge's raised name runs into its bottom row.
 */
export const factLift = (fact: Oddity, spanYears: number, stageWidth: number): number =>
  liftOf(hingeUpOf(stopsOf(fact, spanYears), stageWidth))

/**
 * Where everything over the line goes for this fact: the rows the words sit
 * on, and how high the bars reach to hold them.
 */
function layoutOf(props: Props & { stageWidth: number }) {
  const stops = createMemo(() => stopsOf(props.fact, props.spanYears))
  const gaps = createMemo(() => gapsOf(props.fact))
  const line = () => `${yFrac(lineY()) * 100}%`
  const up = (rem: number) => `calc(${line()} - ${rem}rem)`
  const down = (rem: number) => `calc(${line()} + ${rem}rem)`
  const hingeUp = createMemo(() => hingeUpOf(stops(), props.stageWidth))
  const nameRow = (index: number) =>
    factRows().nameRem + (index === 1 && hingeUp() ? factRows().rowRem : 0)
  const barLift = () => liftOf(hingeUp())

  return { stops, gaps, up, down, nameRow, barLift }
}

/**
 * The two bars. HTML, and put in before the stage's svg so the line and its
 * dots are drawn over them.
 */
export function FactBars(props: Props & { stageWidth: number }) {
  const { stops, up, barLift } = layoutOf(props)
  return (
    <>
      <For each={[0, 1]}>
        {(gap) => {
          const from = () => tOf(stops()[gap]!)
          const to = () => tOf(stops()[gap + 1]!)
          const cut = () => isCut(stops()[gap + 1]!)
          const colour = GAP_COLOUR[gap]!
          const edge = `1px solid color-mix(in oklab, ${colour} 60%, transparent)`
          // Down through the line and out: the same fade as the band column.
          const fade = 'linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)'
          // Cut off in the future: it fades out sideways as well, into the edge.
          const mask = () =>
            cut() ? `${fade}, linear-gradient(to right, #000 55%, transparent 100%)` : fade
          return (
            <div
              class="pointer-events-none absolute"
              style={{
                left: `${xFrac(from()) * 100}%`,
                width: `${(xFrac(to()) - xFrac(from())) * 100}%`,
                top: up(barLift()),
                height: `calc(${barLift()}rem + ${scrub().columnPx}px)`,
                'background-color': `color-mix(in oklab, ${colour} 20%, transparent)`,
                'border-left': gap === 0 ? edge : undefined,
                'border-right': cut() ? undefined : edge,
                '-webkit-mask-image': mask(),
                'mask-image': mask(),
                '-webkit-mask-composite': 'source-in',
                'mask-composite': 'intersect',
              }}
            />
          )
        }}
      </For>
    </>
  )
}

/** The words: each moment named over the line, each gap measured under it. */
export function FactNames(props: Props & { stageWidth: number }) {
  const { stops, gaps, up, down, nameRow } = layoutOf(props)
  return (
    <>
      <For each={[0, 1]}>
        {(gap) => {
          const from = () => tOf(stops()[gap]!)
          const to = () => tOf(stops()[gap + 1]!)
          // Hung like a name: near either end of the drawing it keeps to the
          // inside of its own bar's outer edge, so it never runs off the page.
          const anchor = () => anchorOf((from() + to()) / 2)
          const at = () => from() + (to() - from()) * anchor()
          return (
            <span
              class={MEASURE_CLASS}
              style={{
                left: `${xFrac(at()) * 100}%`,
                top: down(factRows().measureRem),
                color: GAP_COLOUR[gap],
                transform: `translateX(-${anchor() * 100}%)`,
              }}
            >
              {formatYears(gap === 0 ? gaps().older : gaps().younger)}
            </span>
          )
        }}
      </For>

      <For each={stops()}>
        {(stop, index) => (
          <Show when={named(stop)}>
            <span
              class={NAME_CLASS}
              classList={{ 'opacity-80': stop.beyond }}
              style={{
                left: `${xFrac(tOf(stop)) * 100}%`,
                top: up(nameRow(index())),
                transform: 'translate(-50%, -100%)',
              }}
            >
              {stop.point.label}
            </span>
          </Show>
        )}
      </For>
    </>
  )
}

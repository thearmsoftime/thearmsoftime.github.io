import { For, Show, createMemo, createSignal, onCleanup } from 'solid-js'
import type { Band, TimelineEvent, Zone } from '../types'
import {
  ARM_Y,
  CROP_HEIGHT,
  CROP_TOP,
  FIGURE,
  KNOB_Y,
  layoutBands,
  spanPerPixel,
  xFrac,
  xUnits,
  yFrac,
} from '../figure'
import { clamp01, formatYears } from '../scale'

export type NudgeKind = 'fine' | 'coarse' | 'page' | 'event'

interface Props {
  zone: Zone
  bands: Band[]
  events: TimelineEvent[]
  pos: number
  onPos: (next: number) => void
  onNudge: (direction: -1 | 1, kind: NudgeKind) => void
  onEnd: (edge: 0 | 1) => void
  nearestId: string | null
  /** Big line in the readout that rides with the knob. */
  readoutYears: string
  /** Small line under it. Only on the human timeline. */
  readoutGenerations?: string
}

const TICK_TOP = ARM_Y + 14
const TICK_BOTTOM = ARM_Y + 38

/** The image is drawn full width and pulled up, so only the arms band shows. */
const IMAGE_STYLE = {
  height: `${(FIGURE.height / CROP_HEIGHT) * 100}%`,
  top: `${-(CROP_TOP / CROP_HEIGHT) * 100}%`,
}

export default function ArmStage(props: Props) {
  const [width, setWidth] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)
  let stage!: HTMLDivElement

  const observer = new ResizeObserver((entries) => {
    const box = entries[0]
    if (box) setWidth(box.contentRect.width)
  })
  onCleanup(() => observer.disconnect())

  const mountStage = (el: HTMLDivElement) => {
    stage = el
    observer.observe(el)
  }

  /** Pointer x -> position along the arm span. The crop never touches x. */
  const posFromClientX = (clientX: number): number => {
    const box = stage.getBoundingClientRect()
    if (box.width === 0) return props.pos
    const frac = (clientX - box.left) / box.width
    return clamp01((frac - FIGURE.leftX) / (FIGURE.rightX - FIGURE.leftX))
  }

  const startDrag = (e: PointerEvent) => {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setDragging(true)
    props.onPos(posFromClientX(e.clientX))
    e.preventDefault()
  }

  const moveDrag = (e: PointerEvent) => {
    if (!dragging()) return
    props.onPos(posFromClientX(e.clientX))
  }

  const endDrag = () => setDragging(false)

  const onKeyDown = (e: KeyboardEvent) => {
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowDown'
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowUp'
    if (back || forward) {
      props.onNudge(back ? -1 : 1, e.altKey ? 'event' : e.shiftKey ? 'coarse' : 'fine')
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      props.onNudge(e.key === 'PageDown' ? -1 : 1, 'page')
    } else if (e.key === 'Home') {
      props.onEnd(0)
    } else if (e.key === 'End') {
      props.onEnd(1)
    } else {
      return
    }
    e.preventDefault()
  }

  const bandsWithPos = createMemo(() => layoutBands(props.bands, props.zone.spanYears))

  /** A band only gets a name when it is wide enough to hold one. */
  const minLabelSpan = createMemo(() => {
    const lanes = bandsWithPos()[0]?.lanes ?? 1
    // Stacked lanes carry smaller type, so a narrower band can still be named.
    return spanPerPixel(width()) * (lanes > 1 ? 46 : 70)
  })

  /**
   * Names inside a lane need the lane to be tall enough to hold them. On a
   * phone the whole arms band is only some tens of pixels high, so the stacked
   * zones show their bands as bars and leave the naming to the event list.
   */
  const laneLabelsFit = createMemo(() => {
    const first = bandsWithPos()[0]
    if (!first) return false
    if (first.lanes <= 1) return true
    return first.height * (width() / FIGURE.width) >= 9
  })

  const eventsWithPos = createMemo(() =>
    props.events.map((event) => {
      const t = clamp01(1 - event.yearsAgo / props.zone.spanYears)
      const slack = (event.uncertaintyYears ?? 0) / props.zone.spanYears
      return { event, t, from: clamp01(t - slack), to: clamp01(t + slack) }
    }),
  )

  const markerPct = () => `${xFrac(props.pos) * 100}%`
  /** Source y -> a `top` for the HTML overlays sitting on the band. */
  const bandAt = (y: number) => `${yFrac(y) * 100}%`
  /** SVG transforms take user units, so the marker can glide without re-laying out. */
  const glide = () => (dragging() ? 'none' : 'transform 260ms cubic-bezier(0.22, 0.8, 0.28, 1)')

  return (
    <div class="w-full">
      <div
        ref={mountStage}
        class="no-select relative w-full touch-pan-y"
        classList={{ 'cursor-ew-resize': dragging(), 'cursor-pointer': !dragging() }}
        style={{ 'aspect-ratio': `${FIGURE.width} / ${CROP_HEIGHT}` }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* The window onto the scan: head and legs are clipped away. */}
        <div class="absolute inset-0 overflow-hidden">
          <img
            src={FIGURE.src}
            alt="The outstretched arms of Leonardo da Vinci's Vitruvian Man"
            width={FIGURE.width}
            height={FIGURE.height}
            class="figure-ink pointer-events-none absolute inset-x-0 w-full"
            style={IMAGE_STYLE}
            draggable={false}
          />
        </div>

        <svg
          class="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 ${CROP_TOP} ${FIGURE.width} ${CROP_HEIGHT}`}
          aria-hidden="true"
        >
          <line
            x1={xUnits(0)}
            x2={xUnits(1)}
            y1={ARM_Y}
            y2={ARM_Y}
            stroke="currentColor"
            stroke-width="1.5"
            class="text-base-content/30"
          />

          {/* Bands and ticks fade back in whenever the zone changes. */}
          <Show when={props.zone.id} keyed>
            <g class="zone-fade">
              <For each={bandsWithPos()}>
                {(b) => (
                  <rect
                    x={xUnits(b.from)}
                    width={Math.max(xUnits(b.to) - xUnits(b.from), 1.5)}
                    y={b.top}
                    height={b.height}
                    rx={Math.min(4, b.height / 4)}
                    fill={b.color}
                    fill-opacity={b.lanes > 1 ? 0.28 : 0.38}
                    stroke={b.color}
                    stroke-opacity="0.9"
                    stroke-width="1.5"
                    // The svg itself takes no pointer events; the bands do, so
                    // their tooltip works. Drags still bubble up to the stage.
                    class="pointer-events-auto"
                  >
                    {/* The narrow bands never fit a name, so hover tells you. */}
                    <title>
                      {b.band.label} — {formatYears(b.band.fromYearsAgo - b.band.toYearsAgo)}
                    </title>
                  </rect>
                )}
              </For>

              <For each={eventsWithPos()}>
                {(e) => (
                  <g
                    class="transition-opacity duration-200"
                    opacity={props.nearestId === e.event.id ? 1 : 0.7}
                  >
                    <Show when={e.to - e.from > 0.002}>
                      <line
                        x1={xUnits(e.from)}
                        x2={xUnits(e.to)}
                        y1={TICK_BOTTOM}
                        y2={TICK_BOTTOM}
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        class="text-base-content/30"
                      />
                    </Show>
                    <line
                      x1={xUnits(e.t)}
                      x2={xUnits(e.t)}
                      y1={TICK_TOP}
                      y2={TICK_BOTTOM}
                      stroke="currentColor"
                      stroke-width={props.nearestId === e.event.id ? 8 : 4}
                      stroke-linecap="round"
                      class={
                        props.nearestId === e.event.id
                          ? 'text-accent'
                          : e.event.certainty === 'disputed'
                            ? 'text-warning'
                            : 'text-base-content'
                      }
                    />
                  </g>
                )}
              </For>
            </g>
          </Show>

          <g
            class="text-accent"
            style={{ transform: `translateX(${xUnits(props.pos)}px)`, transition: glide() }}
          >
            <line
              x1={0}
              x2={0}
              y1={ARM_Y - 26}
              y2={KNOB_Y}
              stroke="currentColor"
              stroke-width="2"
              stroke-opacity="0.75"
            />
            <circle cx={0} cy={ARM_Y} r="8" fill="currentColor" />
            <circle
              cx={0}
              cy={ARM_Y}
              r="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-opacity="0.4"
            />
          </g>
        </svg>

        {/* Band names live in HTML so they stay readable at any stage width. */}
        <Show when={props.zone.id} keyed>
          <div class="zone-fade pointer-events-none absolute inset-0">
            <For each={bandsWithPos()}>
              {(b) => (
                <Show when={b.size >= minLabelSpan() && laneLabelsFit()}>
                  <span
                    class="absolute -translate-x-1/2 font-semibold tracking-[0.14em] whitespace-nowrap uppercase"
                    classList={{
                      // A lone lane keeps its name floating above the bar.
                      '-translate-y-full text-[0.58rem] sm:text-[0.7rem]': b.lanes <= 1,
                      // Stacked lanes have no room above them, so the name
                      // sits inside the lane it belongs to.
                      '-translate-y-1/2 text-[0.42rem] sm:text-[0.52rem]': b.lanes > 1,
                    }}
                    style={{
                      left: `${xFrac(b.mid) * 100}%`,
                      top: bandAt(b.lanes <= 1 ? b.top - 11 : b.top + b.height / 2),
                      color: b.color,
                      'text-shadow': 'var(--band-shadow)',
                    }}
                  >
                    {b.band.label}
                  </span>
                </Show>
              )}
            </For>
          </div>
        </Show>

        <span
          class="text-base-content/70 bg-base-100/60 pointer-events-none absolute rounded px-1.5 py-0.5 text-[0.58rem] tracking-wide sm:text-[0.7rem]"
          style={{ left: `${xFrac(0) * 100}%`, top: bandAt(ARM_Y + 46) }}
        >
          {props.zone.startLabel}
        </span>
        <span
          class="text-base-content/70 bg-base-100/60 pointer-events-none absolute -translate-x-full rounded px-1.5 py-0.5 text-[0.58rem] tracking-wide sm:text-[0.7rem]"
          style={{ left: `${xFrac(1) * 100}%`, top: bandAt(ARM_Y + 46) }}
        >
          {props.zone.endLabel}
        </span>

        {/* the scrubber: on the chest, between the two arms */}
        <button
          type="button"
          role="slider"
          aria-label="Scrub along the arm span"
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-valuenow={Math.round(props.pos * 1000)}
          aria-valuetext={[props.readoutYears, props.readoutGenerations].filter(Boolean).join(', ')}
          aria-orientation="horizontal"
          class="border-accent bg-base-100/90 text-accent focus-visible:ring-accent/50 absolute z-10 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-2 shadow-lg focus-visible:ring-4 focus-visible:outline-none active:scale-[1.18] sm:h-10 sm:w-10"
          classList={{
            'transition-[left,transform] duration-[260ms] ease-out': !dragging(),
            'scale-[1.18]': dragging(),
          }}
          style={{ left: markerPct(), top: bandAt(KNOB_Y), 'touch-action': 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation()
            // startDrag suppresses the default, so focus has to be taken by hand
            // or the arrow keys would do nothing after a click.
            e.currentTarget.focus()
            startDrag(e)
          }}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true">
            <path
              d="M9 6 4 12l5 6M15 6l5 6-5 6"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      {/*
        The readout rides under the knob on its own rail, so it reserves its own
        height instead of floating over the figure and the list.
      */}
      <div class="pointer-events-none pt-2">
        <div
          class="border-accent/35 bg-base-100/85 w-fit -translate-x-1/2 rounded-full border px-3 py-1 text-center shadow-sm"
          classList={{ 'transition-[margin] duration-[260ms] ease-out': !dragging() }}
          style={{ 'margin-left': `clamp(7rem, ${markerPct()}, calc(100% - 7rem))` }}
        >
          <div class="text-accent text-xs font-semibold tabular-nums whitespace-nowrap sm:text-sm">
            {props.readoutYears}
          </div>
          <Show when={props.readoutGenerations}>
            {(line) => (
              <div class="text-base-content/55 text-[0.6rem] tabular-nums whitespace-nowrap">
                {line()}
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}

import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import type { TimelineEvent } from '../types'
import Sources from './Sources'
import { clamp01, fractionOf } from '../scale'
import {
  formatCalendarYear,
  formatGenerationsAgo,
  formatYears,
  formatYearsAgoStretch,
  formatYearsAgoUncertain,
} from '../format'

interface Props {
  events: TimelineEvent[]
  timelineId: string
  nearestId: string | null
  /** Where the marker stands on the arm, 0 = left fingertip, 1 = now. */
  pos: number
  /** The whole timeline, so a card knows where on the arm it sits. */
  spanYears: number
  /** Where the marker stands. Anything older than this has already gone by. */
  markerYearsAgo: number
  /** Generations only mean something on the human timelines. */
  showGenerations: boolean
  /** On the short timelines a calendar year says more than "586 years ago". */
  showCalendar: boolean
  /** Print each date's ± error bar. Off, the dates read as round numbers. */
  showUncertainty: boolean
  onPick: (event: TimelineEvent) => void
  /**
   * Dragging the strip is scrubbing: the strip tells the marker where it now
   * is, and which card it stopped on. The card matters where two of them share
   * one instant and the position alone cannot say which was meant.
   */
  onScrub: (pos: number, id?: string) => void
}

/**
 * Share of the gap to the marker the strip closes per frame. Low, so the cards
 * drift rather than snap: the strip trails the hand slightly and settles.
 */
const EASE = 0.12

/** How far the mouse has to travel before a press counts as a drag, not a click. */
const DRAG_SLOP = 4

/**
 * How long after the last scroll event the strip still counts as hand-driven.
 * Long enough to cover the gaps in touch momentum, short enough that the
 * marker takes the strip back as soon as the hand lets go.
 */
const HAND_MS = 160

/** Where one card sits on the arm: a moment has a == b, a stretch spans them. */
interface Anchor {
  id: string
  a: number
  b: number
  center: number
}

/**
 * The events laid out the way the arms run: oldest at the left fingertip, now
 * at the right. One card per event, on a rail.
 */
export default function EventCards(props: Props) {
  let strip!: HTMLUListElement
  let frame = 0
  let anchors: Anchor[] = []
  /** The last scrollLeft this component wrote, so a scroll event says whose it was. */
  let written = -1
  /** Set while the hand owns the strip, so `follow` does not pull against it. */
  let byHand = false
  let handTimer = 0
  /** A mouse press that has turned into a drag, so the click it ends with is dead. */
  let drag: { x: number; left: number; moved: boolean } | null = null
  let swallowClick = false
  const [dragging, setDragging] = createSignal(false)

  const stillMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)')

  /**
   * Card centres in strip pixels, paired with the stretch of arm each card
   * owns. Measured, because the card width lives in CSS and changes with the
   * breakpoint. Kept monotonic so the mapping below never doubles back.
   */
  const measure = () => {
    const cards = strip?.querySelectorAll<HTMLElement>('[data-event]')
    if (!cards) return
    let floor = -Infinity
    anchors = Array.from(cards, (el, i) => {
      const event = props.events[i]
      const a = Math.max(fractionOf(event?.yearsAgo ?? 0, props.spanYears), floor)
      const b = Math.max(fractionOf(event?.endYearsAgo ?? event?.yearsAgo ?? 0, props.spanYears), a)
      floor = b
      return { id: event?.id ?? '', a, b, center: el.offsetLeft + el.offsetWidth / 2 }
    })
  }

  /**
   * Marker position -> where the strip should stand. A card holds the middle
   * for as long as the marker is inside it, and the strip glides between two
   * cards across the gap. So the strip tracks the hand instead of hopping from
   * card to card, and the middle card is still the one the marker is nearest.
   */
  const targetFor = (pos: number): number | undefined => {
    if (anchors.length === 0) return undefined
    let center = anchors[anchors.length - 1]!.center
    for (let i = 0; i < anchors.length; i++) {
      const here = anchors[i]!
      if (pos >= here.a && pos <= here.b) {
        center = here.center
        // More than one card can own this one point: a moment sitting on the
        // end edge of a stretch, or two events at the same instant. A moment's
        // anchor has no width, so it would never win on its own. The live card
        // decides, and the strip and the highlight stay on the same card.
        for (let j = i + 1; j < anchors.length; j++) {
          const also = anchors[j]!
          if (also.a > pos) break
          if (pos <= also.b && also.id === props.nearestId) {
            center = also.center
            break
          }
        }
        break
      }
      if (pos < here.a) {
        const before = anchors[i - 1]
        if (!before) {
          center = here.center
        } else {
          const gap = here.a - before.b
          const k = gap > 1e-9 ? (pos - before.b) / gap : 1
          center = before.center + (here.center - before.center) * k
        }
        break
      }
    }
    const target = center - strip.clientWidth / 2
    return Math.max(0, Math.min(target, strip.scrollWidth - strip.clientWidth))
  }

  /**
   * The way back: where the strip stands -> where the marker belongs. The exact
   * inverse of `targetFor`, so dragging the strip and dragging the knob agree
   * and neither one pulls the other off its mark.
   */
  const posFor = (center: number): number | undefined => {
    const last = anchors[anchors.length - 1]
    const first = anchors[0]
    if (!first || !last) return undefined
    if (center <= first.center) return first.a
    if (center >= last.center) return last.b
    for (let i = 1; i < anchors.length; i++) {
      const here = anchors[i]!
      if (center > here.center) continue
      const before = anchors[i - 1]!
      const run = here.center - before.center
      const k = run > 1e-9 ? (center - before.center) / run : 1
      return clamp01(before.b + (here.a - before.b) * k)
    }
    return last.b
  }

  /**
   * The card nearest the middle of the strip. Where two events share an
   * instant they share a marker position too, so a drag has to name the card
   * it stopped on rather than leave the tie to be guessed again.
   */
  const idAt = (center: number): string | undefined => {
    let best: string | undefined
    let bestGap = Infinity
    for (const anchor of anchors) {
      const gap = Math.abs(anchor.center - center)
      if (gap < bestGap) {
        bestGap = gap
        best = anchor.id
      }
    }
    return best
  }

  /** Every write goes through here, so the scroll event it causes is known as ours. */
  const writeScroll = (left: number) => {
    strip.scrollLeft = left
    written = strip.scrollLeft
  }

  /** One rolling animation, not one scroll per card the marker passes. */
  const follow = () => {
    frame = 0
    // While a hand is on the strip the strip leads and the marker follows.
    if (!strip || byHand) return
    const target = targetFor(props.pos)
    if (target === undefined) return
    const diff = target - strip.scrollLeft
    if (Math.abs(diff) < 0.5 || stillMotion === false || stillMotion.matches) {
      writeScroll(target)
      return
    }
    writeScroll(strip.scrollLeft + diff * EASE)
    frame = requestAnimationFrame(follow)
  }

  /**
   * Any scroll this component did not cause is a hand: a finger, a mouse drag,
   * the wheel, the scrollbar. All of them mean the same thing, so all of them
   * move the marker, and the strip keeps whatever position the hand left it in.
   */
  const onScroll = () => {
    if (Math.abs(strip.scrollLeft - written) < 1) return
    written = strip.scrollLeft
    byHand = true
    clearTimeout(handTimer)
    handTimer = window.setTimeout(() => {
      byHand = false
    }, HAND_MS)
    if (frame !== 0) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const middle = strip.scrollLeft + strip.clientWidth / 2
    const next = posFor(middle)
    if (next !== undefined) props.onScrub(next, idAt(middle))
  }

  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(follow)
  }

  // Remeasure whenever the cards themselves change, then take the strip there.
  createEffect(() => {
    props.events
    props.spanYears
    requestAnimationFrame(() => {
      measure()
      schedule()
    })
  })

  // Dragging the marker only moves this.
  createEffect(() => {
    props.pos
    schedule()
  })

  onMount(() => {
    const observer = new ResizeObserver(() => {
      measure()
      schedule()
    })
    observer.observe(strip)
    onCleanup(() => observer.disconnect())
  })

  onCleanup(() => {
    cancelAnimationFrame(frame)
    clearTimeout(handTimer)
  })

  /** A trackpad or wheel only scrolls one way here, so send both ways sideways. */
  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    if (e.deltaY === 0) return
    e.preventDefault()
    strip.scrollBy({ left: e.deltaY })
  }

  /**
   * Grab the strip and pull it. Touch already pans it itself, so this is for the
   * mouse only: a press that travels far enough stops being a click on a card
   * and becomes a drag, and the click it ends with is dropped.
   */
  const onPointerDown = (e: PointerEvent) => {
    swallowClick = false
    if (e.pointerType === 'touch' || e.button !== 0) return
    drag = { x: e.clientX, left: strip.scrollLeft, moved: false }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.x
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_SLOP) return
      drag.moved = true
      setDragging(true)
      strip.setPointerCapture(e.pointerId)
      getSelection()?.removeAllRanges()
    }
    // Written raw, so `onScroll` reads it as a hand and takes the marker along.
    strip.scrollLeft = drag.left - dx
  }

  const endPointer = (e: PointerEvent) => {
    if (drag?.moved) {
      swallowClick = true
      setDragging(false)
      if (strip.hasPointerCapture(e.pointerId)) strip.releasePointerCapture(e.pointerId)
    }
    drag = null
  }

  return (
    <section class="flex min-h-0 min-w-0 flex-1 flex-col">
      <Show when={props.timelineId} keyed>
        <ul
          ref={strip}
          onWheel={onWheel}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          class="timeline-fade card-strip relative flex min-h-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden py-1"
          classList={{ 'cursor-grabbing no-select': dragging(), 'cursor-grab': !dragging() }}
          data-dragging={dragging() ? '' : undefined}
        >
          <Show
            when={props.events.length > 0}
            fallback={
              <li class="text-base-content/45 grid h-full w-full place-items-center p-8 text-center text-sm">
                Nothing on this timeline yet.
              </li>
            }
          >
            <For each={props.events}>
              {(event) => {
                const nearest = () => props.nearestId === event.id
                const end = () => event.endYearsAgo
                // Older than the marker: the arm has already passed it. A stretch
                // is only past once its younger edge is behind the marker.
                const gone = () => (end() ?? event.yearsAgo) > props.markerYearsAgo
                /** The marker stands inside a stretch: it is running right now. */
                const during = () =>
                  end() !== undefined &&
                  props.markerYearsAgo <= event.yearsAgo &&
                  props.markerYearsAgo >= end()!
                /*
                 * The strip is as tall as the space the arms left; a card stops
                 * well short of that. The slack ends up below the cards, and
                 * that is where the scrollbar rides — so it sits at the bottom
                 * of the screen instead of cutting across the middle of it.
                 */
                return (
                  <li
                    data-event={event.id}
                    class="flex max-h-[min(15rem,40vh)] w-56 shrink-0 flex-col sm:w-64"
                  >
                    {/* The rail: card by card the segments join into one line. */}
                    <span class="relative flex h-3 shrink-0 items-center" aria-hidden="true">
                      <span
                        class="h-px w-full transition-colors"
                        classList={{
                          'bg-accent/60': nearest(),
                          'bg-base-content/10': !nearest(),
                        }}
                      />
                      <span
                        data-rail-dot
                        class="absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full transition-colors"
                        classList={{
                          'bg-accent ring-accent/25 ring-3': nearest(),
                          'bg-base-content/25': gone() && !nearest(),
                          'bg-base-content/45': !gone() && !nearest(),
                        }}
                      />
                    </span>

                    <div
                      role="button"
                      tabindex="0"
                      class="border-base-300/60 hover:bg-base-200/70 focus-visible:ring-accent/40 rounded-box mx-1 flex min-h-0 flex-1 cursor-pointer flex-col overflow-hidden border border-t-[3px] px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      classList={{
                        'border-t-accent bg-accent/[0.07]': nearest(),
                        // Inside a stretch: the marker is standing in it, so keep it lit.
                        'border-t-accent/40': during() && !nearest(),
                        'border-t-base-content/20 opacity-45': gone() && !nearest(),
                        'border-t-transparent': !gone() && !during() && !nearest(),
                      }}
                      onClick={() => {
                        // The mouse-up that ends a drag still fires a click here.
                        if (swallowClick) return
                        props.onPick(event)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          props.onPick(event)
                        }
                      }}
                      aria-current={nearest() ? 'true' : undefined}
                    >
                      <span class="block text-sm tabular-nums">
                        <Show
                          when={end() !== undefined}
                          fallback={(() => {
                            const date = formatYearsAgoUncertain(
                              event.yearsAgo,
                              props.showUncertainty ? (event.uncertaintyYears ?? 0) : 0,
                            )
                            return (
                              <>
                                {date.lead}
                                {/* The error bar rides along grey and small, so the
                                    date stays the thing the eye lands on. */}
                                <Show when={date.bar}>
                                  <span class="text-base-content/45 mx-0.5 text-[0.8em]">
                                    {date.bar}
                                  </span>
                                </Show>
                                {date.trail ? ` ${date.trail}` : ''}
                              </>
                            )
                          })()}
                        >
                          {formatYearsAgoStretch(event.yearsAgo, end()!)}
                        </Show>
                      </span>
                      <span class="flex flex-wrap items-baseline gap-x-2 text-[0.65rem] tabular-nums">
                        <Show when={props.showCalendar}>
                          <span class="text-base-content/55">
                            {formatCalendarYear(event.yearsAgo)}
                            <Show when={end() !== undefined}>
                              {' – '}
                              {formatCalendarYear(end()!)}
                            </Show>
                          </span>
                        </Show>
                        <Show when={props.showGenerations}>
                          <span class="text-base-content/45">
                            {formatGenerationsAgo(event.generationsAgo)}
                          </span>
                        </Show>
                        {/* A moment carries its error bar in the date line above; a
                            stretch says how long it lasted instead. */}
                        <Show when={end() !== undefined}>
                          <span class="text-base-content/35">
                            lasted {formatYears(event.yearsAgo - end()!)}
                          </span>
                        </Show>
                      </span>

                      <span class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span class="text-sm leading-snug font-semibold">{event.label}</span>
                        <Show when={event.certainty === 'disputed'}>
                          <span class="badge badge-warning badge-xs">disputed</span>
                        </Show>
                      </span>

                      <Show when={event.description}>
                        <span class="text-base-content/55 card-blurb mt-0.5 min-h-0 flex-1 overflow-hidden text-xs">
                          {event.description}
                        </span>
                      </Show>
                      <Sources event={event} />
                    </div>
                  </li>
                )
              }}
            </For>
          </Show>
        </ul>
      </Show>
    </section>
  )
}

import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import type { Oddity, TimelineEvent } from '../types'
import FactCard from './FactCard'
import Sources from './Sources'
import { clamp01, fractionOf, startsInside } from '../scale'
import { bodyAt } from '../body'
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
  /**
   * The fun fact on show, if any. It is squeezed into the strip as a card of
   * its own, at the moment its two gaps share, so the marker has something
   * real to land on — see `FactCard`.
   */
  fact?: Oddity
  onFactNext: () => void
  onFactClose: () => void
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
 * What the strip holds, in the order it holds it: every event, plus the fun
 * fact when one is up. `measure` walks the cards in the DOM and this list side
 * by side, so the two have to be the same length and the same order.
 *
 * The events and the fact go in as they arrive, not wrapped in anything: `For`
 * keys on identity, and a fresh wrapper per pass would throw away every card
 * in the strip and build it again each time the fact changed.
 */
type Item = TimelineEvent | Oddity

const isFact = (item: Item): item is Oddity => 'points' in item

/** Where a card sits in time. A fact sits on the moment its two gaps share. */
const startOf = (item: Item): number =>
  isFact(item) ? Math.max(item.points[1].yearsAgo, 0) : item.yearsAgo

const endOf = (item: Item): number | undefined =>
  isFact(item) ? undefined : item.endYearsAgo

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

  /**
   * The events, with the fact dropped in at its own moment in time. Oldest
   * first, the way the arms run. A fact sits on the moment its two gaps share,
   * which is the one the marker is sent to when it opens.
   */
  const items = createMemo<Item[]>(() => {
    const fact = props.fact
    if (!fact) return props.events
    const list: Item[] = [...props.events]
    // The hinge, or now when the fact is about what is still ahead: the strip
    // ends at now and there is nothing further right than that.
    const hinge = startOf(fact)
    const at = list.findIndex((item) => startOf(item) < hinge)
    if (at < 0) list.push(fact)
    else list.splice(at, 0, fact)
    return list
  })

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
    const list = items()
    const starts = list.map((item) => fractionOf(startOf(item), props.spanYears))
    let floor = -Infinity
    anchors = Array.from(cards, (el, i) => {
      const item = list[i]
      const from = item ? startOf(item) : 0
      const start = fractionOf(from, props.spanYears)
      const end = fractionOf((item && endOf(item)) ?? from, props.spanYears)
      const a = Math.max(start, floor)
      // A stretch holds the middle for its whole length only when no other
      // card starts inside it. Otherwise it would hold on through every card
      // inside it, and the live card would sit off to the right.
      const b = Math.max(startsInside(start, end, starts) ? start : end, a)
      floor = b
      return { id: item?.id ?? '', a, b, center: el.offsetLeft + el.offsetWidth / 2 }
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
    items()
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
          class="timeline-fade card-strip relative flex min-h-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden pt-1 pb-4"
          classList={{ 'cursor-grabbing no-select': dragging(), 'cursor-grab': !dragging() }}
          data-dragging={dragging() ? '' : undefined}
        >
          <Show
            when={items().length > 0}
            fallback={
              <li class="text-base-content/70 grid h-full w-full place-items-center p-8 text-center text-sm">
                Nothing on this timeline yet.
              </li>
            }
          >
            <For each={items()}>
              {(item) => {
                // The fun fact is a guest in the strip: its own card, in the
                // second colour, at the moment its two gaps share.
                if (isFact(item)) {
                  return (
                    /*
                      The strip measures card centres in pixels, and for a third
                      of a second this one is still growing as it squeezes in.
                      Measure again once it has stopped, or every anchor to the
                      right of it is out by half a card.
                    */
                    <li
                      data-event={item.id}
                      class="fact-squeeze flex h-(--card-h) w-56 shrink-0 flex-col overflow-hidden [--fact-w:14rem] sm:w-64 sm:[--fact-w:16rem]"
                      onAnimationEnd={() => {
                        measure()
                        schedule()
                      }}
                    >
                      <span class="relative flex h-3 shrink-0 items-center" aria-hidden="true">
                        <span class="bg-secondary/50 h-px w-full" />
                        <span
                          data-rail-dot
                          class="bg-secondary ring-secondary/25 absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full ring-3"
                        />
                      </span>
                      <FactCard
                        fact={item}
                        spanYears={props.spanYears}
                        onNext={props.onFactNext}
                        onClose={props.onFactClose}
                      />
                    </li>
                  )
                }
                const event = item
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
                 * Every card is `--card-h` tall, set on the tray from
                 * `src/layout.ts`. The scrollbar rides under the cards, 1 rem
                 * below them: the `pb-4` on the strip.
                 */
                return (
                  <li
                    data-event={event.id}
                    class="flex h-(--card-h) w-56 shrink-0 flex-col sm:w-64"
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
                      class="bg-base-100 focus-visible:ring-accent/40 rounded-box mx-[calc(var(--card-gap)/2)] flex min-h-0 flex-1 cursor-pointer flex-col overflow-hidden border px-4 py-3 text-left transition focus-visible:ring-2 focus-visible:outline-none"
                      classList={{
                        // The live card: one thin line in the accent and a soft
                        // lift off the tray. Nothing louder than that.
                        'border-accent shadow-md shadow-accent/10': nearest(),
                        // Inside a stretch: the marker is standing in it, so keep it lit.
                        'border-accent/40': during() && !nearest(),
                        'border-base-300 hover:border-base-content/25': !during() && !nearest(),
                        // Past cards step back, but only so far: their small grey text still
                        // has to clear 4.5:1 on the card.
                        'opacity-85': gone() && !nearest(),
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
                      <span class="font-display block text-lg leading-tight tabular-nums sm:text-xl">
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
                                  <span class="text-base-content/70 mx-0.5 text-[0.8em]">
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
                      {/* One quiet line under the date, its parts joined by a middle dot. */}
                      <span class="text-base-content/80 mt-0.5 text-[0.65rem] tabular-nums [&>*+*]:before:mx-1 [&>*+*]:before:content-['·']">
                        <Show when={props.showCalendar}>
                          <span>
                            {formatCalendarYear(event.yearsAgo)}
                            <Show when={end() !== undefined}>
                              {' – '}
                              {formatCalendarYear(end()!)}
                            </Show>
                          </span>
                        </Show>
                        <Show when={props.showGenerations}>
                          <span>
                            {formatGenerationsAgo(event.generationsAgo)}
                          </span>
                        </Show>
                        {/* A moment carries its error bar in the date line above; a
                            stretch says how long it lasted instead. */}
                        <Show when={end() !== undefined}>
                          <span>
                            lasted {formatYears(event.yearsAgo - end()!)}
                          </span>
                        </Show>
                      </span>
                      {/* Where it lands on the reader's own arm, when that is a
                          body part: a row of its own. A stretch goes by where
                          it starts. The date's ± counts, always — the knob
                          that hides the ± on the arm does not move the body. */}
                      <Show
                        when={
                          // A stretch that began before the arm did has no
                          // start on the body to name.
                          event.yearsAgo <= props.spanYears &&
                          bodyAt(
                          1 - event.yearsAgo / props.spanYears,
                          (event.uncertaintyYears ?? 0) / props.spanYears,
                          )
                        }
                      >
                        {(body) => (
                          <span class="text-base-content/70 mt-0.5 text-[0.65rem]">{body()}</span>
                        )}
                      </Show>

                      <span class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span class="font-display text-base leading-snug">{event.label}</span>
                        <Show when={event.certainty === 'disputed'}>
                          <span class="badge badge-warning badge-xs">disputed</span>
                        </Show>
                      </span>

                      <Show when={event.description}>
                        <span class="text-base-content/80 card-blurb mt-1 min-h-0 flex-1 overflow-hidden text-xs leading-relaxed">
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

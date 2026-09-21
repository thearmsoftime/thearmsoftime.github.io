import { Show, createEffect, createSignal, on, onCleanup, onMount } from 'solid-js'

interface Props {
  /** Redraw triggers: the marker moves, the live card changes, the timeline changes. */
  pos: number
  nearestId: string | null
  timelineId: string
}

interface Ends {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Below this the two ends are the same point, so there is nothing to draw. */
const MIN_DROP = 8

const same = (a: Ends, b: Ends) =>
  Math.abs(a.x1 - b.x1) < 0.5 &&
  Math.abs(a.y1 - b.y1) < 0.5 &&
  Math.abs(a.x2 - b.x2) < 0.5 &&
  Math.abs(a.y2 - b.y2) < 0.5

/**
 * A thin line from the marker readout down to the card the marker is standing
 * on, so the reading and the event are visibly the same thing.
 *
 * Both ends move on their own: the readout glides with the knob, and the strip
 * scrolls the live card back to the middle. Neither reports when it is done,
 * so this measures the two anchors frame by frame and gives up once they have
 * stopped moving.
 */
export default function MarkerLink(props: Props) {
  let host!: HTMLDivElement
  /** Kept after it goes away, so the line has something to fade out along. */
  const [ends, setEnds] = createSignal<Ends | null>(null)
  const [live, setLive] = createSignal(false)
  let frame = 0
  let still = 0

  /** Reads both anchors out of the page. True when anything moved. */
  const measure = (): boolean => {
    const from = document.querySelector<HTMLElement>('[data-marker-anchor]')
    const to = props.nearestId
      ? document.querySelector<HTMLElement>(
          `[data-event="${CSS.escape(props.nearestId)}"] [data-rail-dot]`,
        )
      : null

    if (!host || !from || !to) {
      const was = live()
      setLive(false)
      return was
    }

    const box = host.getBoundingClientRect()
    const a = from.getBoundingClientRect()
    const b = to.getBoundingClientRect()
    const next: Ends = {
      x1: a.left + a.width / 2 - box.left,
      y1: a.bottom - box.top,
      x2: b.left + b.width / 2 - box.left,
      y2: b.top + b.height / 2 - box.top,
    }

    setLive(next.y2 - next.y1 > MIN_DROP)
    const prev = ends()
    if (prev && same(prev, next)) return false
    setEnds(next)
    return true
  }

  /** Measure every frame until the page holds still for a few of them. */
  const track = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const moved = measure()
      still = moved ? 0 : still + 1
      if (still < 8) track()
    })
  }

  const kick = () => {
    still = 0
    track()
  }

  createEffect(
    on(
      () => [props.pos, props.nearestId, props.timelineId] as const,
      kick,
    ),
  )

  onMount(() => {
    // The strip scrolls its own live card into the middle: catch that in the
    // capture phase, since scroll events do not bubble.
    document.addEventListener('scroll', kick, true)
    window.addEventListener('resize', kick)
    onCleanup(() => {
      document.removeEventListener('scroll', kick, true)
      window.removeEventListener('resize', kick)
      cancelAnimationFrame(frame)
    })
  })

  /** Straight out of the readout, straight into the dot, curved in between. */
  const path = (e: Ends) => {
    const bend = Math.max((e.y2 - e.y1) * 0.55, 10)
    return `M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + bend}, ${e.x2} ${e.y2 - bend}, ${e.x2} ${e.y2}`
  }

  return (
    <div ref={host} class="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <svg
        class="text-accent absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ opacity: live() ? 1 : 0 }}
      >
        <Show when={ends()}>
          {(e) => (
            <>
              <defs>
                {/* The line fades in out of the readout and out into the dot. */}
                <linearGradient
                  id="marker-link-fade"
                  gradientUnits="userSpaceOnUse"
                  x1={e().x1}
                  y1={e().y1}
                  x2={e().x2}
                  y2={e().y2}
                >
                  <stop offset="0" stop-color="currentColor" stop-opacity="0" />
                  <stop offset="0.3" stop-color="currentColor" stop-opacity="0.75" />
                  <stop offset="0.7" stop-color="currentColor" stop-opacity="0.75" />
                  <stop offset="1" stop-color="currentColor" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d={path(e())}
                fill="none"
                stroke="url(#marker-link-fade)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </>
          )}
        </Show>
      </svg>
    </div>
  )
}

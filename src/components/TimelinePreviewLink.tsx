import { For, Show, createEffect, createSignal, on, onCleanup, onMount } from 'solid-js'

interface Props {
  /** The timeline being previewed in the picker, or null. Redraw trigger. */
  timelineId: string | null
  /**
   * Anything else that moves what the lines join, as one value. Picking a
   * timeline leaves the pointer on the button it was already on, so the hover
   * never changes while the span under it becomes a different stretch of arm:
   * without this the lines would keep pointing at where it used to be.
   */
  redrawKey: string
}

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** The curves start inside the pill, not on its corners. */
const BUTTON_INSET = 5
/** Clear of the pill's own edge, so the line is not born under the border. */
const START_DROP = 2

/**
 * Two thin curves from the hovered timeline button down onto the span it would
 * cover, one to each edge of it, so the button and the stretch of arm read as
 * the same thing. The same line as `MarkerLink` draws to the live card.
 *
 * Everything it joins is fixed while it shows — nothing here animates — so it
 * measures on the frame after the hover and then only on a resize. Viewport
 * coordinates: the overlay is fixed, because the button sits in the header and
 * the span sits on the arms, in two different stacking contexts.
 */
export default function TimelinePreviewLink(props: Props) {
  const [lines, setLines] = createSignal<Line[]>([])
  let frame = 0

  const measure = () => {
    const id = props.timelineId
    // On the way out the span is already gone from the page. The last pair of
    // lines is kept so the overlay has something to fade out along.
    if (!id) return
    const button = document.querySelector<HTMLElement>(`[data-segment="${CSS.escape(id)}"]`)
    // The span is drawn twice — once in the timeline strip, once down the figure —
    // so the target is the two of them together: the top edge of the strip and
    // the outer edges of both.
    const blocks = [...document.querySelectorAll<HTMLElement>('[data-preview-span]')]
    if (!button || blocks.length === 0) {
      setLines([])
      return
    }

    const a = button.getBoundingClientRect()
    const boxes = blocks.map((el) => el.getBoundingClientRect())
    const left = Math.min(...boxes.map((b) => b.left))
    const right = Math.max(...boxes.map((b) => b.right))
    const top = Math.min(...boxes.map((b) => b.top))

    setLines([
      { x1: a.left + BUTTON_INSET, y1: a.bottom + START_DROP, x2: left, y2: top },
      { x1: a.right - BUTTON_INSET, y1: a.bottom + START_DROP, x2: right, y2: top },
    ])
  }

  // Two frames: picking a timeline rebuilds the strip, and the second frame is
  // where it has settled into its new width.
  const kick = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      measure()
      frame = requestAnimationFrame(measure)
    })
  }

  createEffect(on(() => [props.timelineId, props.redrawKey] as const, kick))

  onMount(() => {
    window.addEventListener('resize', kick)
    onCleanup(() => {
      window.removeEventListener('resize', kick)
      cancelAnimationFrame(frame)
    })
  })

  /** Straight down out of the button, straight down into the edge, curved between. */
  const path = (l: Line) => {
    const bend = Math.max((l.y2 - l.y1) * 0.55, 12)
    return `M ${l.x1} ${l.y1} C ${l.x1} ${l.y1 + bend}, ${l.x2} ${l.y2 - bend}, ${l.x2} ${l.y2}`
  }

  return (
    <div class="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      <svg
        class="text-accent absolute inset-0 h-full w-full transition-opacity duration-200"
        style={{ opacity: props.timelineId ? 1 : 0 }}
      >
        <Show when={lines().length > 0}>
          <defs>
            <For each={lines()}>
              {(l, i) => (
                // Out of nothing at the button, and up to full strength where it
                // meets the span's own edge line, so the two read as one stroke.
                <linearGradient
                  id={`timeline-link-fade-${i()}`}
                  gradientUnits="userSpaceOnUse"
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                >
                  <stop offset="0" stop-color="currentColor" stop-opacity="0" />
                  <stop offset="0.45" stop-color="currentColor" stop-opacity="0.7" />
                  <stop offset="1" stop-color="currentColor" stop-opacity="0.7" />
                </linearGradient>
              )}
            </For>
          </defs>
          <For each={lines()}>
            {(l, i) => (
              <path
                d={path(l)}
                fill="none"
                stroke={`url(#timeline-link-fade-${i()})`}
                stroke-width="1.5"
                stroke-linecap="round"
              />
            )}
          </For>
        </Show>
      </svg>
    </div>
  )
}

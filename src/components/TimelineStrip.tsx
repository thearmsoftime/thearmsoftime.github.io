import { For, Show, createSignal, onCleanup } from 'solid-js'
import { xFrac, type PlacedBand } from '../figure'

interface Props {
  rows: PlacedBand[][]
  /** 0..1 along the arm span. The strip lines up with the arms above it. */
  pos: number
  /** Click a band to jump the marker to where it starts. */
  onPick: (t: number) => void
  /** A shorter timeline being previewed: where it starts, 0..1 along this one. */
  previewFrom?: number
  /** The cell the pointer is on, null when it leaves. Lifts its column down the figure. */
  onHoverBand?: (band: PlacedBand | null) => void
}

const pct = (t: number) => `${xFrac(t) * 100}%`

/** Roughly how wide a character of the label is, at the size the cells use. */
const CHAR_PX = 4.8

/**
 * The named spans — eons, periods, species, ages — on their own strip above
 * the arms. Optional: on the drawing they crowd the figure, so they live here
 * and can be switched off. Coarsest row first, so the finest ends up nearest
 * the arms.
 */
export default function TimelineStrip(props: Props) {
  const [width, setWidth] = createSignal(0)

  const observer = new ResizeObserver((entries) => {
    const box = entries[0]
    if (box) setWidth(box.contentRect.width)
  })
  onCleanup(() => observer.disconnect())

  /**
   * A cell narrower than its own name shows a clipped stump of it, and a row
   * of stumps reads as noise. Below that width the cell stays a plain block
   * and the tooltip carries the name.
   */
  const fits = (b: PlacedBand): boolean => {
    const cellPx = (xFrac(b.to) - xFrac(b.from)) * width()
    return cellPx >= b.band.label.length * CHAR_PX + 8
  }

  return (
    <div ref={(el) => observer.observe(el)} class="timeline-fade relative w-full pb-1.5">
      <For each={props.rows}>
        {(row) => (
          <div class="relative h-[1rem] sm:h-[1.15rem]">
            <For each={row}>
              {(b) => {
                const here = () => props.pos >= b.from && props.pos <= b.to
                const lift = () => props.onHoverBand?.(b)
                const drop = () => props.onHoverBand?.(null)
                // `tooltip` brings its own `position` and `display`, and the
                // utilities win them back. It also means no `overflow-hidden`
                // on the cell — that would clip the bubble — so the label
                // clips itself one level in.
                return (
                  <button
                    type="button"
                    class="tooltip absolute inset-y-0 flex items-center justify-center rounded-[3px] border px-1 text-[0.5rem] leading-none font-semibold tracking-[0.08em] whitespace-nowrap uppercase transition-colors sm:text-[0.6rem]"
                    style={{
                      left: pct(b.from),
                      width: `calc(${(xFrac(b.to) - xFrac(b.from)) * 100}% + 1px)`,
                      color: b.color,
                      'border-color': `color-mix(in oklab, ${b.color} ${here() ? 90 : 55}%, transparent)`,
                      'background-color': `color-mix(in oklab, ${b.color} ${here() ? 34 : 15}%, transparent)`,
                    }}
                    data-tip={`${b.band.label}${b.band.kind ? ` · ${b.band.kind}` : ''}`}
                    aria-label={b.band.label}
                    onClick={() => props.onPick(b.from)}
                    // Focus counts as hover, so the column works from the keyboard.
                    onPointerEnter={lift}
                    onPointerLeave={drop}
                    onFocus={lift}
                    onBlur={drop}
                  >
                    <Show when={fits(b)}>
                      <span class="min-w-0 truncate">{b.band.label}</span>
                    </Show>
                  </button>
                )
              }}
            </For>
          </div>
        )}
      </For>

      {/*
        The previewed timeline's span, carried up through the strip so its two
        edges read as one column running down into the arms.
      */}
      <Show when={props.previewFrom !== undefined}>
        <div
          data-preview-span
          class="border-accent/70 bg-accent/10 pointer-events-none absolute inset-y-0 bottom-1.5 border-x"
          style={{
            left: pct(props.previewFrom!),
            width: `max(2px, ${(xFrac(1) - xFrac(props.previewFrom!)) * 100}%)`,
          }}
        />
      </Show>

      {/* Where the knob is, carried up through the strip. */}
      <Show when={props.rows.length > 0}>
        <div
          class="bg-accent pointer-events-none absolute inset-y-0 bottom-1.5 w-px opacity-80"
          style={{ left: pct(props.pos) }}
        />
      </Show>
    </div>
  )
}

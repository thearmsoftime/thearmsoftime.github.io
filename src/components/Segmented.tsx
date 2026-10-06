import { For } from 'solid-js'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** One short line in the tooltip. Left off, the button has no tooltip. */
  tip?: string
  /** Only there behind `?dev=1`, so it wears the dev purple. */
  dev?: boolean
}

interface Props<T extends string> {
  /** Names the group for screen readers. */
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /**
   * The option the pointer or the keyboard is on, null when it leaves. Lets a
   * caller preview what picking it would do. Optional.
   */
  onHover?: (value: T | null) => void
}

/** One small pill of buttons. Used for both the timeline and the theme. */
export default function Segmented<T extends string>(props: Props<T>) {
  return (
    <div
      class="border-base-300 bg-base-200/70 flex items-center rounded-full border p-0.5"
      role="radiogroup"
      aria-label={props.label}
    >
      <For each={props.options}>
        {(option) => {
          const active = () => props.value === option.value
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active()}
              data-tip={option.tip}
              // Lets an overlay find this button and draw a line from it.
              data-segment={option.value}
              // The bar is stuck to the top, so the note opens downwards.
              class="tooltip tooltip-bottom focus-visible:ring-accent/50 rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-3 sm:text-xs"
              classList={{
                // The one already chosen does nothing when pressed, so it
                // does not offer the hand.
                'cursor-default': active(),
                'bg-accent text-accent-content': active() && !option.dev,
                'text-base-content/55 hover:text-base-content': !active() && !option.dev,
                'hover:opacity-80': !active() && !!option.dev,
              }}
              // The purple is a CSS variable, not a theme colour, so it goes
              // inline — the same way the dev buttons in Settings wear it.
              style={
                option.dev
                  ? active()
                    ? { 'background-color': 'var(--dev)', color: 'var(--dev-content)' }
                    : { color: 'var(--dev)' }
                  : undefined
              }
              onClick={() => props.onChange(option.value)}
              // Focus counts as hover, so the preview works from the keyboard.
              onPointerEnter={() => props.onHover?.(option.value)}
              onPointerLeave={() => props.onHover?.(null)}
              onFocus={() => props.onHover?.(option.value)}
              onBlur={() => props.onHover?.(null)}
            >
              {option.label}
            </button>
          )
        }}
      </For>
    </div>
  )
}

import { For } from 'solid-js'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Shown on hover, used for the zone's data note. */
  title?: string
}

interface Props<T extends string> {
  /** Names the group for screen readers. */
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
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
              title={option.title}
              class="focus-visible:ring-accent/50 rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-3 sm:text-xs"
              classList={{
                'bg-accent text-accent-content': active(),
                'text-base-content/55 hover:text-base-content': !active(),
              }}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </button>
          )
        }}
      </For>
    </div>
  )
}

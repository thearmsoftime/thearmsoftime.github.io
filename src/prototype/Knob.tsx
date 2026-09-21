import { For, Show } from 'solid-js'

/**
 * The parts every prototype tab is built from: a slider row, a heading to
 * group them under, and a tiny picker for the few knobs that are a choice
 * rather than a number. They all wear the dev purple.
 */

interface KnobProps {
  label: string
  /** What the number means in the file, for the row under the slider. */
  hint?: string
  min: number
  max: number
  step: number
  value: number
  /** How the value reads next to its name. */
  show: (value: number) => string
  onInput: (value: number) => void
}

export function Knob(props: KnobProps) {
  return (
    <label class="block">
      <span class="flex items-baseline justify-between gap-2">
        <span class="text-[0.68rem] font-medium">{props.label}</span>
        <span class="text-base-content/45 text-[0.62rem] tabular-nums">
          {props.show(props.value)}
        </span>
      </span>
      <input
        type="range"
        class="range range-xs mt-0.5 w-full"
        // Dev purple, the way DaisyUI's own `range-primary` does it.
        style={{ color: 'var(--dev)', '--range-thumb': 'var(--dev-content)' }}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={(e) => props.onInput(Number(e.currentTarget.value))}
      />
      <Show when={props.hint}>
        {(hint) => <span class="text-base-content/35 text-[0.58rem]">{hint()}</span>}
      </Show>
    </label>
  )
}

/** A line of text that says what the next few knobs belong to. */
export function Group(props: { title: string }) {
  return (
    <span
      class="mt-1 text-[0.55rem] font-medium tracking-[0.14em] uppercase first:mt-0"
      style={{ color: 'color-mix(in oklab, var(--dev) 75%, var(--fallback-bc, currentColor))' }}
    >
      {props.title}
    </span>
  )
}

interface ChoiceProps<T extends string> {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onPick: (value: T) => void
}

/** Two or three words in a pill, for a knob that is not a number. */
export function Choice<T extends string>(props: ChoiceProps<T>) {
  return (
    <div class="flex items-center justify-between gap-2">
      <span class="text-[0.68rem] font-medium">{props.label}</span>
      <div class="border-base-300 bg-base-200/70 flex items-center rounded-full border p-0.5">
        <For each={props.options}>
          {(option) => (
            <button
              type="button"
              class="rounded-full px-1.5 py-px text-[0.58rem] font-medium"
              classList={{
                'text-base-content/55 hover:text-base-content': option.value !== props.value,
              }}
              style={
                option.value === props.value
                  ? { 'background-color': 'var(--dev)', color: 'var(--dev-content)' }
                  : undefined
              }
              onClick={() => props.onPick(option.value)}
            >
              {option.label}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

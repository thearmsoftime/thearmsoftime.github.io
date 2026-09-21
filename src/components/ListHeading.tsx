import { Show } from 'solid-js'

interface Props {
  count: number
  /** What clicking does, in the words of the layout that is showing. */
  action: string
  /** The one punchy line for this timeline, or the timeline's data note. */
  line?: string
}

/** The line in the footer: what the events are, how many, how to use them. */
export default function ListHeading(props: Props) {
  return (
    <div class="pb-0.5">
      <div class="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5">
        <h2 class="text-[0.65rem] font-semibold tracking-[0.22em] whitespace-nowrap uppercase">
          Along the arms
        </h2>
        <p class="text-base-content/40 text-[0.65rem] whitespace-nowrap">
          {props.count} events · {props.action}
        </p>
        <p class="text-base-content/35 hidden text-[0.65rem] whitespace-nowrap lg:block">
          <span class="text-base-content/55">← →</span> step ·{' '}
          <span class="text-base-content/55">Shift</span> jumps ·{' '}
          <span class="text-base-content/55">Alt</span> hops between events
        </p>
      </div>
      <Show when={props.line}>
        {(line) => (
          <p class="text-base-content/35 hidden truncate text-[0.65rem] md:block">{line()}</p>
        )}
      </Show>
    </div>
  )
}

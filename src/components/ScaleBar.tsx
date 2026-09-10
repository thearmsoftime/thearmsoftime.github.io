import { Show } from 'solid-js'
import { NAIL_FILE_MM, type ScaleReadout } from '../scale'

interface Props {
  scale: ScaleReadout
  armSpanM: number
  totalYears: string
  totalGenerations: string
  /** Generations only mean something on the human timeline. */
  showGenerations: boolean
  /** The one punchy line for this zone, from the research notes. */
  fact?: string
}

function Cell(props: {
  label: string
  value: string
  sub?: string
  strong?: boolean
  class?: string
}) {
  return (
    <div class={`flex items-baseline gap-2 whitespace-nowrap ${props.class ?? ''}`}>
      <span class="text-base-content/40 text-[0.6rem] tracking-[0.14em] uppercase">
        {props.label}
      </span>
      <span class="text-sm font-semibold tabular-nums" classList={{ 'text-accent': props.strong }}>
        {props.value}
      </span>
      <Show when={props.sub}>
        {(sub) => <span class="text-base-content/45 text-[0.65rem] tabular-nums">{sub()}</span>}
      </Show>
    </div>
  )
}

/** One line of numbers under the arms: the whole span, and what a millimetre buys. */
export default function ScaleBar(props: Props) {
  const gen = (text: string) => (props.showGenerations ? text : undefined)

  return (
    <section class="border-base-300/60 mx-auto w-full max-w-[110rem] shrink-0 border-b px-3 py-1.5 sm:px-6">
      <div class="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1">
        <Cell label="Whole span" value={props.totalYears} sub={gen(props.totalGenerations)} />
        <Cell
          label={`1 mm of ${props.armSpanM.toFixed(2)} m`}
          value={props.scale.perMm}
          sub={gen(props.scale.perMmGenerations)}
          strong
        />
        <Cell
          label={`Nail file (${NAIL_FILE_MM} mm)`}
          value={props.scale.nailFile}
          sub={gen(props.scale.nailFileGenerations)}
        />
        <Cell
          label={props.scale.comparisonLabel}
          value={props.scale.comparisonLength}
          class="hidden lg:flex"
        />
      </div>

      {/* One line, never two: it must not cost the layout any height. */}
      <Show when={props.fact}>
        {(fact) => (
          <p class="text-base-content/45 hidden truncate pt-0.5 text-center text-[0.65rem] md:block">
            {fact()}
          </p>
        )}
      </Show>
    </section>
  )
}

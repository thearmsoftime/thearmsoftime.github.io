import { Show, createMemo } from 'solid-js'
import Segmented from './Segmented'
import { formatYears } from '../format'
import SettingsMenu from './SettingsMenu'
import type { ThemeChoice } from '../theme'
import type { Detail } from '../data'
import type { Timeline } from '../types'

interface Props {
  timelines: Timeline[]
  timelineId: string
  onTimeline: (id: string) => void
  /** Which timeline the pointer is on, so the arms can preview its span. */
  onTimelineHover: (id: string | null) => void
  /** The named spans under the arms: eons, species, ages. */
  showBands: boolean
  onShowBands: (next: boolean) => void
  detail: Detail
  onDetail: (next: Detail) => void
  showUncertainty: boolean
  onShowUncertainty: (next: boolean) => void
  spanText: string
  onSpanText: (text: string) => void
  onSpanCommit: () => void
  theme: ThemeChoice
  onTheme: (theme: ThemeChoice) => void
  onOpenDev: () => void
  onOpenData: () => void
  onOpenProto: () => void
  onOpenOdd: () => void
  /** Puts a fun fact on the arm. Absent when this timeline has none. */
  onFact?: () => void
  /** True while one is showing, so the button offers the next one instead. */
  factOn: boolean
}

const Bulb = () => (
  <svg
    viewBox="0 0 24 24"
    class="size-4"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .9 1.6h5.2c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
  </svg>
)

/**
 * One line, stuck to the top: the title on the left, the timeline picker in
 * the middle of the screen, the fun fact, and everything you can set behind
 * one button on the right.
 */
export default function Header(props: Props) {
  const timelineOptions = createMemo(() =>
    props.timelines.map((timeline) => ({
      value: timeline.id,
      label: timeline.label,
      // What the timeline is and how long it runs. The research note is far too
      // long to hover — it stays under the events, where there is room to read.
      tip: `${timeline.startLabel} to ${timeline.endLabel} · ${formatYears(timeline.spanYears)}`,
    })),
  )

  return (
    <header class="border-base-300/70 bg-base-100/85 sticky top-0 z-30 shrink-0 border-b backdrop-blur-md">
      <div class="mx-auto grid max-w-[75rem] grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-3 py-1.5 sm:px-6">
        {/* One word in the accent, set in italic: the title in two colours. */}
        <span class="font-display min-w-0 truncate text-sm sm:text-lg">
          The Arms <em class="text-accent">of</em> Time
        </span>

        {/* One timeline left needs no picker. */}
        <Show when={timelineOptions().length > 1}>
          <div class="justify-self-center">
            <Segmented
              label="Timeline"
              options={timelineOptions()}
              value={props.timelineId}
              onChange={props.onTimeline}
              onHover={props.onTimelineHover}
            />
          </div>
        </Show>

        <div class="flex items-center gap-1.5 justify-self-end">
          {/*
            Next to the settings, because it is the one thing on this bar that
            changes the drawing rather than the reading of it.
          */}
          <Show when={props.onFact}>
            {(fire) => (
              <button
                type="button"
                class="focus-visible:ring-secondary/50 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-xs"
                classList={{
                  'bg-secondary text-secondary-content border-secondary': props.factOn,
                  'border-base-300 bg-base-200/70 text-base-content/55 hover:text-base-content':
                    !props.factOn,
                }}
                onClick={() => fire()()}
              >
                <Bulb />
                <span class="hidden sm:inline">{props.factOn ? 'Another fact' : 'Fun fact'}</span>
              </button>
            )}
          </Show>

          <SettingsMenu
            showBands={props.showBands}
            onShowBands={props.onShowBands}
            detail={props.detail}
            onDetail={props.onDetail}
            showUncertainty={props.showUncertainty}
            onShowUncertainty={props.onShowUncertainty}
            spanText={props.spanText}
            onSpanText={props.onSpanText}
            onSpanCommit={props.onSpanCommit}
            theme={props.theme}
            onTheme={props.onTheme}
            onOpenDev={props.onOpenDev}
            onOpenData={props.onOpenData}
            onOpenProto={props.onOpenProto}
            onOpenOdd={props.onOpenOdd}
          />
        </div>
      </div>
    </header>
  )
}

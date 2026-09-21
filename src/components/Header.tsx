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
}

/**
 * One line, stuck to the top: the title on the left, the timeline picker in
 * the middle of the screen, and everything you can set behind one button on
 * the right.
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
      <div class="mx-auto grid max-w-[130rem] grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-3 py-1.5 sm:px-6">
        <span class="font-display min-w-0 truncate text-[0.72rem] tracking-[0.18em] uppercase sm:text-sm">
          The Arms of Time
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

        <div class="justify-self-end">
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
          />
        </div>
      </div>
    </header>
  )
}

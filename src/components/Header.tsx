import { createMemo } from 'solid-js'
import Segmented from './Segmented'
import { THEME_LABEL, THEMES, type Theme } from '../theme'
import type { Zone } from '../types'

interface Props {
  zones: Zone[]
  zoneId: string
  onZone: (id: string) => void
  spanText: string
  onSpanText: (text: string) => void
  onSpanCommit: () => void
  theme: Theme
  onTheme: (theme: Theme) => void
}

const THEME_OPTIONS = THEMES.map((value) => ({ value, label: THEME_LABEL[value] }))

/** The only chrome on the page: one line, stuck to the top, nothing below it. */
export default function Header(props: Props) {
  const zoneOptions = createMemo(() =>
    props.zones.map((zone) => ({ value: zone.id, label: zone.label, title: zone.note })),
  )

  return (
    <header class="border-base-300/70 bg-base-100/85 sticky top-0 z-30 shrink-0 border-b backdrop-blur-md">
      <div class="mx-auto flex max-w-[110rem] flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 sm:px-6">
        <span class="font-display mr-auto text-[0.72rem] tracking-[0.18em] whitespace-nowrap uppercase sm:text-sm">
          The Arms of Time
        </span>

        <Segmented
          label="Timeline"
          options={zoneOptions()}
          value={props.zoneId}
          onChange={props.onZone}
        />

        <label class="border-base-300 bg-base-200/70 flex items-center gap-1.5 rounded-full border px-2.5 py-1">
          <span class="text-base-content/50 text-[0.68rem] whitespace-nowrap">Arm span</span>
          <input
            type="number"
            class="w-11 bg-transparent text-right text-xs tabular-nums outline-none"
            min="0.5"
            max="2.6"
            step="0.01"
            inputmode="decimal"
            aria-label="Arm span in metres"
            value={props.spanText}
            onInput={(e) => props.onSpanText(e.currentTarget.value)}
            onChange={props.onSpanCommit}
            onBlur={props.onSpanCommit}
          />
          <span class="text-base-content/50 text-[0.68rem]">m</span>
        </label>

        <Segmented
          label="Theme"
          options={THEME_OPTIONS}
          value={props.theme}
          onChange={props.onTheme}
        />
      </div>
    </header>
  )
}

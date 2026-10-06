import { Show, createSignal, onCleanup, onMount, type JSX } from 'solid-js'
import Segmented from './Segmented'
import { THEME_CHOICES, THEME_LABEL, type ThemeChoice } from '../theme'
import { DEV, bodyMarks, setBodyMarks } from '../dev'
import KofiLink from './KofiLink'
import { AboutButton } from './About'
import type { Detail } from '../data'

const DETAIL_OPTIONS = [
  { value: 'simple' as const, label: 'Simple', title: 'A short list: only the turning points' },
  { value: 'all' as const, label: 'All', title: 'Every event in the data' },
]

const BANDS_OPTIONS = [
  { value: 'on' as const, label: 'On' },
  { value: 'off' as const, label: 'Off' },
]

const NUMBER_OPTIONS = [
  { value: 'plain' as const, label: 'Plain', title: 'Round numbers, the way people say them' },
  { value: 'science' as const, label: 'Science', title: 'Each date with its ± error bar' },
]

const THEME_OPTIONS = THEME_CHOICES.map((value) => ({ value, label: THEME_LABEL[value] }))

interface Props {
  /** The named spans under the arms: eons, species, ages. */
  showBands: boolean
  onShowBands: (next: boolean) => void
  detail: Detail
  onDetail: (next: Detail) => void
  /** Dates carry their ± error bar. */
  showUncertainty: boolean
  onShowUncertainty: (next: boolean) => void
  spanText: string
  onSpanText: (text: string) => void
  onSpanCommit: () => void
  theme: ThemeChoice
  onTheme: (theme: ThemeChoice) => void
  /** Opens the ruler workbench. Dev mode only. */
  onOpenDev: () => void
  /** Opens the prototype panel. Dev mode only. */
  onOpenProto: () => void
  /** Opens the data browser. Dev mode only. */
  onOpenData: () => void
  /** Opens the odd-facts panel. Dev mode only. */
  onOpenOdd: () => void
}

/** A label above its control, so the menu reads as a column of settings. */
function Field(props: { label: string; hint?: string; children: JSX.Element }) {
  return (
    <div class="flex flex-col gap-1">
      <span class="text-base-content/40 text-[0.6rem] tracking-[0.14em] uppercase">
        {props.label}
      </span>
      {props.children}
      <Show when={props.hint}>
        {(hint) => <span class="text-base-content/35 text-[0.62rem]">{hint()}</span>}
      </Show>
    </div>
  )
}

/** A way into a dev-only workbench. Purple, like everything behind `?dev=1`. */
function DevButton(props: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      class="w-fit rounded-full border px-2.5 py-1 text-[0.7rem] font-medium tracking-wide transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
      style={{
        color: 'var(--dev)',
        'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)',
        'background-color': 'color-mix(in oklab, var(--dev) 12%, transparent)',
      }}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  )
}

const Gear = () => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.06A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.06A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.06A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.06a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.06a1.7 1.7 0 0 0-1.54 1.03z" />
  </svg>
)

/**
 * Everything you can set, folded into one button at the top right. The page
 * itself stays clear: the arms and the list get the whole viewport.
 */
export default function SettingsMenu(props: Props) {
  const [open, setOpen] = createSignal(false)
  let root!: HTMLDivElement

  // Click anywhere else, or press Escape, and the menu goes away.
  onMount(() => {
    const onPointer = (e: PointerEvent) => {
      if (open() && !root.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open()) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    onCleanup(() => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    })
  })

  return (
    <div class="relative" ref={root}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open()}
        // No tooltip: on `sm` and up the word is right there next to the gear,
        // and below that there is no hover to speak of.
        aria-label="Settings"
        class="focus-visible:ring-accent/50 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-xs"
        classList={{
          'bg-accent text-accent-content border-accent': open(),
          'border-base-300 bg-base-200/70 text-base-content/55 hover:text-base-content': !open(),
        }}
        onClick={() => setOpen(!open())}
      >
        <Gear />
        <span class="hidden sm:inline">Settings</span>
      </button>

      <Show when={open()}>
        <div
          role="dialog"
          aria-label="Settings"
          class="border-base-300 rounded-box bg-base-100 absolute end-0 z-40 mt-2 flex w-60 flex-col gap-4 border p-3 shadow-xl"
        >
          <Field label="Theme">
            <Segmented
              label="Theme"
              options={THEME_OPTIONS}
              value={props.theme}
              onChange={props.onTheme}
            />
          </Field>

          <Field label="Arm span" hint="Your own reach, in metres.">
            <label class="border-base-300 bg-base-200/70 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1">
              <input
                type="number"
                class="w-12 bg-transparent text-right text-xs tabular-nums outline-none"
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
          </Field>

          <Field label="Events">
            <Segmented
              label="How many events"
              options={DETAIL_OPTIONS}
              value={props.detail}
              onChange={props.onDetail}
            />
          </Field>

          <Field label="Numbers" hint="Science adds the ± error bar to each date.">
            <Segmented
              label="How dates are written"
              options={NUMBER_OPTIONS}
              value={props.showUncertainty ? 'science' : 'plain'}
              onChange={(next) => props.onShowUncertainty(next === 'science')}
            />
          </Field>

          <Field label="Time periods" hint="Named periods under the arms.">
            <Segmented
              label="Named periods under the arms"
              options={BANDS_OPTIONS}
              value={props.showBands ? 'on' : 'off'}
              onChange={(next) => props.onShowBands(next === 'on')}
            />
          </Field>

          {/*
            Only with `?dev=1`. Both of these are workbenches, not settings, so
            they wear the dev purple: nothing a visitor can reach is that
            colour.
          */}
          <Show when={DEV}>
            <div class="flex flex-col gap-1">
              <span
                class="text-[0.6rem] tracking-[0.14em] uppercase"
                style={{ color: 'var(--dev)' }}
              >
                Dev
              </span>
              <div class="flex flex-wrap gap-1.5">
                <DevButton
                  label="Prototype"
                  onClick={() => {
                    setOpen(false)
                    props.onOpenProto()
                  }}
                />
                <DevButton
                  label="Ruler workbench"
                  onClick={() => {
                    setOpen(false)
                    props.onOpenDev()
                  }}
                />
                <DevButton
                  label="Data browser"
                  onClick={() => {
                    setOpen(false)
                    props.onOpenData()
                  }}
                />
                <DevButton
                  label="Odd facts"
                  onClick={() => {
                    setOpen(false)
                    props.onOpenOdd()
                  }}
                />
              </div>
              <span class="text-base-content/35 text-[0.62rem]">
                Live knobs, candidate rulers, every row in `data/` as a table, and the
                two-gap facts.
              </span>
              <span class="mt-1.5 text-[0.6rem] tracking-[0.14em] uppercase" style={{ color: 'var(--dev)' }}>
                Body marks
              </span>
              <Segmented
                label="Body marks on the arms"
                options={BANDS_OPTIONS}
                value={bodyMarks() ? 'on' : 'off'}
                onChange={(next) => setBodyMarks(next === 'on')}
              />
              <span class="text-base-content/35 text-[0.62rem]">
                Wrist, elbow, knuckles and the rest, as purple lines. Hover one
                for where it sits and how much people differ.
              </span>
            </div>
          </Show>

          {/* Last, under a rule: the same two ways off the page as the footer
              corner, for the reader who looks here first. Support, then About.
              Clicking About closes the menu first, so the box is not opened
              underneath it. */}
          <div class="border-base-300 flex items-center gap-1.5 border-t pt-3">
            <KofiLink always />
            <div class="contents" onClick={() => setOpen(false)}>
              <AboutButton always />
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

import { For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { Portal } from 'solid-js/web'
import { visibleTimelines } from '../data'
import { createStoredSignal } from '../prefs'
import { formatLength, formatYears } from '../format'
import { HAIR_MM, NAIL_FILE_MM, REFERENCES, pickReference } from '../scale'

/**
 * Dev only. A scratch table for picking the rulers: every candidate size we
 * have considered, against every timeline, so the choice is made on the real
 * numbers instead of on a hunch. Nothing here ships to a visitor, and nothing
 * here is wired into the scale bar — promote a row to `YARDSTICKS` in
 * `scale.ts` once it earns its place.
 */

interface Candidate {
  label: string
  /** Thickness in millimetres, on an arm of this span. */
  mm: (armSpanM: number) => number
  /** Where the number comes from, and why it is on the list. */
  note: string
}

interface Group {
  title: string
  items: Candidate[]
}

/**
 * The old units are all cut from the same body, so they are written here as
 * fractions of the arm span, exactly like the finger already is. On the 1.8 m
 * man they land on their real sizes: a foot is 300 mm, a yard 900 mm, and a
 * fathom is the whole span — because a fathom *is* a pair of outstretched arms.
 */
const of = (fraction: number) => (armSpanM: number) => armSpanM * 1000 * fraction

const GROUPS: Group[] = [
  {
    title: 'Too small to hold',
    items: [
      { label: 'Carbon atom', mm: () => 1.5e-7, note: '0.15 nm across. Nothing the hand knows, but it is the punchline.' },
      { label: 'Red blood cell', mm: () => 0.007, note: 'Body scale, but nobody has a feel for 7 µm.' },
      { label: 'Eye limit', mm: () => 0.04, note: 'Smallest mark the naked eye resolves at reading distance.' },
      { label: 'Hair', mm: () => HAIR_MM, note: 'Runs 0.02–0.18 mm. This is the middle of it. Already shipping.' },
      { label: 'Nail file swipe', mm: () => NAIL_FILE_MM, note: 'One pass of the file. Also about one day of nail growth.' },
      { label: 'Fingerprint ridge', mm: () => 0.45, note: 'Ridge to ridge. The one you can actually count.' },
      { label: 'Nail', mm: () => 0.5, note: 'Thickness of a fingernail. Runs 0.3–0.65 mm.' },
      { label: 'Credit card', mm: () => 0.76, note: 'Not a body part. Here for calibration only.' },
      { label: 'Millimetre', mm: () => 1, note: 'The honest one. Already shipping.' },
    ],
  },
  {
    title: 'Measured off the body',
    items: [
      { label: 'Finger', mm: of(1 / 96), note: 'Vitruvius: a 96th of the span. Already shipping.' },
      { label: 'Fingernail', mm: of(1 / 180), note: 'Width, not thickness. About half a finger.' },
      { label: 'Thumb (inch)', mm: of(1 / 72), note: 'The inch is a thumb: pouce, duim, tomme, pollice. Really the thumb’s top joint.' },
      { label: 'Finger joint', mm: of(1 / 80), note: 'One kootje: the top bone of a finger. Where the inch comes from.' },
      { label: 'Palm', mm: of(1 / 24), note: 'Four fingers. Three inches.' },
      { label: 'Hand', mm: of(1 / 18), note: 'Four inches. Horses are still measured in these.' },
      { label: 'Hand span', mm: of(1 / 8), note: 'Thumb to little finger, spread. Nine inches.' },
      { label: 'Foot', mm: of(1 / 6), note: 'Four palms. Twelve inches.' },
      { label: 'Cubit', mm: of(1 / 4), note: 'Elbow to fingertip. Six palms. The pyramids are built in these.' },
      { label: 'Step', mm: of(5 / 12), note: 'One foot to the next. Two and a half feet.' },
      { label: 'Yard', mm: of(1 / 2), note: 'Nose to fingertip, arm out. Three feet.' },
      { label: 'Pace', mm: of(5 / 6), note: 'Both steps, heel to heel. Five feet. A Roman mile is a thousand.' },
      { label: 'Fathom', mm: of(1), note: 'Both arms out — this whole timeline is one fathom.' },
    ],
  },
]

/** The rulers the comparison row could be said in, small to large. */
const IN_UNITS: { label: string; plural: string; mm: (armSpanM: number) => number }[] = [
  { label: 'atom', plural: 'atoms', mm: () => 1.5e-7 },
  { label: 'hair', plural: 'hairs', mm: () => HAIR_MM },
  { label: 'swipe', plural: 'swipes', mm: () => NAIL_FILE_MM },
  { label: 'nail', plural: 'nails', mm: () => 0.5 },
]

/** Round counts a person says out loud, for the "reads as" column. */
const FRACTIONS: [number, string][] = [
  [1 / 4, 'A quarter of'],
  [1 / 3, 'A third of'],
  [1 / 2, 'Half'],
  [2 / 3, 'Two thirds of'],
  [1, 'About'],
  [1.5, 'One and a half'],
  [2, 'Two'],
  [3, 'Three'],
  [5, 'Five'],
  [10, 'Ten'],
]

/** "Half a hair", "Two hairs" — the wording the scale row would carry. */
function phrase(ratio: number, one: string, many: string): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return '—'
  let best = FRACTIONS[0]!
  let bestDistance = Infinity
  for (const f of FRACTIONS) {
    const d = Math.abs(Math.log(f[0] / ratio))
    if (d < bestDistance) {
      bestDistance = d
      best = f
    }
  }
  const [value, word] = best
  if (value < 1) return `${word} a ${one}`
  if (value === 1) return `About a ${one}`
  return `${word} ${many}`
}

const sig2 = (v: number): string =>
  v >= 100 ? Math.round(v).toLocaleString() : v.toPrecision(2).replace(/\.?0+$/, '')

type Tab = 'rulers' | 'comparison' | 'references'

const TABS: { value: Tab; label: string }[] = [
  { value: 'rulers', label: 'Rulers' },
  { value: 'comparison', label: 'Comparison row' },
  { value: 'references', label: 'Spans' },
]

interface Props {
  armSpanM: number
  /** The timeline on screen, so its column can be picked out of the table. */
  timelineId: string
  onSpanText: (text: string) => void
  onClose: () => void
}

export default function DevPanel(props: Props) {
  // The tab is remembered too: a reload should land back where you were.
  const [tab, setTab] = createStoredSignal<Tab>('devtab', 'rulers', (raw) =>
    TABS.some((t) => t.value === raw) ? (raw as Tab) : undefined,
  )
  /** Which timeline column the pointer is over, for the crosshair. */
  const [hotColumn, setHotColumn] = createSignal<number | null>(null)

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    document.addEventListener('keydown', onKey)
    onCleanup(() => document.removeEventListener('keydown', onKey))
  })

  /** Years per millimetre, one per timeline, on the span the slider is at. */
  const perMm = createMemo(() =>
    visibleTimelines.map((timeline) => ({
      timeline,
      yearsPerMm: timeline.spanYears / props.armSpanM / 1000,
    })),
  )

  const comparison = createMemo(() =>
    perMm().map(({ timeline, yearsPerMm }) => {
      const ref = pickReference(yearsPerMm * NAIL_FILE_MM)
      const mm = ref.years / yearsPerMm
      return { timeline, ref, mm }
    }),
  )

  /** Which reference the swipe rule lands on, per timeline, to mark it below. */
  const picked = createMemo(
    () => new Set(comparison().map(({ timeline, ref }) => `${timeline.id}|${ref.label}`)),
  )

  /** The crosshair: the row under the pointer is lit by CSS, the column here. */
  const columnClass = (index: number, timelineId: string) => ({
    'bg-base-200/70': hotColumn() === index,
    'text-accent': timelineId === props.timelineId,
  })

  return (
    <Portal>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ruler workbench"
          class="rounded-box bg-base-100 flex max-h-[85vh] w-full max-w-5xl flex-col border shadow-2xl"
          // Purple: this is a dev workbench, not part of what a visitor sees.
          style={{ 'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)' }}
        >
          {/* Title, tabs and the arm span, all on the strip that never scrolls. */}
          <div
            class="flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
            style={{
              'border-color': 'color-mix(in oklab, var(--dev) 30%, transparent)',
              'background-color': 'color-mix(in oklab, var(--dev) 10%, transparent)',
            }}
          >
            <span
              class="font-display text-[0.72rem] tracking-[0.18em] uppercase"
              style={{ color: 'var(--dev)' }}
            >
              Ruler workbench
            </span>
            <div class="border-base-300 bg-base-200/70 flex items-center rounded-full border p-0.5">
              <For each={TABS}>
                {(t) => (
                  <button
                    type="button"
                    class="focus-visible:ring-accent/50 rounded-full px-3 py-1 text-xs font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    classList={{
                      'text-base-content/55 hover:text-base-content': tab() !== t.value,
                    }}
                    style={
                      tab() === t.value
                        ? { 'background-color': 'var(--dev)', color: 'var(--dev-content)' }
                        : undefined
                    }
                    onClick={() => setTab(t.value)}
                  >
                    {t.label}
                  </button>
                )}
              </For>
            </div>

            <label class="text-base-content/50 ms-auto flex items-center gap-2 text-[0.68rem]">
              Arm span
              <input
                type="range"
                class="range range-xs w-32"
                min="0.5"
                max="2.6"
                step="0.01"
                value={props.armSpanM}
                onInput={(e) => props.onSpanText(Number(e.currentTarget.value).toFixed(2))}
              />
              <span class="tabular-nums">{props.armSpanM.toFixed(2)} m</span>
            </label>

            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              aria-label="Close"
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>

          <div class="min-h-0 overflow-auto px-4 py-3">
            <Show when={tab() === 'rulers'}>
              <table
                class="w-full text-left text-xs tabular-nums"
                onMouseLeave={() => setHotColumn(null)}
              >
                <thead class="text-base-content/40 text-[0.6rem] tracking-[0.12em] uppercase">
                  <tr>
                    <th class="py-1.5 pe-3 font-medium">Ruler</th>
                    <th class="py-1.5 pe-3 font-medium">Size</th>
                    <For each={perMm()}>
                      {({ timeline }, index) => (
                        <th
                          class="py-1.5 pe-3 text-right font-medium"
                          classList={columnClass(index(), timeline.id)}
                          onMouseEnter={() => setHotColumn(index())}
                        >
                          {timeline.label}
                        </th>
                      )}
                    </For>
                  </tr>
                </thead>
                <For each={GROUPS}>
                  {(group) => (
                    <tbody>
                      <tr>
                        <th
                          colSpan={2 + perMm().length}
                          class="text-base-content/40 pt-4 pb-1 text-left text-[0.6rem] font-medium tracking-[0.12em] uppercase"
                        >
                          {group.title}
                        </th>
                      </tr>
                      <For each={group.items}>
                        {(candidate) => {
                          const mm = () => candidate.mm(props.armSpanM)
                          return (
                            <tr class="border-base-300/40 hover:bg-base-200/70 border-t">
                              <td class="py-1.5 pe-3 whitespace-nowrap" title={candidate.note}>
                                {candidate.label}
                              </td>
                              <td class="text-base-content/50 py-1.5 pe-3 whitespace-nowrap">
                                {formatLength(mm() / 1000)}
                              </td>
                              <For each={perMm()}>
                                {({ timeline, yearsPerMm }, index) => (
                                  <td
                                    class="py-1.5 pe-3 text-right whitespace-nowrap"
                                    classList={columnClass(index(), timeline.id)}
                                    onMouseEnter={() => setHotColumn(index())}
                                  >
                                    {formatYears(yearsPerMm * mm())}
                                  </td>
                                )}
                              </For>
                            </tr>
                          )
                        }}
                      </For>
                    </tbody>
                  )}
                </For>
              </table>
              <p class="text-base-content/40 mt-3 text-[0.68rem] leading-relaxed">
                What one of each covers, on the span above. Hover a name for where the
                number comes from. Shipping today: millimetre, hair, finger.
              </p>
            </Show>

            <Show when={tab() === 'comparison'}>
              <table class="w-full text-left text-xs tabular-nums">
                <thead class="text-base-content/40 text-[0.6rem] tracking-[0.12em] uppercase">
                  <tr>
                    <th class="py-1.5 pe-3 font-medium">Timeline</th>
                    <th class="py-1.5 pe-3 font-medium">Picked span</th>
                    <th class="py-1.5 pe-3 text-right font-medium">Length</th>
                    <For each={IN_UNITS}>
                      {(unit) => (
                        <th class="py-1.5 pe-3 text-right font-medium">In {unit.plural}</th>
                      )}
                    </For>
                    <th class="py-1.5 font-medium">Reads as (hairs)</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={comparison()}>
                    {({ timeline, ref, mm }) => (
                      <tr
                        class="border-base-300/40 hover:bg-base-200/70 border-t"
                        classList={{ 'text-accent': timeline.id === props.timelineId }}
                      >
                        <td class="py-1.5 pe-3 whitespace-nowrap">{timeline.label}</td>
                        <td class="py-1.5 pe-3 whitespace-nowrap">{ref.label}</td>
                        <td class="py-1.5 pe-3 text-right whitespace-nowrap">
                          {formatLength(mm / 1000)}
                        </td>
                        <For each={IN_UNITS}>
                          {(unit) => (
                            <td class="py-1.5 pe-3 text-right whitespace-nowrap">
                              {sig2(mm / unit.mm(props.armSpanM))}
                            </td>
                          )}
                        </For>
                        <td class="py-1.5 whitespace-nowrap">
                          {phrase(mm / HAIR_MM, 'hair', 'hairs')}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
              <p class="text-base-content/40 mt-3 text-[0.68rem] leading-relaxed">
                The right-hand cell: the span closest to one nail-file swipe, and how long
                it is on the arm. The last column is the wording that would replace the
                bare “41 µm”. Drag the arm span to see how far it holds.
              </p>
            </Show>
            <Show when={tab() === 'references'}>
              <table
                class="w-full text-left text-xs tabular-nums"
                onMouseLeave={() => setHotColumn(null)}
              >
                <thead class="text-base-content/40 text-[0.6rem] tracking-[0.12em] uppercase">
                  <tr>
                    <th class="py-1.5 pe-3 font-medium">Span</th>
                    <th class="py-1.5 pe-3 text-right font-medium">Years</th>
                    <For each={perMm()}>
                      {({ timeline }, index) => (
                        <th
                          class="py-1.5 pe-3 text-right font-medium"
                          classList={columnClass(index(), timeline.id)}
                          onMouseEnter={() => setHotColumn(index())}
                        >
                          {timeline.label}
                        </th>
                      )}
                    </For>
                  </tr>
                </thead>
                <tbody>
                  <For each={REFERENCES}>
                    {(ref) => (
                      <tr class="border-base-300/40 hover:bg-base-200/70 border-t">
                        <td class="py-1.5 pe-3 whitespace-nowrap">{ref.label}</td>
                        <td class="text-base-content/50 py-1.5 pe-3 text-right whitespace-nowrap">
                          {formatYears(ref.years)}
                        </td>
                        <For each={perMm()}>
                          {({ timeline, yearsPerMm }, index) => (
                            <td
                              class="py-1.5 pe-3 text-right whitespace-nowrap"
                              classList={{
                                ...columnClass(index(), timeline.id),
                                // Longer than the timeline: it has no length here.
                                'text-base-content/25': ref.years > timeline.spanYears,
                                'font-semibold': picked().has(`${timeline.id}|${ref.label}`),
                              }}
                              onMouseEnter={() => setHotColumn(index())}
                            >
                              {ref.years > timeline.spanYears
                                ? '—'
                                : formatLength(ref.years / yearsPerMm / 1000)}
                            </td>
                          )}
                        </For>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
              <p class="text-base-content/40 mt-3 text-[0.68rem] leading-relaxed">
                How long each span is on the arm, timeline by timeline. Bold is the one the
                nail-file rule picks today. A dash means the span is longer than the
                timeline. This is the list to choose the right-hand cell from by hand.
              </p>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  )
}

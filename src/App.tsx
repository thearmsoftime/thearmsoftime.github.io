import { Show, createMemo, createSignal } from 'solid-js'
import Header from './components/Header'
import ScaleBar from './components/ScaleBar'
import ArmStage, { type NudgeKind } from './components/ArmStage'
import EventList from './components/EventList'
import { bandsFor, eventsFor, generationCredit, showsGenerations, timelines } from './data'
import { factFor } from './facts'
import { CROP_ASPECT } from './figure'
import {
  clamp01,
  formatGenerations,
  formatGenerationsAgo,
  formatYears,
  formatYearsAgo,
  fractionOf,
  generationsOf,
  scaleReadout,
  yearsAgoAt,
} from './scale'
import { applyTheme, readTheme, type Theme } from './theme'
import type { TimelineEvent } from './types'

const MIN_SPAN_M = 0.5
const MAX_SPAN_M = 2.6
/** How far the marker moves per key press, as a fraction of the arm span. */
const STEP: Record<Exclude<NudgeKind, 'event'>, number> = {
  fine: 0.002,
  coarse: 0.02,
  page: 0.1,
}
/** Events within this much of the marker count as "near". */
const NEAR = 0.03
/**
 * The arms fill the width, but never grow past this height, so the event list
 * always keeps a usable share of the viewport.
 */
const ARMS_MAX_WIDTH = `min(110rem, calc(min(28vh, 16rem) * ${CROP_ASPECT}))`

export default function App() {
  const { meta } = timelines
  const [spanText, setSpanText] = createSignal(meta.defaultArmSpanM.toFixed(2))
  const [zoneId, setZoneId] = createSignal(timelines.zones[0]?.id ?? '')
  const [pos, setPos] = createSignal(0.5)
  const [theme, setThemeSignal] = createSignal<Theme>(readTheme())

  const setTheme = (next: Theme) => {
    setThemeSignal(next)
    applyTheme(next)
  }

  const armSpanM = createMemo(() => {
    const parsed = Number.parseFloat(spanText())
    if (!Number.isFinite(parsed)) return meta.defaultArmSpanM
    return Math.min(Math.max(parsed, MIN_SPAN_M), MAX_SPAN_M)
  })

  const commitSpan = () => setSpanText(armSpanM().toFixed(2))

  const zone = createMemo(
    () => timelines.zones.find((z) => z.id === zoneId()) ?? timelines.zones[0],
  )
  const bands = createMemo(() => bandsFor(zoneId()))
  const events = createMemo(() => eventsFor(zoneId()))
  const spanYears = () => zone()?.spanYears ?? 1
  const withGenerations = createMemo(() => showsGenerations(zone()?.id ?? ''))

  const positioned = createMemo(() =>
    events().map((event) => ({ event, t: fractionOf(event.yearsAgo, spanYears()) })),
  )

  const nearest = createMemo(() => {
    let best: { event: TimelineEvent; t: number } | null = null
    let bestDistance = Infinity
    for (const item of positioned()) {
      const distance = Math.abs(item.t - pos())
      if (distance < bestDistance) {
        bestDistance = distance
        best = item
      }
    }
    return best
  })

  /**
   * The set only changes when the marker actually crosses in or out of an
   * event's reach. Comparing the contents keeps every row in the list from
   * re-running its classes on each pointer move.
   */
  const nearIds = createMemo(
    () => new Set(positioned().filter((i) => Math.abs(i.t - pos()) <= NEAR).map((i) => i.event.id)),
    new Set<string>(),
    { equals: (a, b) => a.size === b.size && [...a].every((id) => b.has(id)) },
  )

  const scale = createMemo(() => scaleReadout(spanYears(), armSpanM(), meta.generationYears))
  const fact = createMemo(() => factFor(zone()?.id ?? ''))

  const markerYearsAgo = createMemo(() => yearsAgoAt(pos(), spanYears()))
  const markerReadout = createMemo(() => formatYearsAgo(markerYearsAgo()))
  const markerGenerations = createMemo(() =>
    withGenerations()
      ? formatGenerationsAgo(generationsOf(markerYearsAgo(), meta.generationYears))
      : undefined,
  )

  const totalYears = createMemo(() => formatYears(spanYears()))
  const totalGenerations = createMemo(() =>
    formatGenerations(generationsOf(spanYears(), meta.generationYears)),
  )

  const nudge = (direction: -1 | 1, kind: NudgeKind) => {
    if (kind === 'event') {
      const candidates = positioned()
        .filter((i) => (direction > 0 ? i.t > pos() + 1e-6 : i.t < pos() - 1e-6))
        .sort((a, b) => (direction > 0 ? a.t - b.t : b.t - a.t))
      const next = candidates[0]
      if (next) setPos(next.t)
      return
    }
    setPos(clamp01(pos() + direction * STEP[kind]))
  }

  return (
    // One viewport, top to bottom. Only the event list ever scrolls.
    <div class="bg-base-100 text-base-content flex h-dvh flex-col overflow-hidden">
      <Header
        zones={timelines.zones}
        zoneId={zoneId()}
        onZone={setZoneId}
        spanText={spanText()}
        onSpanText={setSpanText}
        onSpanCommit={commitSpan}
        theme={theme()}
        onTheme={setTheme}
      />

      <Show
        when={zone()}
        fallback={
          <main class="grid grow place-items-center p-8">
            <p class="text-base-content/60 max-w-md text-center text-sm">
              No timelines to show. <code>research/timelines.json</code> has no usable zones yet.
            </p>
          </main>
        }
      >
        {(activeZone) => (
          <main class="flex min-h-0 flex-1 flex-col">
            {/* The arms run the width; the readout sits on its own rail below them. */}
            <div class="w-full shrink-0 px-0 pt-2 pb-2 sm:px-4">
              <div class="mx-auto w-full" style={{ 'max-width': ARMS_MAX_WIDTH }}>
                <ArmStage
                  zone={activeZone()}
                  bands={bands()}
                  events={events()}
                  pos={pos()}
                  onPos={setPos}
                  onNudge={nudge}
                  onEnd={setPos}
                  nearestId={nearest()?.event.id ?? null}
                  readoutYears={markerReadout()}
                  readoutGenerations={markerGenerations()}
                />
              </div>
            </div>

            <ScaleBar
              scale={scale()}
              armSpanM={armSpanM()}
              totalYears={totalYears()}
              totalGenerations={totalGenerations()}
              showGenerations={withGenerations()}
              fact={fact()}
            />

            <EventList
              events={events()}
              zoneId={zoneId()}
              note={activeZone().note}
              nearestId={nearest()?.event.id ?? null}
              nearIds={nearIds()}
              showGenerations={withGenerations()}
              onPick={(event) => setPos(fractionOf(event.yearsAgo, activeZone().spanYears))}
            />
          </main>
        )}
      </Show>

      <footer class="border-base-300/60 text-base-content/40 shrink-0 border-t px-3 py-1 text-center text-[0.62rem] leading-snug sm:px-6">
        <span class="hidden lg:inline">
          Drag the knob or press along the arms; with it focused,
          <span class="text-base-content/60"> ← →</span> step,
          <span class="text-base-content/60"> Shift</span> jumps,
          <span class="text-base-content/60"> Alt</span> hops between events.{' '}
        </span>
        Figure: Leonardo da Vinci, <em>Vitruvian Man</em> (c. 1490), public domain via{' '}
        <a
          class="link link-hover"
          href="https://commons.wikimedia.org/wiki/File:Da_Vinci_Vitruve_Luc_Viatour.jpg"
          target="_blank"
          rel="noreferrer"
        >
          Wikimedia Commons
        </a>
        . After the{' '}
        <a
          class="link link-hover"
          href="https://www.youtube.com/watch?v=uMXt0eGXuZc"
          target="_blank"
          rel="noreferrer"
        >
          Natural History Museum of Los Angeles County
        </a>
        . One generation = {meta.generationYears} years
        <Show when={generationCredit} fallback=".">
          {(credit) => (
            <>
              , after{' '}
              <Show
                when={credit().url}
                fallback={<span title={credit().detail}>{credit().label}</span>}
              >
                {(href) => (
                  <a
                    class="link link-hover"
                    href={href()}
                    title={credit().detail}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {credit().label}
                  </a>
                )}
              </Show>
              .
            </>
          )}
        </Show>{' '}
        Data {meta.generated}.
      </footer>
    </div>
  )
}

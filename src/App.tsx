import { Show, createMemo, createSignal, lazy, onCleanup } from "solid-js";
import Header from "./components/Header";
import { ScaleRail, ScaleRow } from "./components/ScaleBar";
import ArmStage, { type NudgeKind } from "./components/ArmStage";
import EventCards from "./components/EventCards";
import MarkerLink from "./components/MarkerLink";
import TimelinePreviewLink from "./components/TimelinePreviewLink";
import {
  bandsFor,
  eventsFor,
  generationCredit,
  meta,
  showsGenerations,
  visibleTimelines,
  type Detail,
} from "./data";
import { factFor } from "./facts";
import ListHeading from "./components/ListHeading";
import { FIT, cropAspect, tune } from "./figure";
import {
  formatCalendarYear,
  formatGenerations,
  formatGenerationsAgo,
  formatLength,
  formatYears,
  formatYearsAgo,
  generationsOf,
} from "./format";
import {
  clamp01,
  fractionOf,
  parseYardstick,
  scaleReadout,
  yearsAgoAt,
  type YardstickId,
} from "./scale";
import { DEV } from "./dev";
import { createStoredSignal } from "./prefs";
import {
  applyThemeChoice,
  readThemeChoice,
  watchSystemTheme,
  type ThemeChoice,
} from "./theme";
import type { TimelineEvent } from "./types";

/*
  The three dev workbenches are loaded on demand, so a visitor downloads none
  of them. `?dev=1` is a runtime flag, not a build one, so they cannot be
  compiled out — but nothing asks for the chunk until DEV is true, and then it
  is a local file arriving while the page is already up.
*/
const Prototype = lazy(() => import("./prototype/Prototype"));
const DevPanel = lazy(() => import("./components/DevPanel"));
const DataPanel = lazy(() => import("./components/DataPanel"));

const MIN_SPAN_M = 0.5;
const MAX_SPAN_M = 2.6;
/** How far the marker moves per key press, as a fraction of the arm span. */
const STEP: Record<Exclude<NudgeKind, "event">, number> = {
  fine: 0.002,
  coarse: 0.02,
  page: 0.1,
};
/** About a hand: as far back as the length under the readout still means something. */
const HAND_M = 0.2;
/** Short enough that people think in calendar years, not in "years ago". */
const CALENDAR_SPAN_YEARS = 12000;
/**
 * The arms fill the width, but never grow past this height, so the card strip
 * below keeps a usable share of the viewport. The figure is a tall window —
 * the head down to the belly — so the height it is allowed is what sets how
 * long the arms draw, and the ruler is the point: it gets everything the cards
 * and the two bars do not need. `Size` in the prototype panel is this number.
 */
const armsMaxWidth = () =>
  `min(130rem, calc(min(${tune().maxVh}vh, ${FIT.maxRem}rem) * ${cropAspect()}))`;

export default function App() {
  // Everything the top bar sets is remembered, so a reload comes back to the
  // same reading rather than to the defaults.
  const [spanText, setSpanText] = createStoredSignal(
    "armspan",
    meta.defaultArmSpanM.toFixed(2),
    (raw) => {
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) &&
        parsed >= MIN_SPAN_M &&
        parsed <= MAX_SPAN_M
        ? raw
        : undefined;
    },
  );
  const [timelineId, setTimelineId] = createStoredSignal(
    "timeline",
    visibleTimelines[0]?.id ?? "",
    // A timeline kept from a dev visit is not a timeline this visit may pick.
    (raw) => (visibleTimelines.some((z) => z.id === raw) ? raw : undefined),
  );
  const [showBands, setShowBands] = createStoredSignal(
    "bands",
    true,
    (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
    (on) => (on ? "1" : "0"),
  );
  const [detail, setDetail] = createStoredSignal<Detail>(
    "detail",
    "simple",
    (raw) => (raw === "simple" || raw === "all" ? raw : undefined),
  );
  // Off by default: the plain reading is the one the figure is for. On, every
  // date says how well it is pinned.
  const [showUncertainty, setShowUncertainty] = createStoredSignal(
    "errorbars",
    false,
    (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
    (on) => (on ? "1" : "0"),
  );
  const [yardstick, setYardstick] = createStoredSignal<YardstickId>(
    "yardstick",
    "mm",
    parseYardstick,
  );
  const [pos, setPos] = createSignal(0.5);
  /**
   * The card the reader last put the strip on. Events can share one instant —
   * the asteroid sits on the end of the age of dinosaurs, three events share
   * the first moment of the universe — and then the marker position alone
   * cannot say which card is meant. This remembers the answer. It only counts
   * in a dead heat, so it falls away by itself as soon as the marker moves.
   */
  const [pickedId, setPickedId] = createSignal<string | null>(null);
  /** The timeline the pointer is on in the picker, before anything is picked. */
  const [hoverTimelineId, setHoverTimelineId] = createSignal<string | null>(null);
  // Dev only: the scratch table behind the ruler choice. Remembered, because
  // every edit to it is a Vite reload and reopening it every time is a chore.
  const [protoOpen, setProtoOpen] = createStoredSignal(
    "prototype",
    false,
    (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
    (on) => (on ? "1" : "0"),
  );
  const [devOpen, setDevOpen] = createStoredSignal(
    "devpanel",
    false,
    (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
    (on) => (on ? "1" : "0"),
  );
  const [dataOpen, setDataOpen] = createStoredSignal(
    "datapanel",
    false,
    (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
    (on) => (on ? "1" : "0"),
  );
  const [theme, setThemeSignal] = createSignal<ThemeChoice>(readThemeChoice());

  const setTheme = (next: ThemeChoice) => {
    setThemeSignal(next);
    applyThemeChoice(next);
  };

  // On "system" the browser is in charge: follow it while the app is open.
  onCleanup(
    watchSystemTheme(() => {
      if (theme() === "system") applyThemeChoice("system");
    }),
  );

  const armSpanM = createMemo(() => {
    const parsed = Number.parseFloat(spanText());
    if (!Number.isFinite(parsed)) return meta.defaultArmSpanM;
    return Math.min(Math.max(parsed, MIN_SPAN_M), MAX_SPAN_M);
  });

  const commitSpan = () => setSpanText(armSpanM().toFixed(2));

  const timeline = createMemo(
    () => visibleTimelines.find((z) => z.id === timelineId()) ?? visibleTimelines[0],
  );
  const bands = createMemo(() => bandsFor(timelineId()));
  const events = createMemo(() => eventsFor(timelineId(), detail()));
  const spanYears = () => timeline()?.spanYears ?? 1;
  const withGenerations = createMemo(() => showsGenerations(timeline()?.id ?? ""));

  /**
   * A moment has one stop on the arm; something that lasted has two, one per
   * edge. Both the live card and the alt-arrow stepping run off these.
   */
  const positioned = createMemo(() =>
    events().map((event) => {
      const t = fractionOf(event.yearsAgo, spanYears());
      const stops =
        event.endYearsAgo === undefined
          ? [t]
          : [t, fractionOf(event.endYearsAgo, spanYears())];
      return { event, t, stops };
    }),
  );

  const nearest = createMemo(() => {
    let best: { event: TimelineEvent; t: number } | null = null;
    let bestDistance = Infinity;
    let bestRank = -1;
    for (const item of positioned()) {
      // The nearer edge speaks for a stretch, so both ends of it pick the card up.
      const distance = Math.min(...item.stops.map((s) => Math.abs(s - pos())));
      // Two events can land on the exact same point. Settle it: the card the
      // reader picked first, then a moment over something that merely lasted
      // through it — at that instant the asteroid is the thing that happens,
      // and without this its card could never be reached at all.
      const rank =
        item.event.id === pickedId() ? 2 : item.stops.length === 1 ? 1 : 0;
      if (distance < bestDistance || (distance === bestDistance && rank > bestRank)) {
        bestDistance = distance;
        bestRank = rank;
        best = item;
      }
    }
    return best;
  });

  /**
   * Hovering a timeline shows where it would fit on this one: every timeline
   * ends at now, so its span is the stretch from there to the right fingertip.
   * The one already picked is the whole arm, fingertip to fingertip, which is
   * worth saying too. A longer one has nowhere to sit — it would be the whole
   * arm and then some — so it previews nothing.
   */
  const previewFrom = createMemo(() => {
    const hovered = visibleTimelines.find((z) => z.id === hoverTimelineId());
    if (!hovered || hovered.spanYears > spanYears()) return undefined;
    return 1 - hovered.spanYears / spanYears();
  });

  const scale = createMemo(() =>
    scaleReadout(spanYears(), armSpanM(), meta.generationYears, yardstick()),
  );
  const fact = createMemo(() => factFor(timeline()?.id ?? ""));

  const withCalendar = createMemo(() => spanYears() <= CALENDAR_SPAN_YEARS);

  const markerYearsAgo = createMemo(() => yearsAgoAt(pos(), spanYears()));
  /** The year the marker is on, said plainly, right down to the fingertip. */
  const markerReadout = createMemo(() => formatYearsAgo(markerYearsAgo()));

  /** Under the big line: the year, the generations, or both. */
  const markerSub = createMemo(() => {
    const parts: string[] = [];
    if (withCalendar()) parts.push(formatCalendarYear(markerYearsAgo()));
    if (withGenerations())
      parts.push(
        formatGenerationsAgo(
          generationsOf(markerYearsAgo(), meta.generationYears),
        ),
      );
    return parts.length > 0 ? parts.join(" · ") : undefined;
  });

  /**
   * The same reading as a distance: how far back from the right fingertip the
   * marker stands. Only while it is still hand-sized — past that the length is
   * an arm's length nobody feels, and the years say it better.
   */
  const markerLength = createMemo(() => {
    const metres = markerYearsAgo() / scale().yearsPerMetre;
    if (metres > HAND_M) return undefined;
    return `${metres > 0 ? formatLength(metres) : "0 mm"} from now`;
  });

  const totalYears = createMemo(() => formatYears(spanYears()));
  const totalGenerations = createMemo(() =>
    formatGenerations(generationsOf(spanYears(), meta.generationYears)),
  );

  const nudge = (direction: -1 | 1, kind: NudgeKind) => {
    if (kind === "event") {
      const candidates = positioned()
        .flatMap((i) => i.stops)
        .filter((t) => (direction > 0 ? t > pos() + 1e-6 : t < pos() - 1e-6))
        .sort((a, b) => (direction > 0 ? a - b : b - a));
      const next = candidates[0];
      if (next !== undefined) setPos(next);
      return;
    }
    setPos(clamp01(pos() + direction * STEP[kind]));
  };

  return (
    // One viewport, top to bottom. Only the card strip ever scrolls.
    <div class="bg-base-100 text-base-content flex h-dvh flex-col overflow-hidden">
      <Header
        timelines={visibleTimelines}
        timelineId={timelineId()}
        onTimeline={setTimelineId}
        onTimelineHover={setHoverTimelineId}
        showBands={showBands()}
        onShowBands={setShowBands}
        detail={detail()}
        onDetail={setDetail}
        showUncertainty={showUncertainty()}
        onShowUncertainty={setShowUncertainty}
        spanText={spanText()}
        onSpanText={setSpanText}
        onSpanCommit={commitSpan}
        theme={theme()}
        onTheme={setTheme}
        onOpenDev={() => setDevOpen(true)}
        onOpenData={() => setDataOpen(true)}
        onOpenProto={() => setProtoOpen(true)}
      />

      {/*
        Mounted for the whole dev session, open or not: it is what puts the
        knobs back where the last visit left them.
      */}
      <Show when={DEV}>
        <Prototype open={protoOpen()} onClose={() => setProtoOpen(false)} />
      </Show>

      <Show when={DEV && devOpen()}>
        <DevPanel
          armSpanM={armSpanM()}
          timelineId={timelineId()}
          onSpanText={setSpanText}
          onClose={() => setDevOpen(false)}
        />
      </Show>

      <Show when={DEV && dataOpen()}>
        <DataPanel
          armSpanM={armSpanM()}
          timelineId={timelineId()}
          onClose={() => setDataOpen(false)}
          // Picking a row leaves the table up and moves the marker behind it,
          // so a date can be checked against the arm without losing the list.
          onPick={(yearsAgo) => {
            const active = timeline();
            if (active) setPos(fractionOf(yearsAgo, active.spanYears));
          }}
        />
      </Show>

      <Show
        when={timeline()}
        fallback={
          <main class="grid grow place-items-center p-8">
            <p class="text-base-content/60 max-w-md text-center text-sm">
              No timelines to show. <code>data/timelines/</code> has no
              usable timelines yet.
            </p>
          </main>
        }
      >
        {(activeTimeline) => (
          <main class="relative flex min-h-0 flex-1 flex-col">
            {/*
              Everything sits at the top: a gap between the bar and the head
              reads as a white banner over the drawing. The scale numbers flank
              the arms, so the list below gets the height they used to take as
              a band.
            */}
            <div class="w-full shrink-0 px-0 pb-1.5 sm:px-4">
              <div class="mx-auto flex w-full max-w-[130rem] items-center justify-center gap-4 xl:gap-8">
                <div class="hidden lg:flex">
                  <ScaleRail
                    side="left"
                    scale={scale()}
                    armSpanM={armSpanM()}
                    totalYears={totalYears()}
                    totalGenerations={totalGenerations()}
                    showGenerations={withGenerations()}
                    yardstick={yardstick()}
                    onYardstick={setYardstick}
                  />
                </div>

                <div class="min-w-0 flex-1" style={{ "max-width": armsMaxWidth() }}>
                  <ArmStage
                    timeline={activeTimeline()}
                    bands={bands()}
                    events={events()}
                    pos={pos()}
                    onPos={setPos}
                    onNudge={nudge}
                    onEnd={setPos}
                    nearestId={nearest()?.event.id ?? null}
                    showBands={showBands()}
                    showUncertainty={showUncertainty()}
                    readoutYears={markerReadout()}
                    readoutSub={markerSub()}
                    readoutLength={markerLength()}
                    previewFrom={previewFrom()}
                  />
                </div>

                <div class="hidden lg:flex">
                  <ScaleRail
                    side="right"
                    scale={scale()}
                    armSpanM={armSpanM()}
                    totalYears={totalYears()}
                    totalGenerations={totalGenerations()}
                    showGenerations={withGenerations()}
                    yardstick={yardstick()}
                    onYardstick={setYardstick}
                  />
                </div>
              </div>

              <ScaleRow
                scale={scale()}
                armSpanM={armSpanM()}
                totalYears={totalYears()}
                totalGenerations={totalGenerations()}
                showGenerations={withGenerations()}
                yardstick={yardstick()}
                onYardstick={setYardstick}
              />
            </div>

            {/*
              The cards take everything the arms and the two bars left over.
              The cards themselves stop at their own cap; the extra height goes
              to the strip around them, so its scrollbar sits at the bottom of
              the screen rather than cutting across the middle of it.
            */}
            <div class="mx-auto flex w-full max-w-[130rem] min-h-0 flex-1 flex-col px-3 pt-1.5 pb-2 sm:px-6">
              <EventCards
                events={events()}
                timelineId={timelineId()}
                nearestId={nearest()?.event.id ?? null}
                pos={pos()}
                spanYears={activeTimeline().spanYears}
                markerYearsAgo={markerYearsAgo()}
                showGenerations={withGenerations()}
                showCalendar={withCalendar()}
                showUncertainty={showUncertainty()}
                onPick={(event) => {
                  setPickedId(event.id);
                  setPos(fractionOf(event.yearsAgo, activeTimeline().spanYears));
                }}
                onScrub={(next, id) => {
                  if (id) setPickedId(id);
                  setPos(next);
                }}
              />
            </div>

            {/* Ties the readout under the knob to the card it is standing on. */}
            <MarkerLink
              pos={pos()}
              nearestId={nearest()?.event.id ?? null}
              timelineId={timelineId()}
            />
          </main>
        )}
      </Show>

      {/* Joins the hovered timeline button to the span it would cover. */}
      <TimelinePreviewLink
        timelineId={previewFrom() === undefined ? null : hoverTimelineId()}
        redrawKey={`${timelineId()}:${previewFrom() ?? ""}:${showBands()}`}
      />

      <footer class="border-base-300/60 text-base-content/40 shrink-0 border-t px-3 py-1 text-center text-[0.62rem] leading-snug sm:px-6">
        {/* What the cards are and how to drive them, right under them. */}
        <ListHeading
          count={events().length}
          action="drag the strip, or click a card, to move the marker"
          line={fact() ?? timeline()?.note}
        />

        Figure: Leonardo da Vinci, <em>Vitruvian Man</em> (c. 1490), public
        domain via{" "}
        <a
          class="link link-hover"
          href="https://commons.wikimedia.org/wiki/File:Da_Vinci_Vitruve_Luc_Viatour.jpg"
          target="_blank"
          rel="noreferrer"
        >
          Wikimedia Commons
        </a>
        . After the{" "}
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
              , after{" "}
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
        </Show>{" "}
        Data {meta.generated}.
      </footer>
    </div>
  );
}

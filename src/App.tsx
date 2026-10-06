import { Show, createMemo, createSignal, lazy, onCleanup } from "solid-js";
import Header from "./components/Header";
import { ScaleRail, ScaleRow } from "./components/ScaleBar";
import ArmStage, { type NudgeKind } from "./components/ArmStage";
import EventCards from "./components/EventCards";
import AboutDialog, { AboutButton } from "./components/About";
import KofiLink from "./components/KofiLink";
import MarkerLink from "./components/MarkerLink";
import TimelinePreviewLink from "./components/TimelinePreviewLink";
import {
  bandsFor,
  eventsFor,
  meta,
  showsGenerations,
  visibleTimelines,
  type Detail,
} from "./data";
import ListHeading from "./components/ListHeading";
import { factsFor } from "./oddities";
import { FIT, cropAspect, tune } from "./figure";
import { CARD_MAX_VH, layout } from "./layout";
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
  parseYardsticks,
  scaleReadout,
  startsInside,
  writeYardsticks,
  yardsticksFor,
  yearsAgoAt,
  type YardstickId,
} from "./scale";
import { DEV } from "./dev";
import { bodyAt } from "./body";
import { createStoredSignal } from "./prefs";
import {
  applyThemeChoice,
  readThemeChoice,
  watchSystemTheme,
  type ThemeChoice,
} from "./theme";

/*
  The three dev workbenches are loaded on demand, so a visitor downloads none
  of them. `?dev=1` is a runtime flag, not a build one, so they cannot be
  compiled out — but nothing asks for the chunk until DEV is true, and then it
  is a local file arriving while the page is already up.
*/
const Prototype = lazy(() => import("./prototype/Prototype"));
const DevPanel = lazy(() => import("./components/DevPanel"));
const DataPanel = lazy(() => import("./components/DataPanel"));
const OddityPanel = lazy(() => import("./components/OddityPanel"));

const MIN_SPAN_M = 0.5;
const MAX_SPAN_M = 2.6;
/** How far the marker moves per key press, as a fraction of the arm span. */
const STEP: Record<Exclude<NudgeKind, "event">, number> = {
  fine: 0.002,
  coarse: 0.02,
  page: 0.1,
};
/**
 * About a fingertip: as far back as the length over the readout is shown.
 * Past that the body part says where the marker is better than a number does.
 */
const FINGERTIP_M = 0.02;
/** Short enough that people think in calendar years, not in "years ago". */
const CALENDAR_SPAN_YEARS = 12000;
/**
 * The arms fill the width, but never grow past this height, so the card strip
 * below keeps a usable share of the viewport. The figure is a tall window —
 * the head down to the belly — so the height it is allowed is what sets how
 * long the arms draw, and the ruler is the point: it gets everything the cards
 * and the two bars do not need.
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
  // Off by default: the bare arms read first. On, the named periods sit on
  // their own strip above them.
  const [showBands, setShowBands] = createStoredSignal(
    "bands",
    false,
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
  const [pickedYardsticks, setPickedYardsticks] = createStoredSignal<
    Record<string, YardstickId>
  >("yardsticks", {}, parseYardsticks, writeYardsticks);
  /** How far down the stage the fingertip line runs, for the scale numbers. */
  const [lineTop, setLineTop] = createSignal(0);
  // The room above the tray, and what is drawn in it. Measured, so the line
  // can be put at a share of that room rather than wherever centring left it.
  const [roomH, setRoomH] = createSignal(0);
  const [bodyH, setBodyH] = createSignal(0);
  /** Watch one box's height for as long as it is on the page. */
  const heightOf = (set: (px: number) => void) => (el: HTMLElement) => {
    const observer = new ResizeObserver(([entry]) => set(entry!.contentRect.height));
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  };
  /**
   * How far down the arms start. The line goes at its share of the room, the
   * same on every timeline; only when the drawing would run into the tray is
   * it pushed back up, and never above the bar.
   */
  const armsLift = () =>
    Math.max(
      0,
      Math.min(layout().lineShare * roomH() - lineTop(), roomH() - bodyH()),
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
  const [oddOpen, setOddOpen] = createStoredSignal(
    "oddpanel",
    false,
    (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
    (on) => (on ? "1" : "0"),
  );
  /**
   * The fun fact on show, by id rather than by index: the list changes with
   * the timeline, and an id that is not on the new one simply shows nothing
   * instead of landing on whatever happens to sit at that index.
   */
  const [factId, setFactId] = createSignal<string | null>(null);
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
   * edge, unless another card starts inside it. Both the live card and the
   * alt-arrow stepping run off these.
   */
  const facts = createMemo(() => factsFor(timelineId()));
  const liveFact = createMemo(() => facts().find((f) => f.id === factId()));

  /**
   * The button never repeats itself: the first press lands somewhere random,
   * and every press after that steps on through the list. The marker follows
   * to the fact's hinge, so the readout says the date the fact turns on.
   */
  /**
   * Where the fact's card sits: its hinge (see `OddityPoints`), or now when
   * the fact is about what is still ahead — the arm ends at the fingertip.
   */
  const factPos = createMemo(() => {
    const shown = liveFact();
    if (!shown) return undefined;
    return fractionOf(Math.max(shown.points[1].yearsAgo, 0), spanYears());
  });

  const nextFact = () => {
    const list = facts();
    if (list.length === 0) return;
    const current = list.findIndex((f) => f.id === factId());
    const next =
      current < 0
        ? list[Math.floor(Math.random() * list.length)]!
        : list[(current + 1) % list.length]!;
    setFactId(next.id);
    const hinge = next.points[1].yearsAgo;
    if (hinge >= 0) setPos(fractionOf(hinge, spanYears()));
  };

  const positioned = createMemo(() => {
    const items: { id: string; t: number; end?: number }[] = events().map((event) => ({
      id: event.id,
      t: fractionOf(event.yearsAgo, spanYears()),
      end:
        event.endYearsAgo === undefined
          ? undefined
          : fractionOf(event.endYearsAgo, spanYears()),
    }));
    // The fun fact has a card in the strip like everything else here, so it
    // has to be something the marker can be nearest to. Without this the
    // marker sits on the fact and the event behind it lights up instead.
    const at = factPos();
    if (at !== undefined) items.push({ id: liveFact()!.id, t: at });
    // A stretch with another card starting inside it keeps only its start
    // stop: its far edge would light its card while the strip, which runs in
    // start order, stands on the cards inside it. See `startsInside`.
    const starts = items.map((item) => item.t);
    return items.map(({ id, t, end }) => ({
      id,
      t,
      moment: end === undefined,
      stops: end === undefined || startsInside(t, end, starts) ? [t] : [t, end],
    }));
  });

  const nearest = createMemo(() => {
    let best: { id: string; t: number } | null = null;
    let bestDistance = Infinity;
    let bestRank = -1;
    for (const item of positioned()) {
      // The nearer edge speaks for a stretch, so both ends of it pick the card up.
      const distance = Math.min(...item.stops.map((s) => Math.abs(s - pos())));
      // Two cards can land on the exact same point. Settle it: the fun fact
      // first — its hinge is usually an event, and the whole reason the marker
      // is standing there is the fact, not the card behind it. Then the card
      // the reader picked, then a moment over something that merely lasted
      // through it — at that instant the asteroid is the thing that happens,
      // and without this its card could never be reached at all.
      const rank =
        item.id === liveFact()?.id
          ? 3
          : item.id === pickedId()
            ? 2
            : item.moment
              ? 1
              : 0;
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

  /**
   * The ruler is kept per timeline. One this timeline does not offer — a life
   * on the Universe — falls back to the first it does.
   */
  const yardsticks = createMemo(() => yardsticksFor(spanYears()));
  const yardstick = createMemo((): YardstickId => {
    const picked = pickedYardsticks()[timelineId()];
    return yardsticks().some((y) => y.id === picked)
      ? picked!
      : yardsticks()[0]!.id;
  });
  const setYardstick = (id: YardstickId) =>
    setPickedYardsticks((prev) => ({ ...prev, [timelineId()]: id }));

  const scale = createMemo(() =>
    scaleReadout(spanYears(), armSpanM(), meta.generationYears, yardstick()),
  );

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
   * Where on the reader's own arm the marker stands, when it is on a body
   * part: something they can touch. See `src/body.ts`.
   */
  const markerBody = createMemo(() =>
    bodyAt(1 - markerYearsAgo() / spanYears()),
  );

  /**
   * The same reading as a distance: how far back from the right fingertip the
   * marker stands. Only in the last two centimetres — past that the knuckles
   * and the wrist say it better.
   */
  const markerLength = createMemo(() => {
    const metres = markerYearsAgo() / scale().yearsPerMetre;
    if (metres > FINGERTIP_M) return undefined;
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
        onOpenOdd={() => setOddOpen(true)}
        onFact={facts().length > 0 ? nextFact : undefined}
        factOn={liveFact() !== undefined}
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

      <Show when={DEV && oddOpen()}>
        <OddityPanel
          timelineId={timelineId()}
          armSpanM={armSpanM()}
          spanYears={spanYears()}
          onClose={() => setOddOpen(false)}
          onPick={(yearsAgo) => setPos(fractionOf(yearsAgo, spanYears()))}
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
              The arms take the height the card tray does not need. Their line
              sits at a set share of that height (`src/layout.ts`), not in the
              middle of whatever is drawn: bands and labels differ per
              timeline, and centring them made the man jump when the timeline
              changed. The scale numbers flank the arms, so the list below
              gets the height they used to take as a band.
            */}
            <div
              ref={heightOf(setRoomH)}
              class="flex w-full shrink-0 grow flex-col px-0 pb-1.5 sm:px-4"
            >
              <div ref={heightOf(setBodyH)} style={{ "margin-top": `${armsLift()}px` }}>
              <div class="mx-auto flex w-full max-w-[130rem] items-start justify-between gap-4 xl:gap-8">
                {/* From xl only. The rails sit 4.5rem in from their own box
                    (see ScaleRail), so below about 1200 px they ran over the
                    "Big Bang" and "Now" captions — a 1024 x 768 projector is
                    exactly that. Narrower screens get the one-line ScaleRow. */}
                <div
                  class="hidden -translate-y-1/2 xl:flex"
                  style={{ "margin-top": `${lineTop()}px` }}
                >
                  <ScaleRail
                    side="left"
                    scale={scale()}
                    armSpanM={armSpanM()}
                    totalYears={totalYears()}
                    totalGenerations={totalGenerations()}
                    showGenerations={withGenerations()}
                    yardstick={yardstick()}
                    yardsticks={yardsticks()}
                    onYardstick={setYardstick}
                  />
                </div>

                <div class="min-w-0 flex-1" style={{ "max-width": armsMaxWidth() }}>
                  <ArmStage
                    timeline={activeTimeline()}
                    bands={bands()}
                    events={events()}
                    pos={pos()}
                    // Moving the marker on the arm is done with the fact, as
                    // picking a card is: the fact is about where it stood.
                    onPos={(next) => {
                      setFactId(null);
                      setPos(next);
                    }}
                    onNudge={(direction, kind) => {
                      setFactId(null);
                      nudge(direction, kind);
                    }}
                    onEnd={(edge) => {
                      setFactId(null);
                      setPos(edge);
                    }}
                    nearestId={nearest()?.id ?? null}
                    showBands={showBands()}
                    showUncertainty={showUncertainty()}
                    readoutYears={markerReadout()}
                    readoutSub={markerSub()}
                    readoutLength={markerLength()}
                    readoutBody={markerBody()}
                    previewFrom={previewFrom()}
                    fact={liveFact()}
                    onLineTop={setLineTop}
                  />
                </div>

                <div
                  class="hidden -translate-y-1/2 xl:flex"
                  style={{ "margin-top": `${lineTop()}px` }}
                >
                  <ScaleRail
                    side="right"
                    scale={scale()}
                    armSpanM={armSpanM()}
                    totalYears={totalYears()}
                    totalGenerations={totalGenerations()}
                    showGenerations={withGenerations()}
                    yardstick={yardstick()}
                    yardsticks={yardsticks()}
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
                yardsticks={yardsticks()}
                onYardstick={setYardstick}
              />
              </div>
            </div>

            {/*
              The cards sit on a tray of their own, the footer's tint, so the
              strip reads as one band under the arms and the cards lift off it.
              Every card is the same height, so the tray is the same height on
              every timeline and the arms above it stay put. On a short screen
              it is the part that gives, so the arms never get squeezed.
            */}
            <div
              class="bg-base-200 flex min-h-0 shrink flex-col"
              style={{
                "--card-h": `min(${layout().cardHeightRem}rem, ${CARD_MAX_VH}vh)`,
                "--card-gap": `${layout().cardGapRem}rem`,
                "--date-words": `${layout().dateWordsEm}em`,
              }}
            >
            <div
              class="mx-auto flex w-full max-w-[130rem] min-h-0 flex-1 flex-col px-3 sm:px-6"
              style={{
                "padding-top": `${layout().trayTopRem}rem`,
                "padding-bottom": `${layout().trayBottomRem}rem`,
              }}
            >
              <EventCards
                events={events()}
                timelineId={timelineId()}
                nearestId={nearest()?.id ?? null}
                pos={pos()}
                spanYears={activeTimeline().spanYears}
                markerYearsAgo={markerYearsAgo()}
                showGenerations={withGenerations()}
                showCalendar={withCalendar()}
                showUncertainty={showUncertainty()}
                fact={liveFact()}
                onFactNext={nextFact}
                onFactClose={() => setFactId(null)}
                onPick={(event) => {
                  // Picking any other card is done with the fact: the reader
                  // has moved on to an event, and leaving the fact up would
                  // hold the arm's names and the dimmed drawing against a
                  // marker that is no longer standing on it.
                  setFactId(null);
                  setPickedId(event.id);
                  setPos(fractionOf(event.yearsAgo, activeTimeline().spanYears));
                }}
                onScrub={(next, id) => {
                  if (id) setPickedId(id);
                  setPos(next);
                }}
              />
            </div>
            </div>

            {/* Ties the readout under the knob to the card it is standing on. */}
            <MarkerLink
              pos={pos()}
              nearestId={nearest()?.id ?? null}
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

      {/* One line: how to drive the cards, and the two ways off the page in
          the bottom-right corner. The credits live in the About box. */}
      {/* Same 75rem as the bar at the top, so the two frame the page alike. */}
      <footer class="bg-base-200 text-base-content/70 shrink-0 px-3 py-1.5 sm:px-6">
        <div class="mx-auto flex max-w-[75rem] items-center gap-3">
          <div class="min-w-0 flex-1">
            <ListHeading action="drag the strip, or click a card, to move the marker" />
          </div>
          <div class="flex shrink-0 items-center gap-3">
            <KofiLink quiet />
            <AboutButton quiet />
          </div>
        </div>
      </footer>

      <AboutDialog />
    </div>
  );
}

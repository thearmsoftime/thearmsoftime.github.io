import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  lazy,
  onCleanup,
  onMount,
} from "solid-js";
import TimelineStrip from "./TimelineStrip";
import type { Band, Oddity, TimelineEvent, Timeline } from "../types";
import { FactBars, FactDots, FactNames, factLift } from "./FactMarks";
import {
  FIGURE,
  bandRows,
  cropHeight,
  cropTop,
  xFrac,
  xUnits,
  yFrac,
} from "../figure";
import type { PlacedBand } from "../figure";
import { FACT_DIM, inkOpacity, lineOpacity, maskStyle } from "../fade";
import { cardRadius, fob, fobY } from "../fob";
import { columnFrom, columnTo, lineY, scrub } from "../scrub";
import { clamp01 } from "../scale";
import { placeLandmarks } from "../landmarks";
import { formatYears } from "../format";
import { light, scanTint, sideColour } from "../light";
import { DEV, bodyMarks } from "../dev";

/** Purple body landmarks, dev only: the chunk is fetched when the switch is on. */
const BodyMarks = lazy(() => import("./BodyMarks"));

export type NudgeKind = "fine" | "coarse" | "page" | "event";

interface Props {
  timeline: Timeline;
  bands: Band[];
  events: TimelineEvent[];
  pos: number;
  onPos: (next: number) => void;
  onNudge: (direction: -1 | 1, kind: NudgeKind) => void;
  onEnd: (edge: 0 | 1) => void;
  nearestId: string | null;
  /** Named spans under the arms. Off is a legitimate way to read this. */
  showBands: boolean;
  /** Science mode: draw each date's error bar along the line as well. */
  showUncertainty: boolean;
  /** Big line in the readout that rides with the knob. */
  readoutYears: string;
  /** Small line under it: generations, a calendar year, or both. */
  readoutSub?: string;
  /** Smaller line under that: how far back along the arm that reading sits. */
  readoutLength?: string;
  /** Over the card, before the length: the body part the marker stands on. */
  readoutBody?: string;
  /**
   * A shorter timeline the reader is hovering in the picker: where it starts,
   * 0..1 along this one. It runs from there to the right fingertip, because
   * every timeline ends at now.
   */
  previewFrom?: number;
  /**
   * The fun fact on show, if any: its moments and the gaps between them,
   * drawn on the arm whether or not those moments are events here.
   */
  fact?: Oddity;
  /**
   * How far down from the top of this component the fingertip line runs, in
   * pixels, so the scale numbers outside it can sit level with it.
   */
  onLineTop?: (px: number) => void;
}

/**
 * Events are dots on the fingertip line itself, so the knob lands on them.
 * Their radii are source units — the band is 1400 wide and draws at roughly
 * half that — and they are live in dev, so every one of these is a function.
 * See `src/scrub.ts`.
 */
/** The start and end captions ride on the fingertip line, out past the square. */
const captionY = () => lineY();

const LABEL_CLASS =
  "text-base-content/70 bg-base-100/70 pointer-events-none absolute rounded" +
  " px-1.5 py-0.5 text-[0.58rem] leading-tight tracking-wide sm:text-[0.7rem]";
/** The end captions sit astride the line; a landmark's name sits above it. */
const CAPTION_CLASS = `${LABEL_CLASS} -translate-y-1/2`;
const LANDMARK_CLASS = `${LABEL_CLASS} -translate-x-1/2 -translate-y-full text-center whitespace-nowrap`;

/**
 * The clear paper on each side of the square, less a small gap so the caption
 * never touches the fingertip.
 */
const captionGap = () => `${scrub().captionGap}px`;
/**
 * How far a name sits above the line, in source units. Both are measured off
 * the fingertips, so they hold still when the line itself is moved down.
 */
const landmarkLift = () => scrub().lineDrop + scrub().landmarkLift;
/** The hover name sits a little lower than a landmark's, right over its dot. */
const hoverLift = () => scrub().lineDrop + scrub().hoverLift;
/**
 * Roughly how wide a name draws, for keeping two of them off each other. The
 * names grow at `sm:` in LABEL_CLASS, so the guess grows with them: 0.56 em
 * a letter, at 0.58rem and 0.7rem. A guess that stays phone-sized lets desktop
 * names overlap, and the cull in `landmarks.ts` would never see it. Read when
 * the stage resizes, which crossing 40rem always does.
 */
const landmarkCharPx = () =>
  window.matchMedia("(min-width: 40rem)").matches ? 6.3 : 5.2;
const LANDMARK_PAD_PX = 16;
const leftMargin = () => `calc(${FIGURE.leftX * 100}% - ${captionGap()})`;
const rightMargin = () =>
  `calc(${(1 - FIGURE.rightX) * 100}% - ${captionGap()})`;

/**
 * The image is drawn full width and pulled up, so only the arms band shows.
 * The crop is a live number in dev — the prototype panel drags it — so these
 * are functions, read inside the JSX and recomputed when it moves. The Light
 * tab's shift slides the drawing under the line; nothing else reads this box.
 */
const boxStyle = () => ({
  height: `${(FIGURE.height / cropHeight()) * 100}%`,
  top: `${((light().shift - cropTop()) / cropHeight()) * 100}%`,
});

/**
 * Solid across the arms and gone by the crop edge, plus whatever else the Fade
 * tab has switched on. Cut from the image's own box — see `src/fade.ts`.
 */
const imageStyle = (dim: number) => ({
  ...boxStyle(),
  ...maskStyle(),
  // A custom scan colour is painted by the layer below instead; the photo
  // stays in the page for its alt text.
  opacity:
    light().scan.colour === "custom" ? "0" : inkOpacity(dim * light().scanInk),
  "--figure-tint": scanTint(),
});

/**
 * The scan as a mask, in a colour of the Light tab's choosing. The file is
 * white ink on a black card, so it reads by brightness like the trace does,
 * and the colour lands the same on paper and on dark — a tint on the photo
 * cannot, because the light theme inverts it to black first.
 */
const scanColourStyle = (dim: number) => ({
  ...boxStyle(),
  ...maskStyle(`url(${FIGURE.src})`),
  "background-color": sideColour(light().scan),
  opacity: inkOpacity(dim * light().scanInk),
});

/**
 * The line layers ride on exactly the same box as the scan, so they land on it
 * to the pixel. Each is a mask, not an image: the colour under it is the
 * layer's own (see `src/light.ts`), and the fade is laid under it as further
 * mask layers, all intersected. A trace is white on black with no alpha, so its
 * own layer reads luminance while the gradients read alpha — see
 * `.figure-lines` in index.css, which `maskStyle` then overrides layer by layer.
 */
const linesStyle = (dim: number, layer: "outline" | "highlight") => ({
  ...boxStyle(),
  ...maskStyle(`url(${layer === "outline" ? FIGURE.lines : FIGURE.highlight})`),
  "background-color": sideColour(light()[layer]),
  opacity: String(Number(lineOpacity(dim)) * light()[layer].opacity),
});

/**
 * The band strip sits straight over the arms, its bottom just clear of the
 * landmark names above the line. Those names are HTML at a rem size, so the
 * room they need is rem on top of the source-y point they hang from; in source
 * units alone it would be too little on a phone and too much on a projector.
 */
const NAME_ROOM = "1.35rem";
const nameFrac = () => yFrac(lineY() - landmarkLift());
/**
 * How tall a landmark name draws — LABEL_CLASS's text at leading-tight, plus
 * its py-0.5 — and the live stretch's measure, which stands on top of it. The
 * text grows at `sm:`, so the heights are custom properties that grow with it.
 * Set on the stage, so the measure and its bar read the same ones.
 */
const ROW_HEIGHTS =
  "[--name-h:0.975rem] [--measure-h:0.725rem] sm:[--name-h:1.125rem] sm:[--measure-h:0.825rem]";
/**
 * The name's top padding is only paper, so the measure may sit on that. The
 * live stretch's bar reaches up to hold the measure, past the strip's foot if
 * it has to: the strip is drawn over it.
 */
const MEASURE_SINK = "0.125rem";
const STRETCH_ROOM = `max(${NAME_ROOM}, var(--name-h) + var(--measure-h) - ${MEASURE_SINK})`;
const stripBottom = () => `calc(${(1 - nameFrac()) * 100}% + ${NAME_ROOM})`;
/**
 * A column that belongs to the strip — the band under the pointer, the
 * timeline being previewed, the live stretch — runs from the strip's foot down through the
 * line, so the cell and its stretch of arm read as one thing. Solid where it
 * meets the strip, fading out below the line. The preview keeps this shape
 * with the strip off too: a full bar over the arms reads as "this much of it",
 * where a thin column round the line only looks like a thicker line.
 */
const LINK_MASK =
  "linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)";
const linkStyle = (room = NAME_ROOM) => ({
  top: `calc(${nameFrac() * 100}% - ${room})`,
  height: `calc(${(yFrac(lineY()) - nameFrac()) * 100}% + ${room} + ${scrub().columnPx}px)`,
  "-webkit-mask-image": LINK_MASK,
  "mask-image": LINK_MASK,
});
/*
 * The same band for the parts drawn in the SVG is `columnFrom`/`columnTo` in
 * `src/scrub.ts`: the columns are capped in pixels, that is the same cap at
 * the width the stage usually gets. Both ends fade out, so the few units
 * between them never show.
 */


export default function ArmStage(props: Props) {
  const [dragging, setDragging] = createSignal(false);
  const [stageWidth, setStageWidth] = createSignal(0);
  let stage!: HTMLDivElement;

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      const box = entries[0];
      if (box) setStageWidth(box.contentRect.width);
    });
    observer.observe(stage);
    onCleanup(() => observer.disconnect());
  });

  // The stage is the first thing in this component and keeps the crop's
  // aspect, so its width alone says where the line is. The crop is live in dev.
  createEffect(() =>
    props.onLineTop?.((stageWidth() * (lineY() - cropTop())) / FIGURE.width),
  );

  /** Pointer x -> position along the arm span. The crop never touches x. */
  const posFromClientX = (clientX: number): number => {
    const box = stage.getBoundingClientRect();
    if (box.width === 0) return props.pos;
    const frac = (clientX - box.left) / box.width;
    return clamp01((frac - FIGURE.leftX) / (FIGURE.rightX - FIGURE.leftX));
  };

  const startDrag = (e: PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    props.onPos(posFromClientX(e.clientX));
    e.preventDefault();
  };

  const moveDrag = (e: PointerEvent) => {
    if (!dragging()) return;
    props.onPos(posFromClientX(e.clientX));
  };

  const endDrag = () => setDragging(false);

  const onKeyDown = (e: KeyboardEvent) => {
    const back = e.key === "ArrowLeft" || e.key === "ArrowDown";
    const forward = e.key === "ArrowRight" || e.key === "ArrowUp";
    if (back || forward) {
      props.onNudge(
        back ? -1 : 1,
        e.altKey ? "event" : e.shiftKey ? "coarse" : "fine",
      );
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      props.onNudge(e.key === "PageDown" ? -1 : 1, "page");
    } else if (e.key === "Home") {
      props.onEnd(0);
    } else if (e.key === "End") {
      props.onEnd(1);
    } else {
      return;
    }
    e.preventDefault();
  };

  /**
   * The lines over the card: near now, the reading as a length, so the arm
   * stays a ruler; under it, where on the reader's own arm the marker stands.
   * One line each, not joined with a dot — two readings, not one phrase.
   * Either can be missing, so they are kept after they go away and have
   * something to fade out along.
   */
  const over = () =>
    [fob().showLength ? props.readoutLength : undefined, props.readoutBody]
      .filter((line): line is string => Boolean(line));
  const [lastOver, setLastOver] = createSignal<string[]>(["\u00a0"]);
  createEffect(() => {
    if (over().length > 0) setLastOver(over());
  });

  /**
   * The card's own width, so it can be kept on screen. It hangs centred under
   * the knob, and the knob reaches the fingertip, a tenth of the width in: on
   * a phone that put half of "13.8 billion years ago" past the edge.
   */
  const [cardW, setCardW] = createSignal(0);
  const watchCard = (el: HTMLElement) => {
    const observer = new ResizeObserver(() => setCardW(el.offsetWidth));
    observer.observe(el, { box: "border-box" });
    onCleanup(() => observer.disconnect());
  };

  /** The card's rows: the years, and the line under them. */
  const cardRows = () => {
    return (
      <div
        class="flex"
        classList={{
          "flex-col": fob().cardLayout === "stack",
          "items-baseline": fob().cardLayout === "line",
        }}
        style={{
          gap: `${fob().cardRowGap + (fob().cardLayout === "line" ? 0.5 : 0)}rem`,
          "align-items":
            fob().cardLayout === "stack" ? fob().cardAlign : undefined,
        }}
      >
        <Show when={fob().showYears}>
          <div class="text-accent text-xs font-semibold tabular-nums whitespace-nowrap sm:text-sm">
            {props.readoutYears}
          </div>
        </Show>
        <Show when={fob().showSub && props.readoutSub}>
          {(line) => (
            <div class="text-base-content/55 text-[0.6rem] tabular-nums whitespace-nowrap">
              {line()}
            </div>
          )}
        </Show>
      </div>
    );
  };

  /**
   * A fact about what is still ahead draws its future in the margin past the
   * right fingertip — right where the end caption sits. The bars already
   * change colour at now, so the caption stands down rather than sit in the
   * middle of the future.
   */
  const factAhead = () =>
    props.fact?.points.some((p) => p.yearsAgo < 0) ?? false;

  const rows = createMemo(() =>
    bandRows(props.bands, props.timeline.spanYears),
  );
  const stripOn = () => props.showBands && rows().length > 0;

  /** The cell the pointer is on in the strip, null when it leaves. */
  const [hoveredBand, setHoveredBand] = createSignal<PlacedBand | null>(null);

  /**
   * A moment gets one tick, with its error bar under it. Something that lasted
   * gets a bar between its two edges and a tick on each, so the arm shows how
   * long it ran and not just when it started.
   */
  const eventsWithPos = createMemo(() =>
    props.events.map((event) => {
      const t = clamp01(1 - event.yearsAgo / props.timeline.spanYears);
      if (event.endYearsAgo !== undefined) {
        const end = clamp01(1 - event.endYearsAgo / props.timeline.spanYears);
        return { event, t, from: t, to: end, stretch: true };
      }
      // The error bar is part of the Science reading, like the +/- on the
      // card. With it off the dot is the date, full stop.
      const slack = props.showUncertainty
        ? (event.uncertaintyYears ?? 0) / props.timeline.spanYears
        : 0;
      return {
        event,
        t,
        from: clamp01(t - slack),
        to: clamp01(t + slack),
        stretch: false,
      };
    }),
  );

  /**
   * The live card's stretch of arm, when it has one. Only a real span gets the
   * column — an uncertainty bar is not a length of time the reader can stand
   * inside, and a moment has no width at all.
   */
  const liveStretch = createMemo(() => {
    const live = eventsWithPos().find((e) => e.event.id === props.nearestId);
    return live && live.stretch ? live : undefined;
  });

  /** The dot the pointer is on, if any. Names it above the line. */
  const [hovered, setHovered] = createSignal<string | null>(null);
  const hoveredEvent = createMemo(() =>
    eventsWithPos().find((e) => e.event.id === hovered()),
  );

  /** The live event paints last, so its dot is never covered by a neighbour. */
  const ordered = createMemo(() => {
    const all = eventsWithPos();
    const live = all.filter((e) => e.event.id === props.nearestId);
    return live.length === 0
      ? all
      : [...all.filter((e) => !live.includes(e)), ...live];
  });

  /**
   * Landmark names, pushed apart where two of them would collide — Earth and
   * Life sit close together on the universe span — and left off where the
   * push would carry a name off its own dot, which on a phone it does. See
   * `src/landmarks.ts`.
   */
  const landmarks = createMemo(() => {
    const width = stageWidth();
    const charPx = landmarkCharPx();
    return placeLandmarks(
      eventsWithPos()
        .filter((e) => e.event.landmark)
        .map((e) => ({
          id: e.event.id,
          label: e.event.label,
          dot: xFrac(e.t),
          half:
            width > 0
              ? (e.event.label.length * charPx + LANDMARK_PAD_PX) / 2 / width
              : 0,
        })),
      scrub().landmarkSlide,
    );
  });

  /** The scan steps back while a fact is drawn over it. */
  const figureDim = () => (props.fact ? FACT_DIM : 1);

  const markerPct = () => `${xFrac(props.pos) * 100}%`;
  /** Source y -> a `top` for the HTML overlays sitting on the band. */
  const bandAt = (y: number) => `${yFrac(y) * 100}%`;
  /** SVG transforms take user units, so the marker can glide without re-laying out. */
  const glide = () =>
    dragging() ? "none" : "transform 260ms cubic-bezier(0.22, 0.8, 0.28, 1)";

  return (
    <div class="w-full">
      <div
        ref={stage}
        class={`no-select relative w-full touch-pan-y ${ROW_HEIGHTS}`}
        classList={{
          "cursor-ew-resize": dragging(),
          "cursor-pointer": !dragging(),
        }}
        style={{ "aspect-ratio": `${FIGURE.width} / ${cropHeight()}` }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* The window onto the scan: head and legs are clipped away. */}
        <div class="absolute inset-0 overflow-hidden">
          <img
            src={FIGURE.src}
            alt="The outstretched arms of Leonardo da Vinci's Vitruvian Man"
            width={FIGURE.width}
            height={FIGURE.height}
            class="figure-ink pointer-events-none absolute inset-x-0 w-full"
            style={imageStyle(figureDim())}
            draggable={false}
          />
          <Show when={light().scan.colour === "custom"}>
            <div
              class="figure-lines pointer-events-none absolute inset-x-0 w-full"
              style={scanColourStyle(figureDim())}
            />
          </Show>
          {/*
            The traced contours on top of it: the whole outline, softer, then
            the highlight — the top edge of the arms, lit from above — over it.
            Both are the theme's own ink unless the Light tab says otherwise —
            see `src/light.ts`.
          */}
          <div
            class="figure-lines pointer-events-none absolute inset-x-0 w-full"
            style={linesStyle(figureDim(), "outline")}
          />
          <div
            class="figure-lines pointer-events-none absolute inset-x-0 w-full"
            style={linesStyle(figureDim(), "highlight")}
          />
        </div>

        {/*
          What picking the hovered timeline would leave you with: its whole span
          measured on this one, from where it starts to the right fingertip. On
          the long spans that is a sliver at the very end of the arm, which is
          the point — so it is held to a couple of pixels rather than allowed to
          vanish.
        */}
        <Show when={props.previewFrom !== undefined}>
          <div
            data-preview-span
            class="border-accent/70 bg-accent/10 pointer-events-none absolute border-x"
            style={{
              left: `${xFrac(props.previewFrom!) * 100}%`,
              width: `max(2px, ${(xFrac(1) - xFrac(props.previewFrom!)) * 100}%)`,
              ...linkStyle(),
            }}
          />
        </Show>

        {/*
          The span the pointer is on in the strip, marked on the arms in its
          own colour. A cell is a few pixels tall, so a long span
          like the dinosaurs' reads there as a stripe of colour rather than as a
          stretch of arm; this puts it back on the arm without moving the
          marker onto it.
        */}
        <Show when={hoveredBand()}>
          {(b) => (
            <div
              class="pointer-events-none absolute"
              style={{
                left: `${xFrac(b().from) * 100}%`,
                width: `max(2px, ${(xFrac(b().to) - xFrac(b().from)) * 100}%)`,
                ...linkStyle(),
                "background-color": `color-mix(in oklab, ${b().color} 14%, transparent)`,
                "border-left": `1px solid color-mix(in oklab, ${b().color} 60%, transparent)`,
                "border-right": `1px solid color-mix(in oklab, ${b().color} 60%, transparent)`,
              }}
            />
          )}
        </Show>

        {/* A fun fact's gaps, each a bar over the arms it covers. */}
        <Show when={props.fact}>
          {(fact) => (
            <FactBars
              fact={fact()}
              spanYears={props.timeline.spanYears}
              stageWidth={stageWidth()}
            />
          )}
        </Show>

        {/*
          How long the live event ran: a bar over the arms it covers, the same
          shape as a fun fact's gap, with how long it ran written in it.
          A thin column round the line read as a thicker line, not as a length
          of time. A stretch that began before the arm did fades in from the
          left fingertip instead of starting there, so it does not claim to.
          While a fact is up it has the arm, so this stands down.
        */}
        <Show when={!props.fact && liveStretch()}>
          {(e) => {
            const cut = () => e().event.yearsAgo > props.timeline.spanYears;
            const edge =
              "1px solid color-mix(in oklab, var(--color-accent) 55%, transparent)";
            const mask = () =>
              cut()
                ? `${LINK_MASK}, linear-gradient(to right, transparent 0%, #000 12%)`
                : LINK_MASK;
            const mid = () => (e().from + e().to) / 2;
            const anchor = () => (mid() < 0.15 ? 0 : mid() > 0.85 ? 1 : 0.5);
            return (
              <>
                <div
                  class="bg-accent/[0.1] pointer-events-none absolute"
                  classList={{
                    "transition-[left,width] duration-[260ms] ease-out":
                      !dragging(),
                  }}
                  style={{
                    left: `${xFrac(e().from) * 100}%`,
                    width: `max(2px, ${(xFrac(e().to) - xFrac(e().from)) * 100}%)`,
                    ...linkStyle(STRETCH_ROOM),
                    "border-left": cut() ? undefined : edge,
                    "border-right": edge,
                    "-webkit-mask-image": mask(),
                    "mask-image": mask(),
                    "-webkit-mask-composite": "source-in",
                    "mask-composite": "intersect",
                  }}
                />
                <span
                  class="text-accent bg-base-100/95 pointer-events-none absolute rounded px-1 text-[0.58rem] leading-tight font-semibold whitespace-nowrap tabular-nums sm:text-[0.66rem]"
                  style={{
                    left: `${xFrac(e().from + (e().to - e().from) * anchor()) * 100}%`,
                    // Over the line, at the top of its own bar: under it is
                    // where the knob's readout hangs, and the marker is
                    // usually on one of the stretch's edges. It stands on the
                    // landmark names rather than among them — Roman Empire's
                    // name sits on the bar's own left edge. The names are
                    // source units off the line and this is rem, so a fixed
                    // rem lift landed in their row on a wide screen.
                    top: `calc(${nameFrac() * 100}% - var(--name-h) + ${MEASURE_SINK})`,
                    transform: `translate(-${anchor() * 100}%, -100%)`,
                  }}
                >
                  {formatYears(e().event.yearsAgo - e().event.endYearsAgo!)}
                </span>
              </>
            );
          }}
        </Show>

        {/* Under the SVG, so an event dot still wins its own hover. */}
        <Show when={DEV && bodyMarks()}>
          <BodyMarks spanYears={props.timeline.spanYears} />
        </Show>

        <svg
          class="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 ${cropTop()} ${FIGURE.width} ${cropHeight()}`}
          aria-hidden="true"
        >
          <line
            x1={xUnits(0)}
            x2={xUnits(1)}
            y1={lineY()}
            y2={lineY()}
            stroke="currentColor"
            stroke-width={scrub().lineWidth}
            stroke-linecap="round"
            class="text-accent/75"
          />

          {/* Bands and ticks fade back in whenever the timeline changes. */}
          <Show when={props.fact}>
            {(fact) => (
              <FactDots fact={fact()} spanYears={props.timeline.spanYears} />
            )}
          </Show>

          <Show when={props.timeline.id} keyed>
            <g class="timeline-fade">
              <For each={ordered()}>
                {(e) => {
                  const on = () => props.nearestId === e.event.id;
                  return (
                    <g
                      class="transition-opacity duration-200"
                      opacity={on() ? 1 : 0.8}
                    >
                      {/*
                        How unsure the date is: a bar lying along the line,
                        under the dot. A stretch gets no bar of its own here —
                        a line full of them reads as a thicker line, not as
                        lengths. Its two dots mark the edges, and the block
                        over the arms shows it while its card is live.
                      */}
                      <Show when={!e.stretch && e.to - e.from > 0.002}>
                        <line
                          x1={xUnits(e.from)}
                          x2={xUnits(e.to)}
                          y1={lineY()}
                          y2={lineY()}
                          stroke="currentColor"
                          stroke-width={scrub().slackWidth}
                          stroke-linecap="round"
                          class="text-base-content/35"
                        />
                      </Show>
                      <For each={e.stretch ? [e.from, e.to] : [e.t]}>
                        {(at) => (
                          <g
                            class="event"
                            onPointerEnter={() => setHovered(e.event.id)}
                            onPointerLeave={() => setHovered(null)}
                            onClick={() => props.onPos(at)}
                          >
                            <circle
                              class="event-hit"
                              cx={xUnits(at)}
                              cy={lineY()}
                              r={scrub().dotHit}
                            />
                            <circle
                              cx={xUnits(at)}
                              cy={lineY()}
                              r={on() ? scrub().dotLiveR : scrub().dotR}
                              fill="currentColor"
                              stroke-width={scrub().dotStroke}
                              class={
                                "event-dot stroke-base-100 " +
                                (on()
                                  ? "text-accent"
                                  : e.event.certainty === "disputed"
                                    ? "text-warning"
                                    : "text-base-content")
                              }
                            />
                          </g>
                        )}
                      </For>
                    </g>
                  );
                }}
              </For>
            </g>
          </Show>

          {/*
            One thin guide across the arms, the same height as a span column,
            and a dot exactly on the fingertip line. The knob is an HTML ring
            sitting on top of it, so the guide reads straight through the middle
            of it. It ends where the column ends rather than where the drawing
            does: a line down the whole picture reads as a cut through it.
          */}
          <g
            class="text-accent"
            style={{
              transform: `translateX(${xUnits(props.pos)}px)`,
              transition: glide(),
            }}
          >
            <defs>
              {/* Inside the coloured group, so the stops take its own colour. */}
              <linearGradient
                id="guide-fade"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={columnFrom()}
                x2="0"
                y2={columnTo()}
              >
                <stop offset="0" stop-color="currentColor" stop-opacity="0" />
                <stop
                  offset="0.28"
                  stop-color="currentColor"
                  stop-opacity="0.5"
                />
                <stop
                  offset="0.72"
                  stop-color="currentColor"
                  stop-opacity="0.5"
                />
                <stop offset="1" stop-color="currentColor" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line
              x1={0}
              x2={0}
              y1={columnFrom()}
              y2={columnTo()}
              stroke="url(#guide-fade)"
              stroke-width="2"
            />
            <circle cx={0} cy={lineY()} r="2.5" fill="currentColor" />
          </g>
        </svg>

        {/*
          The named spans, laid just over the arms and clear of the landmark
          names. Coarsest at the top, finest under it, so the strip reads down
          into the arms. Up by the head it ran under the header and the top
          row was cut off. It sits inside the stage, so it does not cost the
          drawing any height; the pointer events
          stop here, or picking a span would scrub as well.
        */}
        <Show when={stripOn()}>
          <div
            class="absolute inset-x-0"
            style={{
              bottom: props.fact
                ? `calc(${(1 - yFrac(lineY())) * 100}% + ${factLift(props.fact, props.timeline.spanYears, stageWidth())}rem)`
                : stripBottom(),
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Show when={props.timeline.id} keyed>
              <TimelineStrip
                rows={rows()}
                pos={props.pos}
                onPick={props.onPos}
                previewFrom={props.previewFrom}
                onHoverBand={setHoveredBand}
              />
            </Show>
          </div>
        </Show>

        {/* What the pointer is on, named just above the line it sits on. */}
        <Show when={hoveredEvent()}>
          {(e) => (
            <span
              class="border-base-content/15 bg-base-100/90 text-base-content pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border px-1.5 py-0.5 text-[0.6rem] leading-tight whitespace-nowrap shadow-sm sm:text-[0.7rem]"
              style={{
                left: `${xFrac(e().t) * 100}%`,
                top: bandAt(lineY() - hoverLift()),
              }}
            >
              {e().event.label}
            </span>
          )}
        </Show>

        {/*
          Landmarks: the few events whose name is written on the arm itself, so
          the reader can see where they fall without scrubbing onto them.
        */}
        <Show
          when={props.fact}
          fallback={
            <For each={landmarks()}>
              {(mark) => (
                <span
                  class={LANDMARK_CLASS}
                  // The live event's name stands out from the rest. Placement
                  // still uses the regular width, so nothing shifts when the
                  // marker arrives.
                  classList={{ "font-bold": mark.id === props.nearestId }}
                  style={{
                    left: `${mark.at * 100}%`,
                    top: bandAt(lineY() - landmarkLift()),
                  }}
                >
                  {mark.label}
                </span>
              )}
            </For>
          }
        >
          {/* A fact names its own moments, so the landmark names stand
              down rather than fight them for the same strip of arm. */}
          {(fact) => (
            <FactNames
              fact={fact()}
              spanYears={props.timeline.spanYears}
              stageWidth={stageWidth()}
            />
          )}
        </Show>

        {/*
          The two ends of the span, in the margins beyond the fingertips: the
          square's sides run through the fingertips, so this keeps the words off
          the drawing however long they are.
        */}
        <span
          class={`${CAPTION_CLASS} text-right`}
          style={{
            right: `calc(100% - ${leftMargin()})`,
            "max-width": leftMargin(),
            top: bandAt(captionY()),
          }}
        >
          {props.timeline.startLabel}
        </span>
        <Show when={!factAhead()}>
          <span
            class={CAPTION_CLASS}
            style={{
              left: `calc(100% - ${rightMargin()})`,
              "max-width": rightMargin(),
              top: bandAt(captionY()),
            }}
          >
            {props.timeline.endLabel}
          </span>
        </Show>

        {/*
          The scrubber: an empty ring riding the fingertip line. Its size, its
          halo and how much it grows under the thumb are live numbers, so they
          come in as custom properties — `.fob` in index.css turns them into a
          width, a shadow and the transform, since a Tailwind class cannot be a
          variable.
        */}
        <button
          type="button"
          role="slider"
          aria-label="Move through time along the arms"
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-valuenow={Math.round(props.pos * 1000)}
          aria-valuetext={[
            props.readoutYears,
            props.readoutSub,
            props.readoutLength,
            props.readoutBody,
          ]
            .filter(Boolean)
            .join(", ")}
          aria-orientation="horizontal"
          class="fob border-accent absolute z-10 cursor-ew-resize rounded-full border-solid bg-transparent"
          classList={{
            "transition-[left,transform] duration-[260ms] ease-out":
              !dragging(),
          }}
          style={{
            left: markerPct(),
            top: bandAt(fobY()),
            "touch-action": "none",
            "border-width": `${fob().fobBorder}px`,
            "--fob-size": `${fob().fobSize}px`,
            "--fob-size-wide": `${fob().fobSizeWide}px`,
            "--fob-halo": `${fob().fobHalo}px`,
            "--fob-press": dragging() ? fob().fobPress : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            // startDrag suppresses the default, so focus has to be taken by hand
            // or the arrow keys would do nothing after a click.
            e.currentTarget.focus();
            startDrag(e);
          }}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
        />
      </div>

      {/*
        The readout rides on its own rail right under the knob, so it reserves
        its own height instead of floating over the list. The rail is pulled up
        into the bottom of the band, where the figure has already faded out, so
        the reading stays next to the knob it belongs to.
      */}
      <div
        class="rail pointer-events-none"
        style={{
          "--rail-gap": `${fob().railGap}rem`,
          "--rail-gap-wide": `${fob().railGapWide}rem`,
        }}
      >
        {/*
          `data-marker-anchor` is where the line to the live card starts.
        */}
        <div
          ref={watchCard}
          data-marker-anchor
          class="relative w-fit -translate-x-1/2 border-solid"
          classList={{
            "shadow-sm": fob().cardShadow,
            "transition-[margin] duration-[260ms] ease-out": !dragging(),
          }}
          style={{
            padding: `${fob().railPadY}rem ${fob().railPadX}rem`,
            // Centred under the knob until its edge meets the screen's, then
            // it stops and the knob runs on over it.
            "margin-left": `clamp(calc(${cardW() / 2}px + ${fob().railEdge}rem), ${markerPct()}, calc(100% - ${cardW() / 2}px - ${fob().railEdge}rem))`,
            "border-radius": cardRadius(),
            "border-width": `${fob().cardBorder}px`,
            "border-color": `color-mix(in oklab, var(--color-accent) ${fob().cardBorderInk * 100}%, transparent)`,
            "background-color": `color-mix(in oklab, var(--color-base-100) ${fob().cardFill * 100}%, transparent)`,
            "text-align": fob().cardAlign,
          }}
        >
          {/*
            Over the card and under the knob. Out of the flow, so it never
            moves the card: it only fades in and out.
          */}
          <div
            class="text-base-content/65 bg-base-100/70 pointer-events-none absolute bottom-full left-1/2 mb-0.5 flex -translate-x-1/2 flex-col items-center rounded px-1 text-[0.7rem] tabular-nums whitespace-nowrap transition-opacity duration-300 sm:text-xs"
            classList={{ "opacity-0": over().length === 0 }}
          >
            <For each={lastOver()}>{(line) => <div>{line}</div>}</For>
          </div>
          {cardRows()}
        </div>
      </div>
    </div>
  );
}

import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import TimelineStrip from "./TimelineStrip";
import type { Band, TimelineEvent, Timeline } from "../types";
import {
  FIGURE,
  STRIP_BOTTOM,
  bandRows,
  cropHeight,
  cropTop,
  xFrac,
  xUnits,
  yFrac,
} from "../figure";
import type { PlacedBand } from "../figure";
import { inkOpacity, lineOpacity, maskStyle } from "../fade";
import { columnFrom, columnTo, fobY, lineY, scrub } from "../scrub";
import { clamp01 } from "../scale";

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
  /**
   * A shorter timeline the reader is hovering in the picker: where it starts,
   * 0..1 along this one. It runs from there to the right fingertip, because
   * every timeline ends at now.
   */
  previewFrom?: number;
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
/** Roughly how wide a name draws, for keeping two of them off each other. */
const LANDMARK_CHAR_PX = 5.2;
const LANDMARK_PAD_PX = 16;
const leftMargin = () => `calc(${FIGURE.leftX * 100}% - ${captionGap()})`;
const rightMargin = () => `calc(${(1 - FIGURE.rightX) * 100}% - ${captionGap()})`;

/**
 * The image is drawn full width and pulled up, so only the arms band shows.
 * The crop is a live number in dev — the prototype panel drags it — so these
 * are functions, read inside the JSX and recomputed when it moves.
 */
const boxStyle = () => ({
  height: `${(FIGURE.height / cropHeight()) * 100}%`,
  top: `${-(cropTop() / cropHeight()) * 100}%`,
});

/**
 * Solid across the arms and gone by the crop edge, plus whatever else the Fade
 * tab has switched on. Cut from the image's own box — see `src/fade.ts`.
 */
const imageStyle = () => ({
  ...boxStyle(),
  ...maskStyle(),
  opacity: inkOpacity(),
});

/**
 * The line layer rides on exactly the same box as the scan, so it lands on it
 * to the pixel. It is a mask, not an image: the colour under it is
 * `currentColor`, and the fade is laid under it as further mask layers, all
 * intersected. The trace is white on black with no alpha, so its own layer
 * reads luminance while the gradients read alpha — see `.figure-lines` in
 * index.css, which `maskStyle` then overrides layer by layer.
 */
const linesStyle = () => ({
  ...boxStyle(),
  ...maskStyle(`url(${FIGURE.lines})`),
  opacity: lineOpacity(),
});

/**
 * A stretch of arm — how long an event ran, how much of this timeline another
 * one covers — is marked with a column, because a bar lying on the line is a
 * few pixels tall and reads as a thicker line rather than as a length. It is a
 * short band centred on the line the knob rides: run it the whole height and it
 * stops being a mark on the arms and becomes a block over the drawing. The
 * stage is shorter than the cap on a phone, so there it takes what there is.
 */
const columnHeight = () => `min(100%, ${scrub().columnPx}px)`;
const columnTop = () => `${yFrac(lineY()) * 100}%`;
/** Solid through the middle and out at both ends, so it has no hard edge. */
const COLUMN_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 28%, #000 72%, transparent 100%)";
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

  /** Kept after it goes away, so the length row has something to fade out along. */
  const [lastLength, setLastLength] = createSignal("\u00a0");
  createEffect(() => {
    if (props.readoutLength) setLastLength(props.readoutLength);
  });

  const rows = createMemo(() => bandRows(props.bands, props.timeline.spanYears));

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
   * Landmark names, placed left to right and pushed apart where two of them
   * would collide: Earth and Life sit close together on the universe span. The
   * placement depends only on the dates and the width, so a name never moves
   * when the marker arrives on its dot.
   */
  const landmarks = createMemo(() => {
    const width = stageWidth();
    const placed = eventsWithPos()
      .filter((e) => e.event.landmark)
      .map((e) => ({
        id: e.event.id,
        label: e.event.label,
        at: xFrac(e.t),
        half:
          width > 0
            ? (e.event.label.length * LANDMARK_CHAR_PX + LANDMARK_PAD_PX) /
              2 /
              width
            : 0,
      }))
      .sort((a, b) => a.at - b.at);

    for (let i = 1; i < placed.length; i++) {
      const prev = placed[i - 1]!;
      const cur = placed[i]!;
      cur.at = Math.max(cur.at, prev.at + prev.half + cur.half);
    }
    // The push only ever goes right, so walk back to keep the last one on stage.
    for (let i = placed.length - 1; i >= 0; i--) {
      const cur = placed[i]!;
      const next = placed[i + 1];
      const ceiling = next ? next.at - next.half - cur.half : 1 - cur.half;
      cur.at = Math.min(cur.at, ceiling);
    }
    return placed;
  });

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
        class="no-select relative w-full touch-pan-y"
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
            style={imageStyle()}
            draggable={false}
          />
          {/* The traced contours on top of it, in the theme's own ink. */}
          <div
            class="figure-lines text-base-content/90 pointer-events-none absolute inset-x-0 w-full"
            style={linesStyle()}
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
            class="border-accent/70 bg-accent/10 pointer-events-none absolute -translate-y-1/2 border-x"
            style={{
              left: `${xFrac(props.previewFrom!) * 100}%`,
              width: `max(2px, ${(xFrac(1) - xFrac(props.previewFrom!)) * 100}%)`,
              top: columnTop(),
              height: columnHeight(),
              "-webkit-mask-image": COLUMN_MASK,
              "mask-image": COLUMN_MASK,
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
              class="pointer-events-none absolute -translate-y-1/2"
              style={{
                left: `${xFrac(b().from) * 100}%`,
                width: `max(2px, ${(xFrac(b().to) - xFrac(b().from)) * 100}%)`,
                top: columnTop(),
                height: columnHeight(),
                "background-color": `color-mix(in oklab, ${b().color} 14%, transparent)`,
                "border-left": `1px solid color-mix(in oklab, ${b().color} 60%, transparent)`,
                "border-right": `1px solid color-mix(in oklab, ${b().color} 60%, transparent)`,
                "-webkit-mask-image": COLUMN_MASK,
                "mask-image": COLUMN_MASK,
              }}
            />
          )}
        </Show>

        {/* How long the live event ran, marked on the arms it covers. */}
        <Show when={liveStretch()}>
          {(e) => (
            <div
              class="border-accent/45 bg-accent/[0.09] pointer-events-none absolute -translate-y-1/2 border-x"
              classList={{
                "transition-[left,width] duration-[260ms] ease-out":
                  !dragging(),
              }}
              style={{
                left: `${xFrac(e().from) * 100}%`,
                width: `${(xFrac(e().to) - xFrac(e().from)) * 100}%`,
                top: columnTop(),
                height: columnHeight(),
                "-webkit-mask-image": COLUMN_MASK,
                "mask-image": COLUMN_MASK,
              }}
            />
          )}
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
                        How long it ran, or how unsure the date is: a bar lying
                        along the line, under the dots.
                      */}
                      <Show when={e.to - e.from > 0.002}>
                        <line
                          x1={xUnits(e.from)}
                          x2={xUnits(e.to)}
                          y1={lineY()}
                          y2={lineY()}
                          stroke="currentColor"
                          stroke-width={e.stretch ? scrub().stretchWidth : scrub().slackWidth}
                          stroke-linecap="round"
                          class={
                            !e.stretch
                              ? "text-base-content/35"
                              : on()
                                ? "text-accent/60"
                                : "text-base-content/40"
                          }
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
          The named spans, laid over the head — the one stretch of clear paper
          the outstretched arms leave. Coarsest at the top, finest under it, so
          the strip still reads down into the arms. It sits inside the stage
          now, so it does not cost the drawing any height; the pointer events
          stop here, or picking a span would scrub as well.
        */}
        <Show when={props.showBands && rows().length > 0}>
          <div
            class="absolute inset-x-0"
            style={{ bottom: `${(1 - yFrac(STRIP_BOTTOM)) * 100}%` }}
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
        <For each={landmarks()}>
          {(mark) => (
            <span
              class={LANDMARK_CLASS}
              style={{
                left: `${mark.at * 100}%`,
                top: bandAt(lineY() - landmarkLift()),
              }}
            >
              {mark.label}
            </span>
          )}
        </For>

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
          aria-label="Scrub along the arm span"
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-valuenow={Math.round(props.pos * 1000)}
          aria-valuetext={[
            props.readoutYears,
            props.readoutSub,
            props.readoutLength,
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
            "border-width": `${scrub().fobBorder}px`,
            "--fob-size": `${scrub().fobSize}px`,
            "--fob-size-wide": `${scrub().fobSizeWide}px`,
            "--fob-halo": `${scrub().fobHalo}px`,
            "--fob-press": dragging() ? scrub().fobPress : 1,
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
          "--rail-gap": `${scrub().railGap}rem`,
          "--rail-gap-wide": `${scrub().railGapWide}rem`,
        }}
      >
        {/* `data-marker-anchor` is where the line to the live card starts. */}
        <div
          data-marker-anchor
          class="border-accent/35 bg-base-100/85 w-fit -translate-x-1/2 rounded-full border text-center shadow-sm"
          classList={{
            "transition-[margin] duration-[260ms] ease-out": !dragging(),
          }}
          style={{
            padding: `${scrub().railPadY}rem ${scrub().railPadX}rem`,
            "margin-left": `clamp(${scrub().railEdge}rem, ${markerPct()}, calc(100% - ${scrub().railEdge}rem))`,
          }}
        >
          <div class="text-accent text-xs font-semibold tabular-nums whitespace-nowrap sm:text-sm">
            {props.readoutYears}
          </div>
          <Show when={props.readoutSub}>
            {(line) => (
              <div class="text-base-content/55 text-[0.6rem] tabular-nums whitespace-nowrap">
                {line()}
              </div>
            )}
          </Show>
          {/*
            The same reading as a length, so the arm stays a ruler. It only
            runs while the distance is still hand-sized, so the row keeps its
            height either way and fades instead of popping: the pill, and the
            list under it, hold still.
          */}
          <div
            class="text-base-content/40 text-[0.55rem] tabular-nums whitespace-nowrap transition-opacity duration-200"
            classList={{ "opacity-0": !props.readoutLength }}
          >
            {lastLength()}
          </div>
        </div>
      </div>
    </div>
  );
}

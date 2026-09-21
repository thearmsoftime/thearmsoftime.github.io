import { For, Show } from "solid-js";
import {
  NAIL_FILE_MM,
  stepYardstick,
  yardstickOf,
  type ScaleReadout,
  type YardstickId,
} from "../scale";

export interface ScaleProps {
  scale: ScaleReadout;
  armSpanM: number;
  totalYears: string;
  totalGenerations: string;
  /** Generations only mean something on the human timelines. */
  showGenerations: boolean;
  /** Which ruler the scale cell is read in. */
  yardstick: YardstickId;
  onYardstick: (id: YardstickId) => void;
}

interface Cell {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
  /** The one cell that rotates through rulers carries the arrow. */
  cycle?: boolean;
}

/** Two on the left of the arms, two on the right. */
function cells(props: ScaleProps): { left: Cell[]; right: Cell[] } {
  const gen = (text: string) => (props.showGenerations ? text : undefined);
  return {
    left: [
      {
        label: "Whole span",
        value: props.totalYears,
        sub: gen(props.totalGenerations),
      },
      {
        label: props.scale.unitLabel,
        value: props.scale.perUnit,
        sub: gen(props.scale.perUnitGenerations),
        strong: true,
        cycle: true,
      },
    ],
    right: [
      {
        label: `Nail file (${NAIL_FILE_MM} mm)`,
        value: props.scale.nailFile,
        sub: gen(props.scale.nailFileGenerations),
      },
      {
        label: props.scale.comparisonLabel,
        value: props.scale.comparisonLength,
      },
    ],
  };
}

/** One step along the ring of rulers. */
function StepArrow(
  props: { direction: -1 | 1; title: string } & Pick<
    ScaleProps,
    "yardstick" | "onYardstick"
  >,
) {
  return (
    <button
      type="button"
      class="text-base-content/30 hover:text-accent focus-visible:ring-accent/50 -my-1 shrink-0 rounded px-0.5 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      title={props.title}
      aria-label={props.title}
      onClick={() =>
        props.onYardstick(stepYardstick(props.yardstick, props.direction))
      }
    >
      <svg
        viewBox="0 0 8 12"
        class="size-2.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d={props.direction < 0 ? "M6 1 1.5 6 6 11" : "M2 1 6.5 6 2 11"} />
      </svg>
    </button>
  );
}

/** The label of the scale cell, with an arrow either side to change the ruler. */
function CycleLabel(
  props: { label: string; class: string } & Pick<
    ScaleProps,
    "armSpanM" | "yardstick" | "onYardstick"
  >,
) {
  const title = (direction: -1 | 1) => {
    const label = yardstickOf(
      stepYardstick(props.yardstick, direction),
    ).label(props.armSpanM);
    return `Show ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
  };

  return (
    <div class={`flex max-w-full items-center gap-0.5 ${props.class}`}>
      <StepArrow
        direction={-1}
        title={title(-1)}
        yardstick={props.yardstick}
        onYardstick={props.onYardstick}
      />
      <span class="truncate">{props.label}</span>
      <StepArrow
        direction={1}
        title={title(1)}
        yardstick={props.yardstick}
        onYardstick={props.onYardstick}
      />
    </div>
  );
}

const LABEL_RAIL =
  "text-base-content/40 text-[0.6rem] tracking-[0.14em] uppercase";
const LABEL_ROW =
  "text-base-content/40 text-[0.58rem] tracking-[0.12em] uppercase";

/**
 * The numbers that used to sit in a band under the arms. They live beside the
 * arms now: the height they gave up belongs to the event list.
 */
export function ScaleRail(props: ScaleProps & { side: "left" | "right" }) {
  const list = () =>
    props.side === "left" ? cells(props).left : cells(props).right;

  return (
    <div
      class="flex w-40 shrink-0 flex-col justify-center gap-3 xl:w-52"
      classList={{
        "items-end text-right": props.side === "left",
        "items-start": props.side === "right",
      }}
    >
      <For each={list()}>
        {(cell) => (
          <div class="min-w-0">
            <Show
              when={cell.cycle}
              fallback={
                <div class={`truncate ${LABEL_RAIL}`}>{cell.label}</div>
              }
            >
              <CycleLabel
                label={cell.label}
                class={LABEL_RAIL}
                armSpanM={props.armSpanM}
                yardstick={props.yardstick}
                onYardstick={props.onYardstick}
              />
            </Show>
            <div
              class="truncate text-sm font-semibold tabular-nums"
              classList={{ "text-accent": cell.strong }}
            >
              {cell.value}
            </div>
            <Show when={cell.sub}>
              {(sub) => (
                <div class="text-base-content/45 truncate text-[0.65rem] tabular-nums">
                  {sub()}
                </div>
              )}
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}

/** The same numbers in one line, for screens too narrow to carry the rails. */
export function ScaleRow(props: ScaleProps) {
  const all = () => [...cells(props).left, ...cells(props).right];

  return (
    <div class="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-0.5 px-3 lg:hidden">
      <For each={all()}>
        {(cell) => (
          <div class="flex items-baseline gap-1.5 whitespace-nowrap">
            <Show
              when={cell.cycle}
              fallback={<span class={LABEL_ROW}>{cell.label}</span>}
            >
              <CycleLabel
                label={cell.label}
                class={LABEL_ROW}
                armSpanM={props.armSpanM}
                yardstick={props.yardstick}
                onYardstick={props.onYardstick}
              />
            </Show>
            <span
              class="text-xs font-semibold tabular-nums"
              classList={{ "text-accent": cell.strong }}
            >
              {cell.value}
            </span>
          </div>
        )}
      </For>
    </div>
  );
}

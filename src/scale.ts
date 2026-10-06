import {
  formatFingers,
  formatGenerations,
  formatMm,
  formatYears,
  generationsOf,
} from "./format";

const DAY = 1 / 365.25;
const HOUR = DAY / 24;
const MINUTE = HOUR / 60;

/** Thickness a single pass of a nail file takes off a fingernail. */
export const NAIL_FILE_MM = 0.1;

/** Width of one human hair. They run 0.02-0.18 mm; this is the middle of it. */
export const HAIR_MM = 0.07;

/**
 * Vitruvius, and so Leonardo's drawing: a man is 24 palms tall, a palm is 4
 * fingers, and his arm span equals his height. So one finger is a 96th of the
 * span, whatever the span is.
 */
export const FINGERS_PER_SPAN = 96;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 0 = left fingertip (start of time), 1 = right fingertip (now). */
export const fractionOf = (yearsAgo: number, spanYears: number): number =>
  clamp01(1 - yearsAgo / spanYears);

export const yearsAgoAt = (fraction: number, spanYears: number): number =>
  (1 - clamp01(fraction)) * spanYears;

/**
 * Whether another card starts inside a stretch, all on the 0-1 arm. Such a
 * stretch is read at its start only, like a moment. The strip runs in start
 * order, so Egypt's card sits left of the Great Pyramid's and Athens' cards:
 * if Egypt held the marker for its whole length, the strip would sit on Egypt
 * while the card lit up was two to its right. The live card and the strip
 * both ask this, so they always agree.
 */
export const startsInside = (from: number, to: number, starts: number[]): boolean =>
  starts.some((t) => t > from && t < to);

interface Reference {
  years: number;
  label: string;
}

/**
 * Spans a person has a feel for, matched to one nail-file swipe. The scale bar
 * dropped that row; the ruler workbench still reads it.
 */
export const REFERENCES: Reference[] = [
  { years: MINUTE, label: "A minute" },
  { years: HOUR, label: "An hour" },
  { years: DAY, label: "A day" },
  { years: 7 * DAY, label: "A week" },
  { years: 30 * DAY, label: "A month" },
  { years: 1, label: "A year" },
  { years: 10, label: "A decade" },
  { years: 29, label: "One generation" },
  { years: 57, label: "Since the moon landing" },
  { years: 80, label: "A whole human life" },
  { years: 140, label: "Since the first car" },
  { years: 265, label: "Since the steam engine" },
  { years: 585, label: "Since printing" },
  { years: 1000, label: "A thousand years" },
  { years: 2025, label: "Since the year 1" },
  { years: 5500, label: "All of written history" },
  { years: 12000, label: "Everything since farming began" },
  { years: 300000, label: "All of Homo sapiens" },
  { years: 2.8e6, label: "The whole genus Homo" },
  { years: 7e6, label: "The whole human story" },
  { years: 66e6, label: "The whole age of mammals" },
  { years: 538.8e6, label: "Every animal fossil ever found" },
];

/** The reference span closest in size to one nail-file swipe. */
export function pickReference(yearsPerSwipe: number): Reference {
  let best = REFERENCES[0]!;
  let bestDistance = Infinity;
  for (const r of REFERENCES) {
    const distance = Math.abs(Math.log(r.years / yearsPerSwipe));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = r;
    }
  }
  return best;
}

/**
 * A long human life, for the one ruler that runs the other way. The round 80
 * the dev reference list already uses: a life a reader has seen, not an
 * average dragged down by childhood deaths.
 */
export const LIFE_YEARS = 80;

/**
 * A life is only offered as a ruler where it is at least half a finger long.
 * A finger is a fixed share of the span, so this is a gate on the timeline,
 * not on the arm span: History passes, Humans is a thousand times short.
 */
const LIFE_MIN_FINGERS = 0.5;

/**
 * The rulers the scale cell can be read in. The arrows beside it step through
 * them: a millimetre is honest, a hair and a finger are things the hand knows.
 * A life turns it round — a stretch of time, and how many fingers it takes.
 */
export type YardstickId = "life" | "mm" | "hair" | "finger";

export interface Yardstick {
  id: YardstickId;
  /** What the cell calls it, e.g. "A finger (19.8 mm)". */
  label: (armSpanM: number) => string;
  /** How thick it is, in millimetres, on an arm of this span. */
  mm?: (armSpanM: number) => number;
  /** Or a stretch of time, read back as a length in fingers. */
  years?: number;
  /** Whether a timeline this long can show it at all. */
  offered?: (spanYears: number) => boolean;
}

/**
 * One finger's width on an arm of this span, in whole millimetres. Nobody
 * measures a finger to a tenth of a millimetre, and the label says the same
 * number the readout is worked out from.
 */
export const fingerMm = (armSpanM: number): number =>
  Math.max(1, Math.round((armSpanM * 1000) / FINGERS_PER_SPAN));

/** First in the list is the default, so a timeline that has a life opens on it. */
export const YARDSTICKS: readonly Yardstick[] = [
  {
    id: "life",
    label: () => `One life (${LIFE_YEARS} years)`,
    years: LIFE_YEARS,
    offered: (spanYears) =>
      (LIFE_YEARS * FINGERS_PER_SPAN) / spanYears >= LIFE_MIN_FINGERS,
  },
  { id: "mm", label: () => "Each mm of arm", mm: () => 1 },
  {
    id: "hair",
    label: () => `A hair (${formatMm(HAIR_MM)})`,
    mm: () => HAIR_MM,
  },
  {
    id: "finger",
    label: (span) => `A finger (${formatMm(fingerMm(span))})`,
    mm: (span) => fingerMm(span),
  },
];

/** The rulers this timeline can be read in, in ring order. */
export const yardsticksFor = (spanYears: number): readonly Yardstick[] =>
  YARDSTICKS.filter((y) => y.offered?.(spanYears) ?? true);

export const yardstickOf = (id: YardstickId): Yardstick =>
  YARDSTICKS.find((y) => y.id === id) ?? YARDSTICKS[0]!;

/** One ruler along the ring, either way, for the arrows beside the cell. */
export function stepYardstick(
  ring: readonly Yardstick[],
  id: YardstickId,
  direction: -1 | 1,
): YardstickId {
  const count = ring.length;
  const at = ring.findIndex((y) => y.id === id);
  return ring[(at + direction + count) % count]!.id;
}

export const parseYardstick = (raw: string): YardstickId | undefined =>
  YARDSTICKS.some((y) => y.id === raw) ? (raw as YardstickId) : undefined;

/**
 * The ruler is picked per timeline — a life on History, a millimetre on
 * the Universe — and stored as "modern:life,universe:hair". A pair that no
 * longer parses is dropped, not the whole list.
 */
export function parseYardsticks(raw: string): Record<string, YardstickId> {
  const picked: Record<string, YardstickId> = {};
  for (const pair of raw.split(",")) {
    const [timeline, id] = pair.split(":");
    const yardstick = id ? parseYardstick(id) : undefined;
    if (timeline && yardstick) picked[timeline] = yardstick;
  }
  return picked;
}

export const writeYardsticks = (picked: Record<string, YardstickId>): string =>
  Object.entries(picked)
    .map(([timeline, id]) => `${timeline}:${id}`)
    .join(",");

export interface ScaleReadout {
  yearsPerMetre: number;
  yearsPerMm: number;
  /** The ruler on show, e.g. "A hair (0.07 mm)" */
  unitLabel: string;
  /** What that ruler covers, e.g. "508 thousand years", or "1.7 fingers" */
  perUnit: string;
  /** e.g. "18.9 thousand generations"; none for a life, which is time already */
  perUnitGenerations?: string;
}

export function scaleReadout(
  spanYears: number,
  armSpanM: number,
  generationYears: number,
  yardstick: YardstickId = "mm",
): ScaleReadout {
  const yearsPerMetre = spanYears / armSpanM;
  const yearsPerMm = yearsPerMetre / 1000;
  const unit = yardstickOf(yardstick);

  if (unit.years !== undefined) {
    const yearsPerFinger = yearsPerMm * fingerMm(armSpanM);
    return {
      yearsPerMetre,
      yearsPerMm,
      unitLabel: unit.label(armSpanM),
      perUnit: formatFingers(unit.years / yearsPerFinger),
    };
  }

  const yearsPerUnit = yearsPerMm * (unit.mm?.(armSpanM) ?? 1);
  return {
    yearsPerMetre,
    yearsPerMm,
    unitLabel: unit.label(armSpanM),
    perUnit: formatYears(yearsPerUnit),
    perUnitGenerations: formatGenerations(
      generationsOf(yearsPerUnit, generationYears),
    ),
  };
}

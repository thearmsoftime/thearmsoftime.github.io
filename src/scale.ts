import {
  formatGenerations,
  formatLength,
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

interface Reference {
  years: number;
  label: string;
}

/** Spans a person has a feel for, used for the nail-file comparison. */
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
 * The rulers the scale cell can be read in. The arrows beside it step through
 * them: a millimetre is honest, a hair and a finger are things the hand knows.
 */
export type YardstickId = "mm" | "hair" | "finger";

export interface Yardstick {
  id: YardstickId;
  /** What the cell calls it, e.g. "A finger (19.8 mm)". */
  label: (armSpanM: number) => string;
  /** How thick it is, in millimetres, on an arm of this span. */
  mm: (armSpanM: number) => number;
}

/**
 * One finger's width on an arm of this span, in whole millimetres. Nobody
 * measures a finger to a tenth of a millimetre, and the label says the same
 * number the readout is worked out from.
 */
export const fingerMm = (armSpanM: number): number =>
  Math.max(1, Math.round((armSpanM * 1000) / FINGERS_PER_SPAN));

export const YARDSTICKS: readonly Yardstick[] = [
  { id: "mm", label: (span) => `1 mm of ${span.toFixed(2)} m`, mm: () => 1 },
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

export const yardstickOf = (id: YardstickId): Yardstick =>
  YARDSTICKS.find((y) => y.id === id) ?? YARDSTICKS[0]!;

/** One ruler along the ring, either way, for the arrows beside the cell. */
export function stepYardstick(id: YardstickId, direction: -1 | 1): YardstickId {
  const count = YARDSTICKS.length;
  const at = YARDSTICKS.findIndex((y) => y.id === id);
  return YARDSTICKS[(at + direction + count) % count]!.id;
}

export const parseYardstick = (raw: string): YardstickId | undefined =>
  YARDSTICKS.some((y) => y.id === raw) ? (raw as YardstickId) : undefined;

export interface ScaleReadout {
  yearsPerMetre: number;
  yearsPerMm: number;
  /** The ruler on show, e.g. "A hair (0.07 mm)" */
  unitLabel: string;
  /** What that ruler covers, e.g. "508 thousand years" */
  perUnit: string;
  /** e.g. "18.9 thousand generations" */
  perUnitGenerations: string;
  /** The millimetre, always, for anything that wants it straight. */
  perMm: string;
  perMmGenerations: string;
  /** e.g. "726 thousand years" */
  nailFile: string;
  /** e.g. "27 thousand generations" */
  nailFileGenerations: string;
  /** e.g. "All of Homo sapiens" */
  comparisonLabel: string;
  /** e.g. "41 µm" */
  comparisonLength: string;
}

export function scaleReadout(
  spanYears: number,
  armSpanM: number,
  generationYears: number,
  yardstick: YardstickId = "mm",
): ScaleReadout {
  const yearsPerMetre = spanYears / armSpanM;
  const yearsPerMm = yearsPerMetre / 1000;
  const yearsPerSwipe = yearsPerMm * NAIL_FILE_MM;
  const ref = pickReference(yearsPerSwipe);
  const refMetres = ref.years / yearsPerMetre;
  const unit = yardstickOf(yardstick);
  const yearsPerUnit = yearsPerMm * unit.mm(armSpanM);

  return {
    yearsPerMetre,
    yearsPerMm,
    unitLabel: unit.label(armSpanM),
    perUnit: formatYears(yearsPerUnit),
    perUnitGenerations: formatGenerations(
      generationsOf(yearsPerUnit, generationYears),
    ),
    perMm: formatYears(yearsPerMm),
    perMmGenerations: formatGenerations(
      generationsOf(yearsPerMm, generationYears),
    ),
    nailFile: formatYears(yearsPerSwipe),
    nailFileGenerations: formatGenerations(
      generationsOf(yearsPerSwipe, generationYears),
    ),
    comparisonLabel: ref.label,
    comparisonLength: formatLength(refMetres),
  };
}

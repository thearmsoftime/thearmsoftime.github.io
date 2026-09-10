/**
 * One line per zone, taken from "The lines worth putting on the screen" in
 * `research/research.md` (section 3, the nail-file swipe maths).
 *
 * Each line is written as a proportion, never as a fixed number of years or
 * millimetres, so it stays true at any arm span. The live numbers are the job
 * of the scale bar next to it.
 */
export const ZONE_FACT: Record<string, string> = {
  universe:
    'One swipe of a nail file takes off all of recorded history, many times over. Our whole species is thinner than a hair.',
  earth:
    'One swipe takes off far more than all of recorded history. The Phanerozoic — everything with shells and eyes — is a hand and a wrist.',
  humans:
    'The industrial era is about one hair’s width. All of recorded history fits inside the last fingernail.',
}

export const factFor = (zoneId: string): string | undefined => ZONE_FACT[zoneId]

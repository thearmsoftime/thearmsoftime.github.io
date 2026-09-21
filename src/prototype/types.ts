import type { Component } from 'solid-js'

/**
 * One tab of the prototype panel: a set of live knobs for numbers that are
 * constants in the source. You drag them until the drawing looks right, press
 * Copy, and paste the block back into the file it came from.
 *
 * A tab owns its own state end to end — it writes the live values, it
 * remembers them, and it says what Copy puts on the clipboard. The shell only
 * draws the frame, so adding a tab is one file plus one line in `tabs.ts`.
 */
export interface ProtoTab {
  /** Storage key and tab id. Kebab case. */
  id: string
  /** What the tab strip says. Keep it to one short word. */
  label: string
  /** The knobs. */
  Body: Component
  /** The block Copy puts on the clipboard: source file first, then values. */
  copy: () => string
  /** Put the shipped constants back. */
  reset: () => void
  /**
   * Apply what was remembered from the last session. Called once, for every
   * tab, when the panel mounts — so a reload comes back to what you were
   * looking at and not to the defaults.
   */
  restore?: () => void
}

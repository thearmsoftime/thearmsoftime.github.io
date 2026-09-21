import { createSignal } from 'solid-js'
import { DEV } from './dev'
import { readStored, writeStored } from './prefs'
import type { Placement, TimelineId } from './types'

/**
 * Dev only. The draft edits themselves — nothing that changes them.
 *
 * This module is on the visitor's path, because `src/data.ts` reads the drafts
 * on every lookup to lay them over the real data. So it is kept to the store
 * and nothing else: the editing, and the prompt the edits copy out as, live in
 * `src/edits.ts`, which only the data browser imports and which therefore
 * ships in the browser's own chunk.
 */

/** What was touched on one event. Only the changed keys are kept. */
export interface Draft {
  label?: string
  description?: string
  /** Per timeline, only the settings that were actually touched. */
  timelines?: Record<TimelineId, Partial<Placement>>
}

const KEY = 'dataedits'

/**
 * Drafts survive a reload, because every edit to a component is a Vite reload
 * and losing an afternoon of wording to one would be miserable.
 */
function restore(): Record<string, Draft> {
  if (!DEV) return {}
  const raw = readStored(KEY)
  if (raw === undefined) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Draft>) : {}
  } catch {
    return {}
  }
}

const [drafts, setDrafts] = createSignal<Record<string, Draft>>(restore())

export { drafts }

/** True when nothing is drafted, which is the case in every public build. */
export const noDrafts = (): boolean => Object.keys(drafts()).length === 0

export const draftCount = (): number => Object.keys(drafts()).length

/** The only way in. Every change goes through here, so storage never drifts. */
export function store(next: Record<string, Draft>): void {
  setDrafts(next)
  writeStored(KEY, JSON.stringify(next))
}

/** An empty draft is no draft: it is dropped rather than counted as an edit. */
export const isEmpty = (draft: Draft): boolean =>
  draft.label === undefined &&
  draft.description === undefined &&
  Object.keys(draft.timelines ?? {}).length === 0

/** Two values that mean the same thing on disk: absent and empty are one. */
export const same = (
  a: string | boolean | undefined,
  b: string | boolean | undefined,
): boolean => (a ?? '') === (b ?? '')

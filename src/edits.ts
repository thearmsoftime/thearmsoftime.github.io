import { drafts, isEmpty, same, store, type Draft } from './drafts'
import type { EventRecord, Placement, TimelineId } from './types'

/**
 * Dev only. Everything that *changes* a draft, and the prompt they copy out
 * as. Only the data browser imports this, so it builds into the browser's own
 * lazy chunk and a visitor never downloads a line of it. The drafts themselves
 * live in `src/drafts.ts`, which the app does read.
 *
 * The same loop as the prototype panel: tune it where you can see it, copy the
 * result, never guess the value in the editor. Nothing here edits a date or a
 * source — those need research and a citation, not a text box.
 */

/**
 * Sets one field, or clears it when the value is put back to what the file
 * already says. Editing something and undoing it by hand should leave no trace
 * in the copied prompt.
 */
export function editEvent(id: string, key: 'label' | 'description', value: string, original: string | undefined): void {
  const next = { ...drafts() }
  const draft: Draft = { ...(next[id] ?? {}) }
  const trimmed = value.trim()
  if (trimmed === (original ?? '') || (trimmed === '' && original === undefined)) {
    delete draft[key]
  } else {
    draft[key] = trimmed
  }
  if (isEmpty(draft)) delete next[id]
  else next[id] = draft
  store(next)
}

/** The same, for one timeline's settings on one event. */
export function editPlacement(
  id: string,
  timelineId: TimelineId,
  key: keyof Placement,
  value: string | boolean,
  original: string | boolean | undefined,
): void {
  const next = { ...drafts() }
  const draft: Draft = { ...(next[id] ?? {}) }
  const timelines = { ...(draft.timelines ?? {}) }
  const on: Partial<Placement> = { ...(timelines[timelineId] ?? {}) }
  const cleaned = typeof value === 'string' ? value.trim() : value
  const same =
    typeof cleaned === 'string'
      ? cleaned === (original ?? '') || (cleaned === '' && original === undefined)
      : cleaned === original
  if (same) delete on[key]
  else Object.assign(on, { [key]: cleaned === '' ? undefined : cleaned })
  if (Object.keys(on).length === 0) delete timelines[timelineId]
  else timelines[timelineId] = on
  if (Object.keys(timelines).length === 0) delete draft.timelines
  else draft.timelines = timelines
  if (isEmpty(draft)) delete next[id]
  else next[id] = draft
  store(next)
}

export function revert(id: string): void {
  const next = { ...drafts() }
  delete next[id]
  store(next)
}

export function discardAll(): void {
  store({})
}

/**
 * Drops everything the files have caught up with. Run once at load, so that
 * pasting a copied prompt into a chat, letting it write the files and
 * reloading leaves the browser saying "no edits" rather than still claiming a
 * change it can no longer see any difference for.
 */
export function pruneDrafts(byId: Map<string, EventRecord>): void {
  const current = drafts()
  if (Object.keys(current).length === 0) return
  const next: Record<string, Draft> = {}
  let changed = false

  for (const [id, draft] of Object.entries(current)) {
    const event = byId.get(id)
    // The event itself is gone: so is any draft of it.
    if (!event) {
      changed = true
      continue
    }
    const kept: Draft = {}
    if (draft.label !== undefined && !same(draft.label, event.label)) kept.label = draft.label
    if (draft.description !== undefined && !same(draft.description, event.description)) {
      kept.description = draft.description
    }
    const timelines: Record<TimelineId, Partial<Placement>> = {}
    for (const [timelineId, on] of Object.entries(draft.timelines ?? {})) {
      const was = event.timelines[timelineId]
      const keptOn: Partial<Placement> = {}
      for (const [key, value] of Object.entries(on)) {
        if (same(was?.[key as keyof Placement], value as string | boolean | undefined)) continue
        Object.assign(keptOn, { [key]: value })
      }
      if (Object.keys(keptOn).length > 0) timelines[timelineId] = keptOn
    }
    if (Object.keys(timelines).length > 0) kept.timelines = timelines

    if (isEmpty(kept)) {
      changed = true
      continue
    }
    if (JSON.stringify(kept) !== JSON.stringify(draft)) changed = true
    next[id] = kept
  }

  if (changed) store(next)
}

/** How one value is written into the prompt, so an empty one is not a blank. */
const show = (v: string | boolean | undefined): string => {
  if (v === undefined) return '(none)'
  if (typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

/**
 * The whole point: a block that can be pasted straight into a chat. It names
 * the file, then every field with what it says now and what it should say, so
 * the edit can be applied without opening the browser to check.
 */
export function copyText(
  byId: Map<string, EventRecord>,
  fileOf: (id: string) => string,
): string {
  const entries = Object.entries(drafts())
  if (entries.length === 0) return 'No edits.'

  const lines: string[] = [
    'Apply these edits to the data files, exactly as written and nothing else.',
    'Each line is: field, what it says now, what it should say.',
    'Leave every other field, and every other file, alone.',
    '',
  ]

  for (const [id, draft] of entries) {
    const event = byId.get(id)
    if (!event) continue

    // Only what actually differs from the file. Editing a field and putting it
    // back drops out here too, so the prompt never asks for a no-op.
    const changes: string[] = []
    const change = (
      field: string,
      before: string | boolean | undefined,
      after: string | boolean | undefined,
    ) => {
      if (same(before, after)) return
      changes.push(`  ${field}: ${show(before)} -> ${show(after)}`)
    }

    if (draft.label !== undefined) change('label', event.label, draft.label)
    if (draft.description !== undefined) change('description', event.description, draft.description)
    for (const [timelineId, on] of Object.entries(draft.timelines ?? {})) {
      const was = event.timelines[timelineId]
      for (const [key, value] of Object.entries(on)) {
        change(
          `timelines.${timelineId}.${key}`,
          was?.[key as keyof Placement],
          value as string | boolean | undefined,
        )
      }
    }
    if (changes.length === 0) continue

    lines.push(fileOf(id), ...changes, '')
  }

  lines.push(
    'A per-timeline label or description set to (none) means: delete that key.',
    'The files are the whole database: no code changes, and nothing to rebuild.',
  )
  return lines.join('\n')
}

import { For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { Portal } from 'solid-js/web'
import { allBands, allEvents, eventById, fileOf, timelines } from '../data'
import { createStoredSignal } from '../prefs'
import { formatLength, formatYears, formatYearsAgo } from '../format'
import { draftCount, drafts } from '../drafts'
import {
  copyText,
  discardAll,
  editEvent,
  editPlacement,
  pruneDrafts,
  revert,
} from '../edits'
import type { Band, EventRecord, Placement, TimelineId } from '../types'

/**
 * Dev only. One row per file in `data/`, so the database can be read as a
 * table instead of by opening 173 files. Nothing here ships to a visitor and
 * nothing here writes: it is a window onto the data, not an editor.
 *
 * The point of the table is the things a single file cannot show you — which
 * timelines an event is on, whether the two agree, where Simple is thin, and
 * which rows are still missing a source.
 *
 * The column headers are the words the data uses, not friendlier ones: hover
 * a header for the field it reads. A *timeline* is a whole arm, a *band* is a
 * named part of one, an *event* is a moment on it, and a *stretch* is an event
 * that lasted — the age of dinosaurs, not the asteroid.
 */

type Tab = 'events' | 'bands'

const TABS: { value: Tab; label: string }[] = [
  { value: 'events', label: 'Events' },
  { value: 'bands', label: 'Bands' },
]

type Sort = 'time' | 'label' | 'id'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'time', label: 'Oldest first' },
  { value: 'label', label: 'A–Z' },
  { value: 'id', label: 'By id' },
]

/** Everything the filter row can be narrowed to at once. */
interface Filters {
  text: string
  timeline: TimelineId | ''
  simpleOnly: boolean
  landmarkOnly: boolean
  gapsOnly: boolean
}

/**
 * What a row is missing, in the order it matters. Every event and band is
 * supposed to carry a Wikipedia link and a date source; a description is what
 * the card is built from, so an event without one is half a card.
 */
function gapsOf(row: EventRecord | Band): string[] {
  const gaps: string[] = []
  if (!row.wikipedia) gaps.push('wikipedia')
  if (!row.source) gaps.push('source')
  // A band has no description to miss; only an event's card is built from one.
  if ('yearsAgo' in row && !row.description) gaps.push('description')
  return gaps
}

const matches = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle)

/** Where a row sits on one timeline's arm, as a length from the left fingertip. */
const armMm = (yearsAgo: number, spanYears: number, armSpanM: number): number =>
  (1 - yearsAgo / spanYears) * armSpanM * 1000

/** A labelled text box in the editor, wide enough to read a sentence in. */
function TextField(props: {
  label: string
  hint?: string
  value: string
  placeholder?: string
  rows?: number
  onCommit: (value: string) => void
}) {
  return (
    <label class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="text-base-content/40 text-[0.6rem] tracking-[0.12em] uppercase">
        {props.label}
      </span>
      <textarea
        class="textarea textarea-xs min-h-0 w-full leading-snug"
        rows={props.rows ?? 2}
        value={props.value}
        placeholder={props.placeholder}
        // On blur, not on every keystroke: an edit is finished when you leave
        // the box, and the arm behind should not flicker on every letter.
        onChange={(e) => props.onCommit(e.currentTarget.value)}
      />
      <Show when={props.hint}>
        {(hint) => <span class="text-base-content/35 text-[0.62rem]">{hint()}</span>}
      </Show>
    </label>
  )
}

/** One flag, with the field name it writes. */
function Flag(props: { label: string; title: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <label class="flex items-center gap-1.5 text-[0.7rem]" title={props.title}>
      <input
        type="checkbox"
        class="checkbox checkbox-xs"
        checked={props.on}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      {props.label}
    </label>
  )
}

/**
 * The editor for one event. It writes to the draft store, which the arm and
 * the cards read straight away, so the wording is judged where it will be read
 * rather than in the box it is typed into.
 *
 * Dates and sources are deliberately not here: a date needs research and a
 * citation, not a text box in a side panel.
 */
function EventEditor(props: { event: EventRecord; edited: boolean; onDone: () => void }) {
  const draft = () => drafts()[props.event.id]
  /** What one field says now: the draft if it was touched, else the file. */
  const value = (key: 'label' | 'description') => draft()?.[key] ?? props.event[key] ?? ''
  const placed = (timelineId: TimelineId): Placement => ({
    ...props.event.timelines[timelineId]!,
    ...(draft()?.timelines?.[timelineId] ?? {}),
  })

  return (
    <tr class="border-base-300/40 border-t">
      <td colSpan={9} class="px-0 py-0">
        <div
          class="flex flex-col gap-3 px-3 py-3"
          style={{ 'background-color': 'color-mix(in oklab, var(--dev) 7%, transparent)' }}
        >
          <div class="flex items-baseline gap-2">
            <span
              class="text-[0.6rem] tracking-[0.14em] uppercase"
              style={{ color: 'var(--dev)' }}
            >
              Editing
            </span>
            <span class="text-base-content/40 font-mono text-[0.62rem]">
              {fileOf(props.event.id)}
            </span>
            <div class="ms-auto flex gap-1.5">
              <Show when={props.edited}>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  onClick={() => revert(props.event.id)}
                >
                  Undo edits
                </button>
              </Show>
              <button type="button" class="btn btn-ghost btn-xs" onClick={props.onDone}>
                Done
              </button>
            </div>
          </div>

          {/* The wording every timeline shares. */}
          <div class="flex flex-wrap gap-3">
            <TextField
              label="Label"
              rows={1}
              value={value('label')}
              onCommit={(v) => editEvent(props.event.id, 'label', v, props.event.label)}
            />
            <TextField
              label="Description"
              value={value('description')}
              onCommit={(v) =>
                editEvent(props.event.id, 'description', v, props.event.description)
              }
            />
          </div>

          {/*
            One block per timeline the event is on. This is where the two can
            be made to disagree on purpose: a headline here, a footnote there.
          */}
          <For each={Object.keys(props.event.timelines)}>
            {(timelineId) => {
              const on = () => placed(timelineId)
              const was = () => props.event.timelines[timelineId]!
              return (
                <div class="border-base-300/50 flex flex-wrap items-start gap-3 rounded border p-2">
                  <span class="w-24 shrink-0 pt-1 text-[0.7rem] font-medium">
                    {timelines.find((t) => t.id === timelineId)?.label ?? timelineId}
                  </span>
                  <div class="flex shrink-0 flex-col gap-1 pt-1">
                    <Flag
                      label="simple"
                      title="Kept when the reader asks for the short list"
                      on={on().simple}
                      onChange={(v) =>
                        editPlacement(props.event.id, timelineId, 'simple', v, was().simple)
                      }
                    />
                    <Flag
                      label="landmark"
                      title="Its name is written on the arm itself"
                      on={on().landmark}
                      onChange={(v) =>
                        editPlacement(props.event.id, timelineId, 'landmark', v, was().landmark)
                      }
                    />
                  </div>
                  <TextField
                    label="Label here"
                    rows={1}
                    placeholder={props.event.label}
                    hint="Leave empty to use the label above"
                    value={on().label ?? ''}
                    onCommit={(v) =>
                      editPlacement(props.event.id, timelineId, 'label', v, was().label)
                    }
                  />
                  <TextField
                    label="Description here"
                    placeholder={props.event.description}
                    hint="Leave empty to use the description above"
                    value={on().description ?? ''}
                    onCommit={(v) =>
                      editPlacement(props.event.id, timelineId, 'description', v, was().description)
                    }
                  />
                </div>
              )
            }}
          </For>
        </div>
      </td>
    </tr>
  )
}

interface Props {
  armSpanM: number
  /** The timeline on screen, so its column can be picked out of the table. */
  timelineId: string
  onClose: () => void
  /** Moves the marker to a row's date on the timeline that is on screen. */
  onPick: (yearsAgo: number) => void
}

export default function DataPanel(props: Props) {
  const [tab, setTab] = createStoredSignal<Tab>('datatab', 'events', (raw) =>
    TABS.some((t) => t.value === raw) ? (raw as Tab) : undefined,
  )
  const [sort, setSort] = createStoredSignal<Sort>('datasort', 'time', (raw) =>
    SORTS.some((s) => s.value === raw) ? (raw as Sort) : undefined,
  )
  // The filters are deliberately not remembered: opening the browser should
  // always show the whole database, or you spend a minute wondering where the
  // rows went.
  const [text, setText] = createSignal('')
  const [timeline, setTimeline] = createSignal<TimelineId | ''>('')
  const [simpleOnly, setSimpleOnly] = createSignal(false)
  const [landmarkOnly, setLandmarkOnly] = createSignal(false)
  const [gapsOnly, setGapsOnly] = createSignal(false)
  /** Which row has its editor open. One at a time: the table stays readable. */
  const [editing, setEditing] = createSignal<string | null>(null)
  const [copied, setCopied] = createSignal(false)

  let copiedTimer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(copiedTimer))

  const onCopy = async () => {
    const text = copyText(eventById, fileOf)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // No clipboard on an insecure origin: the console is the fallback.
      console.info(text)
    }
    setCopied(true)
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => setCopied(false), 1400)
  }

  onMount(() => {
    // Drafts from an earlier visit that the files have since caught up with are
    // not edits any more. Clearing them here is what closes the loop: copy the
    // prompt, let it write the files, reload, and the browser is clean.
    pruneDrafts(eventById)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // One Escape shuts the open editor, the next shuts the panel, so a
      // half-typed label is never lost to a stray key.
      if (editing() !== null) setEditing(null)
      else props.onClose()
    }
    document.addEventListener('keydown', onKey)
    onCleanup(() => document.removeEventListener('keydown', onKey))
  })

  const filters = (): Filters => ({
    text: text().trim().toLowerCase(),
    timeline: timeline(),
    simpleOnly: simpleOnly(),
    landmarkOnly: landmarkOnly(),
    gapsOnly: gapsOnly(),
  })

  const sorted = <T extends { id: string; label: string }>(
    rows: T[],
    time: (row: T) => number,
  ): T[] => {
    const how = sort()
    const out = rows.slice()
    if (how === 'label') return out.sort((a, b) => a.label.localeCompare(b.label))
    if (how === 'id') return out.sort((a, b) => a.id.localeCompare(b.id))
    return out.sort((a, b) => time(b) - time(a))
  }

  const events = createMemo(() => {
    const f = filters()
    const rows = allEvents.filter((e) => {
      const on = f.timeline === '' ? Object.values(e.timelines) : [e.timelines[f.timeline]]
      if (on[0] === undefined) return false
      if (f.simpleOnly && !on.some((p) => p?.simple)) return false
      if (f.landmarkOnly && !on.some((p) => p?.landmark)) return false
      if (f.gapsOnly && gapsOf(e).length === 0) return false
      if (f.text && !matches(`${e.id} ${e.label} ${e.description ?? ''}`, f.text)) return false
      return true
    })
    return sorted(rows, (e) => e.yearsAgo)
  })

  const bands = createMemo(() => {
    const f = filters()
    const rows = allBands.filter((b) => {
      if (f.timeline !== '' && !b.timelines.includes(f.timeline)) return false
      if (f.gapsOnly && gapsOf(b).length === 0) return false
      if (f.text && !matches(`${b.id} ${b.label} ${b.kind ?? ''}`, f.text)) return false
      // These two are event-only settings; a band has neither, so asking for
      // them should empty the band table rather than quietly ignore the ask.
      if (f.simpleOnly || f.landmarkOnly) return false
      return true
    })
    return sorted(rows, (b) => b.fromYearsAgo)
  })

  /** The counts under the table: what the whole database holds, per timeline. */
  const tally = createMemo(() =>
    timelines.map((t) => {
      const on = allEvents.filter((e) => e.timelines[t.id])
      return {
        timeline: t,
        events: on.length,
        simple: on.filter((e) => e.timelines[t.id]?.simple).length,
        landmarks: on.filter((e) => e.timelines[t.id]?.landmark).length,
        bands: allBands.filter((b) => b.timelines.includes(t.id)).length,
      }
    }),
  )

  const shown = () => (tab() === 'events' ? events().length : bands().length)
  const total = () => (tab() === 'events' ? allEvents.length : allBands.length)

  return (
    <Portal>
      {/*
        Docked to the bottom, not centred like the ruler workbench, and behind
        a much lighter veil: the arms have to stay visible above it. Editing a
        label and watching it land on the arm is the whole point, and a modal
        over the middle of the screen would hide exactly the thing being judged.
      */}
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-3"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose()
        }}
      >
        <div
          role="dialog"
          aria-label="Data browser"
          class="rounded-box bg-base-100 flex max-h-[68vh] w-full max-w-7xl flex-col border shadow-2xl"
          // Purple: this is a dev workbench, not part of what a visitor sees.
          style={{ 'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)' }}
        >
          {/* Title and tabs, on the strip that never scrolls. */}
          <div
            class="flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
            style={{
              'border-color': 'color-mix(in oklab, var(--dev) 30%, transparent)',
              'background-color': 'color-mix(in oklab, var(--dev) 10%, transparent)',
            }}
          >
            <span
              class="font-display text-[0.72rem] tracking-[0.18em] uppercase"
              style={{ color: 'var(--dev)' }}
            >
              Data browser
            </span>
            <div class="border-base-300 bg-base-200/70 flex items-center rounded-full border p-0.5">
              <For each={TABS}>
                {(t) => (
                  <button
                    type="button"
                    class="focus-visible:ring-accent/50 rounded-full px-3 py-1 text-xs font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    classList={{
                      'text-base-content/55 hover:text-base-content': tab() !== t.value,
                    }}
                    style={
                      tab() === t.value
                        ? { 'background-color': 'var(--dev)', color: 'var(--dev-content)' }
                        : undefined
                    }
                    onClick={() => setTab(t.value)}
                  >
                    {t.label}
                  </button>
                )}
              </For>
            </div>

            <span class="text-base-content/50 ms-auto text-[0.68rem] tabular-nums">
              {shown() === total() ? `${total()} rows` : `${shown()} of ${total()} rows`}
            </span>

            {/*
              Edits live in the browser only. Copy turns them into a prompt to
              paste into a chat; nothing here ever writes a file.
            */}
            <Show when={draftCount() > 0}>
              <span
                class="rounded-full px-2 py-0.5 text-[0.68rem] font-medium tabular-nums"
                style={{
                  color: 'var(--dev)',
                  'background-color': 'color-mix(in oklab, var(--dev) 16%, transparent)',
                }}
              >
                {draftCount()} edited
              </span>
              <button
                type="button"
                class="rounded-full border px-2.5 py-1 text-[0.7rem] font-medium transition-colors hover:opacity-80"
                style={{
                  color: 'var(--dev)',
                  'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)',
                  'background-color': 'color-mix(in oklab, var(--dev) 12%, transparent)',
                }}
                onClick={onCopy}
              >
                {copied() ? 'Copied' : 'Copy as prompt'}
              </button>
              <button type="button" class="btn btn-ghost btn-xs" onClick={discardAll}>
                Discard
              </button>
            </Show>

            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              aria-label="Close"
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>

          {/* The filter row. Also never scrolls, so it stays reachable. */}
          <div class="border-base-300/60 flex flex-wrap items-center gap-2 border-b px-4 py-2 text-[0.7rem]">
            <input
              type="search"
              class="input input-xs w-52"
              placeholder="Search id, name, text"
              value={text()}
              onInput={(e) => setText(e.currentTarget.value)}
            />
            <select
              class="select select-xs w-36"
              value={timeline()}
              onChange={(e) => setTimeline(e.currentTarget.value)}
            >
              <option value="">Every timeline</option>
              <For each={timelines}>
                {(t) => <option value={t.id}>{t.label}</option>}
              </For>
            </select>
            <select
              class="select select-xs w-32"
              value={sort()}
              onChange={(e) => setSort(e.currentTarget.value as Sort)}
            >
              <For each={SORTS}>{(s) => <option value={s.value}>{s.label}</option>}</For>
            </select>
            <label class="flex items-center gap-1.5">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={simpleOnly()}
                onChange={(e) => setSimpleOnly(e.currentTarget.checked)}
              />
              <span title="simple: true — kept in Simple mode">Simple</span>
            </label>
            <label class="flex items-center gap-1.5">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={landmarkOnly()}
                onChange={(e) => setLandmarkOnly(e.currentTarget.checked)}
              />
              <span title="landmark: true — named on the arm itself">Landmark</span>
            </label>
            <label class="flex items-center gap-1.5">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={gapsOnly()}
                onChange={(e) => setGapsOnly(e.currentTarget.checked)}
              />
              <span title="No wikipedia, no source, or no description">Missing something</span>
            </label>
            <Show when={text() || timeline() || simpleOnly() || landmarkOnly() || gapsOnly()}>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                onClick={() => {
                  setText('')
                  setTimeline('')
                  setSimpleOnly(false)
                  setLandmarkOnly(false)
                  setGapsOnly(false)
                }}
              >
                Clear
              </button>
            </Show>
          </div>

          <div class="min-h-0 overflow-auto px-4 py-3">
            <Show when={tab() === 'events'}>
              <table class="w-full text-left text-xs">
                <thead class="bg-base-100 text-base-content/40 sticky top-0 text-[0.6rem] tracking-[0.12em] uppercase">
                  <tr>
                    <th class="py-1.5 pe-3 font-medium" title="label, description">
                      Label
                    </th>
                    <th class="py-1.5 pe-3 text-right font-medium" title="yearsAgo">
                      Years ago
                    </th>
                    <th
                      class="py-1.5 pe-3 text-right font-medium"
                      title="endYearsAgo — a stretch lasted, a moment did not"
                    >
                      Stretch
                    </th>
                    <th class="py-1.5 pe-3 text-right font-medium" title="uncertaintyYears">
                      ±
                    </th>
                    <th class="py-1.5 pe-3 font-medium" title="certainty">
                      Certainty
                    </th>
                    <th class="py-1.5 pe-3 font-medium" title="timelines">
                      Timelines
                    </th>
                    <th
                      class="py-1.5 pe-3 text-right font-medium"
                      title="Where it falls on the arm of the timeline on screen"
                    >
                      On the arm
                    </th>
                    <th class="py-1.5 pe-3 font-medium" title="wikipedia, source, description">
                      Sources
                    </th>
                    <th class="py-1.5 font-medium" title="id — also the file name">
                      Id
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={events()}>
                    {(event) => {
                      const gaps = gapsOf(event)
                      const here = () => event.timelines[props.timelineId]
                      const draft = () => drafts()[event.id]
                      const edited = () => draft() !== undefined
                      /** What the row shows: the draft where there is one. */
                      const label = () => draft()?.label ?? event.label
                      const description = () => draft()?.description ?? event.description
                      const open = () => editing() === event.id
                      return (
                        <>
                        <tr
                          class="border-base-300/40 hover:bg-base-200/70 cursor-pointer border-t align-top"
                          classList={{ 'bg-base-200/50': open() }}
                          // Clicking a row walks the marker to it, when the
                          // timeline on screen is one the event is on.
                          onClick={() => here() && props.onPick(event.yearsAgo)}
                        >
                          <td class="py-1.5 pe-3">
                            <div class="flex items-baseline gap-1.5">
                              {/*
                                The pencil opens the editor without moving the
                                marker, so a row can be edited from anywhere in
                                the list.
                              */}
                              <button
                                type="button"
                                class="text-base-content/30 hover:text-base-content shrink-0 leading-none"
                                title={open() ? 'Close the editor' : 'Edit the wording and flags'}
                                aria-label="Edit"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditing(open() ? null : event.id)
                                }}
                                style={edited() ? { color: 'var(--dev)' } : undefined}
                              >
                                ✎
                              </button>
                              <div>{label()}</div>
                              <Show when={edited()}>
                                <span
                                  class="shrink-0 text-[0.6rem]"
                                  style={{ color: 'var(--dev)' }}
                                  title="Edited here, not yet in the file"
                                >
                                  edited
                                </span>
                              </Show>
                            </div>
                            <Show when={description()}>
                              {(text) => (
                                <div class="text-base-content/45 mt-0.5 ms-4 max-w-lg leading-snug">
                                  {text()}
                                </div>
                              )}
                            </Show>
                          </td>
                          <td class="py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            {formatYearsAgo(event.yearsAgo)}
                          </td>
                          <td class="text-base-content/50 py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            {event.endYearsAgo === undefined
                              ? '—'
                              : formatYears(event.yearsAgo - event.endYearsAgo)}
                          </td>
                          <td class="text-base-content/50 py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            {event.uncertaintyYears ? formatYears(event.uncertaintyYears) : '—'}
                          </td>
                          <td class="py-1.5 pe-3 whitespace-nowrap">
                            <span
                              classList={{
                                'text-base-content/40': event.certainty === 'high',
                                'text-warning': event.certainty === 'disputed',
                              }}
                            >
                              {event.certainty ?? '—'}
                            </span>
                          </td>
                          {/*
                            The whole reason the table exists: one chip per
                            timeline the event is on, carrying that timeline's
                            own settings. ★ simple, ▲ landmark, ✎ its own
                            wording here.
                          */}
                          <td class="py-1.5 pe-3">
                            <div class="flex flex-wrap gap-1">
                              <For each={Object.entries(event.timelines)}>
                                {([id, saved]) => {
                                  const on = () => ({
                                    ...saved,
                                    ...(draft()?.timelines?.[id] ?? {}),
                                  })
                                  return (
                                  <span
                                    class="rounded-full border px-1.5 py-px text-[0.62rem] whitespace-nowrap"
                                    classList={{
                                      'border-base-300 text-base-content/50':
                                        id !== props.timelineId,
                                      'border-accent/50 text-accent': id === props.timelineId,
                                    }}
                                    title={[
                                      on().simple ? '★ simple: kept in Simple mode' : 'not simple',
                                      on().landmark ? '▲ landmark: named on the arm' : undefined,
                                      on().label ? `label: ${on().label}` : undefined,
                                      on().description ? 'own description' : undefined,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  >
                                    {id}
                                    {on().simple ? ' ★' : ''}
                                    {on().landmark ? ' ▲' : ''}
                                    {on().label || on().description ? ' ✎' : ''}
                                  </span>
                                  )
                                }}
                              </For>
                            </div>
                          </td>
                          {/*
                            Where it falls on the arm of the timeline on screen.
                            An event that is not on that timeline has no place
                            on it, so it gets a dash rather than a made-up
                            number.
                          */}
                          <td class="text-base-content/50 py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            <Show when={here()} fallback="—">
                              {formatLength(
                                armMm(
                                  event.yearsAgo,
                                  timelines.find((t) => t.id === props.timelineId)?.spanYears ?? 1,
                                  props.armSpanM,
                                ) / 1000,
                              )}
                            </Show>
                          </td>
                          <td class="py-1.5 pe-3 whitespace-nowrap">
                            <Show
                              when={gaps.length > 0}
                              fallback={<span class="text-base-content/30">ok</span>}
                            >
                              <span class="text-warning" title={`missing: ${gaps.join(', ')}`}>
                                {gaps.length} missing
                              </span>
                            </Show>
                          </td>
                          <td class="text-base-content/35 py-1.5 font-mono text-[0.62rem] whitespace-nowrap">
                            {event.id}
                          </td>
                        </tr>
                        <Show when={open()}>
                          <EventEditor
                            event={event}
                            edited={edited()}
                            onDone={() => setEditing(null)}
                          />
                        </Show>
                        </>
                      )
                    }}
                  </For>
                </tbody>
              </table>
              <Show when={events().length === 0}>
                <p class="text-base-content/40 py-6 text-center text-xs">
                  Nothing matches those filters.
                </p>
              </Show>
            </Show>

            <Show when={tab() === 'bands'}>
              <table class="w-full text-left text-xs">
                <thead class="bg-base-100 text-base-content/40 sticky top-0 text-[0.6rem] tracking-[0.12em] uppercase">
                  <tr>
                    <th class="py-1.5 pe-3 font-medium" title="label">
                      Label
                    </th>
                    <th
                      class="py-1.5 pe-3 font-medium"
                      title="kind — eon, era, period, epoch, species, culture"
                    >
                      Kind
                    </th>
                    <th class="py-1.5 pe-3 text-right font-medium" title="fromYearsAgo">
                      From
                    </th>
                    <th class="py-1.5 pe-3 text-right font-medium" title="toYearsAgo">
                      To
                    </th>
                    <th class="py-1.5 pe-3 text-right font-medium" title="How long the band runs">
                      Stretch
                    </th>
                    <th class="py-1.5 pe-3 font-medium" title="timelines">
                      Timelines
                    </th>
                    <th class="py-1.5 pe-3 font-medium" title="wikipedia, source">
                      Sources
                    </th>
                    <th class="py-1.5 font-medium" title="id — also the row's key in its file">
                      Id
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={bands()}>
                    {(band) => {
                      const gaps = gapsOf(band)
                      return (
                        <tr
                          class="border-base-300/40 hover:bg-base-200/70 cursor-pointer border-t"
                          onClick={() =>
                            band.timelines.includes(props.timelineId) &&
                            props.onPick(band.fromYearsAgo)
                          }
                        >
                          <td class="py-1.5 pe-3">{band.label}</td>
                          <td class="text-base-content/50 py-1.5 pe-3">{band.kind ?? '—'}</td>
                          <td class="py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            {formatYearsAgo(band.fromYearsAgo)}
                          </td>
                          <td class="py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            {formatYearsAgo(band.toYearsAgo)}
                          </td>
                          <td class="text-base-content/50 py-1.5 pe-3 text-right whitespace-nowrap tabular-nums">
                            {formatYears(band.fromYearsAgo - band.toYearsAgo)}
                          </td>
                          <td class="py-1.5 pe-3">
                            <div class="flex flex-wrap gap-1">
                              <For each={band.timelines}>
                                {(id) => (
                                  <span
                                    class="rounded-full border px-1.5 py-px text-[0.62rem] whitespace-nowrap"
                                    classList={{
                                      'border-base-300 text-base-content/50':
                                        id !== props.timelineId,
                                      'border-accent/50 text-accent': id === props.timelineId,
                                    }}
                                  >
                                    {id}
                                  </span>
                                )}
                              </For>
                            </div>
                          </td>
                          <td class="py-1.5 pe-3 whitespace-nowrap">
                            <Show
                              when={gaps.length > 0}
                              fallback={<span class="text-base-content/30">ok</span>}
                            >
                              <span class="text-warning" title={`missing: ${gaps.join(', ')}`}>
                                {gaps.length} missing
                              </span>
                            </Show>
                          </td>
                          <td class="text-base-content/35 py-1.5 font-mono text-[0.62rem] whitespace-nowrap">
                            {band.id}
                          </td>
                        </tr>
                      )
                    }}
                  </For>
                </tbody>
              </table>
              <Show when={bands().length === 0}>
                <p class="text-base-content/40 py-6 text-center text-xs">
                  Nothing matches those filters.
                </p>
              </Show>
            </Show>
          </div>

          {/* What the database holds, so the filters above have something to be read against. */}
          <div class="border-base-300/60 text-base-content/45 flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-2 text-[0.66rem]">
            <For each={tally()}>
              {(row) => (
                <span classList={{ 'text-accent': row.timeline.id === props.timelineId }}>
                  <span class="font-medium">{row.timeline.label}</span>{' '}
                  <span class="tabular-nums">
                    {row.events} events · {row.simple} ★ · {row.landmarks} ▲ · {row.bands} bands
                  </span>
                </span>
              )}
            </For>
            <span class="ms-auto">★ simple · ▲ landmark · ✎ own label or description</span>
          </div>
        </div>
      </div>
    </Portal>
  )
}

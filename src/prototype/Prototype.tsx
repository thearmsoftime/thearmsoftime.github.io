import { Dynamic, Portal } from 'solid-js/web'
import { For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { createStoredSignal } from '../prefs'
import { PROTO_TABS } from './tabs'

/**
 * Dev only. A small floating box of live knobs for numbers that ship as
 * constants: drag until the drawing looks right, press Copy, paste the block
 * back into the file it names. It opens from Settings, under Dev, and wears
 * the dev purple — nothing a visitor can reach is that colour.
 *
 * It stays mounted for the whole session whether it is open or not: closed, it
 * draws nothing, but it is still what puts the knobs back where the last visit
 * left them.
 *
 * The shell holds the frame only: where the box sits and which tab is open.
 * The knobs and the clipboard text belong to the tabs in `tabs.ts`.
 */

/** Roughly the box, for keeping it on screen when the window shrinks. */
const BOX_W = 240
const BOX_H = 420
const EDGE = 12

interface Point {
  x: number
  y: number
}

const parsePoint = (raw: string): Point | undefined => {
  const [x, y] = raw.split(',').map(Number)
  return Number.isFinite(x) && Number.isFinite(y) ? { x: x!, y: y! } : undefined
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function Prototype(props: Props) {
  // Both are remembered: every edit to a tab is a Vite reload, and finding the
  // tab again each time is a chore.
  const [tabId, setTabId] = createStoredSignal(
    'prototab',
    PROTO_TABS[0]?.id ?? '',
    // A tab that has since been renamed or dropped is not a tab to open.
    (raw) => (PROTO_TABS.some((t) => t.id === raw) ? raw : undefined),
  )
  /** Null until it is dragged: it starts parked in the bottom right corner. */
  const [spot, setSpot] = createStoredSignal<Point | null>(
    'protospot',
    null,
    parsePoint,
    (p) => (p ? `${p.x},${p.y}` : ''),
  )
  const [copied, setCopied] = createSignal(false)

  const tab = createMemo(() => PROTO_TABS.find((t) => t.id === tabId()) ?? PROTO_TABS[0])

  // What the last session left in the knobs, put back before anything draws.
  onMount(() => PROTO_TABS.forEach((t) => t.restore?.()))

  let drag: { dx: number; dy: number } | null = null

  const startDrag = (e: PointerEvent) => {
    const box = (e.currentTarget as HTMLElement).closest('[data-proto]')!
    const rect = box.getBoundingClientRect()
    drag = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const moveDrag = (e: PointerEvent) => {
    if (!drag) return
    const max = (limit: number, size: number) => Math.max(EDGE, limit - size - EDGE)
    setSpot({
      x: Math.min(Math.max(EDGE, e.clientX - drag.dx), max(window.innerWidth, BOX_W)),
      y: Math.min(Math.max(EDGE, e.clientY - drag.dy), max(window.innerHeight, BOX_H)),
    })
  }

  const endDrag = () => (drag = null)

  let copiedTimer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(copiedTimer))

  const onCopy = async () => {
    const text = tab()?.copy() ?? ''
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // No clipboard on an insecure origin: the console is the fallback.
      console.info(text)
    }
    setCopied(true)
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => setCopied(false), 1200)
  }

  const place = () => {
    const at = spot()
    return at
      ? { left: `${at.x}px`, top: `${at.y}px` }
      : { right: `${EDGE}px`, bottom: `${EDGE}px` }
  }

  return (
    <Portal>
      <Show when={props.open}>
        <div
          data-proto
          class="bg-base-100/95 rounded-box fixed z-40 w-60 border shadow-xl backdrop-blur"
          style={{
            ...place(),
            'border-color': 'color-mix(in oklab, var(--dev) 45%, transparent)',
          }}
        >
          {/* The title bar is the handle: anywhere else would fight the sliders. */}
          <div
            class="flex cursor-grab items-center gap-1 border-b px-2 py-1.5 active:cursor-grabbing"
            style={{
              color: 'var(--dev)',
              'border-color': 'color-mix(in oklab, var(--dev) 30%, transparent)',
              'background-color': 'color-mix(in oklab, var(--dev) 10%, transparent)',
            }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span class="font-display text-[0.6rem] tracking-[0.18em] uppercase">
              Prototype
            </span>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle ms-auto"
              aria-label="Close"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>

          <div class="flex flex-col gap-2 px-2.5 py-2">
            {/* Tiny: the strip is a way back to a tab, not a thing to look at. */}
            <Show when={PROTO_TABS.length > 1}>
              <div class="border-base-300 bg-base-200/70 flex items-center rounded-full border p-0.5">
                <For each={PROTO_TABS}>
                  {(t) => (
                    <button
                      type="button"
                      class="rounded-full px-2 py-px text-[0.58rem] font-medium tracking-wide"
                      classList={{
                        'text-base-content/55 hover:text-base-content': t.id !== tabId(),
                      }}
                      style={
                        t.id === tabId()
                          ? { 'background-color': 'var(--dev)', color: 'var(--dev-content)' }
                          : undefined
                      }
                      onClick={() => setTabId(t.id)}
                    >
                      {t.label}
                    </button>
                  )}
                </For>
              </div>
            </Show>

            <Show when={tab()}>
              {(active) => (
                <>
                  {/*
                    A tab may carry more knobs than the box is tall, so the
                    knobs scroll and the two buttons stay put underneath.
                  */}
                  <div class="-me-1 max-h-[min(58vh,26rem)] overflow-y-auto pe-1">
                    <Dynamic component={active().Body} />
                  </div>
                  <div class="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      class="btn btn-xs flex-1 border-none"
                      style={{
                        'background-color': 'var(--dev)',
                        color: 'var(--dev-content)',
                      }}
                      onClick={onCopy}
                    >
                      {copied() ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs"
                      onClick={() => active().reset()}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </Show>
          </div>
        </div>
      </Show>
    </Portal>
  )
}

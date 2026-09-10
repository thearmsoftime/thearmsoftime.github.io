import { For, Show, createEffect, onCleanup } from 'solid-js'
import type { TimelineEvent } from '../types'
import { hostOf, isUrl } from '../data'
import { formatGenerationsAgo, formatYears, formatYearsAgo } from '../scale'

interface Props {
  events: TimelineEvent[]
  zoneId: string
  /** A note about where this zone's dates come from, if the data carries one. */
  note?: string
  nearestId: string | null
  nearIds: Set<string>
  /** Generations only mean something on the human timeline. */
  showGenerations: boolean
  onPick: (event: TimelineEvent) => void
}

/** A small, quiet link that opens away from the page. */
function OutLink(props: { href: string; children: string }) {
  return (
    <a
      class="text-base-content/45 hover:text-accent decoration-base-content/25 hover:decoration-accent underline underline-offset-2 transition-colors"
      href={props.href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {props.children}
    </a>
  )
}

/** The date source: a link when the data gives a URL, plain text when it gives a citation. */
function Sources(props: { event: TimelineEvent }) {
  const wiki = () => (isUrl(props.event.wikipedia) ? props.event.wikipedia : undefined)
  const src = () => (isUrl(props.event.source) ? props.event.source : undefined)
  const note = () => (src() ? undefined : (props.event.sourceTitle ?? props.event.source))

  return (
    <Show when={wiki() || src() || note()}>
      <span class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.65rem]">
        <Show when={wiki()}>{(href) => <OutLink href={href()}>Wikipedia</OutLink>}</Show>
        <Show when={src()}>
          {(href) => <OutLink href={href()}>{props.event.sourceTitle ?? hostOf(href())}</OutLink>}
        </Show>
        <Show when={note()}>{(text) => <span class="text-base-content/35">{text()}</span>}</Show>
      </span>
    </Show>
  )
}

/** The only thing on the page that scrolls. */
export default function EventList(props: Props) {
  let list!: HTMLUListElement
  let frame = 0

  /**
   * Keep the highlighted event in view without ever moving the page itself.
   *
   * With sixty rows the marker crosses several of them per drag, so this does
   * as little as it can get away with: at most one scroll per frame, and none
   * at all while the row is already on screen. Chasing every move with a
   * smooth scroll is what makes a long list feel sticky.
   */
  createEffect(() => {
    const id = props.nearestId
    if (!id) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (!list) return
      const row = list.querySelector<HTMLElement>(`[data-event="${CSS.escape(id)}"]`)
      if (!row) return
      const view = list.getBoundingClientRect()
      const box = row.getBoundingClientRect()
      // A row peeking out by a pixel or two is still "in view".
      if (box.top >= view.top - 1 && box.bottom <= view.bottom + 1) return
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  })

  onCleanup(() => cancelAnimationFrame(frame))

  return (
    <section class="mx-auto flex w-full max-w-[110rem] min-h-0 flex-1 flex-col px-3 pt-1.5 pb-2 sm:px-6">
      <div class="flex items-baseline justify-between gap-3 pb-1">
        <h2 class="text-[0.65rem] font-semibold tracking-[0.22em] whitespace-nowrap uppercase">
          Along the arms
        </h2>
        <Show when={props.note}>
          {(note) => (
            <p class="text-base-content/30 hidden min-w-0 flex-1 truncate text-[0.65rem] md:block">
              {note()}
            </p>
          )}
        </Show>
        <p class="text-base-content/40 shrink-0 text-[0.65rem] whitespace-nowrap">
          {props.events.length} events · click one to move the marker
        </p>
      </div>

      <Show when={props.zoneId} keyed>
        <ul
          ref={list}
          class="zone-fade border-base-300 rounded-box min-h-0 flex-1 overflow-x-hidden overflow-y-auto border"
          style={{ 'scroll-behavior': 'smooth' }}
        >
          <Show
            when={props.events.length > 0}
            fallback={
              <li class="text-base-content/45 grid h-full place-items-center p-8 text-center text-sm">
                Nothing on this timeline yet.
              </li>
            }
          >
            <For each={props.events}>
              {(event) => {
                const nearest = () => props.nearestId === event.id
                const near = () => props.nearIds.has(event.id)
                return (
                  <li data-event={event.id}>
                    <div
                      role="button"
                      tabindex="0"
                      class="border-base-300/60 hover:bg-base-200/70 focus-visible:ring-accent/40 flex w-full items-start gap-3 border-b border-l-[3px] px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none sm:gap-5 sm:px-4"
                      classList={{
                        'border-l-accent bg-accent/[0.07]': nearest(),
                        'border-l-accent/40': near() && !nearest(),
                        'border-l-transparent opacity-60': !near(),
                      }}
                      onClick={() => props.onPick(event)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          props.onPick(event)
                        }
                      }}
                      aria-current={nearest() ? 'true' : undefined}
                    >
                      <span class="w-24 shrink-0 sm:w-44">
                        <span class="block text-xs tabular-nums sm:text-sm">
                          {formatYearsAgo(event.yearsAgo)}
                        </span>
                        <Show when={props.showGenerations}>
                          <span class="text-base-content/45 block text-[0.65rem] tabular-nums">
                            {formatGenerationsAgo(event.generationsAgo)}
                          </span>
                        </Show>
                      </span>

                      <span class="min-w-0 flex-1">
                        <span class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span class="text-sm font-semibold">{event.label}</span>
                          <Show when={event.certainty === 'disputed'}>
                            <span class="badge badge-warning badge-xs">disputed</span>
                          </Show>
                          <Show when={(event.uncertaintyYears ?? 0) > 0}>
                            <span class="text-base-content/35 text-[0.65rem] tabular-nums">
                              ± {formatYears(event.uncertaintyYears!)}
                            </span>
                          </Show>
                        </span>
                        <Show when={event.description}>
                          <span class="text-base-content/55 mt-0.5 block text-xs">
                            {event.description}
                          </span>
                        </Show>
                        <Sources event={event} />
                      </span>
                    </div>
                  </li>
                )
              }}
            </For>
          </Show>
        </ul>
      </Show>
    </section>
  )
}

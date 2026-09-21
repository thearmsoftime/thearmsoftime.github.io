import { Show } from 'solid-js'
import type { TimelineEvent } from '../types'
import { hostOf, isUrl } from '../data'

/** A small, quiet link that opens away from the page. */
export function OutLink(props: { href: string; children: string }) {
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
export default function Sources(props: { event: TimelineEvent }) {
  const wiki = () => (isUrl(props.event.wikipedia) ? props.event.wikipedia : undefined)
  const src = () => (isUrl(props.event.source) ? props.event.source : undefined)
  const note = () => (src() ? undefined : (props.event.sourceTitle ?? props.event.source))
  const watch = () => props.event.watch

  return (
    <Show when={wiki() || src() || note() || watch()}>
      <span class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.65rem]">
        <Show when={wiki()}>{(href) => <OutLink href={href()}>Wikipedia</OutLink>}</Show>
        {/* A video, when there is one worth the reader's time. A link only:
            a still would eat the card, and nothing here is fetched. */}
        <Show when={watch()}>
          {(href) => <OutLink href={href()}>{props.event.watchTitle ?? 'Video'}</OutLink>}
        </Show>
        <Show when={src()}>
          {(href) => <OutLink href={href()}>{props.event.sourceTitle ?? hostOf(href())}</OutLink>}
        </Show>
        <Show when={note()}>{(text) => <span class="text-base-content/35">{text()}</span>}</Show>
      </span>
    </Show>
  )
}

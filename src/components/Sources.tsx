import { For, Show, createUniqueId, onCleanup } from 'solid-js'
import type { Sourced } from '../types'
import { hostOf, isUrl } from '../data'

/** A small, quiet link that opens away from the page. */
export function OutLink(props: { href: string; title?: string; children: string }) {
  return (
    <a
      class="text-base-content/70 hover:text-accent decoration-base-content/40 hover:decoration-accent underline underline-offset-2 transition-colors"
      href={props.href}
      title={props.title}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {props.children}
    </a>
  )
}

/** One way out of a card: what it is for, then where it goes. */
export interface SourceLink {
  /** "Read more", "Watch", "Date source". */
  why: string
  /** Absent for a plain citation, which is printed and not linked. */
  href?: string
  text: string
}

/**
 * Everything a card can point to, in the order a reader wants it: the story,
 * a video, then where the date comes from. `sourceWhy` names that last one,
 * because a fun fact's source covers more than a date.
 */
export function linksOf(
  item: Sourced & { watch?: string; watchTitle?: string },
  sourceWhy = 'Date source',
): SourceLink[] {
  const links: SourceLink[] = []
  if (isUrl(item.wikipedia)) links.push({ why: 'Read more', href: item.wikipedia, text: 'Wikipedia' })
  // A video, when there is one worth the reader's time. A link only: a still
  // would eat the card, and nothing here is fetched.
  if (isUrl(item.watch)) links.push({ why: 'Watch', href: item.watch, text: item.watchTitle ?? 'Video' })
  if (isUrl(item.source)) {
    // The date source is often the Wikipedia article itself. Listed anyway:
    // under its own label it says where the date comes from, not a repeat.
    const text =
      item.sourceTitle ?? (item.source === item.wikipedia ? 'Wikipedia' : hostOf(item.source))
    links.push({ why: sourceWhy, href: item.source, text })
  } else {
    const text = item.sourceTitle ?? item.source
    if (text) links.push({ why: sourceWhy, text })
  }
  return links
}

/** Room between the button and the box, in px. */
const GAP = 6
/** Nearest the box comes to the edge of the screen, in px. */
const EDGE = 8

/**
 * The card's links behind one small button. Laid out on the card they took
 * one to three rows, a different number on every card, and ate the room the
 * description needs.
 *
 * The box is a native popover: it opens in the top layer, so the card's and
 * the strip's overflow cannot clip it, and the browser closes it on Escape or
 * a click anywhere else. It opens above its button — the cards sit at the
 * foot of the screen.
 */
export default function Sources(props: { links: SourceLink[] }) {
  const id = createUniqueId()
  let button!: HTMLButtonElement
  let box!: HTMLDivElement

  /** A popover lands in the middle of the screen. This pins it to its button. */
  const place = () => {
    const at = button.getBoundingClientRect()
    box.style.right = `${Math.max(EDGE, innerWidth - at.right)}px`
    box.style.bottom = `${innerHeight - at.top + GAP}px`
    box.style.maxWidth = `min(18rem, ${Math.max(at.right - EDGE, 0)}px)`
  }

  // Anything that moves the strip leaves the box hanging off nothing: a drag
  // of the marker, the wheel, the window. It closes rather than drift.
  const close = () => box.hidePopover()
  const watch = (on: boolean) => {
    if (on) {
      addEventListener('scroll', close, { capture: true, passive: true })
      addEventListener('resize', close)
    } else {
      removeEventListener('scroll', close, { capture: true })
      removeEventListener('resize', close)
    }
  }
  onCleanup(() => watch(false))

  /*
    The box sits inside the card in the DOM, whatever the top layer shows, so
    its clicks and keys still bubble up to the card. Stopped here, or a link
    would also pick the card, and a press would start a drag of the strip.
  */
  const stop = (e: Event) => e.stopPropagation()

  return (
    <Show when={props.links.length > 0}>
      <button
        ref={button}
        type="button"
        popovertarget={id}
        class="text-base-content/70 hover:text-accent decoration-base-content/40 hover:decoration-accent shrink-0 cursor-pointer text-[0.65rem] underline underline-offset-2 transition-colors"
        onClick={(e) => {
          stop(e)
          place()
        }}
        onKeyDown={stop}
      >
        Sources
      </button>
      <div
        ref={box}
        id={id}
        popover="auto"
        class="bg-base-100 text-base-content border-base-300 rounded-box inset-auto m-0 w-max border p-3 text-xs shadow-lg"
        onToggle={(e) => watch(e.newState === 'open')}
        onClick={stop}
        onKeyDown={stop}
        onPointerDown={stop}
      >
        <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5">
          <For each={props.links}>
            {(link) => (
              <>
                <dt class="text-base-content/70">{link.why}</dt>
                <dd>
                  <Show when={link.href} fallback={link.text}>
                    {(href) => <OutLink href={href()}>{link.text}</OutLink>}
                  </Show>
                </dd>
              </>
            )}
          </For>
        </dl>
      </div>
    </Show>
  )
}

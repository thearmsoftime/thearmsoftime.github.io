import { Show } from 'solid-js'
import { OutLink } from './Sources'
import { hostOf, isUrl } from '../data'
import { gapsOf } from '../oddities'
import { formatSpanShare, formatYears } from '../format'
import type { Oddity } from '../types'

/**
 * A fun fact as a card in the strip, squeezed in at the moment its two gaps
 * share. It is a card and not a banner because the strip is already the thing
 * tied to the arm: put the fact anywhere else and the marker still lands on
 * whatever event happens to be nearest, and the wrong card lights up.
 *
 * It wears the second colour, like the rules on the arm, so nobody reads it as
 * one more event. It is a guest here and leaves when the reader closes it.
 */

interface Props {
  fact: Oddity
  /** This timeline's whole span, for saying a future gap in arm spans. */
  spanYears: number
  onNext: () => void
  onClose: () => void
}

export default function FactCard(props: Props) {
  const gaps = () => gapsOf(props.fact)
  const difference = () => Math.abs(gaps().older - gaps().younger)
  /** How far the last moment reaches past now, when it is still to come. */
  const ahead = () => {
    const last = props.fact.points[2].yearsAgo
    return last < 0 ? -last : undefined
  }
  const wiki = () => (isUrl(props.fact.wikipedia) ? props.fact.wikipedia : undefined)
  const src = () => (isUrl(props.fact.source) ? props.fact.source : undefined)

  return (
    // A fixed width, not a share of the parent: while the card squeezes in the
    // parent is still growing, and anything that follows it would reflow on
    // every frame.
    <div class="border-secondary/50 bg-base-100 rounded-box mx-[calc(var(--card-gap)/2)] flex min-h-0 w-[calc(14rem-var(--card-gap))] flex-1 flex-col overflow-hidden border px-4 py-3 text-left shadow-md shadow-secondary/10 sm:w-[calc(16rem-var(--card-gap))]">
      <div class="flex items-center gap-1">
        <span class="text-secondary flex-1 text-[0.6rem] font-semibold tracking-[0.16em] uppercase">
          Fun fact
        </span>
        <button
          type="button"
          class="text-secondary/70 hover:text-secondary text-[0.65rem] font-medium transition-colors"
          onClick={props.onNext}
        >
          Another
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          aria-label="Hide this fact"
          onClick={props.onClose}
        >
          ✕
        </button>
      </div>

      <p class="font-display mt-1 text-base leading-snug">{props.fact.line}</p>

      {/*
        The one number the drawing cannot say for itself. On a fact about the
        future that is how far past the fingertip it reaches, measured in the
        reader's own reach; on the rest it is how much the two gaps differ,
        which is the whole surprise.
      */}
      <p class="text-secondary mt-1.5 text-xs tabular-nums">
        <Show
          when={ahead()}
          fallback={
            <>
              {formatYears(difference())}{' '}
              <span class="text-base-content/70">
                {gaps().younger < gaps().older ? 'shorter than the gap before it' : 'longer than what came after'}
              </span>
            </>
          }
        >
          {(years) => (
            <>
              {formatYears(years())}{' '}
              <span class="text-base-content/70">
                past the fingertip — {formatSpanShare(years() / props.spanYears)}
              </span>
            </>
          )}
        </Show>
      </p>

      <span class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1.5 text-[0.65rem]">
        <Show when={wiki()}>{(href) => <OutLink href={href()}>Wikipedia</OutLink>}</Show>
        <Show when={src()}>
          {(href) => <OutLink href={href()}>{props.fact.sourceTitle ?? hostOf(href())}</OutLink>}
        </Show>
        <Show when={props.fact.certainty && props.fact.certainty !== 'high'}>
          {/* Honesty is part of it: a date nobody has pinned says so here. */}
          <span class="text-base-content/70">date not settled</span>
        </Show>
      </span>
    </div>
  )
}

import { Show } from 'solid-js'
import Sources, { linksOf } from './Sources'
import { gapsOf } from '../oddities'
import { formatSpanShare, formatYears } from '../format'
import type { Oddity } from '../types'

/**
 * A fun fact as a card in the strip, squeezed in at its hinge: the moment its
 * two gaps share, or the end of its one gap. It is a card and not a banner
 * because the strip is already the thing tied to the arm: put the fact
 * anywhere else and the marker still lands on whatever event happens to be
 * nearest, and the wrong card lights up.
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
  /** Only a fact with two gaps compares them. */
  const compares = () => gaps().length === 2
  const older = () => gaps()[0]!
  const younger = () => gaps()[1] ?? 0
  const difference = () => Math.abs(older() - younger())
  /** How far the last moment reaches past now, when it is still to come. */
  const ahead = () => {
    const last = props.fact.points[props.fact.points.length - 1]!.yearsAgo
    return last < 0 ? -last : undefined
  }

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
        reader's own reach; on a fact with two gaps it is how much they differ,
        which is the whole surprise. A fact with one gap has nothing to add:
        the arm already measures it, right under the line.
      */}
      <Show when={ahead() !== undefined || compares()}>
        <p class="text-secondary mt-1.5 text-xs tabular-nums">
          <Show
            when={ahead()}
            fallback={
              <>
                {formatYears(difference())}{' '}
                <span class="text-base-content/70">
                  {younger() < older() ? 'shorter than the gap before it' : 'longer than what came after'}
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
      </Show>

      {/* The same foot as an event card: a note on the left, the sources
          behind one button on the right. */}
      <span class="mt-auto flex items-end gap-2 pt-1.5">
        <span class="text-base-content/70 min-w-0 flex-1 text-[0.65rem] leading-snug">
          <Show when={props.fact.certainty && props.fact.certainty !== 'high'}>
            {/* Honesty is part of it: a date nobody has pinned says so here. */}
            date not settled
          </Show>
        </span>
        <Sources links={linksOf(props.fact, 'Source')} />
      </span>
    </div>
  )
}

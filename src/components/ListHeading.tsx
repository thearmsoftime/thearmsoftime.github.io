interface Props {
  /** What clicking does, in the words of the layout that is showing. */
  action: string
}

/**
 * The line in the footer: what the cards are and how to use them. No count —
 * the cards are right above it — and no punchy line, since the scale bar
 * already says what one nail-file swipe is worth.
 */
export default function ListHeading(props: Props) {
  return (
    <div class="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
      {/* Set like the title: the same serif, in small spaced capitals. */}
      <h2 class="font-display text-base-content/70 text-[0.65rem] tracking-[0.22em] whitespace-nowrap uppercase">
        Along the arms
      </h2>
      {/* No key hints: the arrow keys only answer once the arms have focus,
          which a visitor never sees, so the hint read as a broken promise. */}
      <p class="text-base-content/70 text-[0.65rem]">{props.action}</p>
    </div>
  )
}

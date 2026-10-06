/** The Ko-fi page this links to. The id is the one the widget script carries. */
const KOFI_URL = 'https://ko-fi.com/G2G8JT2U9'
/** Ko-fi's own blue, so the button reads as theirs in either theme. */
const KOFI_BLUE = '#72a4f2'
/** Text on the solid blue button. */
const KOFI_INK = '#0e2340'

const Cup = (props: { big?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    class={`shrink-0 ${props.big ? 'size-4.5' : 'size-3.5'}`}
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M16 9h2a3 3 0 0 1 0 6h-2" />
    <path d="M6 3v2M10 3v2M14 3v2" />
  </svg>
)

/** The footer's two ways off the page share this look: small, grey, underlined. */
export const QUIET_LINK =
  'text-base-content/70 hover:text-base-content decoration-base-content/40 focus-visible:ring-accent/50 rounded-sm text-[0.65rem] whitespace-nowrap underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:outline-none'

/**
 * A plain link to the Ko-fi page. Ko-fi ships a widget script, but it would be
 * the only thing on the page fetched from another host, and it draws itself
 * with `document.write`, which a Solid render has no place for. Same
 * destination, no third party on the visitor's path.
 */
export default function KofiLink(props: { big?: boolean; always?: boolean; quiet?: boolean }) {
  // The footer: a plain text link, as quiet as About beside it. The page is
  // the thing on screen; the way off it should not compete with the cards.
  if (props.quiet) {
    return (
      <a
        class={QUIET_LINK}
        href={KOFI_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Support this on Ko-fi"
      >
        Support on Ko-fi
      </a>
    )
  }
  return (
    <a
      class="focus-visible:ring-accent/50 flex shrink-0 items-center rounded-full font-medium leading-none whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none"
      classList={{
        // The footer pill: tinted, the same height as the About pill next to
        // it. A fixed height and `leading-none` keep icon and word on one
        // centre line, where the line box of the tiny text used to push the
        // word low.
        'h-6 gap-1.5 border px-2 text-[0.65rem] hover:opacity-80': !props.big,
        // The About box: a real button, solid blue with dark ink. White on
        // this blue is under 3:1; the dark ink clears 7:1.
        'h-9 gap-2 px-4 text-sm shadow-sm hover:brightness-105 active:scale-[0.98]': props.big,
      }}
      style={
        props.big
          ? { color: KOFI_INK, 'background-color': KOFI_BLUE }
          : {
              color: KOFI_BLUE,
              'border-color': `color-mix(in oklab, ${KOFI_BLUE} 45%, transparent)`,
              'background-color': `color-mix(in oklab, ${KOFI_BLUE} 12%, transparent)`,
            }
      }
      href={KOFI_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Support this on Ko-fi"
    >
      <Cup big={props.big} />
      {/* In the footer the word only shows where there is room; in the
          Settings menu and the About box there is always room. */}
      <span classList={{ 'hidden sm:inline': !props.big && !props.always }}>
        {props.big ? 'Buy a coffee on Ko-fi' : 'Support on Ko-fi'}
      </span>
    </a>
  )
}

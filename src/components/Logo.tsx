/**
 * Bernoulli's lemniscate round the chest at (50, 44), 40 units out to each
 * fingertip. Worked out once here rather than pasted as 120 points.
 */
const LOOP =
  'M' +
  Array.from({ length: 120 }, (_, i) => {
    const t = (i / 120) * 2 * Math.PI
    const d = 1 + Math.sin(t) ** 2
    const x = 50 + (40 * Math.cos(t)) / d
    const y = 44 + (40 * Math.sin(t) * Math.cos(t)) / d
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join('L') +
  'Z'

/**
 * The mark: a figure whose outstretched arms are one infinity loop, crossing at
 * the chest. Drawn in `currentColor`, so it follows the page's theme, not the
 * browser's. `public/favicon.svg` is the same drawing as a file, for the tab
 * and the readme; change one, change both. The strokes are heavy because the
 * tab shows it at 16 px.
 */
const Logo = (props: { class?: string }) => (
  <svg
    viewBox="6 9 88 88"
    class={props.class}
    fill="none"
    stroke="currentColor"
    stroke-width="7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d={LOOP} />
    <path d="M50,44V64L41,82M50,64L59,82" />
    <circle cx="50" cy="27" r="7" fill="currentColor" stroke="none" />
  </svg>
)

export default Logo

import { createSignal } from 'solid-js'
import { FIGURE, cropHeight, cropTop } from './figure'

/**
 * How the drawing runs out into air.
 *
 * The drawing is held in air on every side: it runs out over the head, runs
 * out under the arms, runs out at both fingertips, and the face is taken out
 * by a soft circle. What is left is the pair of arms, which is all the ruler
 * needs — and none of it ends on a hard edge.
 *
 * The dimmers per layer are still workbench only, sitting at "does nothing".
 * The prototype panel's Fade tab is the only thing that moves any of this, so
 * a visitor gets exactly the constant below and nothing more.
 *
 * Every position is source y (or a fraction of the image box), the same units
 * as `figure.ts`, because the mask is cut from the scan's own box.
 */

/** The shipped run-out at the foot, in source y. */
export const FADE_LENGTH = 126

export type SpotMode = 'off' | 'hide' | 'keep'

export interface Fade {
  /** Run-out over the head. 0 leaves the top edge hard. */
  topLength: number
  /** Moves that run-out off the crop's top edge. Down is positive. */
  topOffset: number
  /** Run-out under the arms — the one that ships. */
  bottomLength: number
  /** Moves it off the crop's bottom edge. */
  bottomOffset: number
  /**
   * How much ink is left halfway along a run-out. 0.5 is a straight ramp,
   * lower holds the fade back and then drops it, higher lets go early.
   */
  curve: number
  /** Run-out at each fingertip, as a fraction of the image width. */
  sideLength: number
  /** A circle: off, hide what is inside it, or keep only what is inside it. */
  spot: SpotMode
  /** Its middle, as fractions of the image box. Head is about 0.5, 0.2. */
  spotX: number
  spotY: number
  /** Radius, as a fraction of the image width. */
  spotR: number
  /** How much of that radius is edge rather than middle. */
  spotFeather: number
  /** Dimmer on the scan, on top of whatever the theme already asks for. */
  ink: number
  /** Dimmer on the traced lines. */
  lineInk: number
}

export const FADE_DEFAULT: Fade = {
  topLength: 84,
  topOffset: 18,
  bottomLength: FADE_LENGTH,
  bottomOffset: -38,
  curve: 0.57,
  sideLength: 0.16,
  spot: 'hide',
  spotX: 0.495,
  spotY: 0.225,
  spotR: 0.24,
  spotFeather: 0.76,
  ink: 1,
  lineInk: 1,
}

const [fade, setFade] = createSignal<Fade>(FADE_DEFAULT)
export { fade, setFade }

/** Source y -> a stop position in the scan's own box. */
const pct = (y: number): string =>
  `${Math.min(100, Math.max(0, (y / FIGURE.height) * 100)).toFixed(2)}%`

/** Part-way ink. Black with alpha, because the mask reads alpha. */
const soft = (curve: number): string => `rgba(0, 0, 0, ${curve.toFixed(3)})`

/**
 * Top and foot in one gradient. Outside the first and last stop the gradient
 * holds its end colour, so a length of 0 simply leaves that end solid.
 */
function verticalLayer(f: Fade): string {
  const top = cropTop() + f.topOffset
  const foot = cropTop() + cropHeight() + f.bottomOffset
  const stops: string[] = []

  if (f.topLength > 0) {
    stops.push(`transparent ${pct(top)}`, `${soft(f.curve)} ${pct(top + f.topLength / 2)}`)
  }
  stops.push(`#000 ${pct(top + f.topLength)}`, `#000 ${pct(foot - f.bottomLength)}`)
  if (f.bottomLength > 0) {
    stops.push(`${soft(f.curve)} ${pct(foot - f.bottomLength / 2)}`, `transparent ${pct(foot)}`)
  }

  return `linear-gradient(to bottom, ${stops.join(', ')})`
}

/** The same run-out at both fingertips, so the arms end in air too. */
function sideLayer(f: Fade): string {
  const end = f.sideLength * 100
  const half = end / 2
  return (
    `linear-gradient(to right, transparent 0%, ${soft(f.curve)} ${half}%,` +
    ` #000 ${end}%, #000 ${100 - end}%, ${soft(f.curve)} ${100 - half}%, transparent 100%)`
  )
}

/**
 * The circle. Its radius is given in width, so the vertical half-size has to
 * be stretched by the image's own aspect or it comes out as an egg.
 */
function spotLayer(f: Fade): string {
  const rx = f.spotR * 100
  const ry = f.spotR * 100 * (FIGURE.width / FIGURE.height)
  const inner = `${Math.round((1 - f.spotFeather) * 100)}%`
  const stops =
    f.spot === 'hide' ? `transparent ${inner}, #000 100%` : `#000 ${inner}, transparent 100%`
  return `radial-gradient(${rx.toFixed(2)}% ${ry.toFixed(2)}% at ${f.spotX * 100}% ${f.spotY * 100}%, ${stops})`
}

/** Every mask layer, in paint order. One while nothing extra is switched on. */
export function fadeLayers(): string[] {
  const f = fade()
  const layers = [verticalLayer(f)]
  if (f.sideLength > 0) layers.push(sideLayer(f))
  if (f.spot !== 'off' && f.spotR > 0) layers.push(spotLayer(f))
  return layers
}

/**
 * The mask half of a style object. `lead` is a layer laid over the fade and
 * read by brightness instead of alpha — the traced contours, which are white
 * ink on a black card. The mode list has to name every layer: a short list is
 * repeated, so `luminance, alpha` over four layers would read two of the
 * gradients as brightness and blank them.
 *
 * Compositing is only set when there is something to composite. On older
 * WebKit `source-in` against an empty backdrop can wipe a single layer out.
 */
export function maskStyle(lead?: string): Record<string, string> {
  const layers = lead ? [lead, ...fadeLayers()] : fadeLayers()
  const image = layers.join(', ')
  const modes = layers.map((_, i) => (lead && i === 0 ? 'luminance' : 'alpha')).join(', ')

  const style: Record<string, string> = {
    '-webkit-mask-image': image,
    'mask-image': image,
    '-webkit-mask-size': '100% 100%',
    'mask-size': '100% 100%',
    '-webkit-mask-repeat': 'no-repeat',
    'mask-repeat': 'no-repeat',
    '-webkit-mask-source-type': modes,
    'mask-mode': modes,
  }
  if (layers.length > 1) {
    style['-webkit-mask-composite'] = 'source-in'
    style['mask-composite'] = 'intersect'
  }
  return style
}

/** The theme picks the scan's strength; this is a dimmer on top of it. */
export const inkOpacity = (): string => `calc(var(--figure-opacity) * ${fade().ink})`
export const lineOpacity = (): string => String(fade().lineInk)

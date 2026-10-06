import { createSignal } from 'solid-js'

/**
 * Light on Leonardo's arms. The drawing is three layers here, faintest at the
 * back: the scan, almost nothing, then the whole traced outline, softer, then
 * the highlight on top — the top edge of the arms, where light from above
 * falls, at full strength. The highlight is the only light effect: no
 * shadow tricks, just its own colour and opacity. The eye goes to the line
 * the ruler runs along.
 *
 * Outline and highlight are two traces from the same GIMP file, the same box
 * as the scan. The highlight is a part of the outline, drawn again over it.
 *
 * The defaults are a first guess, to be tuned on screen with the Light tab.
 * The tab is the only thing that moves them.
 */

/** `ink` is the theme's own text colour; `custom` is the oklch beside it. */
export type LightColour = 'ink' | 'custom'

/** One layer of the drawing. */
export interface Side {
  colour: LightColour
  /** oklch lightness 0..100, chroma 0..0.37, hue 0..360 — only for `custom`. */
  lightness: number
  chroma: number
  hue: number
  opacity: number
}

export interface Light {
  /**
   * The scan's colour. `ink` is the photo as the theme draws it, tinted by
   * the three numbers below. That cannot colour the light theme: there the
   * scan is inverted to black ink, and no tint moves black. `custom` paints
   * the colour through the scan instead, as a mask, the way the trace is
   * drawn — so it reads the same on paper and on dark. Its opacity is unused;
   * `scanInk` sets the strength either way.
   */
  scan: Side
  /** The scan: a dimmer on the theme's strength, a warm tint and its hue. */
  scanInk: number
  scanTint: number
  scanHue: number
  scanSaturate: number

  highlight: Side
  outline: Side

  /**
   * The drawing moved down (plus) or up (minus) under the line, in source y.
   * All three layers move together; the line, the knob and the marks stay.
   */
  shift: number
}

export const LIGHT_DEFAULT: Light = {
  scan: { colour: 'ink', lightness: 45, chroma: 0.08, hue: 55, opacity: 1 },
  scanInk: 0.25,
  scanTint: 0.75,
  scanHue: -11,
  scanSaturate: 1,

  highlight: { colour: 'ink', lightness: 70, chroma: 0.1, hue: 70, opacity: 0.96 },
  outline: { colour: 'ink', lightness: 70, chroma: 0.1, hue: 70, opacity: 0.35 },

  shift: 0,
}

const [light, setLight] = createSignal<Light>(LIGHT_DEFAULT)
export { light, setLight }

/** A layer's colour as CSS. */
export const sideColour = (side: Side): string =>
  side.colour === 'ink'
    ? 'var(--color-base-content)'
    : `oklch(${side.lightness}% ${side.chroma} ${side.hue})`

/**
 * Added after the theme's own filter on the scan, via `--figure-tint` in
 * index.css. Nothing when the tint is off, so the theme's filter is all there is.
 */
export const scanTint = (): string | undefined => {
  const l = light()
  if (l.scanTint === 0 && l.scanHue === 0 && l.scanSaturate === 1) return undefined
  return `sepia(${l.scanTint}) hue-rotate(${l.scanHue}deg) saturate(${l.scanSaturate})`
}

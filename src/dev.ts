import { createStoredSignal } from './prefs'

/**
 * Dev mode: `?dev=1` on the URL. It is read once, at load, so the rest of the
 * app can treat it as a constant. Nothing is stored — drop the flag and the
 * build is public again.
 *
 * A visitor without it gets Universe, Life and Humans. Earth and Modern humans
 * are still loaded and still sanitised the same way; dev mode is the only way
 * to reach them.
 */
export const DEV: boolean = readFlag()

function readFlag(): boolean {
  if (typeof location === 'undefined') return false
  const dev = new URLSearchParams(location.search).get('dev')
  return dev === '1' || dev === 'true'
}

/**
 * The body landmarks drawn over the arms — wrist, elbow, knuckles — as purple
 * guides. A dev switch in the settings menu, kept between visits. It lives
 * here, not with the marks, because the menu and the stage both read it and
 * both are on the visitor's path; the marks themselves are a lazy chunk.
 */
export const [bodyMarks, setBodyMarks] = createStoredSignal(
  'dev-body-marks',
  false,
  (raw) => (raw === 'true' ? true : raw === 'false' ? false : undefined),
)

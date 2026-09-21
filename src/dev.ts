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

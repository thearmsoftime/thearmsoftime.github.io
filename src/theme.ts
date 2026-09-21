/** The two DaisyUI themes defined in index.css. */
export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

/**
 * What the reader picks. "System" is not a theme of its own — it follows the
 * browser, and keeps following it while the app is open.
 */
export const THEME_CHOICES = ['system', 'dark', 'light'] as const

export type ThemeChoice = (typeof THEME_CHOICES)[number]

export const DEFAULT_CHOICE: ThemeChoice = 'system'

/** Where the browser is asked. Same string in the index.html pre-paint script. */
const DARK_QUERY = '(prefers-color-scheme: dark)'

export const STORAGE_KEY = 'armsoftime:theme'

const isChoice = (v: unknown): v is ThemeChoice =>
  typeof v === 'string' && (THEME_CHOICES as readonly string[]).includes(v)

/** What the browser is set to right now. No match support means dark. */
export function systemTheme(): Theme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  } catch {
    return 'dark'
  }
}

/** The stored choice, or the default. Storage can throw in a locked-down browser. */
export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isChoice(stored)) return stored
  } catch {
    /* no storage: fall through to the default */
  }
  return DEFAULT_CHOICE
}

/** The theme a choice actually paints. */
export const resolveTheme = (choice: ThemeChoice): Theme =>
  choice === 'system' ? systemTheme() : choice

let shiftTimer: ReturnType<typeof setTimeout> | undefined

/** Paint a theme on <html>, and cross-fade the colours while it lands. */
function paint(theme: Theme): void {
  const root = document.documentElement
  if (root.dataset.theme !== theme) {
    root.classList.add('theme-shift')
    clearTimeout(shiftTimer)
    shiftTimer = setTimeout(() => root.classList.remove('theme-shift'), 420)
  }
  root.dataset.theme = theme
}

/** Remember the choice and paint what it resolves to. */
export function applyThemeChoice(choice: ThemeChoice): void {
  paint(resolveTheme(choice))
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    /* the choice just will not survive a reload */
  }
}

/**
 * Repaint when the browser flips light/dark — but only while the reader is on
 * "system". Returns the unsubscribe. Safari before 14 has no addEventListener
 * on a media query list, hence the fallback.
 */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  let mq: MediaQueryList
  try {
    mq = window.matchMedia(DARK_QUERY)
  } catch {
    return () => {}
  }
  const handler = () => onChange(mq.matches ? 'dark' : 'light')
  if (mq.addEventListener) {
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }
  mq.addListener(handler)
  return () => mq.removeListener(handler)
}

export const THEME_LABEL: Record<ThemeChoice, string> = {
  system: 'System',
  dark: 'Dark',
  light: 'Light',
}

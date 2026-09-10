/** The three DaisyUI themes defined in index.css, in the order the buttons show. */
export const THEMES = ['black', 'dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'dark'

export const STORAGE_KEY = 'armsoftime:theme'

const isTheme = (v: unknown): v is Theme =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v)

/** The stored choice, or the default. Storage can throw in a locked-down browser. */
export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    /* no storage: fall through to the default */
  }
  const attr = document.documentElement.dataset.theme
  return isTheme(attr) ? attr : DEFAULT_THEME
}

let shiftTimer: ReturnType<typeof setTimeout> | undefined

/** Set the theme on <html>, remember it, and cross-fade the colours while it lands. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (root.dataset.theme !== theme) {
    root.classList.add('theme-shift')
    clearTimeout(shiftTimer)
    shiftTimer = setTimeout(() => root.classList.remove('theme-shift'), 420)
  }
  root.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* the choice just will not survive a reload */
  }
}

export const THEME_LABEL: Record<Theme, string> = {
  black: 'Black',
  dark: 'Dark',
  light: 'Light',
}

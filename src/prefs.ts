import { createSignal, type Signal } from 'solid-js'

/**
 * What the top bar chooses, kept between visits: the timeline, the timeline
 * strip, how many events, the arm span. The theme has its own module because
 * it also has to land before the first paint.
 *
 * Storage throws in a locked-down browser, so every touch of it is guarded and
 * the app just falls back to the default.
 */
const PREFIX = 'armsoftime:'

export function readStored(key: string): string | undefined {
  try {
    return localStorage.getItem(PREFIX + key) ?? undefined
  } catch {
    return undefined
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    /* the choice just will not survive a reload */
  }
}

/**
 * A signal that remembers itself. `parse` returns undefined for anything
 * stored that no longer makes sense — a timeline that was renamed, say — and the
 * fallback takes over.
 */
export function createStoredSignal<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T | undefined,
  write: (value: T) => string = String,
): Signal<T> {
  const raw = readStored(key)
  const [get, set] = createSignal<T>((raw !== undefined ? parse(raw) : undefined) ?? fallback)

  const store = ((next: unknown) => {
    const value = (set as (v: unknown) => T)(next)
    writeStored(key, write(value))
    return value
  }) as Signal<T>[1]

  return [get, store]
}

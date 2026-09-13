/** Thin, defensive wrapper around window.localStorage: reads/writes JSON
 * and never throws — private browsing, a full quota, or corrupted data
 * all degrade to the given fallback instead of crashing the app. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local persistence is a nice-to-have, not a hard requirement — a
    // full/unavailable store shouldn't break the current session.
  }
}

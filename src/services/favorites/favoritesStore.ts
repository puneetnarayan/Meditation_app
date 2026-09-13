import { readJSON, writeJSON } from '../storage/localStorage'

const FAVORITES_STORAGE_KEY = 'meditation-app.favorites'

export function getFavoriteIds(): string[] {
  return readJSON<string[]>(FAVORITES_STORAGE_KEY, [])
}

export function isFavorite(meditationId: string): boolean {
  return getFavoriteIds().includes(meditationId)
}

export function addFavorite(meditationId: string): string[] {
  const current = getFavoriteIds()
  if (current.includes(meditationId)) return current

  const updated = [...current, meditationId]
  writeJSON(FAVORITES_STORAGE_KEY, updated)
  return updated
}

export function removeFavorite(meditationId: string): string[] {
  const updated = getFavoriteIds().filter((id) => id !== meditationId)
  writeJSON(FAVORITES_STORAGE_KEY, updated)
  return updated
}

/** Toggles a meditation's favorite state and returns the resulting full
 * list of favorite ids. Works on any string[] store today; swapping in
 * a Supabase-backed `favorites` table later only touches this module. */
export function toggleFavorite(meditationId: string): string[] {
  return isFavorite(meditationId)
    ? removeFavorite(meditationId)
    : addFavorite(meditationId)
}

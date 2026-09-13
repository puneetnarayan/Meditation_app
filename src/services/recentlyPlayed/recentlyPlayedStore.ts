import type { RecentlyPlayedEntry } from '../../types'
import { readJSON, writeJSON } from '../storage/localStorage'

const RECENTLY_PLAYED_STORAGE_KEY = 'meditation-app.recently-played'
const MAX_ENTRIES = 10

export function getRecentlyPlayed(): RecentlyPlayedEntry[] {
  return readJSON<RecentlyPlayedEntry[]>(RECENTLY_PLAYED_STORAGE_KEY, [])
}

/** Records that a meditation was just started, moving it to the front if
 * it was already in the list. Capped at MAX_ENTRIES most-recent items. */
export function recordPlayed(meditationId: string): RecentlyPlayedEntry[] {
  const withoutExisting = getRecentlyPlayed().filter(
    (entry) => entry.meditationId !== meditationId,
  )
  const updated = [
    { meditationId, playedAt: new Date().toISOString() },
    ...withoutExisting,
  ].slice(0, MAX_ENTRIES)

  writeJSON(RECENTLY_PLAYED_STORAGE_KEY, updated)
  return updated
}

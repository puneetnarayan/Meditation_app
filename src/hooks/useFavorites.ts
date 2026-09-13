import { useState } from 'react'
import { trackEvent } from '../services/analytics/analyticsStore'
import {
  getFavoriteIds,
  toggleFavorite as persistToggleFavorite,
} from '../services/favorites/favoritesStore'

export interface UseFavoritesResult {
  favoriteIds: string[]
  isFavorite: (meditationId: string) => boolean
  toggleFavorite: (meditationId: string) => void
}

/** Reads favorites once per mount and keeps a live copy in React state
 * so toggling immediately updates every card reading from this hook
 * instance (e.g. a favorites list that should drop a card the moment
 * it's unfavorited). */
export function useFavorites(): UseFavoritesResult {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    getFavoriteIds(),
  )

  function isFavorite(meditationId: string): boolean {
    return favoriteIds.includes(meditationId)
  }

  function toggleFavorite(meditationId: string): void {
    const wasFavorite = favoriteIds.includes(meditationId)
    setFavoriteIds(persistToggleFavorite(meditationId))
    if (!wasFavorite) {
      trackEvent('favorite_added', { meditationId })
    }
  }

  return { favoriteIds, isFavorite, toggleFavorite }
}

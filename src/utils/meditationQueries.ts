import type { Meditation, MeditationDifficulty, MeditationType } from '../types'

export type MeditationSortBy = 'title' | 'duration' | 'featured'

export interface MeditationQueryOptions {
  search?: string
  categoryId?: string
  difficulty?: MeditationDifficulty
  type?: MeditationType
  /** When false, premium meditations are excluded. Defaults to true
   * (include everything) — entitlement checks happen elsewhere. */
  includePremium?: boolean
  sortBy?: MeditationSortBy
}

export function searchMeditations(
  meditations: Meditation[],
  query: string,
): Meditation[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return meditations

  return meditations.filter(
    (meditation) =>
      meditation.title.toLowerCase().includes(normalized) ||
      meditation.description.toLowerCase().includes(normalized) ||
      meditation.tags.some((tag) => tag.toLowerCase().includes(normalized)),
  )
}

export function filterByCategory(
  meditations: Meditation[],
  categoryId: string,
): Meditation[] {
  return meditations.filter(
    (meditation) => meditation.categoryId === categoryId,
  )
}

export function filterByDifficulty(
  meditations: Meditation[],
  difficulty: MeditationDifficulty,
): Meditation[] {
  return meditations.filter(
    (meditation) => meditation.difficulty === difficulty,
  )
}

export function filterByType(
  meditations: Meditation[],
  type: MeditationType,
): Meditation[] {
  return meditations.filter((meditation) => meditation.type === type)
}

export function filterByPremiumAccess(
  meditations: Meditation[],
  includePremium: boolean,
): Meditation[] {
  return includePremium
    ? meditations
    : meditations.filter((meditation) => !meditation.isPremium)
}

export function getFeaturedMeditations(
  meditations: Meditation[],
): Meditation[] {
  return meditations.filter((meditation) => meditation.isFeatured)
}

export function getMeditationById(
  meditations: Meditation[],
  id: string,
): Meditation | undefined {
  return meditations.find((meditation) => meditation.id === id)
}

export function sortMeditations(
  meditations: Meditation[],
  sortBy: MeditationSortBy = 'title',
): Meditation[] {
  const sorted = [...meditations]

  switch (sortBy) {
    case 'duration':
      return sorted.sort((a, b) => a.durationSeconds - b.durationSeconds)
    case 'featured':
      return sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    case 'title':
    default:
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
  }
}

/** Composes the filters above in a fixed, predictable order: category →
 * difficulty → type → premium access → search → sort. Works on any
 * Meditation[] regardless of source (mock data today, Supabase later). */
export function queryMeditations(
  meditations: Meditation[],
  options: MeditationQueryOptions = {},
): Meditation[] {
  let result = meditations

  if (options.categoryId) {
    result = filterByCategory(result, options.categoryId)
  }
  if (options.difficulty) {
    result = filterByDifficulty(result, options.difficulty)
  }
  if (options.type) {
    result = filterByType(result, options.type)
  }
  if (options.includePremium === false) {
    result = filterByPremiumAccess(result, false)
  }
  if (options.search) {
    result = searchMeditations(result, options.search)
  }
  if (options.sortBy) {
    result = sortMeditations(result, options.sortBy)
  }

  return result
}

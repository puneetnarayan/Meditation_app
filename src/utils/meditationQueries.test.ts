import { describe, expect, it } from 'vitest'
import type { Meditation } from '../types'
import {
  filterByCategory,
  filterByDifficulty,
  filterByPremiumAccess,
  filterByType,
  getFeaturedMeditations,
  getMeditationById,
  queryMeditations,
  searchMeditations,
  sortMeditations,
} from './meditationQueries'

function makeMeditation(overrides: Partial<Meditation>): Meditation {
  return {
    id: 'med-fixture',
    title: 'Fixture Meditation',
    description: 'A fixture for tests.',
    categoryId: 'cat-fixture',
    durationSeconds: 600,
    type: 'guided',
    difficulty: 'beginner',
    tags: [],
    isPremium: false,
    isFeatured: false,
    ...overrides,
  }
}

const fixtures: Meditation[] = [
  makeMeditation({
    id: 'med-1',
    title: 'Calm Morning',
    description: 'Ease into the day.',
    categoryId: 'cat-morning',
    difficulty: 'beginner',
    type: 'guided',
    durationSeconds: 600,
    tags: ['morning-routine'],
    isFeatured: true,
  }),
  makeMeditation({
    id: 'med-2',
    title: 'Deep Focus',
    description: 'Sharpen concentration for deep work.',
    categoryId: 'cat-focus',
    difficulty: 'intermediate',
    type: 'unguided',
    durationSeconds: 900,
    tags: ['deep-focus'],
    isPremium: true,
  }),
  makeMeditation({
    id: 'med-3',
    title: 'Anxiety Relief',
    description: 'Ground yourself when anxious.',
    categoryId: 'cat-anxiety',
    difficulty: 'beginner',
    type: 'guided',
    durationSeconds: 300,
    tags: ['anxiety', 'stress-relief'],
  }),
]

describe('searchMeditations', () => {
  it('returns everything for an empty query', () => {
    expect(searchMeditations(fixtures, '   ')).toEqual(fixtures)
  })

  it('matches title, description and tags case-insensitively', () => {
    expect(searchMeditations(fixtures, 'FOCUS').map((m) => m.id)).toEqual([
      'med-2',
    ])
    expect(
      searchMeditations(fixtures, 'ground yourself').map((m) => m.id),
    ).toEqual(['med-3'])
    expect(
      searchMeditations(fixtures, 'stress-relief').map((m) => m.id),
    ).toEqual(['med-3'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchMeditations(fixtures, 'nonexistent')).toEqual([])
  })
})

describe('filterByCategory / filterByDifficulty / filterByType', () => {
  it('filters by category', () => {
    expect(filterByCategory(fixtures, 'cat-anxiety').map((m) => m.id)).toEqual([
      'med-3',
    ])
  })

  it('filters by difficulty', () => {
    expect(
      filterByDifficulty(fixtures, 'intermediate').map((m) => m.id),
    ).toEqual(['med-2'])
  })

  it('filters by type', () => {
    expect(filterByType(fixtures, 'unguided').map((m) => m.id)).toEqual([
      'med-2',
    ])
  })
})

describe('filterByPremiumAccess', () => {
  it('returns everything when premium is included', () => {
    expect(filterByPremiumAccess(fixtures, true)).toEqual(fixtures)
  })

  it('excludes premium meditations when not included', () => {
    const result = filterByPremiumAccess(fixtures, false)
    expect(result.some((m) => m.isPremium)).toBe(false)
    expect(result.map((m) => m.id)).toEqual(['med-1', 'med-3'])
  })
})

describe('getFeaturedMeditations / getMeditationById', () => {
  it('returns only featured meditations', () => {
    expect(getFeaturedMeditations(fixtures).map((m) => m.id)).toEqual(['med-1'])
  })

  it('finds a meditation by id', () => {
    expect(getMeditationById(fixtures, 'med-2')?.title).toBe('Deep Focus')
  })

  it('returns undefined for an unknown id', () => {
    expect(getMeditationById(fixtures, 'nope')).toBeUndefined()
  })
})

describe('sortMeditations', () => {
  it('sorts by title alphabetically by default', () => {
    expect(sortMeditations(fixtures).map((m) => m.id)).toEqual([
      'med-3',
      'med-1',
      'med-2',
    ])
  })

  it('sorts by duration ascending', () => {
    expect(sortMeditations(fixtures, 'duration').map((m) => m.id)).toEqual([
      'med-3',
      'med-1',
      'med-2',
    ])
  })

  it('sorts featured first', () => {
    expect(sortMeditations(fixtures, 'featured')[0].id).toBe('med-1')
  })

  it('does not mutate the input array', () => {
    const original = [...fixtures]
    sortMeditations(fixtures, 'duration')
    expect(fixtures).toEqual(original)
  })
})

describe('queryMeditations', () => {
  it('composes filters, search and sort together', () => {
    const result = queryMeditations(fixtures, {
      includePremium: false,
      search: 'calm',
    })
    expect(result.map((m) => m.id)).toEqual(['med-1'])
  })

  it('returns all meditations when no options are given', () => {
    expect(queryMeditations(fixtures)).toEqual(fixtures)
  })
})

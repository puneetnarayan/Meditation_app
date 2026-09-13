import { describe, expect, it } from 'vitest'
import type { Meditation, UserPreferences } from '../types'
import { getRecommendedMeditation } from './recommendations'

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

function makePreferences(
  overrides: Partial<UserPreferences> = {},
): UserPreferences {
  return {
    audioVolume: 0.8,
    reducedMotion: false,
    contentPreferences: [],
    onboardingCompleted: false,
    onboardingSkipped: false,
    ...overrides,
  }
}

const fixtures: Meditation[] = [
  makeMeditation({
    id: 'med-stress-1',
    categoryId: 'cat-stress',
    difficulty: 'beginner',
    durationSeconds: 300,
  }),
  makeMeditation({
    id: 'med-stress-2',
    categoryId: 'cat-stress',
    difficulty: 'beginner',
    durationSeconds: 1200,
  }),
  makeMeditation({
    id: 'med-stress-advanced',
    categoryId: 'cat-stress',
    difficulty: 'advanced',
    durationSeconds: 600,
  }),
  makeMeditation({
    id: 'med-focus-featured',
    categoryId: 'cat-focus',
    isFeatured: true,
  }),
  makeMeditation({ id: 'med-plain', categoryId: 'cat-morning' }),
]

describe('getRecommendedMeditation', () => {
  it('falls back to a featured meditation when onboarding was never completed', () => {
    const result = getRecommendedMeditation(fixtures, makePreferences())
    expect(result?.id).toBe('med-focus-featured')
  })

  it('falls back to the first meditation when nothing is featured either', () => {
    const noFeatured = fixtures.map((m) => ({ ...m, isFeatured: false }))
    const result = getRecommendedMeditation(noFeatured, makePreferences())
    expect(result?.id).toBe(noFeatured[0].id)
  })

  it('recommends from the goal-matched category once onboarding is complete', () => {
    const result = getRecommendedMeditation(
      fixtures,
      makePreferences({ onboardingCompleted: true, primaryGoal: 'stress' }),
    )
    expect(result?.categoryId).toBe('cat-stress')
  })

  it('filters by experience level within the matched category', () => {
    const result = getRecommendedMeditation(
      fixtures,
      makePreferences({
        onboardingCompleted: true,
        primaryGoal: 'stress',
        experienceLevel: 'advanced',
      }),
    )
    expect(result?.id).toBe('med-stress-advanced')
  })

  it('picks the closest match to the preferred duration', () => {
    const result = getRecommendedMeditation(
      fixtures,
      makePreferences({
        onboardingCompleted: true,
        primaryGoal: 'stress',
        experienceLevel: 'beginner',
        preferredDurationSeconds: 1100,
      }),
    )
    expect(result?.id).toBe('med-stress-2')
  })

  it('falls back to featured when the goal category has no matches', () => {
    const result = getRecommendedMeditation(
      fixtures,
      makePreferences({
        onboardingCompleted: true,
        primaryGoal: 'sleep', // no cat-sleep fixtures here
      }),
    )
    expect(result?.id).toBe('med-focus-featured')
  })

  it('ignores onboarding answers when onboarding was skipped, not completed', () => {
    const result = getRecommendedMeditation(
      fixtures,
      makePreferences({
        onboardingCompleted: false,
        onboardingSkipped: true,
        primaryGoal: 'stress',
      }),
    )
    expect(result?.id).toBe('med-focus-featured')
  })
})

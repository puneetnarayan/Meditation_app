import type { Meditation, PrimaryGoal, UserPreferences } from '../types'
import { getFeaturedMeditations, queryMeditations } from './meditationQueries'

/** Maps an onboarding goal to the closest existing category. Kept as a
 * plain lookup (rather than adding a goal-specific field to Category)
 * since it's just steering a recommendation, not a real content
 * relationship. */
const GOAL_CATEGORY_MAP: Record<PrimaryGoal, string> = {
  stress: 'cat-stress',
  sleep: 'cat-sleep',
  focus: 'cat-focus',
  anxiety: 'cat-anxiety',
  'general-wellbeing': 'cat-mindfulness',
}

/** A single meditation to feature on Home: personalized to the user's
 * onboarding answers when available, a featured meditation otherwise,
 * and the first meditation in the list as a last resort so Home always
 * has something to show. */
export function getRecommendedMeditation(
  meditations: Meditation[],
  preferences: UserPreferences,
): Meditation | undefined {
  const personalized = getPersonalizedMeditation(meditations, preferences)
  if (personalized) return personalized

  const featured = getFeaturedMeditations(meditations)
  return featured[0] ?? meditations[0]
}

function getPersonalizedMeditation(
  meditations: Meditation[],
  preferences: UserPreferences,
): Meditation | undefined {
  if (!preferences.onboardingCompleted || !preferences.primaryGoal) {
    return undefined
  }

  const matches = queryMeditations(meditations, {
    categoryId: GOAL_CATEGORY_MAP[preferences.primaryGoal],
    difficulty: preferences.experienceLevel,
  })
  if (matches.length === 0) return undefined

  const target = preferences.preferredDurationSeconds
  if (target === undefined) return matches[0]

  return [...matches].sort(
    (a, b) =>
      Math.abs(a.durationSeconds - target) -
      Math.abs(b.durationSeconds - target),
  )[0]
}

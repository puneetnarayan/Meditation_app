import type { MeditationDifficulty } from './meditation'
import type { MeditationTag } from './tag'

export const PRIMARY_GOALS = [
  'stress',
  'sleep',
  'focus',
  'anxiety',
  'general-wellbeing',
] as const
export type PrimaryGoal = (typeof PRIMARY_GOALS)[number]

export const PREFERRED_TIMES_OF_DAY = [
  'morning',
  'afternoon',
  'evening',
  'anytime',
] as const
export type PreferredTimeOfDay = (typeof PREFERRED_TIMES_OF_DAY)[number]

export interface UserPreferences {
  /** 0–1. */
  audioVolume: number
  reducedMotion: boolean
  /** Preferred meditation length in seconds, used to pre-select a
   * duration elsewhere in the app. Undefined = no preference set. */
  preferredDurationSeconds?: number

  // Personalization (captured during onboarding, editable later from
  // Settings). All optional/empty until the user actually answers.
  primaryGoal?: PrimaryGoal
  experienceLevel?: MeditationDifficulty
  preferredTimeOfDay?: PreferredTimeOfDay
  contentPreferences: MeditationTag[]
  /** True once the user has finished the onboarding questions. */
  onboardingCompleted: boolean
  /** True if the user explicitly dismissed onboarding without
   * completing it — distinct from onboardingCompleted so Home's
   * invitation to personalize only shows once, not on every visit. */
  onboardingSkipped: boolean
}

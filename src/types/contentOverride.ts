import type { MeditationDifficulty, MeditationType } from './meditation'
import type { MeditationTag } from './tag'

/** A partial edit layered over a built-in meditation at read time. Only
 * fields an admin actually changed are present — everything else keeps
 * falling through to the shipped content. */
export interface MeditationOverride {
  title?: string
  description?: string
  categoryId?: string
  instructorId?: string
  durationSeconds?: number
  type?: MeditationType
  difficulty?: MeditationDifficulty
  tags?: MeditationTag[]
  isPremium?: boolean
  isFeatured?: boolean
}

export interface NewMeditationInput {
  title: string
  description: string
  categoryId: string
  instructorId?: string
  durationSeconds: number
  type: MeditationType
  difficulty: MeditationDifficulty
  tags: MeditationTag[]
  isPremium: boolean
  isFeatured: boolean
}

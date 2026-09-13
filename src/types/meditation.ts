import type { MeditationTag } from './tag'

export const MEDITATION_TYPES = [
  'guided',
  'unguided',
  'body-scan',
  'visualization',
] as const
export type MeditationType = (typeof MEDITATION_TYPES)[number]

export const MEDITATION_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
] as const
export type MeditationDifficulty = (typeof MEDITATION_DIFFICULTIES)[number]

export interface Meditation {
  id: string
  title: string
  description: string
  categoryId: string
  instructorId?: string
  durationSeconds: number
  type: MeditationType
  difficulty: MeditationDifficulty
  /** Absent for mock/placeholder content until real audio is hosted. */
  audioUrl?: string
  thumbnailUrl?: string
  tags: MeditationTag[]
  isPremium: boolean
  isFeatured: boolean
}

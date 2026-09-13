/** A single recorded meditation session. Mirrors the future Supabase
 * `sessions` table (see master spec §18) minus `userId`, which has
 * nowhere to come from until auth exists. */
export interface MeditationSession {
  id: string
  meditationId: string
  startedAt: string
  /** Set only when the session met the completion threshold. */
  completedAt?: string
  /** The meditation's planned duration at the time of the session. */
  durationSeconds: number
  /** Actual seconds practiced, clamped to durationSeconds. */
  elapsedSeconds: number
  completed: boolean
}

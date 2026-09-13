import type { MeditationSession } from '../../types'
import { readJSON, writeJSON } from '../storage/localStorage'

const SESSIONS_STORAGE_KEY = 'meditation-app.sessions'

/** Fraction of the planned duration a session must reach to count as
 * completed — ending a session a few seconds early (closing the tab,
 * tapping End right at the finish) shouldn't discard an otherwise
 * finished practice. */
export const COMPLETION_THRESHOLD_RATIO = 0.9

export interface RecordSessionInput {
  meditationId: string
  startedAt: Date
  /** The meditation's planned duration. */
  durationSeconds: number
  /** Actual seconds practiced. */
  elapsedSeconds: number
}

export function getSessions(): MeditationSession[] {
  return readJSON<MeditationSession[]>(SESSIONS_STORAGE_KEY, [])
}

export function clearSessions(): void {
  writeJSON(SESSIONS_STORAGE_KEY, [])
}

/** Records a finished/ended meditation session to local storage. Works
 * on any MeditationSession[] store today; swapping in a Supabase-backed
 * `sessions` table later only requires changing this one module. */
export function recordSession(input: RecordSessionInput): MeditationSession {
  const elapsedSeconds = Math.max(
    0,
    Math.min(input.elapsedSeconds, input.durationSeconds),
  )
  const completed =
    input.durationSeconds > 0 &&
    elapsedSeconds / input.durationSeconds >= COMPLETION_THRESHOLD_RATIO

  const session: MeditationSession = {
    id: crypto.randomUUID(),
    meditationId: input.meditationId,
    startedAt: input.startedAt.toISOString(),
    completedAt: completed ? new Date().toISOString() : undefined,
    durationSeconds: input.durationSeconds,
    elapsedSeconds,
    completed,
  }

  writeJSON(SESSIONS_STORAGE_KEY, [...getSessions(), session])
  return session
}

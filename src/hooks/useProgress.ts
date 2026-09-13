import { useState } from 'react'
import { getSessions } from '../services/progress/sessionStore'
import {
  calculateProgressStats,
  getWeeklyActivity,
  type DayActivity,
  type ProgressStats,
} from '../utils/progressCalculations'

export interface UseProgressResult {
  stats: ProgressStats
  weeklyActivity: DayActivity[]
}

/** Reads local session history once per mount and derives progress
 * stats/weekly activity from it. Pages that show progress are freshly
 * mounted on navigation, so a fresh read on mount is enough to reflect
 * a session recorded elsewhere (e.g. just finished in the player). */
export function useProgress(): UseProgressResult {
  const [result] = useState<UseProgressResult>(() => {
    const sessions = getSessions()
    const now = new Date()
    return {
      stats: calculateProgressStats(sessions, now),
      weeklyActivity: getWeeklyActivity(sessions, now),
    }
  })

  return result
}

import type { MeditationSession } from '../types'

export interface ProgressStats {
  totalSessions: number
  completedSessions: number
  totalMinutes: number
  currentStreakDays: number
  longestStreakDays: number
  weeklySessions: number
  monthlySessions: number
  completionPercentage: number
}

export interface DayActivity {
  date: Date
  completed: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Local (not UTC) calendar-day key, so streaks/weekly activity line up
 * with the day the user actually practiced on rather than shifting near
 * midnight for timezones behind/ahead of UTC. */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCompletedDateKeys(sessions: MeditationSession[]): Set<string> {
  const keys = new Set<string>()
  for (const session of sessions) {
    if (session.completed) {
      keys.add(toLocalDateKey(new Date(session.startedAt)))
    }
  }
  return keys
}

export function getCompletedSessions(
  sessions: MeditationSession[],
): MeditationSession[] {
  return sessions.filter((session) => session.completed)
}

export function getTotalMinutes(sessions: MeditationSession[]): number {
  const totalSeconds = sessions.reduce(
    (sum, session) => sum + session.elapsedSeconds,
    0,
  )
  return Math.round(totalSeconds / 60)
}

export function getCompletionPercentage(sessions: MeditationSession[]): number {
  if (sessions.length === 0) return 0
  return Math.round(
    (getCompletedSessions(sessions).length / sessions.length) * 100,
  )
}

function getSessionsSince(
  sessions: MeditationSession[],
  since: Date,
): MeditationSession[] {
  return sessions.filter((session) => new Date(session.startedAt) >= since)
}

export function getWeeklySessions(
  sessions: MeditationSession[],
  now: Date = new Date(),
): number {
  const weekAgo = new Date(now.getTime() - 7 * MS_PER_DAY)
  return getSessionsSince(sessions, weekAgo).length
}

export function getMonthlySessions(
  sessions: MeditationSession[],
  now: Date = new Date(),
): number {
  const monthAgo = new Date(now)
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  return getSessionsSince(sessions, monthAgo).length
}

/** Consecutive days (ending today or, if today has no completed session
 * yet, ending yesterday) with at least one completed session. A gap of
 * two or more days breaks the streak back to zero. */
export function getCurrentStreakDays(
  sessions: MeditationSession[],
  now: Date = new Date(),
): number {
  const completedDays = getCompletedDateKeys(sessions)
  if (completedDays.size === 0) return 0

  const cursor = new Date(now)
  if (!completedDays.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (completedDays.has(toLocalDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** The longest run of consecutive completed-session days ever recorded,
 * not just the currently active streak. */
export function getLongestStreakDays(sessions: MeditationSession[]): number {
  const completedDays = [...getCompletedDateKeys(sessions)].sort()
  if (completedDays.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < completedDays.length; i++) {
    const previous = new Date(completedDays[i - 1])
    const day = new Date(completedDays[i])
    const dayDiff = Math.round(
      (day.getTime() - previous.getTime()) / MS_PER_DAY,
    )

    current = dayDiff === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }

  return longest
}

/** The last 7 calendar days (oldest first, ending today) and whether
 * each had a completed session — feeds a simple weekly-activity view. */
export function getWeeklyActivity(
  sessions: MeditationSession[],
  now: Date = new Date(),
): DayActivity[] {
  const completedDays = getCompletedDateKeys(sessions)
  const days: DayActivity[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push({ date, completed: completedDays.has(toLocalDateKey(date)) })
  }

  return days
}

export function calculateProgressStats(
  sessions: MeditationSession[],
  now: Date = new Date(),
): ProgressStats {
  return {
    totalSessions: sessions.length,
    completedSessions: getCompletedSessions(sessions).length,
    totalMinutes: getTotalMinutes(sessions),
    currentStreakDays: getCurrentStreakDays(sessions, now),
    longestStreakDays: getLongestStreakDays(sessions),
    weeklySessions: getWeeklySessions(sessions, now),
    monthlySessions: getMonthlySessions(sessions, now),
    completionPercentage: getCompletionPercentage(sessions),
  }
}

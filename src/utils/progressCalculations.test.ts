import { describe, expect, it } from 'vitest'
import type { MeditationSession } from '../types'
import {
  calculateProgressStats,
  getCompletionPercentage,
  getCurrentStreakDays,
  getLongestStreakDays,
  getMonthlySessions,
  getTotalMinutes,
  getWeeklyActivity,
  getWeeklySessions,
} from './progressCalculations'

function makeSession(
  overrides: Partial<MeditationSession> = {},
): MeditationSession {
  return {
    id: 'session-fixture',
    meditationId: 'med-fixture',
    startedAt: new Date().toISOString(),
    durationSeconds: 600,
    elapsedSeconds: 600,
    completed: true,
    ...overrides,
  }
}

/** Builds an ISO timestamp for `daysAgo` days before `now`, at a fixed
 * time of day so it lands unambiguously within that local calendar day. */
function daysAgo(now: Date, days: number): string {
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days,
    9,
  )
  return date.toISOString()
}

describe('getTotalMinutes', () => {
  it('sums elapsed seconds across sessions and rounds to minutes', () => {
    const sessions = [
      makeSession({ elapsedSeconds: 90 }),
      makeSession({ elapsedSeconds: 30 }),
    ]
    expect(getTotalMinutes(sessions)).toBe(2)
  })

  it('returns 0 for no sessions', () => {
    expect(getTotalMinutes([])).toBe(0)
  })
})

describe('getCompletionPercentage', () => {
  it('returns 0 when there are no sessions', () => {
    expect(getCompletionPercentage([])).toBe(0)
  })

  it('computes the percentage of completed sessions', () => {
    const sessions = [
      makeSession({ completed: true }),
      makeSession({ completed: true }),
      makeSession({ completed: false }),
      makeSession({ completed: false }),
    ]
    expect(getCompletionPercentage(sessions)).toBe(50)
  })
})

describe('getWeeklySessions / getMonthlySessions', () => {
  const now = new Date(2024, 5, 15, 12) // June 15, 2024, noon local time

  it('counts sessions within the last 7 days', () => {
    const sessions = [
      makeSession({ startedAt: daysAgo(now, 0) }),
      makeSession({ startedAt: daysAgo(now, 6) }),
      makeSession({ startedAt: daysAgo(now, 10) }), // outside the window
    ]
    expect(getWeeklySessions(sessions, now)).toBe(2)
  })

  it('counts sessions within the last month', () => {
    const sessions = [
      makeSession({ startedAt: daysAgo(now, 5) }),
      makeSession({ startedAt: daysAgo(now, 45) }), // outside the window
    ]
    expect(getMonthlySessions(sessions, now)).toBe(1)
  })
})

describe('getCurrentStreakDays', () => {
  const now = new Date(2024, 5, 15, 12)

  it('returns 0 for no sessions', () => {
    expect(getCurrentStreakDays([], now)).toBe(0)
  })

  it('counts today alone as a streak of 1', () => {
    const sessions = [makeSession({ startedAt: daysAgo(now, 0) })]
    expect(getCurrentStreakDays(sessions, now)).toBe(1)
  })

  it('stays alive if yesterday was completed but today has not happened yet', () => {
    const sessions = [makeSession({ startedAt: daysAgo(now, 1) })]
    expect(getCurrentStreakDays(sessions, now)).toBe(1)
  })

  it('counts consecutive days ending today', () => {
    const sessions = [
      makeSession({ startedAt: daysAgo(now, 0) }),
      makeSession({ startedAt: daysAgo(now, 1) }),
      makeSession({ startedAt: daysAgo(now, 2) }),
    ]
    expect(getCurrentStreakDays(sessions, now)).toBe(3)
  })

  it('breaks the streak across a two-day gap', () => {
    const sessions = [makeSession({ startedAt: daysAgo(now, 2) })]
    expect(getCurrentStreakDays(sessions, now)).toBe(0)
  })

  it('ignores incomplete sessions', () => {
    const sessions = [
      makeSession({ startedAt: daysAgo(now, 0), completed: false }),
    ]
    expect(getCurrentStreakDays(sessions, now)).toBe(0)
  })
})

describe('getLongestStreakDays', () => {
  it('returns 0 for no sessions', () => {
    expect(getLongestStreakDays([])).toBe(0)
  })

  it('finds the longest of several separate runs', () => {
    const now = new Date(2024, 5, 15, 12)
    const sessions = [
      // A 3-day run.
      makeSession({ startedAt: daysAgo(now, 20) }),
      makeSession({ startedAt: daysAgo(now, 19) }),
      makeSession({ startedAt: daysAgo(now, 18) }),
      // A separate 2-day run.
      makeSession({ startedAt: daysAgo(now, 5) }),
      makeSession({ startedAt: daysAgo(now, 4) }),
    ]
    expect(getLongestStreakDays(sessions)).toBe(3)
  })

  it('treats multiple sessions on the same day as one streak day', () => {
    const now = new Date(2024, 5, 15, 12)
    const sessions = [
      makeSession({ startedAt: daysAgo(now, 0) }),
      makeSession({
        startedAt: new Date(now.getTime() + 60_000).toISOString(),
      }),
    ]
    expect(getLongestStreakDays(sessions)).toBe(1)
  })
})

describe('getWeeklyActivity', () => {
  it('returns 7 days, oldest first, ending today', () => {
    const now = new Date(2024, 5, 15, 12)
    const days = getWeeklyActivity([], now)

    expect(days).toHaveLength(7)
    expect(days[6].date.getDate()).toBe(15)
    expect(days[0].date.getDate()).toBe(9)
  })

  it('marks days with a completed session', () => {
    const now = new Date(2024, 5, 15, 12)
    const sessions = [makeSession({ startedAt: daysAgo(now, 1) })]
    const days = getWeeklyActivity(sessions, now)

    expect(days.filter((d) => d.completed)).toHaveLength(1)
    expect(days[5].completed).toBe(true) // yesterday
    expect(days[6].completed).toBe(false) // today
  })
})

describe('calculateProgressStats', () => {
  it('composes all the derived metrics together', () => {
    const now = new Date(2024, 5, 15, 12)
    const sessions = [
      makeSession({
        startedAt: daysAgo(now, 0),
        elapsedSeconds: 600,
        completed: true,
      }),
      makeSession({
        startedAt: daysAgo(now, 1),
        elapsedSeconds: 300,
        completed: false,
      }),
    ]
    const stats = calculateProgressStats(sessions, now)

    expect(stats).toEqual({
      totalSessions: 2,
      completedSessions: 1,
      totalMinutes: 15,
      currentStreakDays: 1,
      longestStreakDays: 1,
      weeklySessions: 2,
      monthlySessions: 2,
      completionPercentage: 50,
    })
  })
})

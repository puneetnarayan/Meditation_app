import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearSessions, getSessions, recordSession } from './sessionStore'

describe('sessionStore', () => {
  beforeEach(() => clearSessions())
  afterEach(() => clearSessions())

  it('starts with no sessions', () => {
    expect(getSessions()).toEqual([])
  })

  it('records a fully completed session', () => {
    const session = recordSession({
      meditationId: 'med-1',
      startedAt: new Date('2024-01-01T10:00:00Z'),
      durationSeconds: 600,
      elapsedSeconds: 600,
    })

    expect(session.meditationId).toBe('med-1')
    expect(session.durationSeconds).toBe(600)
    expect(session.elapsedSeconds).toBe(600)
    expect(session.completed).toBe(true)
    expect(session.completedAt).toBeDefined()
    expect(session.startedAt).toBe('2024-01-01T10:00:00.000Z')
  })

  it('marks a session incomplete below the completion threshold', () => {
    const session = recordSession({
      meditationId: 'med-1',
      startedAt: new Date(),
      durationSeconds: 600,
      elapsedSeconds: 500, // ~83%
    })

    expect(session.completed).toBe(false)
    expect(session.completedAt).toBeUndefined()
  })

  it('marks a session complete right at the threshold boundary', () => {
    const session = recordSession({
      meditationId: 'med-1',
      startedAt: new Date(),
      durationSeconds: 600,
      elapsedSeconds: 540, // exactly 90%
    })

    expect(session.completed).toBe(true)
  })

  it('clamps elapsed seconds to the planned duration', () => {
    const session = recordSession({
      meditationId: 'med-1',
      startedAt: new Date(),
      durationSeconds: 600,
      elapsedSeconds: 650,
    })

    expect(session.elapsedSeconds).toBe(600)
  })

  it('never marks a zero-duration session complete', () => {
    const session = recordSession({
      meditationId: 'med-1',
      startedAt: new Date(),
      durationSeconds: 0,
      elapsedSeconds: 0,
    })

    expect(session.completed).toBe(false)
  })

  it('persists sessions and appends rather than overwrites', () => {
    recordSession({
      meditationId: 'a',
      startedAt: new Date(),
      durationSeconds: 60,
      elapsedSeconds: 60,
    })
    recordSession({
      meditationId: 'b',
      startedAt: new Date(),
      durationSeconds: 60,
      elapsedSeconds: 60,
    })

    const sessions = getSessions()
    expect(sessions).toHaveLength(2)
    expect(sessions.map((s) => s.meditationId)).toEqual(['a', 'b'])
  })

  it('assigns each session a unique id', () => {
    const first = recordSession({
      meditationId: 'a',
      startedAt: new Date(),
      durationSeconds: 60,
      elapsedSeconds: 60,
    })
    const second = recordSession({
      meditationId: 'a',
      startedAt: new Date(),
      durationSeconds: 60,
      elapsedSeconds: 60,
    })

    expect(first.id).not.toBe(second.id)
  })

  it('clearSessions empties the store', () => {
    recordSession({
      meditationId: 'a',
      startedAt: new Date(),
      durationSeconds: 60,
      elapsedSeconds: 60,
    })
    clearSessions()

    expect(getSessions()).toEqual([])
  })
})

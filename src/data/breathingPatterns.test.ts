import { describe, expect, it } from 'vitest'
import { breathingPatterns } from './breathingPatterns'

describe('breathing pattern content integrity', () => {
  it('has unique pattern ids', () => {
    const ids = new Set(breathingPatterns.map((p) => p.id))
    expect(ids.size).toBe(breathingPatterns.length)
  })

  it('has at least one non-zero phase per pattern', () => {
    for (const pattern of breathingPatterns) {
      const total =
        pattern.inhaleSeconds +
        pattern.holdAfterInhaleSeconds +
        pattern.exhaleSeconds +
        pattern.holdAfterExhaleSeconds
      expect(total).toBeGreaterThan(0)
    }
  })

  it('has no negative phase durations', () => {
    for (const pattern of breathingPatterns) {
      expect(pattern.inhaleSeconds).toBeGreaterThanOrEqual(0)
      expect(pattern.holdAfterInhaleSeconds).toBeGreaterThanOrEqual(0)
      expect(pattern.exhaleSeconds).toBeGreaterThanOrEqual(0)
      expect(pattern.holdAfterExhaleSeconds).toBeGreaterThanOrEqual(0)
    }
  })
})

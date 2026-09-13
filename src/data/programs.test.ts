import { describe, expect, it } from 'vitest'
import { meditations } from './meditations'
import { programItems } from './programItems'
import { programs } from './programs'

describe('program content integrity', () => {
  it('has unique program ids', () => {
    const ids = new Set(programs.map((p) => p.id))
    expect(ids.size).toBe(programs.length)
  })

  it('has a positive day count for every program', () => {
    for (const program of programs) {
      expect(program.totalDays).toBeGreaterThan(0)
    }
  })

  it('has unique program item ids', () => {
    const ids = new Set(programItems.map((item) => item.id))
    expect(ids.size).toBe(programItems.length)
  })

  it('gives every program exactly one item per day, 1..totalDays', () => {
    for (const program of programs) {
      const items = programItems.filter((i) => i.programId === program.id)
      const dayNumbers = items.map((i) => i.dayNumber).sort((a, b) => a - b)
      expect(dayNumbers).toEqual(
        Array.from({ length: program.totalDays }, (_, i) => i + 1),
      )
    }
  })

  it('references only existing meditations', () => {
    const meditationIds = new Set(meditations.map((m) => m.id))
    for (const item of programItems) {
      expect(meditationIds.has(item.meditationId)).toBe(true)
    }
  })

  it('references only existing programs', () => {
    const programIds = new Set(programs.map((p) => p.id))
    for (const item of programItems) {
      expect(programIds.has(item.programId)).toBe(true)
    }
  })

  it('has at least one featured program', () => {
    expect(programs.some((p) => p.isFeatured)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import type { Program, ProgramItem } from '../types'
import {
  getCurrentDay,
  getProgramById,
  getProgramItems,
} from './programQueries'

const fixturePrograms: Program[] = [
  {
    id: 'program-a',
    title: 'Program A',
    description: 'desc',
    totalDays: 3,
    isFeatured: false,
  },
]

const fixtureItems: ProgramItem[] = [
  {
    id: 'a-day-2',
    programId: 'program-a',
    dayNumber: 2,
    meditationId: 'med-2',
  },
  {
    id: 'a-day-1',
    programId: 'program-a',
    dayNumber: 1,
    meditationId: 'med-1',
  },
  {
    id: 'a-day-3',
    programId: 'program-a',
    dayNumber: 3,
    meditationId: 'med-3',
  },
  {
    id: 'b-day-1',
    programId: 'program-b',
    dayNumber: 1,
    meditationId: 'med-4',
  },
]

describe('getProgramById', () => {
  it('finds a program by id', () => {
    expect(getProgramById(fixturePrograms, 'program-a')?.title).toBe(
      'Program A',
    )
  })

  it('returns undefined for an unknown id', () => {
    expect(getProgramById(fixturePrograms, 'nope')).toBeUndefined()
  })
})

describe('getProgramItems', () => {
  it("returns only the given program's items, sorted by day number", () => {
    const items = getProgramItems(fixtureItems, 'program-a')
    expect(items.map((i) => i.dayNumber)).toEqual([1, 2, 3])
  })

  it('returns an empty array for a program with no items', () => {
    expect(getProgramItems(fixtureItems, 'program-c')).toEqual([])
  })
})

describe('getCurrentDay', () => {
  it('returns day 1 when nothing is completed', () => {
    expect(getCurrentDay([], 7)).toBe(1)
  })

  it('returns the first gap in completed days', () => {
    expect(getCurrentDay([1, 2, 4], 7)).toBe(3)
  })

  it('returns the next day after a completed prefix', () => {
    expect(getCurrentDay([1, 2, 3], 7)).toBe(4)
  })

  it('returns the last day once everything is completed', () => {
    expect(getCurrentDay([1, 2, 3], 3)).toBe(3)
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getCompletedDays,
  isDayCompleted,
  markDayCompleted,
} from './programProgressStore'

function clear() {
  window.localStorage.clear()
}

describe('programProgressStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('starts with no completed days', () => {
    expect(getCompletedDays('program-a')).toEqual([])
    expect(isDayCompleted('program-a', 1)).toBe(false)
  })

  it('marks a day completed', () => {
    const result = markDayCompleted('program-a', 1)
    expect(result).toEqual([1])
    expect(isDayCompleted('program-a', 1)).toBe(true)
  })

  it('accumulates multiple completed days in sorted order regardless of completion order', () => {
    markDayCompleted('program-a', 3)
    markDayCompleted('program-a', 1)
    const result = markDayCompleted('program-a', 2)
    expect(result).toEqual([1, 2, 3])
  })

  it('marking the same day twice does not duplicate it', () => {
    markDayCompleted('program-a', 1)
    const result = markDayCompleted('program-a', 1)
    expect(result).toEqual([1])
  })

  it('keeps progress for different programs independent', () => {
    markDayCompleted('program-a', 1)
    markDayCompleted('program-b', 5)

    expect(getCompletedDays('program-a')).toEqual([1])
    expect(getCompletedDays('program-b')).toEqual([5])
  })

  it('persists across reads', () => {
    markDayCompleted('program-a', 2)
    expect(getCompletedDays('program-a')).toEqual([2])
  })
})

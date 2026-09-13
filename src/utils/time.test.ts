import { describe, expect, it } from 'vitest'
import { formatSecondsAsClock } from './time'

describe('formatSecondsAsClock', () => {
  it('formats sub-minute durations', () => {
    expect(formatSecondsAsClock(0)).toBe('0:00')
    expect(formatSecondsAsClock(5)).toBe('0:05')
  })

  it('formats minutes and seconds', () => {
    expect(formatSecondsAsClock(65)).toBe('1:05')
    expect(formatSecondsAsClock(600)).toBe('10:00')
  })

  it('formats hours when the duration is long enough', () => {
    expect(formatSecondsAsClock(3661)).toBe('1:01:01')
  })

  it('rounds fractional seconds', () => {
    expect(formatSecondsAsClock(59.6)).toBe('1:00')
  })

  it('clamps negative or non-finite input to zero', () => {
    expect(formatSecondsAsClock(-10)).toBe('0:00')
    expect(formatSecondsAsClock(NaN)).toBe('0:00')
    expect(formatSecondsAsClock(Infinity)).toBe('0:00')
  })
})

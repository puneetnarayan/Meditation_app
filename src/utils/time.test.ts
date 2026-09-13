import { describe, expect, it } from 'vitest'
import { formatMinutesAsDuration, formatSecondsAsClock } from './time'

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

describe('formatMinutesAsDuration', () => {
  it('formats sub-hour durations in minutes', () => {
    expect(formatMinutesAsDuration(0)).toBe('0 min')
    expect(formatMinutesAsDuration(45)).toBe('45 min')
  })

  it('formats whole hours without a minutes part', () => {
    expect(formatMinutesAsDuration(60)).toBe('1h')
    expect(formatMinutesAsDuration(120)).toBe('2h')
  })

  it('formats hours and minutes together', () => {
    expect(formatMinutesAsDuration(125)).toBe('2h 5m')
  })

  it('clamps negative or non-finite input to zero', () => {
    expect(formatMinutesAsDuration(-10)).toBe('0 min')
    expect(formatMinutesAsDuration(NaN)).toBe('0 min')
    expect(formatMinutesAsDuration(Infinity)).toBe('0 min')
  })
})

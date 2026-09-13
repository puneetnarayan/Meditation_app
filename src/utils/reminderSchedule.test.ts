import { describe, expect, it } from 'vitest'
import type { Reminder } from '../types'
import { getDueReminders, toDateKey, toTimeKey } from './reminderSchedule'

function makeReminder(overrides: Partial<Reminder>): Reminder {
  return {
    id: 'reminder-fixture',
    kind: 'custom',
    label: 'Fixture reminder',
    time: '08:00',
    enabled: true,
    ...overrides,
  }
}

describe('toDateKey / toTimeKey', () => {
  it('formats a date as local YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5, 9, 30))).toBe('2026-01-05')
  })

  it('formats a time as local HH:MM, zero-padded', () => {
    expect(toTimeKey(new Date(2026, 0, 5, 8, 5))).toBe('08:05')
  })
})

describe('getDueReminders', () => {
  const now = new Date(2026, 0, 5, 8, 30)

  it('includes an enabled reminder whose time has passed and has not fired today', () => {
    const reminder = makeReminder({ time: '08:00' })
    expect(getDueReminders([reminder], now)).toEqual([reminder])
  })

  it('excludes a disabled reminder even if its time has passed', () => {
    const reminder = makeReminder({ time: '08:00', enabled: false })
    expect(getDueReminders([reminder], now)).toEqual([])
  })

  it('excludes a reminder whose time has not arrived yet', () => {
    const reminder = makeReminder({ time: '09:00' })
    expect(getDueReminders([reminder], now)).toEqual([])
  })

  it('excludes a reminder already fired today', () => {
    const reminder = makeReminder({ time: '08:00', lastFiredOn: '2026-01-05' })
    expect(getDueReminders([reminder], now)).toEqual([])
  })

  it('includes a reminder fired on a previous day again today', () => {
    const reminder = makeReminder({ time: '08:00', lastFiredOn: '2026-01-04' })
    expect(getDueReminders([reminder], now)).toEqual([reminder])
  })

  it('includes a reminder exactly at the current minute', () => {
    const reminder = makeReminder({ time: '08:30' })
    expect(getDueReminders([reminder], now)).toEqual([reminder])
  })
})

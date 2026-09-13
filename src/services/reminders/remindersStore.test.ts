import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addCustomReminder,
  getReminders,
  markReminderFired,
  removeReminder,
  upsertReminder,
} from './remindersStore'

function clear() {
  window.localStorage.clear()
}

describe('remindersStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('seeds a default morning and evening reminder, both disabled', () => {
    const reminders = getReminders()
    expect(reminders).toHaveLength(2)
    expect(reminders.every((reminder) => !reminder.enabled)).toBe(true)
    expect(reminders.map((reminder) => reminder.kind).sort()).toEqual([
      'evening',
      'morning',
    ])
  })

  it('upsertReminder updates an existing reminder in place', () => {
    const [morning] = getReminders()
    const updated = upsertReminder({
      ...morning,
      enabled: true,
      time: '07:30',
    })

    expect(updated).toHaveLength(2)
    const changed = updated.find((r) => r.id === morning.id)
    expect(changed).toEqual({ ...morning, enabled: true, time: '07:30' })
  })

  it('upsertReminder appends a reminder with an unknown id', () => {
    const updated = upsertReminder({
      id: 'reminder-new',
      kind: 'custom',
      label: 'Lunch break',
      time: '12:30',
      enabled: true,
    })
    expect(updated).toHaveLength(3)
  })

  it('addCustomReminder creates an enabled custom reminder', () => {
    const updated = addCustomReminder('Lunch break', '12:30')
    const custom = updated.find((r) => r.kind === 'custom')
    expect(custom).toMatchObject({
      kind: 'custom',
      label: 'Lunch break',
      time: '12:30',
      enabled: true,
    })
    expect(custom?.id).toBeTruthy()
  })

  it('removeReminder deletes a reminder by id', () => {
    const updated = addCustomReminder('Lunch break', '12:30')
    const custom = updated.find((r) => r.kind === 'custom')!
    const afterRemoval = removeReminder(custom.id)

    expect(afterRemoval.find((r) => r.id === custom.id)).toBeUndefined()
    expect(afterRemoval).toHaveLength(2)
  })

  it('markReminderFired stamps lastFiredOn without touching other reminders', () => {
    const [morning, evening] = getReminders()
    const updated = markReminderFired(morning.id, '2026-01-05')

    expect(updated.find((r) => r.id === morning.id)?.lastFiredOn).toBe(
      '2026-01-05',
    )
    expect(
      updated.find((r) => r.id === evening.id)?.lastFiredOn,
    ).toBeUndefined()
  })

  it('persists changes across reads', () => {
    addCustomReminder('Lunch break', '12:30')
    expect(getReminders()).toHaveLength(3)
  })
})

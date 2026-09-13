import type { Reminder } from '../../types'
import { readJSON, writeJSON } from '../storage/localStorage'

const REMINDERS_STORAGE_KEY = 'meditation-app.reminders'

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'reminder-morning',
    kind: 'morning',
    label: 'Morning meditation',
    time: '08:00',
    enabled: false,
  },
  {
    id: 'reminder-evening',
    kind: 'evening',
    label: 'Evening meditation',
    time: '20:00',
    enabled: false,
  },
]

export function getReminders(): Reminder[] {
  return readJSON<Reminder[]>(REMINDERS_STORAGE_KEY, DEFAULT_REMINDERS)
}

export function saveReminders(reminders: Reminder[]): Reminder[] {
  writeJSON(REMINDERS_STORAGE_KEY, reminders)
  return reminders
}

export function upsertReminder(reminder: Reminder): Reminder[] {
  const current = getReminders()
  const index = current.findIndex((r) => r.id === reminder.id)
  const updated =
    index === -1
      ? [...current, reminder]
      : current.map((r, i) => (i === index ? reminder : r))
  return saveReminders(updated)
}

export function removeReminder(id: string): Reminder[] {
  return saveReminders(getReminders().filter((r) => r.id !== id))
}

export function markReminderFired(id: string, firedOn: string): Reminder[] {
  return saveReminders(
    getReminders().map((r) =>
      r.id === id ? { ...r, lastFiredOn: firedOn } : r,
    ),
  )
}

export function addCustomReminder(label: string, time: string): Reminder[] {
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    kind: 'custom',
    label,
    time,
    enabled: true,
  }
  return upsertReminder(reminder)
}

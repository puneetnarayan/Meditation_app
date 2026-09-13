import type { Reminder } from '../types'

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toTimeKey(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/** Reminders that are enabled, whose scheduled time has passed for
 * "today" (local time), and that haven't already fired today. A
 * reminder stays due for the rest of the day once its time passes, so
 * opening the app later still surfaces it once — there's no push
 * server behind this app, so a reminder can only fire while the app is
 * actually loaded in a tab. */
export function getDueReminders(reminders: Reminder[], now: Date): Reminder[] {
  const today = toDateKey(now)
  const currentTime = toTimeKey(now)
  return reminders.filter(
    (reminder) =>
      reminder.enabled &&
      reminder.time <= currentTime &&
      reminder.lastFiredOn !== today,
  )
}

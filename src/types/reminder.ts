export type ReminderKind = 'morning' | 'evening' | 'custom'

export interface Reminder {
  id: string
  kind: ReminderKind
  label: string
  /** 24-hour "HH:MM", local time. */
  time: string
  enabled: boolean
  /** "YYYY-MM-DD" the reminder last fired, local time — prevents firing
   * more than once on the same day. */
  lastFiredOn?: string
}

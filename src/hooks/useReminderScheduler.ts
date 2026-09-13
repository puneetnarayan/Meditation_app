import { useEffect } from 'react'
import {
  getReminders,
  markReminderFired,
} from '../services/reminders/remindersStore'
import { getDueReminders, toDateKey } from '../utils/reminderSchedule'

const CHECK_INTERVAL_MS = 30_000

/** Mounted once for the app's lifetime (in AppLayout) to surface a
 * browser Notification for any enabled reminder that's due. This only
 * works while the app is loaded in a tab — there's no push server
 * behind this app, so it can't wake a fully closed browser the way a
 * real push notification would; opening the app after the scheduled
 * time still surfaces the reminder once, as a catch-up. */
export function useReminderScheduler(): void {
  useEffect(() => {
    function checkReminders() {
      if (typeof Notification === 'undefined') return
      if (Notification.permission !== 'granted') return

      const now = new Date()
      const today = toDateKey(now)
      const due = getDueReminders(getReminders(), now)

      for (const reminder of due) {
        new Notification(reminder.label, {
          body: 'Time for a moment of calm.',
          tag: reminder.id,
        })
        markReminderFired(reminder.id, today)
      }
    }

    checkReminders()
    const intervalId = window.setInterval(checkReminders, CHECK_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [])
}

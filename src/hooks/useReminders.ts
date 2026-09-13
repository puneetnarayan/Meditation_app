import { useState } from 'react'
import type { Reminder } from '../types'
import {
  addCustomReminder,
  getReminders,
  removeReminder as removeReminderFromStore,
  upsertReminder,
} from '../services/reminders/remindersStore'

export type NotificationPermissionState = 'unsupported' | NotificationPermission

export interface UseRemindersResult {
  reminders: Reminder[]
  permission: NotificationPermissionState
  requestPermission: () => Promise<void>
  toggleReminder: (id: string, enabled: boolean) => void
  setReminderTime: (id: string, time: string) => void
  addReminder: (label: string, time: string) => void
  removeReminder: (id: string) => void
}

function readPermission(): NotificationPermissionState {
  return typeof Notification === 'undefined'
    ? 'unsupported'
    : Notification.permission
}

export function useReminders(): UseRemindersResult {
  const [reminders, setReminders] = useState<Reminder[]>(() => getReminders())
  const [permission, setPermission] =
    useState<NotificationPermissionState>(readPermission)

  async function requestPermission() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  function updateReminder(id: string, patch: Partial<Reminder>) {
    const target = reminders.find((reminder) => reminder.id === id)
    if (!target) return
    setReminders(upsertReminder({ ...target, ...patch }))
  }

  function toggleReminder(id: string, enabled: boolean) {
    updateReminder(id, { enabled })
  }

  function setReminderTime(id: string, time: string) {
    updateReminder(id, { time })
  }

  function addReminder(label: string, time: string) {
    setReminders(addCustomReminder(label, time))
  }

  function removeReminder(id: string) {
    setReminders(removeReminderFromStore(id))
  }

  return {
    reminders,
    permission,
    requestPermission,
    toggleReminder,
    setReminderTime,
    addReminder,
    removeReminder,
  }
}

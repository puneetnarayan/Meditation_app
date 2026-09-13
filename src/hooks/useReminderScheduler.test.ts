import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getReminders,
  upsertReminder,
} from '../services/reminders/remindersStore'
import { useReminderScheduler } from './useReminderScheduler'

class MockNotification {
  static permission: NotificationPermission = 'granted'
  static instances: MockNotification[] = []
  title: string
  options?: NotificationOptions

  constructor(title: string, options?: NotificationOptions) {
    this.title = title
    this.options = options
    MockNotification.instances.push(this)
  }
}

describe('useReminderScheduler', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 8, 30))
    MockNotification.instances = []
    MockNotification.permission = 'granted'
    vi.stubGlobal('Notification', MockNotification)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('fires a notification immediately for a due, enabled reminder', () => {
    const [morning] = getReminders()
    upsertReminder({ ...morning, enabled: true, time: '08:00' })

    renderHook(() => useReminderScheduler())

    expect(MockNotification.instances).toHaveLength(1)
    expect(MockNotification.instances[0].title).toBe('Morning meditation')
  })

  it('marks the reminder as fired so it does not repeat later the same day', () => {
    const [morning] = getReminders()
    upsertReminder({ ...morning, enabled: true, time: '08:00' })

    renderHook(() => useReminderScheduler())
    expect(MockNotification.instances).toHaveLength(1)

    vi.advanceTimersByTime(60_000)
    expect(MockNotification.instances).toHaveLength(1)
  })

  it('does not fire when permission is not granted', () => {
    MockNotification.permission = 'default'
    const [morning] = getReminders()
    upsertReminder({ ...morning, enabled: true, time: '08:00' })

    renderHook(() => useReminderScheduler())

    expect(MockNotification.instances).toHaveLength(0)
  })

  it('does not fire a reminder whose time has not arrived yet', () => {
    const [morning] = getReminders()
    upsertReminder({ ...morning, enabled: true, time: '09:00' })

    renderHook(() => useReminderScheduler())

    expect(MockNotification.instances).toHaveLength(0)
  })

  it('stops checking after unmount', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const { unmount } = renderHook(() => useReminderScheduler())

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})

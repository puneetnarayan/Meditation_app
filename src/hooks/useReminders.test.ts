import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReminders } from './useReminders'

class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn((): Promise<NotificationPermission> =>
    Promise.resolve(MockNotification.permission),
  )
}

describe('useReminders', () => {
  beforeEach(() => {
    window.localStorage.clear()
    MockNotification.permission = 'default'
    vi.stubGlobal('Notification', MockNotification)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('starts with the two seeded reminders and current permission state', () => {
    const { result } = renderHook(() => useReminders())
    expect(result.current.reminders).toHaveLength(2)
    expect(result.current.permission).toBe('default')
  })

  it('requestPermission asks the browser and stores the resulting state', async () => {
    MockNotification.permission = 'granted'
    MockNotification.requestPermission = vi.fn(() =>
      Promise.resolve('granted' as NotificationPermission),
    )
    const { result } = renderHook(() => useReminders())

    await act(async () => {
      await result.current.requestPermission()
    })

    expect(result.current.permission).toBe('granted')
  })

  it('toggleReminder flips a reminder on', () => {
    const { result } = renderHook(() => useReminders())
    const [morning] = result.current.reminders

    act(() => result.current.toggleReminder(morning.id, true))

    expect(
      result.current.reminders.find((r) => r.id === morning.id)?.enabled,
    ).toBe(true)
  })

  it('setReminderTime updates the time for a reminder', () => {
    const { result } = renderHook(() => useReminders())
    const [morning] = result.current.reminders

    act(() => result.current.setReminderTime(morning.id, '07:15'))

    expect(
      result.current.reminders.find((r) => r.id === morning.id)?.time,
    ).toBe('07:15')
  })

  it('addReminder appends a new enabled custom reminder', () => {
    const { result } = renderHook(() => useReminders())

    act(() => result.current.addReminder('Lunch break', '12:30'))

    expect(result.current.reminders).toHaveLength(3)
    const added = result.current.reminders.find((r) => r.kind === 'custom')
    expect(added).toMatchObject({
      label: 'Lunch break',
      time: '12:30',
      enabled: true,
    })
  })

  it('removeReminder deletes a reminder by id', () => {
    const { result } = renderHook(() => useReminders())
    act(() => result.current.addReminder('Lunch break', '12:30'))
    const added = result.current.reminders.find((r) => r.kind === 'custom')!

    act(() => result.current.removeReminder(added.id))

    expect(
      result.current.reminders.find((r) => r.id === added.id),
    ).toBeUndefined()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getReminders } from '../../services/reminders/remindersStore'
import { RemindersSection } from './RemindersSection'

class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn((): Promise<NotificationPermission> =>
    Promise.resolve(MockNotification.permission),
  )
}

function stubNotification(permission: NotificationPermission) {
  MockNotification.permission = permission
  vi.stubGlobal('Notification', MockNotification)
}

describe('RemindersSection', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('shows an unsupported notice when the browser has no Notification API', () => {
    vi.stubGlobal('Notification', undefined)
    render(<RemindersSection />)

    expect(
      screen.getByText(/doesn't support notifications/),
    ).toBeInTheDocument()
  })

  it('prompts to enable notifications when permission has not been decided', async () => {
    stubNotification('default')
    const user = userEvent.setup()
    render(<RemindersSection />)

    const enableButton = screen.getByRole('button', {
      name: 'Enable notifications',
    })
    expect(enableButton).toBeInTheDocument()

    MockNotification.permission = 'granted'
    await user.click(enableButton)

    expect(
      await screen.findByLabelText('Morning meditation'),
    ).toBeInTheDocument()
  })

  it('shows a blocked notice when permission was denied', () => {
    stubNotification('denied')
    render(<RemindersSection />)

    expect(screen.getByText(/blocked for this site/)).toBeInTheDocument()
  })

  it('lets the user enable a built-in reminder and change its time', async () => {
    stubNotification('granted')
    const user = userEvent.setup()
    render(<RemindersSection />)

    const morningSwitch = screen.getByLabelText('Morning meditation')
    await user.click(morningSwitch)
    expect(morningSwitch).toBeChecked()

    const timeInput = screen.getByLabelText('Morning meditation time')
    await user.clear(timeInput)
    await user.type(timeInput, '07:15')

    const [morning] = getReminders()
    expect(morning.enabled).toBe(true)
    expect(morning.time).toBe('07:15')
  })

  it('adds and removes a custom reminder', async () => {
    stubNotification('granted')
    const user = userEvent.setup()
    render(<RemindersSection />)

    await user.type(screen.getByLabelText('Custom reminder'), 'Lunch break')
    await user.click(screen.getByRole('button', { name: 'Add reminder' }))

    expect(await screen.findByLabelText('Lunch break')).toBeInTheDocument()
    expect(getReminders().some((r) => r.label === 'Lunch break')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(screen.queryByLabelText('Lunch break')).not.toBeInTheDocument()
    expect(getReminders().some((r) => r.label === 'Lunch break')).toBe(false)
  })
})

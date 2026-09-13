import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getPreferences } from '../services/preferences/preferencesStore'
import { SettingsPage } from './SettingsPage'

function clear() {
  window.localStorage.clear()
  delete document.documentElement.dataset.motion
}

describe('SettingsPage', () => {
  beforeEach(clear)
  afterEach(clear)

  it('renders current preferences', () => {
    render(<SettingsPage />)

    expect(screen.getByLabelText(/Volume/)).toHaveValue('0.8')
    expect(screen.getByLabelText('Reduce motion')).not.toBeChecked()
    expect(screen.getByLabelText('Preferred duration')).toHaveValue('')
  })

  it('updates and persists the reduced-motion preference', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByLabelText('Reduce motion'))

    expect(getPreferences().reducedMotion).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })

  it('updates and persists the preferred duration', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.selectOptions(screen.getByLabelText('Preferred duration'), '600')

    expect(getPreferences().preferredDurationSeconds).toBe(600)
  })

  it('updates and persists audio volume', () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText(/Volume/), {
      target: { value: '0.3' },
    })

    expect(getPreferences().audioVolume).toBe(0.3)
  })
})

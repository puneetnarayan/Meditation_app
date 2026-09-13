import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { getPreferences } from '../services/preferences/preferencesStore'
import { SettingsPage } from './SettingsPage'

function clear() {
  window.localStorage.clear()
  delete document.documentElement.dataset.motion
}

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  )
}

describe('SettingsPage', () => {
  beforeEach(clear)
  afterEach(clear)

  it('renders current preferences', () => {
    renderSettings()

    expect(screen.getByLabelText(/Volume/)).toHaveValue('0.8')
    expect(screen.getByLabelText('Reduce motion')).not.toBeChecked()
    expect(screen.getByLabelText('Preferred duration')).toHaveValue('')
  })

  it('updates and persists the reduced-motion preference', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByLabelText('Reduce motion'))

    expect(getPreferences().reducedMotion).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })

  it('updates and persists the preferred duration', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.selectOptions(screen.getByLabelText('Preferred duration'), '600')

    expect(getPreferences().preferredDurationSeconds).toBe(600)
  })

  it('updates and persists audio volume', () => {
    renderSettings()

    fireEvent.change(screen.getByLabelText(/Volume/), {
      target: { value: '0.3' },
    })

    expect(getPreferences().audioVolume).toBe(0.3)
  })

  it('links to onboarding, inviting personalization when it has not been done', () => {
    renderSettings()

    expect(
      screen.getByRole('link', { name: 'Personalize your experience' }),
    ).toHaveAttribute('href', '/onboarding')
  })

  it('links to the content management admin tool', () => {
    renderSettings()

    expect(
      screen.getByRole('link', { name: 'Content management' }),
    ).toHaveAttribute('href', '/admin')
  })

  it('links to the downloads management page', () => {
    renderSettings()

    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveAttribute(
      'href',
      '/downloads',
    )
  })
})

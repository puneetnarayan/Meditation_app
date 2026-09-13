import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getPreferences } from '../services/preferences/preferencesStore'
import { OnboardingPage } from './OnboardingPage'

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('saves the answered questions and marks onboarding completed on submit', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.selectOptions(
      screen.getByLabelText('What brings you here?'),
      'Reduce stress',
    )
    await user.selectOptions(
      screen.getByLabelText('How experienced are you with meditation?'),
      'Beginner',
    )
    await user.selectOptions(
      screen.getByLabelText('When do you usually practice?'),
      'Morning',
    )
    await user.selectOptions(
      screen.getByLabelText('Typical session length?'),
      '10 min',
    )
    await user.click(screen.getByLabelText('Stress relief'))
    await user.click(screen.getByLabelText('Breath work'))

    await user.click(screen.getByRole('button', { name: 'Get started' }))

    const preferences = getPreferences()
    expect(preferences.onboardingCompleted).toBe(true)
    expect(preferences.onboardingSkipped).toBe(false)
    expect(preferences.primaryGoal).toBe('stress')
    expect(preferences.experienceLevel).toBe('beginner')
    expect(preferences.preferredTimeOfDay).toBe('morning')
    expect(preferences.preferredDurationSeconds).toBe(600)
    expect(preferences.contentPreferences).toEqual([
      'stress-relief',
      'breath-work',
    ])
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('can be submitted with every question left unanswered', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.click(screen.getByRole('button', { name: 'Get started' }))

    const preferences = getPreferences()
    expect(preferences.onboardingCompleted).toBe(true)
    expect(preferences.primaryGoal).toBeUndefined()
    expect(preferences.contentPreferences).toEqual([])
  })

  it('marks onboarding skipped without saving answers when dismissed', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.selectOptions(
      screen.getByLabelText('What brings you here?'),
      'Reduce stress',
    )
    await user.click(screen.getByRole('button', { name: 'Not now' }))

    const preferences = getPreferences()
    expect(preferences.onboardingSkipped).toBe(true)
    expect(preferences.onboardingCompleted).toBe(false)
    expect(preferences.primaryGoal).toBeUndefined()
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('toggling a content-preference checkbox twice leaves it unselected', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    const checkbox = screen.getByLabelText('Gratitude')
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { meditations } from '../data/meditations'
import { recordPlayed } from '../services/recentlyPlayed/recentlyPlayedStore'
import { updatePreferences } from '../services/preferences/preferencesStore'
import { HomePage } from './HomePage'

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('renders the welcome heading', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: 'Welcome back', level: 1 }),
    ).toBeInTheDocument()
  })

  it('shows the onboarding invitation for a fresh user', () => {
    renderHome()
    expect(
      screen.getByRole('link', { name: /Personalize/ }),
    ).toBeInTheDocument()
  })

  it('hides the onboarding invitation once completed', () => {
    updatePreferences({ onboardingCompleted: true })
    renderHome()
    expect(
      screen.queryByRole('link', { name: /Personalize/ }),
    ).not.toBeInTheDocument()
  })

  it('hides the onboarding invitation once skipped', () => {
    updatePreferences({ onboardingSkipped: true })
    renderHome()
    expect(
      screen.queryByRole('link', { name: /Personalize/ }),
    ).not.toBeInTheDocument()
  })

  it('always shows a recommended meditation', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: 'Recommended for you' }),
    ).toBeInTheDocument()
  })

  it('has no "continue listening" section when nothing was recently played', () => {
    renderHome()
    expect(
      screen.queryByRole('heading', { name: 'Continue listening' }),
    ).not.toBeInTheDocument()
  })

  it('shows recently played meditations under "continue listening"', () => {
    const meditation = meditations[0]
    recordPlayed(meditation.id)

    renderHome()

    expect(
      screen.getByRole('heading', { name: 'Continue listening' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(meditation.title).length).toBeGreaterThan(0)
  })

  it('shows category browsing links', () => {
    renderHome()
    expect(
      screen.getByRole('navigation', { name: 'Meditation categories' }),
    ).toBeInTheDocument()
  })
})

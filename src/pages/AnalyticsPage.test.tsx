import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { trackEvent } from '../services/analytics/analyticsStore'
import { AnalyticsPage } from './AnalyticsPage'

describe('AnalyticsPage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('shows an empty state when nothing has been recorded', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('No activity recorded yet')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Clear analytics data' }),
    ).toBeDisabled()
  })

  it('shows counts per event type', () => {
    trackEvent('meditation_started', { meditationId: 'med-1' })
    trackEvent('meditation_started', { meditationId: 'med-2' })
    trackEvent('meditation_completed', { meditationId: 'med-1' })

    render(<AnalyticsPage />)

    expect(screen.getByText('Meditations started')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Meditations completed')).toBeInTheDocument()
    expect(
      screen.getByText('50% meditation completion rate'),
    ).toBeInTheDocument()
  })

  it('clears recorded events and returns to the empty state', async () => {
    trackEvent('favorite_added', { meditationId: 'med-1' })
    const user = userEvent.setup()
    render(<AnalyticsPage />)

    await user.click(
      screen.getByRole('button', { name: 'Clear analytics data' }),
    )

    expect(screen.getByText('No activity recorded yet')).toBeInTheDocument()
  })
})

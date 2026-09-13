import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Meditation } from '../../types'
import { getSessions } from '../../services/progress/sessionStore'
import { getRecentlyPlayed } from '../../services/recentlyPlayed/recentlyPlayedStore'
import { MeditationPlayer } from './MeditationPlayer'

const fixture: Meditation = {
  id: 'med-test',
  title: 'Test Meditation',
  description: 'A short session used for testing.',
  categoryId: 'cat-test',
  durationSeconds: 10,
  type: 'guided',
  difficulty: 'beginner',
  tags: [],
  isPremium: false,
  isFeatured: false,
}

describe('MeditationPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('renders the meditation title, description and initial duration', () => {
    render(<MeditationPlayer meditation={fixture} />)

    expect(
      screen.getByRole('heading', { name: 'Test Meditation' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('A short session used for testing.'),
    ).toBeInTheDocument()
    expect(screen.getByText('0:10 remaining')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
  })

  it('plays, pauses, resumes, restarts, completes and ends the session', () => {
    const onExit = vi.fn()
    render(<MeditationPlayer meditation={fixture} onExit={onExit} />)

    // Play
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByText('0:06 remaining')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '4',
    )

    // Pause
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('0:06 remaining')).toBeInTheDocument()

    // Resume
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('0:04 remaining')).toBeInTheDocument()

    // Restart
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
    expect(screen.getByText('0:10 remaining')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    // Complete
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('Session complete')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByText('0:00 remaining')).toBeInTheDocument()

    // End
    fireEvent.click(screen.getByRole('button', { name: 'End' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(screen.getByText('0:10 remaining')).toBeInTheDocument()
  })

  it('has accessible, labeled controls throughout', () => {
    render(<MeditationPlayer meditation={fixture} />)

    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'End' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Session progress',
    )
  })

  it('records a completed session when the meditation finishes naturally', () => {
    render(<MeditationPlayer meditation={fixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    const sessions = getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({
      meditationId: 'med-test',
      durationSeconds: 10,
      elapsedSeconds: 10,
      completed: true,
    })
  })

  it('does not record a second session if End is pressed after completion', () => {
    render(<MeditationPlayer meditation={fixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'End' }))

    expect(getSessions()).toHaveLength(1)
  })

  it('records an incomplete session when ended early', () => {
    render(<MeditationPlayer meditation={fixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'End' }))

    const sessions = getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({
      elapsedSeconds: 3,
      completed: false,
    })
  })

  it('does not record a session if ended before ever starting', () => {
    render(<MeditationPlayer meditation={fixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'End' }))

    expect(getSessions()).toHaveLength(0)
  })

  it('records the meditation as recently played on first play', () => {
    render(<MeditationPlayer meditation={fixture} />)

    expect(getRecentlyPlayed()).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    const recentlyPlayed = getRecentlyPlayed()
    expect(recentlyPlayed).toHaveLength(1)
    expect(recentlyPlayed[0].meditationId).toBe('med-test')
  })

  it('does not duplicate the recently-played entry on pause/resume', () => {
    render(<MeditationPlayer meditation={fixture} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(getRecentlyPlayed()).toHaveLength(1)
  })
})

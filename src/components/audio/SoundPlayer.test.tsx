import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sounds } from '../../data/sounds'
import { SoundPlayer } from './SoundPlayer'

describe('SoundPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists every sound', () => {
    render(<SoundPlayer timerMinutes={0} />)
    for (const sound of sounds) {
      expect(screen.getByText(sound.name)).toBeInTheDocument()
    }
  })

  it('plays one sound at a time, pausing the previous one when another starts', () => {
    render(<SoundPlayer timerMinutes={0} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play Rain$/ }))
    expect(
      screen.getByRole('button', { name: /^Pause Rain$/ }),
    ).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /^Play Ocean$/ }))
    expect(
      screen.getByRole('button', { name: /^Pause Ocean$/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^Play Rain$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('pauses and resumes the same sound', () => {
    render(<SoundPlayer timerMinutes={0} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play Rain$/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Pause Rain$/ }))
    expect(screen.getByRole('button', { name: /^Play Rain$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    fireEvent.click(screen.getByRole('button', { name: /^Play Rain$/ }))
    expect(
      screen.getByRole('button', { name: /^Pause Rain$/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows no sleep-timer status when no timer is set', () => {
    render(<SoundPlayer timerMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /^Play Rain$/ }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('never stops playback on its own with no sleep timer', () => {
    render(<SoundPlayer timerMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /^Play Rain$/ }))

    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000) // a full hour
    })

    expect(
      screen.getByRole('button', { name: /^Pause Rain$/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows a counting-down sleep timer and stops playback when it elapses', () => {
    render(<SoundPlayer timerMinutes={15} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play Rain$/ }))
    expect(screen.getByRole('status')).toHaveTextContent(
      '15:00 until sounds stop',
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      '14:55 until sounds stop',
    )

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(screen.getByRole('button', { name: /^Play Rain$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BellTimerPage } from './BellTimerPage'

class MockGainNode {
  gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  connect = vi.fn()
}

class MockOscillatorNode {
  type = ''
  frequency = { value: 0 }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  resume = vi.fn()
  createGain = vi.fn(() => new MockGainNode())
  createOscillator = vi.fn(() => new MockOscillatorNode())
}

describe('BellTimerPage', () => {
  let mockContext: MockAudioContext

  beforeEach(() => {
    vi.useFakeTimers()
    mockContext = new MockAudioContext()
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContextCtor() {
        return mockContext
      }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts idle, ready to start', () => {
    render(<BellTimerPage />)
    expect(screen.getByText('Ready to start')).toBeInTheDocument()
    expect(screen.getByText('Bell 0 / 10')).toBeInTheDocument()
  })

  it('starts, pauses, resumes and stops the session', () => {
    render(<BellTimerPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByText('Running')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByText('Paused')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(screen.getByText('Running')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(screen.getByText('Ready to start')).toBeInTheDocument()
    expect(screen.getByText('Bell 0 / 10')).toBeInTheDocument()
  })

  it('rings a bell (creates oscillators) once the delay elapses, and again each minute', () => {
    render(<BellTimerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(3)
    expect(screen.getByText('Bell 1 / 10')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(6)
    expect(screen.getByText('Bell 2 / 10')).toBeInTheDocument()
  })

  it('does not ring when the sound toggle is off', () => {
    render(<BellTimerPage />)
    fireEvent.click(screen.getByLabelText('Bell sound'))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(mockContext.createOscillator).not.toHaveBeenCalled()
    expect(screen.getByText('Bell 1 / 10')).toBeInTheDocument()
  })

  it('shows Completed once every bell has rung', () => {
    render(<BellTimerPage />)
    const decrease = screen.getByRole('button', { name: 'Fewer bells' })
    for (let i = 0; i < 9; i++) fireEvent.click(decrease) // 10 -> 1 bell
    expect(screen.getByText('Bell 0 / 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Bell 1 / 1')).toBeInTheDocument()
  })

  it('disables bell-count editing once running, and re-enables after stop', () => {
    render(<BellTimerPage />)
    const decrease = screen.getByRole('button', { name: 'Fewer bells' })
    expect(decrease).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(decrease).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(decrease).not.toBeDisabled()
  })

  it('increments and decrements the bell count within bounds', () => {
    render(<BellTimerPage />)
    const input = screen.getByLabelText('Number of bells')
    const decrease = screen.getByRole('button', { name: 'Fewer bells' })
    const increase = screen.getByRole('button', { name: 'More bells' })

    fireEvent.click(increase)
    expect(input).toHaveValue(11)

    fireEvent.click(decrease)
    fireEvent.click(decrease)
    expect(input).toHaveValue(9)
  })
})

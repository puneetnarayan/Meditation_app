import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MeditationTimer } from './MeditationTimer'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('MeditationTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    setVisibility('visible')
    vi.useRealTimers()
  })

  it('starts idle with the full duration remaining', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    expect(timer.getState()).toEqual({
      status: 'idle',
      durationSeconds: 600,
      elapsedSeconds: 0,
      remainingSeconds: 600,
    })
  })

  it('tracks elapsed/remaining time accurately while running', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()

    vi.advanceTimersByTime(5000)

    const state = timer.getState()
    expect(state.status).toBe('running')
    expect(state.elapsedSeconds).toBe(5)
    expect(state.remainingSeconds).toBe(595)
  })

  it('calls onTick as time advances', () => {
    const onTick = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 60, onTick })
    timer.start()

    vi.advanceTimersByTime(1000)

    expect(onTick).toHaveBeenCalled()
    const lastCall = onTick.mock.calls.at(-1)?.[0]
    expect(lastCall.elapsedSeconds).toBeCloseTo(1, 1)
  })

  it('pauses without accumulating further elapsed time', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()
    vi.advanceTimersByTime(10_000)
    timer.pause()

    const pausedState = timer.getState()
    expect(pausedState.status).toBe('paused')
    expect(pausedState.elapsedSeconds).toBe(10)

    vi.advanceTimersByTime(20_000)

    expect(timer.getState().elapsedSeconds).toBe(10)
  })

  it('resumes and continues accumulating from the paused point', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()
    vi.advanceTimersByTime(10_000)
    timer.pause()
    vi.advanceTimersByTime(5_000) // should not count
    timer.resume()
    vi.advanceTimersByTime(10_000)

    expect(timer.getState().elapsedSeconds).toBe(20)
    expect(timer.getState().status).toBe('running')
  })

  it('handles multiple pause/resume cycles correctly', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()

    vi.advanceTimersByTime(3000)
    timer.pause()
    vi.advanceTimersByTime(7000)
    timer.resume()

    vi.advanceTimersByTime(4000)
    timer.pause()
    vi.advanceTimersByTime(2000)
    timer.resume()

    vi.advanceTimersByTime(3000)

    // Only running segments should count: 3 + 4 + 3 = 10 seconds.
    expect(timer.getState().elapsedSeconds).toBe(10)
  })

  it('restart resets elapsed time to zero and keeps running', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()
    vi.advanceTimersByTime(50_000)
    timer.restart()

    const state = timer.getState()
    expect(state.status).toBe('running')
    expect(state.elapsedSeconds).toBe(0)

    vi.advanceTimersByTime(4000)
    expect(timer.getState().elapsedSeconds).toBe(4)
  })

  it('restart works even from a paused or completed state', () => {
    const timer = new MeditationTimer({ durationSeconds: 5 })
    timer.start()
    vi.advanceTimersByTime(5000)
    expect(timer.getState().status).toBe('completed')

    timer.restart()
    expect(timer.getState().status).toBe('running')
    expect(timer.getState().elapsedSeconds).toBe(0)
  })

  it('completes exactly once when the duration elapses', () => {
    const onComplete = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 10, onComplete })
    timer.start()

    vi.advanceTimersByTime(10_000)
    vi.advanceTimersByTime(10_000) // further time must not re-trigger

    expect(onComplete).toHaveBeenCalledTimes(1)
    const state = timer.getState()
    expect(state.status).toBe('completed')
    expect(state.elapsedSeconds).toBe(10)
    expect(state.remainingSeconds).toBe(0)
  })

  it('stops ticking once completed', () => {
    const onTick = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 2, onTick })
    timer.start()
    vi.advanceTimersByTime(2000)

    const callsAtCompletion = onTick.mock.calls.length
    vi.advanceTimersByTime(5000)

    expect(onTick.mock.calls.length).toBe(callsAtCompletion)
  })

  it('end() stops the timer and resets to idle', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()
    vi.advanceTimersByTime(30_000)
    timer.end()

    expect(timer.getState()).toEqual({
      status: 'idle',
      durationSeconds: 600,
      elapsedSeconds: 0,
      remainingSeconds: 600,
    })

    vi.advanceTimersByTime(10_000)
    expect(timer.getState().elapsedSeconds).toBe(0)
  })

  it('recomputes immediately on visibilitychange instead of waiting for the next tick', () => {
    const onTick = vi.fn()
    const timer = new MeditationTimer({
      durationSeconds: 600,
      onTick,
      tickIntervalMs: 250,
    })
    timer.start()
    onTick.mockClear()

    setVisibility('hidden')
    // Simulate the browser throttling/suspending the interval while
    // backgrounded: advance the system clock without firing any timers.
    vi.setSystemTime(Date.now() + 30_000)
    expect(onTick).not.toHaveBeenCalled()

    setVisibility('visible')

    expect(onTick).toHaveBeenCalledTimes(1)
    expect(onTick.mock.calls[0][0].elapsedSeconds).toBe(30)
  })

  it('completes on visibilitychange if the duration elapsed while hidden', () => {
    const onComplete = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 10, onComplete })
    timer.start()

    setVisibility('hidden')
    vi.setSystemTime(Date.now() + 15_000)
    setVisibility('visible')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(timer.getState().status).toBe('completed')
  })

  it('ignores visibilitychange while not running', () => {
    const onTick = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 600, onTick })
    onTick.mockClear()

    setVisibility('hidden')
    setVisibility('visible')

    expect(onTick).not.toHaveBeenCalled()
    expect(timer.getState().status).toBe('idle')
  })

  it('immediately completes when started with a zero duration', () => {
    const onComplete = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 0, onComplete })
    timer.start()

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(timer.getState().status).toBe('completed')
  })

  it('ignores pause when not running', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.pause()
    expect(timer.getState().status).toBe('idle')
  })

  it('ignores resume when not paused', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.resume()
    expect(timer.getState().status).toBe('idle')
  })

  it('ignores a second start() call while already running', () => {
    const timer = new MeditationTimer({ durationSeconds: 600 })
    timer.start()
    vi.advanceTimersByTime(5000)
    timer.start()

    // Elapsed time should be unaffected by the redundant start() call.
    expect(timer.getState().elapsedSeconds).toBe(5)
  })

  it('destroy() stops future ticks and visibility handling', () => {
    const onTick = vi.fn()
    const timer = new MeditationTimer({ durationSeconds: 600, onTick })
    timer.start()
    timer.destroy()
    onTick.mockClear()

    vi.advanceTimersByTime(5000)
    setVisibility('hidden')
    setVisibility('visible')

    expect(onTick).not.toHaveBeenCalled()
  })
})

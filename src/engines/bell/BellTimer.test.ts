import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BellTimer } from './BellTimer'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('BellTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    setVisibility('visible')
    vi.useRealTimers()
  })

  it('starts idle with no bells rung, showing the wait before the first bell', () => {
    const timer = new BellTimer({ totalBells: 10, firstBellDelaySeconds: 5 })
    expect(timer.getState()).toEqual({
      status: 'idle',
      totalBells: 10,
      rungBells: 0,
      remainingSeconds: 5,
    })
  })

  it('counts down to the first bell using the configured delay', () => {
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
    })
    timer.start()

    expect(timer.getState().remainingSeconds).toBe(5)
    vi.advanceTimersByTime(2000)
    expect(timer.getState().remainingSeconds).toBe(3)
  })

  it('rings the first bell after the delay and starts a new 60s segment', () => {
    const onBell = vi.fn()
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
      onBell,
    })
    timer.start()

    vi.advanceTimersByTime(5000)

    expect(onBell).toHaveBeenCalledTimes(1)
    expect(onBell.mock.calls[0][0].rungBells).toBe(1)
    const state = timer.getState()
    expect(state.status).toBe('running')
    expect(state.remainingSeconds).toBe(60)
  })

  it('rings every subsequent bell 60s apart', () => {
    const onBell = vi.fn()
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
      onBell,
    })
    timer.start()

    vi.advanceTimersByTime(5000) // bell 1
    vi.advanceTimersByTime(60_000) // bell 2
    vi.advanceTimersByTime(60_000) // bell 3 (last)

    expect(onBell).toHaveBeenCalledTimes(3)
    expect(timer.getState().status).toBe('completed')
    expect(timer.getState().rungBells).toBe(3)
  })

  it('calls onComplete exactly once, alongside the final bell', () => {
    const onComplete = vi.fn()
    const onBell = vi.fn()
    const timer = new BellTimer({
      totalBells: 2,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
      onBell,
      onComplete,
    })
    timer.start()

    vi.advanceTimersByTime(5000)
    vi.advanceTimersByTime(60_000)
    vi.advanceTimersByTime(60_000) // further time must not re-trigger

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onBell).toHaveBeenCalledTimes(2)
  })

  it('pauses without the current segment continuing to count down', () => {
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
    })
    timer.start()
    vi.advanceTimersByTime(2000)
    timer.pause()

    expect(timer.getState().status).toBe('paused')
    expect(timer.getState().remainingSeconds).toBe(3)

    vi.advanceTimersByTime(10_000)
    expect(timer.getState().remainingSeconds).toBe(3)
  })

  it('resumes and continues the same segment from where it paused', () => {
    const onBell = vi.fn()
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
      onBell,
    })
    timer.start()
    vi.advanceTimersByTime(2000)
    timer.pause()
    vi.advanceTimersByTime(10_000) // must not count
    timer.resume()

    expect(timer.getState().status).toBe('running')
    expect(timer.getState().remainingSeconds).toBe(3)

    vi.advanceTimersByTime(3000)
    expect(onBell).toHaveBeenCalledTimes(1)
  })

  it('stop() resets to idle and clears bells rung', () => {
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
    })
    timer.start()
    vi.advanceTimersByTime(5000) // ring bell 1
    timer.stop()

    expect(timer.getState()).toEqual({
      status: 'idle',
      totalBells: 3,
      rungBells: 0,
      remainingSeconds: 5,
    })
  })

  it('a fresh start() after stop() begins from bell zero again', () => {
    const onBell = vi.fn()
    const timer = new BellTimer({
      totalBells: 2,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
      onBell,
    })
    timer.start()
    vi.advanceTimersByTime(5000)
    timer.stop()

    timer.start()
    expect(timer.getState().rungBells).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(onBell.mock.calls.at(-1)?.[0].rungBells).toBe(1)
  })

  it('ignores a second start() call while already running', () => {
    const timer = new BellTimer({ totalBells: 3 })
    timer.start()
    vi.advanceTimersByTime(2000)
    timer.start()

    expect(timer.getState().remainingSeconds).toBe(3)
  })

  it('ignores pause when not running, and resume when not paused', () => {
    const timer = new BellTimer({ totalBells: 3 })
    timer.pause()
    expect(timer.getState().status).toBe('idle')

    timer.resume()
    expect(timer.getState().status).toBe('idle')
  })

  it('recomputes immediately on visibilitychange, ringing bells missed while hidden', () => {
    const onBell = vi.fn()
    const timer = new BellTimer({
      totalBells: 3,
      firstBellDelaySeconds: 5,
      intervalSeconds: 60,
      onBell,
    })
    timer.start()

    setVisibility('hidden')
    vi.setSystemTime(Date.now() + 5000)
    expect(onBell).not.toHaveBeenCalled()

    setVisibility('visible')

    expect(onBell).toHaveBeenCalledTimes(1)
  })

  it('destroy() stops future ticks and visibility handling', () => {
    const onTick = vi.fn()
    const timer = new BellTimer({ totalBells: 3, onTick })
    timer.start()
    timer.destroy()
    onTick.mockClear()

    vi.advanceTimersByTime(5000)
    setVisibility('hidden')
    setVisibility('visible')

    expect(onTick).not.toHaveBeenCalled()
  })
})

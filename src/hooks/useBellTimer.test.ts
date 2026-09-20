import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBellTimer } from './useBellTimer'

describe('useBellTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts idle, waiting on the first bell', () => {
    const { result } = renderHook(() => useBellTimer(3))
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.rungBells).toBe(0)
  })

  it('start/pause/resume/stop drive the engine and mirror its state', () => {
    const { result } = renderHook(() => useBellTimer(3))

    act(() => result.current.start())
    expect(result.current.state.status).toBe('running')

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    act(() => result.current.pause())
    expect(result.current.state.status).toBe('paused')

    act(() => result.current.resume())
    expect(result.current.state.status).toBe('running')

    act(() => result.current.stop())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.rungBells).toBe(0)
  })

  it('calls onBell each time a bell rings and onComplete once at the end', () => {
    const onBell = vi.fn()
    const onComplete = vi.fn()
    const { result } = renderHook(() => useBellTimer(2, { onBell, onComplete }))

    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(5000) // default first-bell delay
    })
    expect(onBell).toHaveBeenCalledTimes(1)
    expect(result.current.state.rungBells).toBe(1)

    act(() => {
      vi.advanceTimersByTime(60_000) // default interval
    })
    expect(onBell).toHaveBeenCalledTimes(2)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.state.status).toBe('completed')
  })

  it('picks up a changed bell count and actually runs with it, not the original count', () => {
    const onBell = vi.fn()
    const onComplete = vi.fn()
    const { result, rerender } = renderHook(
      ({ totalBells }) => useBellTimer(totalBells, { onBell, onComplete }),
      { initialProps: { totalBells: 10 } },
    )

    rerender({ totalBells: 2 })
    expect(result.current.state.totalBells).toBe(2)

    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(5000) // bell 1
    })
    act(() => {
      vi.advanceTimersByTime(60_000) // bell 2 — should complete at 2, not 10
    })

    expect(onBell).toHaveBeenCalledTimes(2)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.state.status).toBe('completed')
  })

  it('does not reset an in-progress run when the same count is passed again', () => {
    const { result, rerender } = renderHook(
      ({ totalBells }) => useBellTimer(totalBells),
      { initialProps: { totalBells: 3 } },
    )

    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    rerender({ totalBells: 3 }) // unchanged — must not disturb the running timer

    expect(result.current.state.status).toBe('running')
    expect(result.current.state.remainingSeconds).toBe(3)
  })

  it('destroys the engine on unmount', () => {
    const onBell = vi.fn()
    const { result, unmount } = renderHook(() => useBellTimer(2, { onBell }))

    act(() => result.current.start())
    unmount()

    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(onBell).not.toHaveBeenCalled()
  })
})

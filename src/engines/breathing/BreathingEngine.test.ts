import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BreathingPattern } from '../../types'
import { BreathingEngine } from './BreathingEngine'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

// inhale 2s -> hold 1s -> exhale 3s -> (no hold) = 6s/cycle, 2 cycles = 12s.
const testPattern: BreathingPattern = {
  id: 'test-pattern',
  name: 'Test Pattern',
  inhaleSeconds: 2,
  holdAfterInhaleSeconds: 1,
  exhaleSeconds: 3,
  holdAfterExhaleSeconds: 0,
  cycles: 2,
}

// inhale 4s -> exhale 6s, no holds at all — both zero-duration phases
// should be skipped entirely.
const relaxationPattern: BreathingPattern = {
  id: 'relaxation',
  name: 'Relaxation',
  inhaleSeconds: 4,
  holdAfterInhaleSeconds: 0,
  exhaleSeconds: 6,
  holdAfterExhaleSeconds: 0,
  cycles: 1,
}

const infinitePattern: BreathingPattern = {
  id: 'infinite',
  name: 'Infinite',
  inhaleSeconds: 4,
  holdAfterInhaleSeconds: 4,
  exhaleSeconds: 4,
  holdAfterExhaleSeconds: 4,
}

describe('BreathingEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    setVisibility('visible')
    vi.useRealTimers()
  })

  it('starts idle at the first phase', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    expect(engine.getState()).toEqual({
      status: 'idle',
      phase: 'inhale',
      phaseDurationSeconds: 2,
      phaseElapsedSeconds: 0,
      phaseRemainingSeconds: 2,
      currentCycle: 0,
      totalCycles: 2,
    })
  })

  it('tracks phase elapsed/remaining time while running', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()

    vi.advanceTimersByTime(1000)

    const state = engine.getState()
    expect(state.status).toBe('running')
    expect(state.phase).toBe('inhale')
    expect(state.phaseElapsedSeconds).toBe(1)
    expect(state.phaseRemainingSeconds).toBe(1)
    expect(state.currentCycle).toBe(1)
  })

  it('transitions through phases in order within a cycle', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()

    vi.advanceTimersByTime(2000) // end of inhale (2s)
    expect(engine.getState().phase).toBe('holdAfterInhale')
    expect(engine.getState().phaseElapsedSeconds).toBe(0)

    vi.advanceTimersByTime(1000) // end of hold (1s)
    expect(engine.getState().phase).toBe('exhale')
    expect(engine.getState().phaseElapsedSeconds).toBe(0)

    vi.advanceTimersByTime(1500)
    expect(engine.getState().phase).toBe('exhale')
    expect(engine.getState().phaseElapsedSeconds).toBe(1.5)
  })

  it('advances to the next cycle after a full cycle elapses', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()

    vi.advanceTimersByTime(6000) // exactly one full cycle (2+1+3)

    const state = engine.getState()
    expect(state.currentCycle).toBe(2)
    expect(state.phase).toBe('inhale')
    expect(state.phaseElapsedSeconds).toBe(0)
  })

  it('skips zero-duration hold phases entirely', () => {
    const onPhaseChange = vi.fn()
    const engine = new BreathingEngine({
      pattern: relaxationPattern,
      onPhaseChange,
    })
    engine.start()

    expect(engine.getState().phase).toBe('inhale')

    vi.advanceTimersByTime(4000) // end of inhale, no hold in between
    expect(engine.getState().phase).toBe('exhale')
    expect(engine.getState().phaseElapsedSeconds).toBe(0)

    // Only two phase changes should ever fire: initial inhale, then exhale.
    expect(onPhaseChange).toHaveBeenCalledTimes(2)
    expect(onPhaseChange.mock.calls[0][0].phase).toBe('inhale')
    expect(onPhaseChange.mock.calls[1][0].phase).toBe('exhale')
  })

  it('calls onPhaseChange only on transitions, not on every tick', () => {
    const onPhaseChange = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onPhaseChange })
    engine.start()

    vi.advanceTimersByTime(1750) // several ticks, still within inhale

    expect(onPhaseChange).toHaveBeenCalledTimes(1) // only the initial phase
  })

  it('calls onTick as time advances', () => {
    const onTick = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onTick })
    engine.start()

    vi.advanceTimersByTime(1000)

    expect(onTick).toHaveBeenCalled()
    const lastCall = onTick.mock.calls.at(-1)?.[0]
    expect(lastCall.phaseElapsedSeconds).toBeCloseTo(1, 1)
  })

  it('pauses without accumulating further elapsed time', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()
    vi.advanceTimersByTime(1000)
    engine.pause()

    const pausedState = engine.getState()
    expect(pausedState.status).toBe('paused')
    expect(pausedState.phaseElapsedSeconds).toBe(1)

    vi.advanceTimersByTime(5000)

    expect(engine.getState().phaseElapsedSeconds).toBe(1)
  })

  it('resumes and continues accumulating from the paused point', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()
    vi.advanceTimersByTime(1000)
    engine.pause()
    vi.advanceTimersByTime(3000) // should not count
    engine.resume()
    vi.advanceTimersByTime(1500)

    const state = engine.getState()
    expect(state.status).toBe('running')
    expect(state.phase).toBe('holdAfterInhale')
    expect(state.phaseElapsedSeconds).toBe(0.5)
  })

  it('handles multiple pause/resume cycles correctly', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()

    vi.advanceTimersByTime(1000)
    engine.pause()
    vi.advanceTimersByTime(2000)
    engine.resume()

    vi.advanceTimersByTime(1000)
    engine.pause()
    vi.advanceTimersByTime(500)
    engine.resume()

    vi.advanceTimersByTime(1500)

    // Only running segments count: 1 + 1 + 1.5 = 3.5s elapsed total,
    // which lands 0.5s into the exhale phase (inhale 2s + hold 1s).
    expect(engine.getState().phase).toBe('exhale')
    expect(engine.getState().phaseElapsedSeconds).toBeCloseTo(0.5, 5)
  })

  it('restart resets to the first phase of cycle one and keeps running', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()
    vi.advanceTimersByTime(5000)
    engine.restart()

    const state = engine.getState()
    expect(state.status).toBe('running')
    expect(state.phase).toBe('inhale')
    expect(state.currentCycle).toBe(1)
    expect(state.phaseElapsedSeconds).toBe(0)
  })

  it('restart works even from a paused or completed state', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()
    vi.advanceTimersByTime(12_000)
    expect(engine.getState().status).toBe('completed')

    engine.restart()
    expect(engine.getState().status).toBe('running')
    expect(engine.getState().phase).toBe('inhale')
  })

  it('completes exactly once when all cycles elapse', () => {
    const onComplete = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onComplete })
    engine.start()

    vi.advanceTimersByTime(12_000)
    vi.advanceTimersByTime(12_000) // further time must not re-trigger

    expect(onComplete).toHaveBeenCalledTimes(1)
    const state = engine.getState()
    expect(state.status).toBe('completed')
    expect(state.currentCycle).toBe(2)
    expect(state.phase).toBe('exhale')
    expect(state.phaseRemainingSeconds).toBe(0)
  })

  it('stops ticking once completed', () => {
    const onTick = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onTick })
    engine.start()
    vi.advanceTimersByTime(12_000)

    const callsAtCompletion = onTick.mock.calls.length
    vi.advanceTimersByTime(5000)

    expect(onTick.mock.calls.length).toBe(callsAtCompletion)
  })

  it('never completes on its own when the pattern has no cycle count', () => {
    const onComplete = vi.fn()
    const engine = new BreathingEngine({
      pattern: infinitePattern,
      onComplete,
    })
    engine.start()

    // Three full cycles' worth of time (16s each).
    vi.advanceTimersByTime(48_000)

    expect(onComplete).not.toHaveBeenCalled()
    const state = engine.getState()
    expect(state.status).toBe('running')
    expect(state.currentCycle).toBe(4)
  })

  it('end() stops the session and resets to idle', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()
    vi.advanceTimersByTime(3000)
    engine.end()

    expect(engine.getState()).toEqual({
      status: 'idle',
      phase: 'inhale',
      phaseDurationSeconds: 2,
      phaseElapsedSeconds: 0,
      phaseRemainingSeconds: 2,
      currentCycle: 0,
      totalCycles: 2,
    })

    vi.advanceTimersByTime(5000)
    expect(engine.getState().phase).toBe('inhale')
  })

  it('recomputes immediately on visibilitychange instead of waiting for the next tick', () => {
    const onTick = vi.fn()
    const engine = new BreathingEngine({
      pattern: testPattern,
      onTick,
      tickIntervalMs: 250,
    })
    engine.start()
    onTick.mockClear()

    setVisibility('hidden')
    // Simulate the browser throttling/suspending the interval while
    // backgrounded: advance the system clock without firing any timers.
    vi.setSystemTime(Date.now() + 2000)
    expect(onTick).not.toHaveBeenCalled()

    setVisibility('visible')

    expect(onTick).toHaveBeenCalledTimes(1)
    expect(onTick.mock.calls[0][0].phase).toBe('holdAfterInhale')
  })

  it('completes on visibilitychange if all cycles elapsed while hidden', () => {
    const onComplete = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onComplete })
    engine.start()

    setVisibility('hidden')
    vi.setSystemTime(Date.now() + 20_000)
    setVisibility('visible')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(engine.getState().status).toBe('completed')
  })

  it('ignores visibilitychange while not running', () => {
    const onTick = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onTick })
    onTick.mockClear()

    setVisibility('hidden')
    setVisibility('visible')

    expect(onTick).not.toHaveBeenCalled()
    expect(engine.getState().status).toBe('idle')
  })

  it('immediately completes when started with zero cycles', () => {
    const onComplete = vi.fn()
    const engine = new BreathingEngine({
      pattern: { ...testPattern, cycles: 0 },
      onComplete,
    })
    engine.start()

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(engine.getState().status).toBe('completed')
  })

  it('ignores pause when not running', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.pause()
    expect(engine.getState().status).toBe('idle')
  })

  it('ignores resume when not paused', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.resume()
    expect(engine.getState().status).toBe('idle')
  })

  it('ignores a second start() call while already running', () => {
    const engine = new BreathingEngine({ pattern: testPattern })
    engine.start()
    vi.advanceTimersByTime(1000)
    engine.start()

    expect(engine.getState().phaseElapsedSeconds).toBe(1)
  })

  it('destroy() stops future ticks and visibility handling', () => {
    const onTick = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onTick })
    engine.start()
    engine.destroy()
    onTick.mockClear()

    vi.advanceTimersByTime(1000)
    setVisibility('hidden')
    setVisibility('visible')

    expect(onTick).not.toHaveBeenCalled()
  })

  it('setCallbacks() updates callbacks without recreating the engine', () => {
    const first = vi.fn()
    const second = vi.fn()
    const engine = new BreathingEngine({ pattern: testPattern, onTick: first })
    engine.start()
    vi.advanceTimersByTime(250)
    expect(first).toHaveBeenCalled()

    engine.setCallbacks({ onTick: second })
    first.mockClear()
    vi.advanceTimersByTime(250)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
  })
})

import { useEffect, useRef, useState } from 'react'
import {
  BellTimer,
  DEFAULT_FIRST_BELL_DELAY_SECONDS,
  type BellTimerState,
} from '../engines/bell/BellTimer'

export interface UseBellTimerCallbacks {
  onBell?: () => void
  onComplete?: () => void
}

export interface UseBellTimerResult {
  state: BellTimerState
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
}

/** Thin React binding over BellTimer: owns one engine instance and
 * mirrors its state into React state. No timer/bell-scheduling logic
 * lives here — it all stays in the engine. */
export function useBellTimer(
  totalBells: number,
  callbacks: UseBellTimerCallbacks = {},
): UseBellTimerResult {
  const [state, setState] = useState<BellTimerState>(() => ({
    status: 'idle',
    totalBells,
    rungBells: 0,
    remainingSeconds: DEFAULT_FIRST_BELL_DELAY_SECONDS,
  }))

  const [timer, setTimer] = useState(
    () => new BellTimer({ totalBells, onTick: setState, onBell: setState }),
  )

  // BellTimer's totalBells is fixed at construction, so a change to
  // the requested count (the caller is expected to only allow editing
  // this while idle) means replacing the engine outright — "start
  // over with the new count" — rather than trying to resize one
  // already ticking.
  const totalBellsRef = useRef(totalBells)
  useEffect(() => {
    if (totalBellsRef.current === totalBells) return
    totalBellsRef.current = totalBells
    timer.destroy()
    const nextTimer = new BellTimer({
      totalBells,
      onTick: setState,
      onBell: setState,
    })
    setTimer(nextTimer)
    setState(nextTimer.getState())
  }, [totalBells, timer])

  // Keep the bell/completion callbacks pointed at the latest render's
  // closures without recreating the engine.
  useEffect(() => {
    timer.setCallbacks({
      onBell: (nextState) => {
        setState(nextState)
        callbacks.onBell?.()
      },
      onComplete: () => callbacks.onComplete?.(),
    })
  })

  useEffect(() => () => timer.destroy(), [timer])

  return {
    state,
    start: () => timer.start(),
    pause: () => timer.pause(),
    resume: () => timer.resume(),
    stop: () => timer.stop(),
  }
}

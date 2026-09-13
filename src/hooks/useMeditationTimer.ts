import { useEffect, useState } from 'react'
import {
  MeditationTimer,
  type MeditationTimerState,
} from '../engines/meditation/MeditationTimer'

export interface UseMeditationTimerCallbacks {
  onComplete?: () => void
}

export interface UseMeditationTimerResult {
  state: MeditationTimerState
  start: () => void
  pause: () => void
  resume: () => void
  restart: () => void
  end: () => void
}

/** Thin React binding over MeditationTimer: owns one engine instance for
 * the lifetime of the component and mirrors its state into React state.
 * No timer/elapsed-time logic lives here — it all stays in the engine. */
export function useMeditationTimer(
  durationSeconds: number,
  callbacks: UseMeditationTimerCallbacks = {},
): UseMeditationTimerResult {
  const [state, setState] = useState<MeditationTimerState>(() => ({
    status: 'idle',
    durationSeconds,
    elapsedSeconds: 0,
    remainingSeconds: durationSeconds,
  }))

  const [timer] = useState(
    () => new MeditationTimer({ durationSeconds, onTick: setState }),
  )

  // Keep the completion callback pointed at the latest render's closure
  // without recreating the engine.
  useEffect(() => {
    timer.setCallbacks({ onComplete: () => callbacks.onComplete?.() })
  })

  useEffect(() => () => timer.destroy(), [timer])

  return {
    state,
    start: () => timer.start(),
    pause: () => timer.pause(),
    resume: () => timer.resume(),
    restart: () => timer.restart(),
    end: () => timer.end(),
  }
}

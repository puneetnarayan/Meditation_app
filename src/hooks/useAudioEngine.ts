import { useEffect, useState } from 'react'
import {
  AudioEngine,
  type AudioElementLike,
  type AudioEngineState,
} from '../engines/audio/AudioEngine'

export interface UseAudioEngineOptions {
  onComplete?: () => void
  initialVolume?: number
  /** For continuous ambient sound rather than a guided session. */
  loop?: boolean
  /** Injectable element factory, primarily for tests. */
  createElement?: () => AudioElementLike
}

export interface UseAudioEngineResult {
  state: AudioEngineState
  load: (src: string) => void
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
}

/** Thin React binding over AudioEngine: owns one engine instance for the
 * lifetime of the component and mirrors its state into React state. No
 * playback logic lives here — it all stays in the engine. */
export function useAudioEngine(
  options: UseAudioEngineOptions = {},
): UseAudioEngineResult {
  const [state, setState] = useState<AudioEngineState>(() => ({
    status: 'idle',
    currentTime: 0,
    duration: 0,
    volume: options.initialVolume ?? 1,
    errorMessage: null,
  }))

  const [engine] = useState(
    () =>
      new AudioEngine({
        initialVolume: options.initialVolume,
        loop: options.loop,
        createElement: options.createElement,
        onStateChange: setState,
      }),
  )

  // Keep the completion callback pointed at the latest render's closure
  // without recreating the engine.
  useEffect(() => {
    engine.setCallbacks({ onComplete: () => options.onComplete?.() })
  })

  useEffect(() => () => engine.destroy(), [engine])

  return {
    state,
    load: (src) => engine.load(src),
    play: () => engine.play(),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    stop: () => engine.stop(),
    seek: (seconds) => engine.seek(seconds),
    setVolume: (volume) => engine.setVolume(volume),
  }
}

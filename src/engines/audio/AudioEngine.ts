export type AudioEngineStatus =
  'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'completed' | 'error'

export interface AudioEngineState {
  status: AudioEngineStatus
  currentTime: number
  duration: number
  volume: number
  errorMessage: string | null
}

/** The subset of HTMLMediaElement the engine depends on. Keeping this as
 * a narrow interface (rather than coupling directly to HTMLAudioElement)
 * lets tests supply a fake implementation, since jsdom cannot actually
 * decode or play audio. */
export interface AudioElementLike {
  src: string
  currentTime: number
  duration: number
  volume: number
  loop: boolean
  play: () => Promise<void>
  pause: () => void
  load: () => void
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
}

export interface AudioEngineOptions {
  onStateChange?: (state: AudioEngineState) => void
  onComplete?: (state: AudioEngineState) => void
  /** Injectable element factory, primarily for tests. Defaults to
   * `() => new Audio()`. */
  createElement?: () => AudioElementLike
  initialVolume?: number
  /** For continuous ambient sound (e.g. rain, ocean) rather than a
   * guided session — a looping element never fires `ended`, so
   * `onComplete`/the `completed` status are simply never reached. */
  loop?: boolean
}

const GENERIC_ERROR_MESSAGE = 'This audio could not be played.'

/**
 * A centralized audio controller wrapping a single media element, with a
 * clear state machine: idle -> loading -> ready -> playing ⇄ paused ->
 * completed, with an error state reachable from any point. Meant to be
 * the single owner of its underlying element — create one instance per
 * independent audio source (e.g. one for guided meditation narration,
 * another for background ambience) rather than having components reach
 * into `<audio>` elements directly.
 */
export class AudioEngine {
  private readonly createElementFn: () => AudioElementLike
  private onStateChange?: (state: AudioEngineState) => void
  private onComplete?: (state: AudioEngineState) => void

  /** Created lazily on first `load()` — a meditation with no audio
   * should never have to pay for (or produce) a real media element. */
  private element: AudioElementLike | null = null

  private status: AudioEngineStatus = 'idle'
  private currentTime = 0
  private duration = 0
  private volume: number
  private readonly loop: boolean
  private errorMessage: string | null = null
  private currentSrc: string | null = null

  constructor(options: AudioEngineOptions = {}) {
    this.onStateChange = options.onStateChange
    this.onComplete = options.onComplete
    this.volume = clamp(options.initialVolume ?? 1, 0, 1)
    this.loop = options.loop ?? false
    this.createElementFn = options.createElement ?? (() => new Audio())
  }

  private ensureElement(): AudioElementLike {
    if (this.element) return this.element

    const element = this.createElementFn()
    element.volume = this.volume
    element.loop = this.loop
    element.addEventListener('loadedmetadata', this.handleLoadedMetadata)
    element.addEventListener('canplay', this.handleCanPlay)
    element.addEventListener('timeupdate', this.handleTimeUpdate)
    element.addEventListener('ended', this.handleEnded)
    element.addEventListener('error', this.handleError)
    this.element = element
    return element
  }

  /** Updates the state-change/completion callbacks in place, e.g. so a
   * React binding can keep them pointing at the latest render's closures
   * without recreating the engine. Omitted keys are left unchanged. */
  setCallbacks(callbacks: {
    onStateChange?: (state: AudioEngineState) => void
    onComplete?: (state: AudioEngineState) => void
  }): void {
    if ('onStateChange' in callbacks) {
      this.onStateChange = callbacks.onStateChange
    }
    if ('onComplete' in callbacks) this.onComplete = callbacks.onComplete
  }

  getState(): AudioEngineState {
    return {
      status: this.status,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      errorMessage: this.errorMessage,
    }
  }

  /** Begins loading a new source. Calling this with the source that is
   * already loaded/loading is a no-op. */
  load(src: string): void {
    if (this.currentSrc === src && this.status !== 'error') return

    const element = this.ensureElement()
    this.currentSrc = src
    this.currentTime = 0
    this.duration = 0
    this.errorMessage = null
    this.status = 'loading'
    element.src = src
    element.load()
    this.emit()
  }

  play(): void {
    if (this.status === 'idle' || this.status === 'loading' || !this.element) {
      return
    }

    if (this.status === 'completed') {
      this.element.currentTime = 0
      this.currentTime = 0
    }

    this.element
      .play()
      .then(() => {
        this.status = 'playing'
        this.errorMessage = null
        this.emit()
      })
      .catch(() => {
        this.status = 'error'
        this.errorMessage = GENERIC_ERROR_MESSAGE
        this.emit()
      })
  }

  /** Alias for `play()` — resuming and starting playback are the same
   * operation on the underlying element. */
  resume(): void {
    this.play()
  }

  pause(): void {
    if (this.status !== 'playing' || !this.element) return
    this.element.pause()
    this.status = 'paused'
    this.emit()
  }

  stop(): void {
    if (this.status === 'idle' || this.status === 'loading' || !this.element) {
      return
    }
    this.element.pause()
    this.element.currentTime = 0
    this.currentTime = 0
    this.status = 'ready'
    this.emit()
  }

  seek(seconds: number): void {
    if (
      this.status === 'idle' ||
      this.status === 'loading' ||
      this.status === 'error' ||
      !this.element
    ) {
      return
    }
    const clamped = clamp(seconds, 0, this.duration)
    this.element.currentTime = clamped
    this.currentTime = clamped
    if (this.status === 'completed' && clamped < this.duration) {
      this.status = 'ready'
    }
    this.emit()
  }

  setVolume(volume: number): void {
    this.volume = clamp(volume, 0, 1)
    if (this.element) {
      this.element.volume = this.volume
    }
    this.emit()
  }

  destroy(): void {
    if (!this.element) return
    this.element.pause()
    this.element.removeEventListener(
      'loadedmetadata',
      this.handleLoadedMetadata,
    )
    this.element.removeEventListener('canplay', this.handleCanPlay)
    this.element.removeEventListener('timeupdate', this.handleTimeUpdate)
    this.element.removeEventListener('ended', this.handleEnded)
    this.element.removeEventListener('error', this.handleError)
  }

  private readonly handleLoadedMetadata = (): void => {
    if (this.element && Number.isFinite(this.element.duration)) {
      this.duration = this.element.duration
    }
    if (this.status === 'loading') {
      this.status = 'ready'
    }
    this.emit()
  }

  private readonly handleCanPlay = (): void => {
    if (this.status === 'loading') {
      this.status = 'ready'
      this.emit()
    }
  }

  private readonly handleTimeUpdate = (): void => {
    if (this.element) {
      this.currentTime = this.element.currentTime
    }
    this.emit()
  }

  private readonly handleEnded = (): void => {
    this.currentTime = this.duration
    this.status = 'completed'
    const state = this.getState()
    this.onStateChange?.(state)
    this.onComplete?.(state)
  }

  private readonly handleError = (): void => {
    this.status = 'error'
    this.errorMessage = GENERIC_ERROR_MESSAGE
    this.emit()
  }

  private emit(): void {
    this.onStateChange?.(this.getState())
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

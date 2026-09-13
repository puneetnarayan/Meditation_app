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
  private readonly element: AudioElementLike
  private readonly onStateChange?: (state: AudioEngineState) => void
  private readonly onComplete?: (state: AudioEngineState) => void

  private status: AudioEngineStatus = 'idle'
  private currentTime = 0
  private duration = 0
  private volume: number
  private errorMessage: string | null = null
  private currentSrc: string | null = null

  constructor(options: AudioEngineOptions = {}) {
    this.onStateChange = options.onStateChange
    this.onComplete = options.onComplete
    this.volume = clamp(options.initialVolume ?? 1, 0, 1)

    this.element = (options.createElement ?? (() => new Audio()))()
    this.element.volume = this.volume

    this.element.addEventListener('loadedmetadata', this.handleLoadedMetadata)
    this.element.addEventListener('canplay', this.handleCanPlay)
    this.element.addEventListener('timeupdate', this.handleTimeUpdate)
    this.element.addEventListener('ended', this.handleEnded)
    this.element.addEventListener('error', this.handleError)
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

    this.currentSrc = src
    this.currentTime = 0
    this.duration = 0
    this.errorMessage = null
    this.status = 'loading'
    this.element.src = src
    this.element.load()
    this.emit()
  }

  play(): void {
    if (this.status === 'idle' || this.status === 'loading') return

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
    if (this.status !== 'playing') return
    this.element.pause()
    this.status = 'paused'
    this.emit()
  }

  stop(): void {
    if (this.status === 'idle' || this.status === 'loading') return
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
      this.status === 'error'
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
    this.element.volume = this.volume
    this.emit()
  }

  destroy(): void {
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
    if (Number.isFinite(this.element.duration)) {
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
    this.currentTime = this.element.currentTime
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

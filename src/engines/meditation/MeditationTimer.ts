export type MeditationTimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface MeditationTimerState {
  status: MeditationTimerStatus
  durationSeconds: number
  elapsedSeconds: number
  remainingSeconds: number
}

export interface MeditationTimerOptions {
  durationSeconds: number
  onTick?: (state: MeditationTimerState) => void
  onComplete?: (state: MeditationTimerState) => void
  /** How often to recompute/emit while running. The elapsed/remaining
   * values themselves are always derived from timestamps, so this only
   * controls UI update frequency, not accuracy. */
  tickIntervalMs?: number
  /** Injectable clock, primarily for deterministic tests. */
  now?: () => number
}

const DEFAULT_TICK_INTERVAL_MS = 250

/**
 * A meditation countdown timer with a small state machine
 * (idle → running ⇄ paused → completed). Elapsed/remaining time is always
 * derived from wall-clock timestamps rather than accumulated tick counts,
 * so it cannot drift even if `setInterval` is throttled in a background
 * tab — a `visibilitychange` listener forces an immediate recompute (and
 * completion check) the moment the tab becomes visible again.
 *
 * This engine has no dependency on React or the DOM beyond
 * `document.visibilityState`/events, so it can be used from any UI layer.
 */
export class MeditationTimer {
  private durationSeconds: number
  private readonly onTick?: (state: MeditationTimerState) => void
  private readonly onComplete?: (state: MeditationTimerState) => void
  private readonly tickIntervalMs: number
  private readonly now: () => number

  private status: MeditationTimerStatus = 'idle'
  /** Elapsed milliseconds accumulated from run segments before the
   * current one (0 while idle/never started). */
  private accumulatedMs = 0
  /** Timestamp the current running segment began, or null when not
   * currently running. */
  private runStartTimestamp: number | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private visibilityListenerAttached = false

  constructor(options: MeditationTimerOptions) {
    this.durationSeconds = Math.max(0, options.durationSeconds)
    this.onTick = options.onTick
    this.onComplete = options.onComplete
    this.tickIntervalMs = options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS
    this.now = options.now ?? Date.now
  }

  getState(): MeditationTimerState {
    const elapsedSeconds = Math.min(
      this.durationSeconds,
      this.getElapsedMs() / 1000,
    )
    return {
      status: this.status,
      durationSeconds: this.durationSeconds,
      elapsedSeconds,
      remainingSeconds: Math.max(0, this.durationSeconds - elapsedSeconds),
    }
  }

  /** Begins a fresh run from zero. If already running, this is a no-op —
   * use `restart` to explicitly reset a run in progress. */
  start(): void {
    if (this.status === 'running') return
    this.beginRun()
  }

  pause(): void {
    if (this.status !== 'running') return
    this.accumulatedMs = this.getElapsedMs()
    this.runStartTimestamp = null
    this.status = 'paused'
    this.stopTicking()
    this.emit()
  }

  resume(): void {
    if (this.status !== 'paused') return
    this.runStartTimestamp = this.now()
    this.status = 'running'
    this.beginTicking()
    this.emit()
  }

  /** Resets elapsed time to zero and starts running again, regardless of
   * the current status. */
  restart(): void {
    this.beginRun()
  }

  /** Stops the timer without marking it complete (e.g. the user left the
   * session early) and resets it back to idle. */
  end(): void {
    this.stopTicking()
    this.detachVisibilityListener()
    this.accumulatedMs = 0
    this.runStartTimestamp = null
    this.status = 'idle'
    this.emit()
  }

  /** Releases the interval and event listener. Call when the owning
   * component/session unmounts. */
  destroy(): void {
    this.stopTicking()
    this.detachVisibilityListener()
  }

  private beginRun(): void {
    this.accumulatedMs = 0
    this.runStartTimestamp = this.now()
    this.status = 'running'

    const state = this.getState()
    if (state.remainingSeconds <= 0) {
      this.complete()
      return
    }

    this.beginTicking()
    this.attachVisibilityListener()
    this.onTick?.(state)
  }

  private getElapsedMs(): number {
    if (this.status === 'running' && this.runStartTimestamp !== null) {
      return this.accumulatedMs + (this.now() - this.runStartTimestamp)
    }
    return this.accumulatedMs
  }

  private beginTicking(): void {
    this.stopTicking()
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs)
  }

  private stopTicking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    if (this.status !== 'running') return
    const state = this.getState()
    if (state.remainingSeconds <= 0) {
      this.complete()
      return
    }
    this.onTick?.(state)
  }

  private complete(): void {
    this.stopTicking()
    this.detachVisibilityListener()
    this.accumulatedMs = this.durationSeconds * 1000
    this.runStartTimestamp = null
    this.status = 'completed'
    const state = this.getState()
    this.onTick?.(state)
    this.onComplete?.(state)
  }

  private emit(): void {
    this.onTick?.(this.getState())
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.status !== 'running' || document.visibilityState !== 'visible') {
      return
    }
    const state = this.getState()
    if (state.remainingSeconds <= 0) {
      this.complete()
    } else {
      this.onTick?.(state)
    }
  }

  private attachVisibilityListener(): void {
    if (this.visibilityListenerAttached || typeof document === 'undefined') {
      return
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.visibilityListenerAttached = true
  }

  private detachVisibilityListener(): void {
    if (!this.visibilityListenerAttached || typeof document === 'undefined') {
      return
    }
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    this.visibilityListenerAttached = false
  }
}

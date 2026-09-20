export type BellTimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface BellTimerState {
  status: BellTimerStatus
  totalBells: number
  rungBells: number
  /** Seconds remaining until the next bell (or until the first one). */
  remainingSeconds: number
}

export interface BellTimerOptions {
  totalBells: number
  /** Delay before the very first bell. Defaults to 5s. */
  firstBellDelaySeconds?: number
  /** Gap between every bell after the first. Defaults to 60s. */
  intervalSeconds?: number
  onTick?: (state: BellTimerState) => void
  /** Fired the instant each bell rings, including the last one — the
   * caller decides what a bell sounds like, this engine only times it. */
  onBell?: (state: BellTimerState) => void
  onComplete?: (state: BellTimerState) => void
  tickIntervalMs?: number
  /** Injectable clock, primarily for deterministic tests. */
  now?: () => number
}

export const DEFAULT_FIRST_BELL_DELAY_SECONDS = 5
export const DEFAULT_INTERVAL_SECONDS = 60
const DEFAULT_TICK_INTERVAL_MS = 250

/**
 * A repeating interval-bell timer for silent/unguided sitting: rings a
 * bell after an initial delay, then again every `intervalSeconds` until
 * `totalBells` have rung. Modeled closely on MeditationTimer (same
 * timestamp-derived, visibility-safe state machine) but restarts a new
 * countdown segment after each bell instead of completing once.
 *
 * Has no dependency on React or the DOM beyond
 * `document.visibilityState`/events, so it can be used from any UI layer.
 */
export class BellTimer {
  private readonly totalBells: number
  private readonly firstBellDelaySeconds: number
  private readonly intervalSeconds: number
  private onTick?: (state: BellTimerState) => void
  private onBell?: (state: BellTimerState) => void
  private onComplete?: (state: BellTimerState) => void
  private readonly tickIntervalMs: number
  private readonly now: () => number

  private status: BellTimerStatus = 'idle'
  private rungBells = 0
  /** Duration of the segment currently counting down to the next bell. */
  private segmentDurationMs = 0
  /** Elapsed milliseconds within the current segment, before the run
   * currently in progress (0 while idle/paused-at-start). */
  private accumulatedMs = 0
  /** Timestamp the current running segment began, or null when not
   * currently running. */
  private runStartTimestamp: number | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private visibilityListenerAttached = false

  constructor(options: BellTimerOptions) {
    this.totalBells = Math.max(1, options.totalBells)
    this.firstBellDelaySeconds =
      options.firstBellDelaySeconds ?? DEFAULT_FIRST_BELL_DELAY_SECONDS
    this.intervalSeconds = options.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS
    this.onTick = options.onTick
    this.onBell = options.onBell
    this.onComplete = options.onComplete
    this.tickIntervalMs = options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS
    this.now = options.now ?? Date.now
    this.segmentDurationMs = this.firstBellDelaySeconds * 1000
  }

  /** Updates callbacks in place, e.g. so a React binding can keep them
   * pointing at the latest render's closures without recreating the
   * engine. Omitted keys are left unchanged. */
  setCallbacks(callbacks: {
    onTick?: (state: BellTimerState) => void
    onBell?: (state: BellTimerState) => void
    onComplete?: (state: BellTimerState) => void
  }): void {
    if ('onTick' in callbacks) this.onTick = callbacks.onTick
    if ('onBell' in callbacks) this.onBell = callbacks.onBell
    if ('onComplete' in callbacks) this.onComplete = callbacks.onComplete
  }

  getState(): BellTimerState {
    const elapsedMs = Math.min(this.segmentDurationMs, this.getElapsedMs())
    const remainingSeconds = Math.max(
      0,
      (this.segmentDurationMs - elapsedMs) / 1000,
    )
    return {
      status: this.status,
      totalBells: this.totalBells,
      rungBells: this.rungBells,
      remainingSeconds,
    }
  }

  /** Begins a fresh run from zero. If already running, this is a no-op. */
  start(): void {
    if (this.status === 'running') return
    this.rungBells = 0
    this.beginSegment(this.firstBellDelaySeconds * 1000)
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

  /** Stops the timer without marking it complete and resets it to idle. */
  stop(): void {
    this.stopTicking()
    this.detachVisibilityListener()
    this.rungBells = 0
    this.accumulatedMs = 0
    this.segmentDurationMs = this.firstBellDelaySeconds * 1000
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

  private beginSegment(durationMs: number): void {
    this.segmentDurationMs = durationMs
    this.accumulatedMs = 0
    this.runStartTimestamp = this.now()
    this.status = 'running'
    this.beginTicking()
    this.attachVisibilityListener()
    this.onTick?.(this.getState())
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
      this.ringBell()
      return
    }
    this.onTick?.(state)
  }

  private ringBell(): void {
    this.rungBells += 1

    if (this.rungBells >= this.totalBells) {
      this.stopTicking()
      this.detachVisibilityListener()
      this.accumulatedMs = this.segmentDurationMs
      this.runStartTimestamp = null
      this.status = 'completed'
      const state = this.getState()
      this.onBell?.(state)
      this.onComplete?.(state)
      return
    }

    const bellState = this.getState()
    this.onBell?.(bellState)
    this.beginSegment(this.intervalSeconds * 1000)
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
      this.ringBell()
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

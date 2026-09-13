import type { BreathingPattern } from '../../types'

export type BreathingPhase =
  'inhale' | 'holdAfterInhale' | 'exhale' | 'holdAfterExhale'

export type BreathingEngineStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface BreathingEngineState {
  status: BreathingEngineStatus
  phase: BreathingPhase
  phaseDurationSeconds: number
  phaseElapsedSeconds: number
  phaseRemainingSeconds: number
  /** 1-based; 0 while idle. */
  currentCycle: number
  totalCycles?: number
}

export interface BreathingEngineOptions {
  pattern: BreathingPattern
  onTick?: (state: BreathingEngineState) => void
  /** Fired whenever the active phase (or cycle) changes, not on every tick. */
  onPhaseChange?: (state: BreathingEngineState) => void
  onComplete?: (state: BreathingEngineState) => void
  tickIntervalMs?: number
  /** Injectable clock, primarily for deterministic tests. */
  now?: () => number
}

const DEFAULT_TICK_INTERVAL_MS = 250

const PHASE_ORDER: readonly BreathingPhase[] = [
  'inhale',
  'holdAfterInhale',
  'exhale',
  'holdAfterExhale',
]

const PHASE_DURATION_KEYS: Record<BreathingPhase, keyof BreathingPattern> = {
  inhale: 'inhaleSeconds',
  holdAfterInhale: 'holdAfterInhaleSeconds',
  exhale: 'exhaleSeconds',
  holdAfterExhale: 'holdAfterExhaleSeconds',
}

interface PhaseSpec {
  phase: BreathingPhase
  durationSeconds: number
}

interface Position {
  phase: BreathingPhase
  phaseElapsedSeconds: number
  phaseDurationSeconds: number
  cycleNumber: number
}

/**
 * A generic breathing-session engine driven entirely by a BreathingPattern's
 * durations (Box, 4-7-8, Relaxation, or any custom pattern) — there is no
 * pattern-specific timing logic here. Phases with a zero duration (e.g. the
 * holds in Relaxation Breathing) are skipped automatically.
 *
 * Like MeditationTimer, elapsed time is derived from wall-clock timestamps
 * rather than accumulated tick counts, so a throttled/backgrounded tab
 * cannot cause drift; a visibilitychange listener forces an immediate
 * recompute (and completion check) when the tab becomes visible again.
 */
export class BreathingEngine {
  private readonly cyclePhases: PhaseSpec[]
  private readonly cycleDurationSeconds: number
  private readonly totalCycles?: number

  private onTick?: (state: BreathingEngineState) => void
  private onPhaseChange?: (state: BreathingEngineState) => void
  private onComplete?: (state: BreathingEngineState) => void
  private readonly tickIntervalMs: number
  private readonly now: () => number

  private status: BreathingEngineStatus = 'idle'
  private accumulatedMs = 0
  private runStartTimestamp: number | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private visibilityListenerAttached = false
  private lastEmittedKey: string | null = null

  constructor(options: BreathingEngineOptions) {
    this.cyclePhases = PHASE_ORDER.map((phase) => ({
      phase,
      durationSeconds: Math.max(
        0,
        options.pattern[PHASE_DURATION_KEYS[phase]] as number,
      ),
    })).filter((spec) => spec.durationSeconds > 0)

    this.cycleDurationSeconds = this.cyclePhases.reduce(
      (sum, spec) => sum + spec.durationSeconds,
      0,
    )
    this.totalCycles = options.pattern.cycles
    this.onTick = options.onTick
    this.onPhaseChange = options.onPhaseChange
    this.onComplete = options.onComplete
    this.tickIntervalMs = options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS
    this.now = options.now ?? Date.now
  }

  /** Updates callbacks in place, e.g. so a React binding can keep them
   * pointing at the latest render's closures without recreating the
   * engine. Omitted keys are left unchanged. */
  setCallbacks(callbacks: {
    onTick?: (state: BreathingEngineState) => void
    onPhaseChange?: (state: BreathingEngineState) => void
    onComplete?: (state: BreathingEngineState) => void
  }): void {
    if ('onTick' in callbacks) this.onTick = callbacks.onTick
    if ('onPhaseChange' in callbacks) {
      this.onPhaseChange = callbacks.onPhaseChange
    }
    if ('onComplete' in callbacks) this.onComplete = callbacks.onComplete
  }

  getState(): BreathingEngineState {
    if (this.status === 'idle') {
      const first = this.cyclePhases[0]
      return {
        status: 'idle',
        phase: first?.phase ?? 'inhale',
        phaseDurationSeconds: first?.durationSeconds ?? 0,
        phaseElapsedSeconds: 0,
        phaseRemainingSeconds: first?.durationSeconds ?? 0,
        currentCycle: 0,
        totalCycles: this.totalCycles,
      }
    }

    if (this.status === 'completed') {
      const last = this.cyclePhases[this.cyclePhases.length - 1]
      return {
        status: 'completed',
        phase: last?.phase ?? 'inhale',
        phaseDurationSeconds: last?.durationSeconds ?? 0,
        phaseElapsedSeconds: last?.durationSeconds ?? 0,
        phaseRemainingSeconds: 0,
        currentCycle: this.totalCycles ?? 0,
        totalCycles: this.totalCycles,
      }
    }

    return this.stateAtElapsedSeconds(this.getElapsedMs() / 1000)
  }

  /** Begins a fresh session from the first phase. If already running, this
   * is a no-op — use `restart` to explicitly reset a run in progress. */
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

  /** Resets to the first phase of cycle one and starts running again,
   * regardless of the current status. */
  restart(): void {
    this.beginRun()
  }

  /** Stops the session without marking it complete (the user left early)
   * and resets it back to idle. */
  end(): void {
    this.stopTicking()
    this.detachVisibilityListener()
    this.accumulatedMs = 0
    this.runStartTimestamp = null
    this.status = 'idle'
    this.lastEmittedKey = null
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
    this.lastEmittedKey = null

    if (this.isElapsedComplete(0)) {
      this.complete()
      return
    }

    this.beginTicking()
    this.attachVisibilityListener()
    this.emitTick(this.getState())
  }

  private get totalDurationSeconds(): number | undefined {
    return this.totalCycles !== undefined
      ? this.cycleDurationSeconds * this.totalCycles
      : undefined
  }

  private isElapsedComplete(elapsedSeconds: number): boolean {
    const total = this.totalDurationSeconds
    return total !== undefined && elapsedSeconds >= total
  }

  private resolvePosition(elapsedSeconds: number): Position {
    if (this.cycleDurationSeconds <= 0) {
      const only = this.cyclePhases[0]
      return {
        phase: only?.phase ?? 'inhale',
        phaseElapsedSeconds: 0,
        phaseDurationSeconds: only?.durationSeconds ?? 0,
        cycleNumber: 1,
      }
    }

    const cycleIndex = Math.floor(elapsedSeconds / this.cycleDurationSeconds)
    let remaining = elapsedSeconds - cycleIndex * this.cycleDurationSeconds

    for (const spec of this.cyclePhases) {
      if (remaining < spec.durationSeconds) {
        return {
          phase: spec.phase,
          phaseElapsedSeconds: remaining,
          phaseDurationSeconds: spec.durationSeconds,
          cycleNumber: cycleIndex + 1,
        }
      }
      remaining -= spec.durationSeconds
    }

    const last = this.cyclePhases[this.cyclePhases.length - 1]
    return {
      phase: last.phase,
      phaseElapsedSeconds: last.durationSeconds,
      phaseDurationSeconds: last.durationSeconds,
      cycleNumber: cycleIndex + 1,
    }
  }

  private stateAtElapsedSeconds(elapsedSeconds: number): BreathingEngineState {
    const position = this.resolvePosition(elapsedSeconds)
    return {
      status: this.status,
      phase: position.phase,
      phaseDurationSeconds: position.phaseDurationSeconds,
      phaseElapsedSeconds: position.phaseElapsedSeconds,
      phaseRemainingSeconds:
        position.phaseDurationSeconds - position.phaseElapsedSeconds,
      currentCycle: position.cycleNumber,
      totalCycles: this.totalCycles,
    }
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
    const elapsedSeconds = this.getElapsedMs() / 1000
    if (this.isElapsedComplete(elapsedSeconds)) {
      this.complete()
      return
    }
    this.emitTick(this.stateAtElapsedSeconds(elapsedSeconds))
  }

  private complete(): void {
    this.stopTicking()
    this.detachVisibilityListener()
    this.status = 'completed'
    const state = this.getState()
    this.emitTick(state)
    this.onComplete?.(state)
  }

  private emit(): void {
    this.emitTick(this.getState())
  }

  /** Always invokes onTick; invokes onPhaseChange only when the
   * phase/cycle actually differs from the last emitted state. */
  private emitTick(state: BreathingEngineState): void {
    const key = `${state.currentCycle}:${state.phase}`
    if (key !== this.lastEmittedKey) {
      this.lastEmittedKey = key
      this.onPhaseChange?.(state)
    }
    this.onTick?.(state)
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.status !== 'running' || document.visibilityState !== 'visible') {
      return
    }
    const elapsedSeconds = this.getElapsedMs() / 1000
    if (this.isElapsedComplete(elapsedSeconds)) {
      this.complete()
    } else {
      this.emitTick(this.stateAtElapsedSeconds(elapsedSeconds))
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

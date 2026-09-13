export interface BreathingPattern {
  id: string
  name: string
  inhaleSeconds: number
  holdAfterInhaleSeconds: number
  exhaleSeconds: number
  holdAfterExhaleSeconds: number
  /** Number of cycles a session of this pattern runs before completing on
   * its own. Omitted for a pattern meant to repeat until the user ends it. */
  cycles?: number
}

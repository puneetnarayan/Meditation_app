import type { BreathingPattern } from '../types'

export const breathingPatterns: BreathingPattern[] = [
  {
    id: 'breathing-box',
    name: 'Box Breathing',
    inhaleSeconds: 4,
    holdAfterInhaleSeconds: 4,
    exhaleSeconds: 4,
    holdAfterExhaleSeconds: 4,
  },
  {
    id: 'breathing-relaxation',
    name: 'Relaxation Breathing',
    inhaleSeconds: 4,
    holdAfterInhaleSeconds: 0,
    exhaleSeconds: 6,
    holdAfterExhaleSeconds: 0,
  },
  {
    id: 'breathing-4-7-8',
    name: '4-7-8',
    inhaleSeconds: 4,
    holdAfterInhaleSeconds: 7,
    exhaleSeconds: 8,
    holdAfterExhaleSeconds: 0,
  },
]

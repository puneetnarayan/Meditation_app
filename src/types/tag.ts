/** Canonical set of meditation tags. Keeping this closed (rather than
 * free-text strings) keeps filtering and future admin tooling consistent. */
export const MEDITATION_TAGS = [
  'stress-relief',
  'anxiety',
  'better-sleep',
  'deep-focus',
  'self-compassion',
  'gratitude',
  'body-awareness',
  'loving-kindness',
  'breath-work',
  'quick-reset',
  'morning-routine',
  'evening-wind-down',
] as const

export type MeditationTag = (typeof MEDITATION_TAGS)[number]

import type { ProgramItem } from '../types'

/** Builds a program's day-by-day items by cycling through a themed pool
 * of existing meditations — programs are allowed to revisit a session
 * on a later day (real multi-week programs do this too), so this never
 * requires as many unique meditations as there are days. */
function buildItems(
  programId: string,
  meditationPool: string[],
  totalDays: number,
): ProgramItem[] {
  return Array.from({ length: totalDays }, (_, index) => ({
    id: `${programId}-day-${index + 1}`,
    programId,
    dayNumber: index + 1,
    meditationId: meditationPool[index % meditationPool.length],
  }))
}

const CALM_POOL = [
  'med-morning-calm',
  'med-stress-reset',
  'med-box-breathing-primer',
  'med-releasing-anxiety',
  'med-loving-kindness-practice',
  'med-gratitude-journal-meditation',
  'med-evening-wind-down',
]

const SLEEP_POOL = [
  'med-body-scan-for-sleep',
  'med-evening-wind-down',
  'med-deep-sleep-visualization',
  'med-advanced-body-scan',
]

const MINDFULNESS_POOL = [
  'med-mindful-awareness',
  'med-morning-calm',
  'med-gratitude-journal-meditation',
  'med-loving-kindness-practice',
  'med-box-breathing-primer',
]

const FOCUS_POOL = [
  'med-deep-focus-flow',
  'med-mindful-awareness',
  'med-box-breathing-primer',
  'med-quick-reset-breath',
]

const STRESS_POOL = [
  'med-stress-reset',
  'med-releasing-anxiety',
  'med-box-breathing-primer',
  'med-quick-reset-breath',
  'med-evening-wind-down',
  'med-loving-kindness-practice',
]

export const programItems: ProgramItem[] = [
  ...buildItems('program-7-days-of-calm', CALM_POOL, 7),
  ...buildItems('program-10-days-of-better-sleep', SLEEP_POOL, 10),
  ...buildItems('program-14-days-of-mindfulness', MINDFULNESS_POOL, 14),
  ...buildItems('program-21-days-of-focus', FOCUS_POOL, 21),
  ...buildItems('program-stress-reduction', STRESS_POOL, 7),
]

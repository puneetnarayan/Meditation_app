/** Shared "typical session length" choices, used by both Settings and
 * Onboarding so the two don't drift out of sync with each other. */
export const DURATION_OPTIONS: { label: string; seconds: number }[] = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
]

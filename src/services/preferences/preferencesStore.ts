import type { UserPreferences } from '../../types'
import { readJSON, writeJSON } from '../storage/localStorage'

const PREFERENCES_STORAGE_KEY = 'meditation-app.preferences'

export const DEFAULT_PREFERENCES: UserPreferences = {
  audioVolume: 0.8,
  reducedMotion: false,
  preferredDurationSeconds: undefined,
  primaryGoal: undefined,
  experienceLevel: undefined,
  preferredTimeOfDay: undefined,
  contentPreferences: [],
  onboardingCompleted: false,
  onboardingSkipped: false,
}

export function getPreferences(): UserPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...readJSON<Partial<UserPreferences>>(PREFERENCES_STORAGE_KEY, {}),
  }
}

export function updatePreferences(
  patch: Partial<UserPreferences>,
): UserPreferences {
  const updated = { ...getPreferences(), ...patch }
  writeJSON(PREFERENCES_STORAGE_KEY, updated)
  applyDocumentPreferences(updated)
  return updated
}

/** Applies preferences that need to take effect outside React, on the
 * document itself. Safe to call before any component mounts (e.g. once
 * at app startup) so a persisted preference is honored from first paint.
 *
 * Reduced motion is opt-in only: this only ever *adds* the override —
 * it never removes it to fight the OS-level `prefers-reduced-motion`
 * media query, since a user who set that at the OS level did so for
 * genuine accessibility reasons this app has no business overriding. */
export function applyDocumentPreferences(preferences: UserPreferences): void {
  if (typeof document === 'undefined') return

  if (preferences.reducedMotion) {
    document.documentElement.dataset.motion = 'reduced'
  } else {
    delete document.documentElement.dataset.motion
  }
}

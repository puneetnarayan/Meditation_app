import { useState } from 'react'
import type { UserPreferences } from '../types'
import {
  getPreferences,
  updatePreferences as persistPreferences,
} from '../services/preferences/preferencesStore'

export interface UsePreferencesResult {
  preferences: UserPreferences
  updatePreferences: (patch: Partial<UserPreferences>) => void
}

export function usePreferences(): UsePreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getPreferences(),
  )

  function updatePreferences(patch: Partial<UserPreferences>) {
    setPreferences(persistPreferences(patch))
  }

  return { preferences, updatePreferences }
}

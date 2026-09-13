import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  applyDocumentPreferences,
  DEFAULT_PREFERENCES,
  getPreferences,
  updatePreferences,
} from './preferencesStore'

function clear() {
  window.localStorage.clear()
  delete document.documentElement.dataset.motion
}

describe('preferencesStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('returns defaults when nothing is stored', () => {
    expect(getPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('merges a partial update over the current preferences', () => {
    updatePreferences({ audioVolume: 0.5 })
    const result = updatePreferences({ reducedMotion: true })

    expect(result).toEqual({
      ...DEFAULT_PREFERENCES,
      audioVolume: 0.5,
      reducedMotion: true,
    })
  })

  it('persists updates across reads', () => {
    updatePreferences({ preferredDurationSeconds: 600 })
    expect(getPreferences().preferredDurationSeconds).toBe(600)
  })

  it('fills in missing fields with defaults if stored data is partial', () => {
    window.localStorage.setItem(
      'meditation-app.preferences',
      JSON.stringify({ audioVolume: 0.3 }),
    )
    expect(getPreferences()).toEqual({
      ...DEFAULT_PREFERENCES,
      audioVolume: 0.3,
    })
  })
})

describe('applyDocumentPreferences', () => {
  beforeEach(clear)
  afterEach(clear)

  it('sets data-motion to reduced when the preference is on', () => {
    applyDocumentPreferences({ ...DEFAULT_PREFERENCES, reducedMotion: true })
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })

  it('removes data-motion entirely when the preference is off, rather than forcing motion back on', () => {
    document.documentElement.dataset.motion = 'reduced'
    applyDocumentPreferences({ ...DEFAULT_PREFERENCES, reducedMotion: false })
    expect(document.documentElement.dataset.motion).toBeUndefined()
  })

  it('updatePreferences applies the reduced-motion side effect', () => {
    updatePreferences({ reducedMotion: true })
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getRecentlyPlayed, recordPlayed } from './recentlyPlayedStore'

function clear() {
  window.localStorage.clear()
}

describe('recentlyPlayedStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('starts empty', () => {
    expect(getRecentlyPlayed()).toEqual([])
  })

  it('records a played meditation', () => {
    const result = recordPlayed('med-1')
    expect(result).toHaveLength(1)
    expect(result[0].meditationId).toBe('med-1')
    expect(result[0].playedAt).toBeDefined()
  })

  it('moves an already-recorded meditation to the front instead of duplicating it', () => {
    recordPlayed('med-1')
    recordPlayed('med-2')
    const result = recordPlayed('med-1')

    expect(result.map((entry) => entry.meditationId)).toEqual([
      'med-1',
      'med-2',
    ])
  })

  it('caps the list at 10 most-recent entries', () => {
    for (let i = 0; i < 12; i++) {
      recordPlayed(`med-${i}`)
    }
    const result = getRecentlyPlayed()

    expect(result).toHaveLength(10)
    // Most recent (med-11) first; the two oldest (med-0, med-1) fell off.
    expect(result[0].meditationId).toBe('med-11')
    expect(result.map((e) => e.meditationId)).not.toContain('med-0')
    expect(result.map((e) => e.meditationId)).not.toContain('med-1')
  })
})

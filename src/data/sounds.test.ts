import { describe, expect, it } from 'vitest'
import { sounds } from './sounds'

describe('sound content integrity', () => {
  it('has unique sound ids', () => {
    const ids = new Set(sounds.map((s) => s.id))
    expect(ids.size).toBe(sounds.length)
  })

  it('has a name and description for every sound', () => {
    for (const sound of sounds) {
      expect(sound.name.length).toBeGreaterThan(0)
      expect(sound.description.length).toBeGreaterThan(0)
    }
  })
})

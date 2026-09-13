import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readJSON, writeJSON } from './localStorage'

const KEY = 'test.key'

describe('readJSON', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns the fallback when nothing is stored', () => {
    expect(readJSON(KEY, { count: 0 })).toEqual({ count: 0 })
  })

  it('returns the parsed value when valid JSON is stored', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ count: 5 }))
    expect(readJSON(KEY, { count: 0 })).toEqual({ count: 5 })
  })

  it('returns the fallback instead of throwing on corrupted JSON', () => {
    window.localStorage.setItem(KEY, '{not valid json')
    expect(readJSON(KEY, { count: 0 })).toEqual({ count: 0 })
  })

  it('returns the fallback instead of throwing if localStorage access itself throws', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: access denied')
    })
    expect(readJSON(KEY, ['fallback'])).toEqual(['fallback'])
  })
})

describe('writeJSON', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('persists a value that readJSON can read back', () => {
    writeJSON(KEY, { count: 3 })
    expect(readJSON(KEY, { count: 0 })).toEqual({ count: 3 })
  })

  it('does not throw when localStorage.setItem throws (e.g. quota exceeded)', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => writeJSON(KEY, { count: 1 })).not.toThrow()
  })
})

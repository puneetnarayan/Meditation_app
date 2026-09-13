import { describe, expect, it } from 'vitest'
import { toTitleCase } from './text'

describe('toTitleCase', () => {
  it('replaces hyphens with spaces and capitalizes the first letter', () => {
    expect(toTitleCase('body-scan')).toBe('Body scan')
    expect(toTitleCase('guided')).toBe('Guided')
    expect(toTitleCase('quick-reset')).toBe('Quick reset')
  })

  it('handles an empty string', () => {
    expect(toTitleCase('')).toBe('')
  })
})

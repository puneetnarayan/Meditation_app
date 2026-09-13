import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addFavorite,
  getFavoriteIds,
  isFavorite,
  removeFavorite,
  toggleFavorite,
} from './favoritesStore'

function clear() {
  window.localStorage.clear()
}

describe('favoritesStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('starts with no favorites', () => {
    expect(getFavoriteIds()).toEqual([])
    expect(isFavorite('med-1')).toBe(false)
  })

  it('adds a favorite', () => {
    const result = addFavorite('med-1')
    expect(result).toEqual(['med-1'])
    expect(isFavorite('med-1')).toBe(true)
  })

  it('does not add the same favorite twice', () => {
    addFavorite('med-1')
    const result = addFavorite('med-1')
    expect(result).toEqual(['med-1'])
  })

  it('removes a favorite', () => {
    addFavorite('med-1')
    addFavorite('med-2')
    const result = removeFavorite('med-1')
    expect(result).toEqual(['med-2'])
    expect(isFavorite('med-1')).toBe(false)
  })

  it('removing a favorite that is not present is a no-op', () => {
    addFavorite('med-1')
    const result = removeFavorite('med-2')
    expect(result).toEqual(['med-1'])
  })

  it('toggleFavorite adds when absent and removes when present', () => {
    expect(toggleFavorite('med-1')).toEqual(['med-1'])
    expect(toggleFavorite('med-1')).toEqual([])
  })

  it('persists across reads', () => {
    addFavorite('med-1')
    addFavorite('med-2')
    expect(getFavoriteIds()).toEqual(['med-1', 'med-2'])
  })
})

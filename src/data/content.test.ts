import { describe, expect, it } from 'vitest'
import { MEDITATION_TAGS } from '../types'
import { categories } from './categories'
import { instructors } from './instructors'
import { meditations } from './meditations'

function uniqueIds<T extends { id: string }>(items: T[]): string[] {
  return [...new Set(items.map((item) => item.id))]
}

describe('mock content integrity', () => {
  it('has unique category ids and slugs', () => {
    expect(uniqueIds(categories)).toHaveLength(categories.length)
    expect(new Set(categories.map((c) => c.slug)).size).toBe(categories.length)
  })

  it('has unique instructor ids', () => {
    expect(uniqueIds(instructors)).toHaveLength(instructors.length)
  })

  it('has unique meditation ids', () => {
    expect(uniqueIds(meditations)).toHaveLength(meditations.length)
  })

  it('references only existing categories', () => {
    const categoryIds = new Set(categories.map((c) => c.id))
    for (const meditation of meditations) {
      expect(categoryIds.has(meditation.categoryId)).toBe(true)
    }
  })

  it('references only existing instructors when set', () => {
    const instructorIds = new Set(instructors.map((i) => i.id))
    for (const meditation of meditations) {
      if (meditation.instructorId) {
        expect(instructorIds.has(meditation.instructorId)).toBe(true)
      }
    }
  })

  it('only uses canonical tags', () => {
    const validTags = new Set<string>(MEDITATION_TAGS)
    for (const meditation of meditations) {
      for (const tag of meditation.tags) {
        expect(validTags.has(tag)).toBe(true)
      }
    }
  })

  it('has a positive duration for every meditation', () => {
    for (const meditation of meditations) {
      expect(meditation.durationSeconds).toBeGreaterThan(0)
    }
  })

  it('has at least one featured and one premium meditation', () => {
    expect(meditations.some((m) => m.isFeatured)).toBe(true)
    expect(meditations.some((m) => m.isPremium)).toBe(true)
  })
})

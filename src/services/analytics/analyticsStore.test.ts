import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearEvents,
  getEventCounts,
  getEvents,
  trackEvent,
} from './analyticsStore'

function clear() {
  window.localStorage.clear()
}

describe('analyticsStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('starts with no events', () => {
    expect(getEvents()).toEqual([])
    const counts = getEventCounts()
    expect(Object.values(counts).every((count) => count === 0)).toBe(true)
  })

  it('records an event with a timestamp and optional properties', () => {
    trackEvent('meditation_started', { meditationId: 'med-1' })

    const events = getEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      name: 'meditation_started',
      properties: { meditationId: 'med-1' },
    })
    expect(typeof events[0].occurredAt).toBe('string')
  })

  it('records an event with no properties', () => {
    trackEvent('search_performed')
    expect(getEvents()[0].properties).toBeUndefined()
  })

  it('getEventCounts tallies events by name', () => {
    trackEvent('meditation_started', { meditationId: 'med-1' })
    trackEvent('meditation_started', { meditationId: 'med-2' })
    trackEvent('meditation_completed', { meditationId: 'med-1' })

    const counts = getEventCounts()
    expect(counts.meditation_started).toBe(2)
    expect(counts.meditation_completed).toBe(1)
    expect(counts.meditation_paused).toBe(0)
  })

  it('clearEvents empties the log', () => {
    trackEvent('favorite_added', { meditationId: 'med-1' })
    clearEvents()

    expect(getEvents()).toEqual([])
    expect(getEventCounts().favorite_added).toBe(0)
  })

  it('caps the log at 500 most-recent events', () => {
    for (let i = 0; i < 505; i++) {
      trackEvent('search_performed', { queryLength: i })
    }

    const events = getEvents()
    expect(events).toHaveLength(500)
    // The oldest 5 were dropped, so the log starts at queryLength 5.
    expect(events[0].properties).toEqual({ queryLength: 5 })
    expect(events[499].properties).toEqual({ queryLength: 504 })
  })
})

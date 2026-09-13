import { readJSON, writeJSON } from '../storage/localStorage'

/** Product events worth knowing about, per the spec's suggested list.
 * Deliberately not invasive: everything here stays on this device,
 * nothing is sent to any server, and event properties are limited to
 * internal catalog ids and counts — never free-text user input. */
export const ANALYTICS_EVENT_NAMES = [
  'meditation_started',
  'meditation_completed',
  'meditation_paused',
  'breathing_started',
  'breathing_completed',
  'favorite_added',
  'search_performed',
  'program_started',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

export interface AnalyticsEvent {
  name: AnalyticsEventName
  occurredAt: string
  properties?: Record<string, string | number | boolean>
}

const ANALYTICS_STORAGE_KEY = 'meditation-app.analytics-events'
const MAX_EVENTS = 500

export function trackEvent(
  name: AnalyticsEventName,
  properties?: Record<string, string | number | boolean>,
): void {
  const event: AnalyticsEvent = {
    name,
    occurredAt: new Date().toISOString(),
    properties,
  }
  writeJSON(ANALYTICS_STORAGE_KEY, [...getEvents(), event].slice(-MAX_EVENTS))
}

export function getEvents(): AnalyticsEvent[] {
  return readJSON<AnalyticsEvent[]>(ANALYTICS_STORAGE_KEY, [])
}

export function clearEvents(): void {
  writeJSON(ANALYTICS_STORAGE_KEY, [])
}

export function getEventCounts(): Record<AnalyticsEventName, number> {
  const counts = Object.fromEntries(
    ANALYTICS_EVENT_NAMES.map((name) => [name, 0]),
  ) as Record<AnalyticsEventName, number>

  for (const event of getEvents()) {
    counts[event.name] += 1
  }

  return counts
}

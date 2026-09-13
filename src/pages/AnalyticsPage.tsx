import { useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { StatCard } from '../components/progress/StatCard'
import {
  ANALYTICS_EVENT_NAMES,
  clearEvents,
  getEventCounts,
  getEvents,
  type AnalyticsEventName,
} from '../services/analytics/analyticsStore'
import styles from './AnalyticsPage.module.css'

const EVENT_LABELS: Record<AnalyticsEventName, string> = {
  meditation_started: 'Meditations started',
  meditation_completed: 'Meditations completed',
  meditation_paused: 'Times paused',
  breathing_started: 'Breathing sessions started',
  breathing_completed: 'Breathing sessions completed',
  favorite_added: 'Favorites added',
  search_performed: 'Searches performed',
  program_started: 'Program days started',
}

export function AnalyticsPage() {
  const [counts, setCounts] = useState(() => getEventCounts())
  const totalEvents = getEvents().length

  function handleClear() {
    clearEvents()
    setCounts(getEventCounts())
  }

  const completionRate =
    counts.meditation_started > 0
      ? Math.round(
          (counts.meditation_completed / counts.meditation_started) * 100,
        )
      : null

  return (
    <PageContainer>
      <h1>Analytics</h1>
      <p className={styles.description}>
        Local, private product-usage counts. Nothing here is sent anywhere —
        it's recorded on this device only, and you can clear it at any time.
      </p>

      {totalEvents === 0 ? (
        <EmptyState
          title="No activity recorded yet"
          description="Counts appear here as the app is used."
        />
      ) : (
        <>
          <div className={styles.grid}>
            {ANALYTICS_EVENT_NAMES.map((name) => (
              <StatCard
                key={name}
                label={EVENT_LABELS[name]}
                value={String(counts[name])}
              />
            ))}
          </div>

          {completionRate !== null && (
            <p className={styles.completion}>
              {completionRate}% meditation completion rate
            </p>
          )}
        </>
      )}

      <Button
        variant="secondary"
        onClick={handleClear}
        disabled={totalEvents === 0}
      >
        Clear analytics data
      </Button>
    </PageContainer>
  )
}

export default AnalyticsPage

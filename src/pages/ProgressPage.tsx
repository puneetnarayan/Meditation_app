import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { ProgressBar } from '../components/progress/ProgressBar'
import { StatCard } from '../components/progress/StatCard'
import { WeeklyActivity } from '../components/progress/WeeklyActivity'
import { useProgress } from '../hooks/useProgress'
import { formatMinutesAsDuration } from '../utils/time'
import styles from './ProgressPage.module.css'

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function ProgressPage() {
  const { stats, weeklyActivity } = useProgress()

  if (stats.totalSessions === 0) {
    return (
      <PageContainer>
        <h1>Progress</h1>
        <EmptyState
          title="No sessions yet"
          description="Complete a meditation to start tracking your progress."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1>Progress</h1>

      <section aria-label="Last 7 days" className={styles.section}>
        <WeeklyActivity days={weeklyActivity} />
      </section>

      <div className={styles.grid}>
        <StatCard
          label="Current streak"
          value={pluralize(stats.currentStreakDays, 'day')}
        />
        <StatCard
          label="Longest streak"
          value={pluralize(stats.longestStreakDays, 'day')}
        />
        <StatCard
          label="Sessions completed"
          value={String(stats.completedSessions)}
        />
        <StatCard
          label="Total time"
          value={formatMinutesAsDuration(stats.totalMinutes)}
        />
        <StatCard
          label="This week"
          value={pluralize(stats.weeklySessions, 'session')}
        />
        <StatCard
          label="This month"
          value={pluralize(stats.monthlySessions, 'session')}
        />
      </div>

      <div className={styles.completion}>
        <p className={styles.completionLabel}>
          {stats.completionPercentage}% completion rate
        </p>
        <ProgressBar
          value={stats.completionPercentage}
          max={100}
          label="Completion rate"
        />
      </div>
    </PageContainer>
  )
}

export default ProgressPage

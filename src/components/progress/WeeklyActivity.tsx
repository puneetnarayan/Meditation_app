import type { DayActivity } from '../../utils/progressCalculations'
import styles from './WeeklyActivity.module.css'

export interface WeeklyActivityProps {
  days: DayActivity[]
}

/** A calm, non-gamified strip of the last 7 days — a filled dot marks a
 * day with a completed session. No streak flames, badges or counters. */
export function WeeklyActivity({ days }: WeeklyActivityProps) {
  return (
    <ul className={styles.week} aria-label="Meditation activity, last 7 days">
      {days.map((day) => {
        const weekday = day.date.toLocaleDateString(undefined, {
          weekday: 'short',
        })
        return (
          <li key={day.date.toISOString()} className={styles.day}>
            <span
              className={[
                styles.dot,
                day.completed ? styles.completed : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
              role="img"
              aria-label={`${weekday}: ${day.completed ? 'practiced' : 'no session'}`}
            />
            <span className={styles.label} aria-hidden="true">
              {weekday.charAt(0)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

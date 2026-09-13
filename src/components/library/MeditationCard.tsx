import { Link } from 'react-router-dom'
import type { Category, Instructor, Meditation } from '../../types'
import { formatSecondsAsClock } from '../../utils/time'
import { Card } from '../common/Card'
import styles from './MeditationCard.module.css'

export interface MeditationCardProps {
  meditation: Meditation
  category?: Category
  instructor?: Instructor
}

export function MeditationCard({
  meditation,
  category,
  instructor,
}: MeditationCardProps) {
  const metaParts = [
    formatSecondsAsClock(meditation.durationSeconds),
    category?.name,
    instructor?.name,
  ].filter(Boolean)

  return (
    <Link to={`/meditation/${meditation.id}`} className={styles.link}>
      <Card interactive className={styles.card}>
        <h3 className={styles.title}>{meditation.title}</h3>
        <p className={styles.description}>{meditation.description}</p>
        <p className={styles.meta}>{metaParts.join(' · ')}</p>
      </Card>
    </Link>
  )
}

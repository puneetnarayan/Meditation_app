import { Link } from 'react-router-dom'
import type { Category, Instructor, Meditation } from '../../types'
import { formatSecondsAsClock } from '../../utils/time'
import { Card } from '../common/Card'
import { IconButton } from '../common/IconButton'
import styles from './MeditationCard.module.css'

export interface MeditationCardProps {
  meditation: Meditation
  category?: Category
  instructor?: Instructor
  isFavorite?: boolean
  /** Omit to hide the favorite toggle entirely. */
  onToggleFavorite?: () => void
}

export function MeditationCard({
  meditation,
  category,
  instructor,
  isFavorite = false,
  onToggleFavorite,
}: MeditationCardProps) {
  const metaParts = [
    formatSecondsAsClock(meditation.durationSeconds),
    category?.name,
    instructor?.name,
  ].filter(Boolean)

  return (
    <Card interactive className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {/* Stretched over the whole card via ::after so the card reads
           * as one click target, while the favorite button below stays a
           * separate, un-nested interactive element (a button inside an
           * anchor would be invalid HTML). */}
          <Link to={`/meditation/${meditation.id}`} className={styles.link}>
            {meditation.title}
          </Link>
        </h3>
        {onToggleFavorite && (
          <IconButton
            icon={isFavorite ? '★' : '☆'}
            label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
            className={styles.favoriteButton}
          />
        )}
      </div>
      <p className={styles.description}>{meditation.description}</p>
      <p className={styles.meta}>{metaParts.join(' · ')}</p>
    </Card>
  )
}

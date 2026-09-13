import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { IconButton } from '../components/common/IconButton'
import { PageContainer } from '../components/common/PageContainer'
import { categories } from '../data/categories'
import { instructors } from '../data/instructors'
import { useFavorites } from '../hooks/useFavorites'
import { useOfflineDownload } from '../hooks/useOfflineDownload'
import { getAllMeditations } from '../services/content/contentStore'
import { getMeditationById } from '../utils/meditationQueries'
import { formatSecondsAsClock } from '../utils/time'
import { toTitleCase } from '../utils/text'
import styles from './MeditationDetailsPage.module.css'

export function MeditationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const meditation = id ? getMeditationById(getAllMeditations(), id) : undefined
  const { isFavorite, toggleFavorite } = useFavorites()
  const offlineDownload = useOfflineDownload(meditation)

  if (!meditation) {
    return (
      <PageContainer>
        <EmptyState
          title="Meditation not found"
          description="This meditation may have been removed or the link is incorrect."
        />
      </PageContainer>
    )
  }

  const category = categories.find((c) => c.id === meditation.categoryId)
  const instructor = meditation.instructorId
    ? instructors.find((i) => i.id === meditation.instructorId)
    : undefined

  return (
    <PageContainer>
      <article className={styles.details}>
        {category && <p className={styles.eyebrow}>{category.name}</p>}
        <div className={styles.titleRow}>
          <h1>{meditation.title}</h1>
          <IconButton
            icon={isFavorite(meditation.id) ? '★' : '☆'}
            label={
              isFavorite(meditation.id)
                ? 'Remove from favorites'
                : 'Add to favorites'
            }
            aria-pressed={isFavorite(meditation.id)}
            onClick={() => toggleFavorite(meditation.id)}
          />
        </div>
        <p className={styles.meta}>
          {formatSecondsAsClock(meditation.durationSeconds)} ·{' '}
          {toTitleCase(meditation.type)} · {toTitleCase(meditation.difficulty)}
        </p>
        <p>{meditation.description}</p>
        {instructor && (
          <p className={styles.instructor}>Guided by {instructor.name}</p>
        )}
        {meditation.tags.length > 0 && (
          <ul className={styles.tags}>
            {meditation.tags.map((tag) => (
              <li key={tag}>{toTitleCase(tag)}</li>
            ))}
          </ul>
        )}
        <Button onClick={() => navigate(`/player/${meditation.id}`)}>
          Start meditation
        </Button>

        {meditation.audioUrl ? (
          <div className={styles.offline}>
            {offlineDownload.status === 'downloaded' && (
              <>
                <p className={styles.offlineStatus}>
                  Downloaded for offline listening
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void offlineDownload.remove()}
                >
                  Remove download
                </Button>
              </>
            )}
            {offlineDownload.status === 'downloading' && (
              <p className={styles.offlineStatus} role="status">
                Downloading…
              </p>
            )}
            {(offlineDownload.status === 'idle' ||
              offlineDownload.status === 'error') && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void offlineDownload.download()}
                  disabled={!offlineDownload.isSupported}
                >
                  Download for offline
                </Button>
                {offlineDownload.status === 'error' && (
                  <p className={styles.offlineError} role="alert">
                    {offlineDownload.errorMessage ?? 'Download failed.'}
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <p className={styles.offlineStatus}>
            Offline listening isn't available for this meditation yet.
          </p>
        )}
      </article>
    </PageContainer>
  )
}

export default MeditationDetailsPage

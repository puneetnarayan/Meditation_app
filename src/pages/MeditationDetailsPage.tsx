import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { categories } from '../data/categories'
import { instructors } from '../data/instructors'
import { meditations } from '../data/meditations'
import { getMeditationById } from '../utils/meditationQueries'
import { formatSecondsAsClock } from '../utils/time'
import { toTitleCase } from '../utils/text'
import styles from './MeditationDetailsPage.module.css'

export function MeditationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const meditation = id ? getMeditationById(meditations, id) : undefined

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
        <h1>{meditation.title}</h1>
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
      </article>
    </PageContainer>
  )
}

export default MeditationDetailsPage

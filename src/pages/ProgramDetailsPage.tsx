import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { programItems } from '../data/programItems'
import { programs } from '../data/programs'
import { useProgramProgress } from '../hooks/useProgramProgress'
import { getAllMeditations } from '../services/content/contentStore'
import { getMeditationById } from '../utils/meditationQueries'
import { getProgramById, getProgramItems } from '../utils/programQueries'
import { formatSecondsAsClock } from '../utils/time'
import styles from './ProgramDetailsPage.module.css'

export function ProgramDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const program = id ? getProgramById(programs, id) : undefined

  // Called unconditionally (Rules of Hooks) with harmless fallbacks when
  // there's no program yet — the not-found branch below never uses them.
  const { completedDays, currentDay } = useProgramProgress(
    program?.id ?? '',
    program?.totalDays ?? 0,
  )

  if (!program) {
    return (
      <PageContainer>
        <EmptyState
          title="Program not found"
          description="This program may have been removed or the link is incorrect."
        />
      </PageContainer>
    )
  }

  const items = getProgramItems(programItems, program.id)
  const meditations = getAllMeditations()

  return (
    <PageContainer>
      <h1>{program.title}</h1>
      <p>{program.description}</p>
      <p className={styles.meta}>
        {completedDays.length} of {program.totalDays} days completed
      </p>

      <ol className={styles.dayList}>
        {items.map((item) => {
          const meditation = getMeditationById(meditations, item.meditationId)
          if (!meditation) return null

          const isCompleted = completedDays.includes(item.dayNumber)
          const isCurrent = !isCompleted && item.dayNumber === currentDay

          return (
            <li key={item.id} className={styles.day}>
              <div className={styles.dayInfo}>
                <p className={styles.dayLabel}>
                  Day {item.dayNumber}
                  {isCompleted && ' · Completed'}
                  {isCurrent && ' · Up next'}
                </p>
                <p className={styles.dayTitle}>{meditation.title}</p>
                <p className={styles.dayMeta}>
                  {formatSecondsAsClock(meditation.durationSeconds)}
                </p>
              </div>
              <Link
                to={`/player/${meditation.id}?programId=${program.id}&day=${item.dayNumber}`}
                className={styles.playLink}
              >
                {isCompleted ? 'Replay' : 'Start'}
              </Link>
            </li>
          )
        })}
      </ol>
    </PageContainer>
  )
}

export default ProgramDetailsPage

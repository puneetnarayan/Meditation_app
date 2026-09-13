import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/common/PageContainer'
import { MeditationPlayer } from '../components/meditation/MeditationPlayer'
import { meditations } from '../data/meditations'
import { markDayCompleted } from '../services/programs/programProgressStore'
import { getMeditationById } from '../utils/meditationQueries'

export function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const meditation = id ? getMeditationById(meditations, id) : undefined

  // Present only when this session was started from a program day (see
  // ProgramDetailsPage) — used to advance that program's progress
  // without MeditationPlayer needing to know programs exist at all.
  const programId = searchParams.get('programId')
  const dayNumber = Number(searchParams.get('day'))
  const hasProgramContext = Boolean(programId) && Number.isInteger(dayNumber)

  if (!meditation) {
    return (
      <PageContainer>
        <h1>Meditation not found</h1>
        <p>This meditation may have been removed or the link is incorrect.</p>
      </PageContainer>
    )
  }

  const exitTo =
    hasProgramContext && programId ? `/programs/${programId}` : '/library'

  return (
    <PageContainer>
      <MeditationPlayer
        meditation={meditation}
        onExit={() => navigate(exitTo)}
        onComplete={() => {
          if (hasProgramContext && programId) {
            markDayCompleted(programId, dayNumber)
          }
        }}
      />
    </PageContainer>
  )
}

export default PlayerPage

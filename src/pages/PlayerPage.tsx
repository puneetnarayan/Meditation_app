import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/common/PageContainer'
import { MeditationPlayer } from '../components/meditation/MeditationPlayer'
import { meditations } from '../data/meditations'
import { getMeditationById } from '../utils/meditationQueries'

export function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const meditation = id ? getMeditationById(meditations, id) : undefined

  if (!meditation) {
    return (
      <PageContainer>
        <h1>Meditation not found</h1>
        <p>This meditation may have been removed or the link is incorrect.</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <MeditationPlayer
        meditation={meditation}
        onExit={() => navigate('/library')}
      />
    </PageContainer>
  )
}

export default PlayerPage

import { ProgramCard } from '../components/programs/ProgramCard'
import { PageContainer } from '../components/common/PageContainer'
import { programs } from '../data/programs'
import { getCompletedDays } from '../services/programs/programProgressStore'
import styles from './ProgramsPage.module.css'

export function ProgramsPage() {
  return (
    <PageContainer>
      <h1>Programs</h1>
      <p>Multi-day journeys built from the meditations you already know.</p>

      <ul className={styles.grid}>
        {programs.map((program) => (
          <li key={program.id}>
            <ProgramCard
              program={program}
              completedDays={getCompletedDays(program.id)}
            />
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}

export default ProgramsPage

import { Link } from 'react-router-dom'
import type { Program } from '../../types'
import { getCurrentDay } from '../../utils/programQueries'
import { Card } from '../common/Card'
import styles from './ProgramCard.module.css'

export interface ProgramCardProps {
  program: Program
  completedDays: number[]
}

export function ProgramCard({ program, completedDays }: ProgramCardProps) {
  const isComplete = completedDays.length >= program.totalDays
  const statusLabel = isComplete
    ? 'Completed'
    : completedDays.length > 0
      ? `Day ${getCurrentDay(completedDays, program.totalDays)} of ${program.totalDays}`
      : `${program.totalDays} days`

  return (
    <Link to={`/programs/${program.id}`} className={styles.link}>
      <Card interactive className={styles.card}>
        <h3 className={styles.title}>{program.title}</h3>
        <p className={styles.description}>{program.description}</p>
        <p className={styles.meta}>{statusLabel}</p>
      </Card>
    </Link>
  )
}

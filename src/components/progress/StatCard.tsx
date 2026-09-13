import { Card } from '../common/Card'
import styles from './StatCard.module.css'

export interface StatCardProps {
  label: string
  value: string
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className={styles.card}>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </Card>
  )
}

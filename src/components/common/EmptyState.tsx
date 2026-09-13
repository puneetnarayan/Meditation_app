import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './EmptyState.module.css'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: EmptyStateAction
}

/** Calm, minimal placeholder for a list/screen with nothing to show —
 * no results, no data yet, or a missing/removed item. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState} role="status">
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

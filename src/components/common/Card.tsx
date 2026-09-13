import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover affordance for cards that act as a link/button. */
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  const classes = [
    styles.card,
    interactive ? styles.interactive : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes} {...props} />
}

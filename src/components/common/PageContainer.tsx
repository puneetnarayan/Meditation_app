import type { HTMLAttributes } from 'react'
import styles from './PageContainer.module.css'

export function PageContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[styles.container, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

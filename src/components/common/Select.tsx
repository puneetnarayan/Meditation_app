import { useId, type SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export function Select({
  label,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={[styles.select, className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

import { useId, type InputHTMLAttributes } from 'react'
import styles from './Switch.module.css'

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string
}

export function Switch({ label, id, className, ...props }: SwitchProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label
      htmlFor={inputId}
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
    >
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        className={styles.input}
        {...props}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  )
}

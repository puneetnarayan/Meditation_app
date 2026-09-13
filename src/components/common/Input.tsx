import { useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errorMessage?: string
}

export function Input({
  label,
  errorMessage,
  id,
  className,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = errorMessage ? `${inputId}-error` : undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={[
          styles.input,
          errorMessage ? styles.error : undefined,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorId}
        {...props}
      />
      {errorMessage && (
        <span id={errorId} className={styles.errorText} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  )
}

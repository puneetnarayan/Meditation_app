import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './IconButton.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: 'default' | 'primary'
  size?: 'md' | 'lg'
}

/** An icon-only control (e.g. play/pause/restart). `label` is required
 * because there is no visible text for assistive technology to read. */
export function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const classes = [
    styles.iconButton,
    variant === 'primary' ? styles.primary : undefined,
    size === 'lg' ? styles.lg : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} aria-label={label} {...props}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  )
}

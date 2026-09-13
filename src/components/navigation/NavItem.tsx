import type { AnchorHTMLAttributes, ReactNode } from 'react'
import styles from './NavItem.module.css'

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: ReactNode
  label: string
  active?: boolean
}

/** Presentational nav link. The application shell decides routing
 * (e.g. by rendering this inside a router's NavLink) and passes the
 * resulting `active` state and `href` in. */
export function NavItem({
  icon,
  label,
  active = false,
  className,
  ...props
}: NavItemProps) {
  const classes = [
    styles.navItem,
    active ? styles.active : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <a
      className={classes}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{label}</span>
    </a>
  )
}

import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './NavItem.module.css'

export interface NavLinkItemProps {
  to: string
  icon?: ReactNode
  label: string
  end?: boolean
  className?: string
}

/** Router-aware nav link. Shares NavItem's visual styling but renders a
 * react-router NavLink so navigation is client-side and `active` state is
 * derived from the current route rather than passed in manually. */
export function NavLinkItem({
  to,
  icon,
  label,
  end,
  className,
}: NavLinkItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [styles.navItem, isActive ? styles.active : undefined, className]
          .filter(Boolean)
          .join(' ')
      }
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{label}</span>
    </NavLink>
  )
}

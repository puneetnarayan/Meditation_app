import { primaryNavItems } from '../../config/navigation'
import { NavLinkItem } from './NavLinkItem'
import styles from './SideNav.module.css'

export function SideNav() {
  return (
    <nav className={styles.sideNav} aria-label="Primary">
      {primaryNavItems.map((item) => (
        <NavLinkItem key={item.to} {...item} />
      ))}
    </nav>
  )
}

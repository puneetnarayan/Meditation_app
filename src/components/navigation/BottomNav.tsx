import { primaryNavItems } from '../../config/navigation'
import { NavLinkItem } from './NavLinkItem'
import styles from './BottomNav.module.css'

export function BottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="Primary">
      {primaryNavItems.map((item) => (
        <NavLinkItem key={item.to} {...item} className={styles.item} />
      ))}
    </nav>
  )
}

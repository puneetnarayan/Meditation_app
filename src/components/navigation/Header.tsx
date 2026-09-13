import { NavLink } from 'react-router-dom'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <p className={styles.title}>Meditation App</p>
      <NavLink
        to="/favorites"
        aria-label="Favorites"
        className={({ isActive }) =>
          [styles.favoritesLink, isActive ? styles.active : undefined]
            .filter(Boolean)
            .join(' ')
        }
      >
        <span aria-hidden="true">★</span>
      </NavLink>
    </header>
  )
}

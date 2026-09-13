import { NavLink } from 'react-router-dom'
import type { Category } from '../../types'
import styles from './CategoryChipList.module.css'

export interface CategoryChipListProps {
  categories: Category[]
}

/** Horizontally scrollable row of category filter chips. Active state is
 * derived from the current route, matching NavLinkItem's convention. */
export function CategoryChipList({ categories }: CategoryChipListProps) {
  return (
    <nav className={styles.list} aria-label="Meditation categories">
      <NavLink
        to="/library"
        end
        className={({ isActive }) =>
          [styles.chip, isActive ? styles.active : undefined]
            .filter(Boolean)
            .join(' ')
        }
      >
        All
      </NavLink>
      {categories.map((category) => (
        <NavLink
          key={category.id}
          to={`/library/${category.slug}`}
          className={({ isActive }) =>
            [styles.chip, isActive ? styles.active : undefined]
              .filter(Boolean)
              .join(' ')
          }
        >
          {category.name}
        </NavLink>
      ))}
    </nav>
  )
}

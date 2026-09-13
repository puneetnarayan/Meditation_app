import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { MeditationCard } from '../components/library/MeditationCard'
import { categories } from '../data/categories'
import { instructors } from '../data/instructors'
import { useFavorites } from '../hooks/useFavorites'
import { getAllMeditations } from '../services/content/contentStore'
import styles from './FavoritesPage.module.css'

const categoryById = new Map(categories.map((c) => [c.id, c]))
const instructorById = new Map(instructors.map((i) => [i.id, i]))

export function FavoritesPage() {
  const { favoriteIds, toggleFavorite } = useFavorites()
  const favorites = getAllMeditations().filter((m) =>
    favoriteIds.includes(m.id),
  )

  return (
    <PageContainer>
      <h1>Favorites</h1>

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Tap the star on a meditation to save it here."
        />
      ) : (
        <ul className={styles.grid}>
          {favorites.map((meditation) => (
            <li key={meditation.id}>
              <MeditationCard
                meditation={meditation}
                category={categoryById.get(meditation.categoryId)}
                instructor={
                  meditation.instructorId
                    ? instructorById.get(meditation.instructorId)
                    : undefined
                }
                isFavorite
                onToggleFavorite={() => toggleFavorite(meditation.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}

export default FavoritesPage

import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Meditation } from '../types'
import { CategoryChipList } from '../components/library/CategoryChipList'
import { MeditationCard } from '../components/library/MeditationCard'
import { PageContainer } from '../components/common/PageContainer'
import { categories } from '../data/categories'
import { instructors } from '../data/instructors'
import { useFavorites } from '../hooks/useFavorites'
import { getAllMeditations } from '../services/content/contentStore'
import { getPreferences } from '../services/preferences/preferencesStore'
import { getRecentlyPlayed } from '../services/recentlyPlayed/recentlyPlayedStore'
import { getMeditationById } from '../utils/meditationQueries'
import { getRecommendedMeditation } from '../utils/recommendations'
import styles from './HomePage.module.css'

const categoryById = new Map(categories.map((c) => [c.id, c]))
const instructorById = new Map(instructors.map((i) => [i.id, i]))
const MAX_RECENTLY_PLAYED_SHOWN = 3

export function HomePage() {
  const [preferences] = useState(() => getPreferences())
  const { isFavorite, toggleFavorite } = useFavorites()
  const meditations = getAllMeditations()

  const showOnboardingBanner =
    !preferences.onboardingCompleted && !preferences.onboardingSkipped

  const recommended = getRecommendedMeditation(meditations, preferences)

  const recentlyPlayed = getRecentlyPlayed()
    .slice(0, MAX_RECENTLY_PLAYED_SHOWN)
    .map((entry) => getMeditationById(meditations, entry.meditationId))
    .filter((meditation) => meditation !== undefined)

  function renderCard(meditation: Meditation) {
    return (
      <MeditationCard
        key={meditation.id}
        meditation={meditation}
        category={categoryById.get(meditation.categoryId)}
        instructor={
          meditation.instructorId
            ? instructorById.get(meditation.instructorId)
            : undefined
        }
        isFavorite={isFavorite(meditation.id)}
        onToggleFavorite={() => toggleFavorite(meditation.id)}
      />
    )
  }

  return (
    <PageContainer>
      <h1>Welcome back</h1>

      {showOnboardingBanner && (
        <div className={styles.onboardingBanner}>
          <p className={styles.onboardingText}>
            Answer a few quick questions to get recommendations tailored to you.
          </p>
          <Link to="/onboarding" className={styles.onboardingLink}>
            Personalize →
          </Link>
        </div>
      )}

      {recommended && (
        <section className={styles.section}>
          <h2>Recommended for you</h2>
          <div className={styles.singleCard}>{renderCard(recommended)}</div>
        </section>
      )}

      {recentlyPlayed.length > 0 && (
        <section className={styles.section}>
          <h2>Continue listening</h2>
          <ul className={styles.grid}>
            {recentlyPlayed.map((meditation) => (
              <li key={meditation.id}>{renderCard(meditation)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2>Browse by category</h2>
        <CategoryChipList categories={categories} />
      </section>
    </PageContainer>
  )
}

export default HomePage

import { useState } from 'react'
import {
  MEDITATION_DIFFICULTIES,
  MEDITATION_TYPES,
  type Category,
  type MeditationDifficulty,
  type MeditationType,
} from '../../types'
import { categories } from '../../data/categories'
import { instructors } from '../../data/instructors'
import { meditations } from '../../data/meditations'
import {
  queryMeditations,
  type MeditationSortBy,
} from '../../utils/meditationQueries'
import { toTitleCase } from '../../utils/text'
import { EmptyState } from '../common/EmptyState'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { CategoryChipList } from './CategoryChipList'
import { MeditationCard } from './MeditationCard'
import styles from './LibraryBrowser.module.css'

export interface LibraryBrowserProps {
  /** When set, restricts results to this category (e.g. on /library/:category). */
  category?: Category
}

const categoryById = new Map(categories.map((c) => [c.id, c]))
const instructorById = new Map(instructors.map((i) => [i.id, i]))

/** The meditation library's browse/search/filter UI. Shared by the
 * top-level library screen and each category screen so the filtering
 * logic isn't duplicated between them. Reads from the mock meditation
 * data today; swapping in Supabase-backed data later only requires
 * changing where `meditations`/`categories` come from. */
export function LibraryBrowser({ category }: LibraryBrowserProps) {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<MeditationDifficulty | ''>('')
  const [type, setType] = useState<MeditationType | ''>('')
  const [sortBy, setSortBy] = useState<MeditationSortBy>('title')

  const results = queryMeditations(meditations, {
    categoryId: category?.id,
    difficulty: difficulty || undefined,
    type: type || undefined,
    search,
    sortBy,
  })

  const hasActiveFilters = Boolean(search || difficulty || type)

  function handleClearFilters() {
    setSearch('')
    setDifficulty('')
    setType('')
  }

  return (
    <div className={styles.browser}>
      <CategoryChipList categories={categories} />

      {category && (
        <p className={styles.categoryDescription}>{category.description}</p>
      )}

      <div className={styles.filters}>
        <Input
          label="Search"
          type="search"
          placeholder="Search meditations…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(event) =>
            setDifficulty(event.target.value as MeditationDifficulty | '')
          }
        >
          <option value="">All levels</option>
          {MEDITATION_DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {toTitleCase(level)}
            </option>
          ))}
        </Select>
        <Select
          label="Type"
          value={type}
          onChange={(event) =>
            setType(event.target.value as MeditationType | '')
          }
        >
          <option value="">All types</option>
          {MEDITATION_TYPES.map((meditationType) => (
            <option key={meditationType} value={meditationType}>
              {toTitleCase(meditationType)}
            </option>
          ))}
        </Select>
        <Select
          label="Sort by"
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as MeditationSortBy)
          }
        >
          <option value="title">Title (A–Z)</option>
          <option value="duration">Duration (shortest first)</option>
          <option value="featured">Featured first</option>
        </Select>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No meditations found"
          description="Try a different search, or clear your filters."
          action={
            hasActiveFilters
              ? { label: 'Clear filters', onClick: handleClearFilters }
              : undefined
          }
        />
      ) : (
        <ul className={styles.grid}>
          {results.map((meditation) => (
            <li key={meditation.id}>
              <MeditationCard
                meditation={meditation}
                category={categoryById.get(meditation.categoryId)}
                instructor={
                  meditation.instructorId
                    ? instructorById.get(meditation.instructorId)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

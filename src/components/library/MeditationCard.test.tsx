import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { Category, Instructor, Meditation } from '../../types'
import { MeditationCard } from './MeditationCard'

const meditation: Meditation = {
  id: 'med-test',
  title: 'Test Meditation',
  description: 'A short test description.',
  categoryId: 'cat-test',
  instructorId: 'inst-test',
  durationSeconds: 300,
  type: 'guided',
  difficulty: 'beginner',
  tags: [],
  isPremium: false,
  isFeatured: false,
}

const category: Category = {
  id: 'cat-test',
  slug: 'test',
  name: 'Test Category',
  description: 'A test category.',
}

const instructor: Instructor = {
  id: 'inst-test',
  name: 'Test Instructor',
}

describe('MeditationCard', () => {
  it('links to the meditation details page', () => {
    render(
      <MemoryRouter>
        <MeditationCard
          meditation={meditation}
          category={category}
          instructor={instructor}
        />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /Test Meditation/ })
    expect(link).toHaveAttribute('href', '/meditation/med-test')
    expect(screen.getByText(/5:00/)).toBeInTheDocument()
    expect(screen.getByText(/Test Category/)).toBeInTheDocument()
    expect(screen.getByText(/Test Instructor/)).toBeInTheDocument()
  })

  it('renders without a category or instructor', () => {
    render(
      <MemoryRouter>
        <MeditationCard meditation={meditation} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Test Meditation')).toBeInTheDocument()
  })
})

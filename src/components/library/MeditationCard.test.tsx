import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

  it('hides the favorite toggle when onToggleFavorite is omitted', () => {
    render(
      <MemoryRouter>
        <MeditationCard meditation={meditation} />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('button', { name: /favorites/ }),
    ).not.toBeInTheDocument()
  })

  it('shows an unpressed favorite toggle by default', () => {
    render(
      <MemoryRouter>
        <MeditationCard meditation={meditation} onToggleFavorite={vi.fn()} />
      </MemoryRouter>,
    )

    const toggle = screen.getByRole('button', { name: 'Add to favorites' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows a pressed favorite toggle and calls the handler on click', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(
      <MemoryRouter>
        <MeditationCard
          meditation={meditation}
          isFavorite
          onToggleFavorite={onToggleFavorite}
        />
      </MemoryRouter>,
    )

    const toggle = screen.getByRole('button', {
      name: 'Remove from favorites',
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle)
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })
})

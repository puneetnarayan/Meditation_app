import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { addFavorite } from '../services/favorites/favoritesStore'
import { FavoritesPage } from './FavoritesPage'

describe('FavoritesPage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('shows an empty state when there are no favorites', () => {
    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
  })

  it('lists favorited meditations', () => {
    addFavorite('med-morning-calm')

    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Morning Calm')).toBeInTheDocument()
  })

  it('removes a meditation from the list when unfavorited', async () => {
    addFavorite('med-morning-calm')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('button', { name: 'Remove from favorites' }),
    )

    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { categories } from '../../data/categories'
import { getEvents } from '../../services/analytics/analyticsStore'
import { LibraryBrowser } from './LibraryBrowser'

function renderBrowser(categorySlug?: string) {
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined

  return render(
    <MemoryRouter initialEntries={['/library']}>
      <LibraryBrowser category={category} />
    </MemoryRouter>,
  )
}

describe('LibraryBrowser', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('lists every mock meditation by default', () => {
    renderBrowser()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(1)
    expect(screen.getByText('Morning Calm')).toBeInTheDocument()
  })

  it('filters results by search text', async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.type(screen.getByLabelText('Search'), 'anxiety')

    expect(screen.getByText('Releasing Anxiety')).toBeInTheDocument()
    expect(screen.queryByText('Morning Calm')).not.toBeInTheDocument()
  })

  it('shows an empty state with a clear-filters action when nothing matches', async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.type(screen.getByLabelText('Search'), 'zzz-nonexistent')

    expect(screen.getByText('No meditations found')).toBeInTheDocument()
    const clearButton = screen.getByRole('button', { name: 'Clear filters' })

    await user.click(clearButton)
    expect(screen.getByText('Morning Calm')).toBeInTheDocument()
  })

  it('filters by difficulty', async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.selectOptions(screen.getByLabelText('Difficulty'), 'advanced')

    expect(screen.getByText('Advanced Body Scan')).toBeInTheDocument()
    expect(screen.queryByText('Morning Calm')).not.toBeInTheDocument()
  })

  it('scopes results to the given category', () => {
    renderBrowser('anxiety')

    expect(screen.getByText('Releasing Anxiety')).toBeInTheDocument()
    expect(screen.queryByText('Morning Calm')).not.toBeInTheDocument()
  })

  it('toggles a meditation as favorite', async () => {
    const user = userEvent.setup()
    renderBrowser()

    const toggle = screen.getAllByRole('button', {
      name: 'Add to favorites',
    })[0]
    await user.click(toggle)

    expect(
      screen.getAllByRole('button', { name: 'Remove from favorites' }),
    ).toHaveLength(1)
  })

  it('tracks favorite_added only when a meditation is favorited, not un-favorited', async () => {
    const user = userEvent.setup()
    renderBrowser()

    const toggle = screen.getAllByRole('button', {
      name: 'Add to favorites',
    })[0]
    await user.click(toggle)
    await user.click(
      screen.getAllByRole('button', {
        name: 'Remove from favorites',
      })[0],
    )

    const favoriteEvents = getEvents().filter(
      (event) => event.name === 'favorite_added',
    )
    expect(favoriteEvents).toHaveLength(1)
  })

  it('tracks search_performed once, by query length, after a pause in typing', () => {
    vi.useFakeTimers()
    renderBrowser()

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'anxiety' },
    })
    vi.advanceTimersByTime(500)

    const searchEvents = getEvents().filter(
      (event) => event.name === 'search_performed',
    )
    expect(searchEvents).toHaveLength(1)
    expect(searchEvents[0].properties).toEqual({ queryLength: 7 })

    vi.useRealTimers()
  })
})

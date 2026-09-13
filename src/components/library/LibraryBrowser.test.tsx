import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { categories } from '../../data/categories'
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
})

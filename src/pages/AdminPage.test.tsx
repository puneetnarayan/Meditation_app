import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { meditations as baseMeditations } from '../data/meditations'
import { getAllMeditations } from '../services/content/contentStore'
import { AdminPage } from './AdminPage'

describe('AdminPage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('lists every shipped meditation', () => {
    render(<AdminPage />)
    const [first] = baseMeditations
    expect(screen.getByText(first.title)).toBeInTheDocument()
  })

  it('filters the list by search', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const [first, second] = baseMeditations

    await user.type(screen.getByLabelText('Search'), first.title)

    expect(screen.getByText(first.title)).toBeInTheDocument()
    expect(screen.queryByText(second.title)).not.toBeInTheDocument()
  })

  it('toggling Featured updates the catalog everywhere', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const [first] = baseMeditations

    await user.click(screen.getByLabelText(`Featured — ${first.title}`))

    expect(getAllMeditations().find((m) => m.id === first.id)?.isFeatured).toBe(
      !first.isFeatured,
    )
  })

  it('hiding a meditation removes it from the catalog', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const [first] = baseMeditations

    await user.click(screen.getByLabelText(`Hidden — ${first.title}`))

    expect(getAllMeditations().some((m) => m.id === first.id)).toBe(false)
  })

  it('adds a new custom meditation through the modal', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)

    await user.click(screen.getByRole('button', { name: 'Add meditation' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Title'), 'Lunch Reset')
    await user.type(
      within(dialog).getByLabelText('Description'),
      'A short reset for the middle of the day.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Add meditation' }),
    )

    expect(await screen.findByText('Lunch Reset')).toBeInTheDocument()
    expect(getAllMeditations().some((m) => m.title === 'Lunch Reset')).toBe(
      true,
    )
  })

  it('edits an existing meditation through the modal', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const [first] = baseMeditations

    const row = screen.getByText(first.title).closest('li')!
    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    const titleInput = screen.getByLabelText('Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Updated Title')).toBeInTheDocument()
    expect(getAllMeditations().find((m) => m.id === first.id)?.title).toBe(
      'Updated Title',
    )
  })

  it('edits a custom meditation through the modal', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)

    await user.click(screen.getByRole('button', { name: 'Add meditation' }))
    const addDialog = screen.getByRole('dialog')
    await user.type(within(addDialog).getByLabelText('Title'), 'Lunch Reset')
    await user.type(
      within(addDialog).getByLabelText('Description'),
      'A short reset for the middle of the day.',
    )
    await user.click(
      within(addDialog).getByRole('button', { name: 'Add meditation' }),
    )
    await screen.findByText('Lunch Reset')

    const row = screen.getByText('Lunch Reset').closest('li')!
    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    const titleInput = screen.getByLabelText('Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Lunch Reset (Updated)')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Lunch Reset (Updated)')).toBeInTheDocument()
    expect(
      getAllMeditations().find((m) => m.title === 'Lunch Reset (Updated)'),
    ).toBeTruthy()
  })

  it('deletes a custom meditation but has no delete action for shipped content', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const [first] = baseMeditations

    const shippedRow = screen.getByText(first.title).closest('li')!
    expect(
      within(shippedRow).queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add meditation' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Title'), 'Lunch Reset')
    await user.type(
      within(dialog).getByLabelText('Description'),
      'A short reset for the middle of the day.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Add meditation' }),
    )
    await screen.findByText('Lunch Reset')

    const customRow = screen.getByText('Lunch Reset').closest('li')!
    await user.click(within(customRow).getByRole('button', { name: 'Delete' }))

    expect(screen.queryByText('Lunch Reset')).not.toBeInTheDocument()
    expect(getAllMeditations().some((m) => m.title === 'Lunch Reset')).toBe(
      false,
    )
  })
})

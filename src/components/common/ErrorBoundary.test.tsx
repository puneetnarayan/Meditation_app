import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the error to the console itself even with a boundary in
    // place; silence that expected noise for this test only.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows a calm recovery message instead of crashing when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.queryByText('boom')).not.toBeInTheDocument()
  })

  it('offers a reload action', async () => {
    const user = userEvent.setup()
    const reloadSpy = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: reloadSpy })

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Reload' }))
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })
})

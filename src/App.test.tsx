import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App shell routing', () => {
  it('renders the home page by default', async () => {
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument()
  })

  it('navigates to Library via the primary nav', async () => {
    const user = userEvent.setup()
    render(<App />)

    const libraryLinks = await screen.findAllByRole('link', {
      name: 'Library',
    })
    await user.click(libraryLinks[0])

    expect(
      await screen.findByRole('heading', { name: 'Library' }),
    ).toBeInTheDocument()
  })

  it('shows a not-found page for an unknown route', async () => {
    window.history.pushState({}, '', '/does-not-exist')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('browses the library, opens a meditation, and starts the player', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/library')
    render(<App />)

    await user.type(await screen.findByLabelText('Search'), 'Morning Calm')
    await user.click(await screen.findByRole('link', { name: /Morning Calm/ }))

    const startButton = await screen.findByRole('button', {
      name: 'Start meditation',
    })
    expect(window.location.pathname).toBe('/meditation/med-morning-calm')

    await user.click(startButton)

    expect(
      await screen.findByRole('button', { name: 'Play' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/player/med-morning-calm')
  })

  it('shows a category page scoped to that category', async () => {
    window.history.pushState({}, '', '/library/anxiety')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Anxiety' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Releasing Anxiety')).toBeInTheDocument()
    expect(screen.queryByText('Morning Calm')).not.toBeInTheDocument()
  })
})

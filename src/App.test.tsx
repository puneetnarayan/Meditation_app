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
})

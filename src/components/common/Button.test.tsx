import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label and responds to clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Start session</Button>)

    const button = screen.getByRole('button', { name: 'Start session' })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Start session
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Start session' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('defaults to type="button" so it never submits a surrounding form', () => {
    render(<Button>Start session</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})

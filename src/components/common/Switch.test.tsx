import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('toggles checked state via keyboard and mouse', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch label="Reduced motion" onChange={onChange} />)

    const toggle = screen.getByRole('switch', { name: 'Reduced motion' })
    expect(toggle).not.toBeChecked()

    await user.click(toggle)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('is reachable and toggleable with the keyboard alone', async () => {
    const user = userEvent.setup()
    render(<Switch label="Reduced motion" />)

    const toggle = screen.getByRole('switch', { name: 'Reduced motion' })
    await user.tab()
    expect(toggle).toHaveFocus()

    await user.keyboard(' ')
    expect(toggle).toBeChecked()
  })
})

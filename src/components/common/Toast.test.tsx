import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from './Toast'
import { useToast } from './ToastContext'

function TriggerToast() {
  const { showToast } = useToast()
  return <button onClick={() => showToast('Session saved')}>Save</button>
}

describe('ToastProvider / useToast', () => {
  it('shows a toast message triggered by a descendant', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(screen.getByText('Session saved')).toBeInTheDocument(),
    )
  })
})

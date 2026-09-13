import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getCompletedDays } from '../services/programs/programProgressStore'
import { PlayerPage } from './PlayerPage'

function renderPlayer(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/player/:id" element={<PlayerPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlayerPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('shows a not-found state for an unknown meditation id', () => {
    renderPlayer('/player/does-not-exist')
    expect(screen.getByText('Meditation not found')).toBeInTheDocument()
  })

  it('marks the program day completed when the session finishes naturally', () => {
    renderPlayer(
      '/player/med-box-breathing-primer?programId=program-7-days-of-calm&day=3',
    )

    expect(getCompletedDays('program-7-days-of-calm')).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000) // Box Breathing Primer is 5:00
    })

    expect(getCompletedDays('program-7-days-of-calm')).toEqual([3])
  })

  it('does not touch program progress for a plain (non-program) session', () => {
    renderPlayer('/player/med-box-breathing-primer')

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })

    expect(getCompletedDays('program-7-days-of-calm')).toEqual([])
  })

  it('does not mark the day completed on manual End before finishing', () => {
    renderPlayer(
      '/player/med-box-breathing-primer?programId=program-7-days-of-calm&day=3',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'End' }))

    expect(getCompletedDays('program-7-days-of-calm')).toEqual([])
  })
})

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { meditations } from '../data/meditations'
import { getProgramItems } from '../utils/programQueries'
import { programItems } from '../data/programItems'
import { programs } from '../data/programs'
import { markDayCompleted } from '../services/programs/programProgressStore'
import { ProgramDetailsPage } from './ProgramDetailsPage'

function renderProgram(programId: string) {
  return render(
    <MemoryRouter initialEntries={[`/programs/${programId}`]}>
      <Routes>
        <Route path="/programs/:id" element={<ProgramDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProgramDetailsPage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('shows a not-found state for an unknown program id', () => {
    renderProgram('nope')
    expect(screen.getByText('Program not found')).toBeInTheDocument()
  })

  it('lists every day with its meditation title and a Start link', () => {
    const program = programs[0]
    renderProgram(program.id)

    const items = getProgramItems(programItems, program.id)
    expect(items).toHaveLength(program.totalDays)

    for (const item of items) {
      const meditation = meditations.find((m) => m.id === item.meditationId)!
      expect(screen.getAllByText(meditation.title).length).toBeGreaterThan(0)
    }

    expect(screen.getAllByRole('link', { name: 'Start' }).length).toBe(
      program.totalDays,
    )
  })

  it('links each day to the player with program context in the URL', () => {
    const program = programs[0]
    renderProgram(program.id)

    const firstDayLink = screen.getAllByRole('link', { name: 'Start' })[0]
    expect(firstDayLink.getAttribute('href')).toContain(
      `programId=${program.id}&day=1`,
    )
  })

  it('marks completed days and shows the current day', () => {
    const program = programs[0]
    markDayCompleted(program.id, 1)

    renderProgram(program.id)

    expect(
      screen.getByText(`1 of ${program.totalDays} days completed`),
    ).toBeInTheDocument()
    expect(screen.getByText(/Day 1 · Completed/)).toBeInTheDocument()
    expect(screen.getByText(/Day 2 · Up next/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Replay' })).toHaveLength(1)
  })
})

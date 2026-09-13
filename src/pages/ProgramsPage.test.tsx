import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { programs } from '../data/programs'
import { markDayCompleted } from '../services/programs/programProgressStore'
import { ProgramsPage } from './ProgramsPage'

describe('ProgramsPage', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('lists every program with its full duration when nothing is started', () => {
    render(
      <MemoryRouter>
        <ProgramsPage />
      </MemoryRouter>,
    )

    for (const program of programs) {
      expect(screen.getByText(program.title)).toBeInTheDocument()
    }
    expect(screen.getByText('21 days')).toBeInTheDocument()
  })

  it('shows in-progress status once a day is completed', () => {
    const program = programs[0]
    markDayCompleted(program.id, 1)

    render(
      <MemoryRouter>
        <ProgramsPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(`Day 2 of ${program.totalDays}`),
    ).toBeInTheDocument()
  })
})

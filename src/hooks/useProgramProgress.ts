import { useState } from 'react'
import {
  getCompletedDays,
  markDayCompleted as persistMarkDayCompleted,
} from '../services/programs/programProgressStore'
import { getCurrentDay } from '../utils/programQueries'

export interface UseProgramProgressResult {
  completedDays: number[]
  currentDay: number
  markDayCompleted: (dayNumber: number) => void
}

export function useProgramProgress(
  programId: string,
  totalDays: number,
): UseProgramProgressResult {
  const [completedDays, setCompletedDays] = useState<number[]>(() =>
    getCompletedDays(programId),
  )

  function markDayCompleted(dayNumber: number): void {
    setCompletedDays(persistMarkDayCompleted(programId, dayNumber))
  }

  return {
    completedDays,
    currentDay: getCurrentDay(completedDays, totalDays),
    markDayCompleted,
  }
}

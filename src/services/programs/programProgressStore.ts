import { readJSON, writeJSON } from '../storage/localStorage'

interface ProgramProgressRecord {
  programId: string
  completedDays: number[]
}

const PROGRAM_PROGRESS_STORAGE_KEY = 'meditation-app.program-progress'

function getAllProgress(): ProgramProgressRecord[] {
  return readJSON<ProgramProgressRecord[]>(PROGRAM_PROGRESS_STORAGE_KEY, [])
}

function saveAllProgress(records: ProgramProgressRecord[]): void {
  writeJSON(PROGRAM_PROGRESS_STORAGE_KEY, records)
}

export function getCompletedDays(programId: string): number[] {
  return (
    getAllProgress().find((r) => r.programId === programId)?.completedDays ?? []
  )
}

export function isDayCompleted(programId: string, dayNumber: number): boolean {
  return getCompletedDays(programId).includes(dayNumber)
}

/** Marks a program day completed (e.g. when its meditation finishes
 * naturally in the player) and returns the program's full, sorted
 * completed-days list. Idempotent — marking an already-completed day
 * again is a no-op. */
export function markDayCompleted(
  programId: string,
  dayNumber: number,
): number[] {
  const all = getAllProgress()
  const existing = all.find((r) => r.programId === programId)

  if (existing?.completedDays.includes(dayNumber)) {
    return existing.completedDays
  }

  const updatedDays = [...(existing?.completedDays ?? []), dayNumber].sort(
    (a, b) => a - b,
  )
  const updatedRecords = existing
    ? all.map((r) =>
        r.programId === programId ? { ...r, completedDays: updatedDays } : r,
      )
    : [...all, { programId, completedDays: updatedDays }]

  saveAllProgress(updatedRecords)
  return updatedDays
}

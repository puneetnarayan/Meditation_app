import type { Program, ProgramItem } from '../types'

export function getProgramById(
  programs: Program[],
  id: string,
): Program | undefined {
  return programs.find((program) => program.id === id)
}

export function getProgramItems(
  items: ProgramItem[],
  programId: string,
): ProgramItem[] {
  return items
    .filter((item) => item.programId === programId)
    .sort((a, b) => a.dayNumber - b.dayNumber)
}

/** The first not-yet-completed day, or the last day once everything is
 * done — used to surface a "Day N of totalDays" / "Continue" state. */
export function getCurrentDay(
  completedDays: number[],
  totalDays: number,
): number {
  for (let day = 1; day <= totalDays; day++) {
    if (!completedDays.includes(day)) return day
  }
  return totalDays
}

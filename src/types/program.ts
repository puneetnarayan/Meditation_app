export interface Program {
  id: string
  title: string
  description: string
  totalDays: number
  categoryId?: string
  isFeatured: boolean
}

/** One day of a program, referencing an existing Meditation rather than
 * duplicating its content — mirrors the future Supabase `program_items`
 * table (see master spec §18), which links `programs` to `meditations`. */
export interface ProgramItem {
  id: string
  programId: string
  /** 1-based. */
  dayNumber: number
  meditationId: string
}

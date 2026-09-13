export interface Sound {
  id: string
  name: string
  description: string
  /** Absent for mock/placeholder content until real audio is hosted. */
  audioUrl?: string
}
